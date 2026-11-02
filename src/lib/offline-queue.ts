export interface QueuedAction {
  id?: number;
  action: string;
  payload: Record<string, unknown>;
  label: string;
  timestamp: string;
  retryCount?: number;
}

const DB_NAME = "bss_offline_db";
const STORE_NAME = "actions";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

/**
 * Add an action to the local IndexedDB queue when offline.
 */
export async function enqueueOfflineAction(
  action: string,
  payload: Record<string, unknown>,
  label?: string
): Promise<QueuedAction> {
  const db = await getDb();
  const readableLabel = label || generateActionLabel(action, payload);
  const queued: QueuedAction = {
    action,
    payload,
    label: readableLabel,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(queued);

    request.onsuccess = () => {
      queued.id = request.result as number;
      notifyQueueSubscribers();
      resolve(queued);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all currently pending offline actions.
 */
export async function getPendingOfflineActions(): Promise<QueuedAction[]> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Remove an action by ID once it has synced successfully.
 */
export async function removeOfflineAction(id: number): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyQueueSubscribers();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear the entire offline queue.
 */
export async function clearOfflineQueue(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      notifyQueueSubscribers();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update the retry count for an offline action.
 */
export async function updateOfflineActionRetry(id: number, retryCount: number): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as QueuedAction | undefined;
      if (record) {
        record.retryCount = retryCount;
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Flush and replay all queued actions sequentially to the backend.
 */
export async function syncOfflineQueue(
  sendToServer: (action: string, payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const queue = await getPendingOfflineActions();
  if (!queue.length) return { synced: 0, failed: 0, errors: [] };

  const MAX_RETRIES = 3;
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      const res = await sendToServer(item.action, item.payload);
      if (res.ok) {
        if (item.id != null) {
          await removeOfflineAction(item.id);
        }
        synced++;
      } else {
        failed++;
        const retries = (item.retryCount || 0) + 1;
        if (item.id != null) {
          if (retries >= MAX_RETRIES) {
            await removeOfflineAction(item.id);
            errors.push(`${item.label}: rejected permanently after ${retries} attempts (${res.error || "Sync rejected"})`);
          } else {
            await updateOfflineActionRetry(item.id, retries);
            errors.push(`${item.label}: attempt ${retries}/${MAX_RETRIES} failed (${res.error || "Sync rejected"})`);
          }
        } else {
          errors.push(`${item.label}: ${res.error || "Sync rejected"}`);
        }
      }
    } catch (err) {
      failed++;
      const retries = (item.retryCount || 0) + 1;
      if (item.id != null) {
        if (retries >= MAX_RETRIES) {
          await removeOfflineAction(item.id);
          errors.push(`${item.label}: permanently dropped after ${retries} attempts (${err instanceof Error ? err.message : String(err)})`);
        } else {
          await updateOfflineActionRetry(item.id, retries);
          errors.push(`${item.label}: attempt ${retries}/${MAX_RETRIES} network error (${err instanceof Error ? err.message : String(err)})`);
        }
      } else {
        errors.push(`${item.label}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  notifyQueueSubscribers();
  return { synced, failed, errors };
}

// Queue change listeners for reactive UI badges
type QueueListener = (count: number) => void;
const subscribers = new Set<QueueListener>();

export function subscribeOfflineQueue(listener: QueueListener): () => void {
  subscribers.add(listener);
  // Send current count immediately
  getPendingOfflineActions().then((q) => listener(q.length)).catch(() => listener(0));
  return () => {
    subscribers.delete(listener);
  };
}

function notifyQueueSubscribers() {
  getPendingOfflineActions().then((q) => {
    subscribers.forEach((fn) => fn(q.length));
  }).catch(() => {});
}

function generateActionLabel(action: string, payload: Record<string, unknown>): string {
  switch (action) {
    case "collectDues":
      return `Dues Collection (₹${payload.amount || "20"})`;
    case "addDonation":
      return `Public Donation (₹${payload.amount || "0"} from ${payload.donorName || "Patron"})`;
    case "addProcurement":
      return `Procurement Requisition (${payload.itemName || "Item"})`;
    case "purchase":
      return `Purchase Log (₹${payload.actualCost || "0"})`;
    case "verify":
      return `Peer Verification (Item: ${payload.id || "Procurement"})`;
    case "addMember":
      return `Member Enrollment (${payload.fullName || "Volunteer"})`;
    case "createEvent":
      return `Event Scheduling (${payload.title || "Campaign"})`;
    case "publishCircular":
      return `Circular Publication (${payload.title || "Notice"})`;
    default:
      return `${action} operation`;
  }
}
