export interface QueuedAction {
  id?: number;
  action: string;
  payload: Record<string, unknown>;
  label: string;
  timestamp: string;
  retryCount?: number;
  status?: "pending" | "needs_attention";
  lastError?: string;
  idempotencyKey?: string;
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
  const idempotencyKey = (payload.idempotencyKey as string) ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  payload.idempotencyKey = idempotencyKey;

  const queued: QueuedAction = {
    action,
    payload,
    label: readableLabel,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
    idempotencyKey,
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
 * Retrieve actions that failed validation and need volunteer attention.
 */
export async function getNeedsAttentionActions(): Promise<QueuedAction[]> {
  const all = await getPendingOfflineActions();
  return all.filter((a) => a.status === "needs_attention");
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
 * Move a permanently rejected action to the 'needs_attention' list without deleting its data.
 */
export async function markOfflineActionNeedsAttention(id: number, errorMsg: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as QueuedAction | undefined;
      if (record) {
        record.status = "needs_attention";
        record.lastError = errorMsg;
        const putReq = store.put(record);
        putReq.onsuccess = () => {
          notifyQueueSubscribers();
          resolve();
        };
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Update the status of an offline action without deleting it.
 */
export async function updateOfflineActionStatus(
  id: number,
  status: "pending" | "needs_attention",
  lastError?: string
): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as QueuedAction | undefined;
      if (record) {
        record.status = status;
        if (lastError !== undefined) record.lastError = lastError;
        const putReq = store.put(record);
        putReq.onsuccess = () => {
          notifyQueueSubscribers();
          resolve();
        };
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
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
 * Update the retry count for an offline action on permanent validation error.
 */
export async function updateOfflineActionRetry(
  id: number,
  retryCount: number,
  lastError?: string
): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as QueuedAction | undefined;
      if (record) {
        record.retryCount = retryCount;
        if (lastError !== undefined) record.lastError = lastError;
        const putReq = store.put(record);
        putReq.onsuccess = () => {
          notifyQueueSubscribers();
          resolve();
        };
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
 * Only permanently rejected validation (HTTP 400) failures count against retries;
 * network errors, expired logins (401), and server errors stay queued safely.
 */
export async function syncOfflineQueue(
  sendToServer: (
    action: string,
    payload: Record<string, unknown>
  ) => Promise<{ ok: boolean; status?: number; error?: string }>
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const queue = await getPendingOfflineActions();
  // Filter for active pending items; do not endlessly retry items parked in needs_attention
  const activeQueue = queue.filter((item) => item.status !== "needs_attention");
  if (!activeQueue.length) return { synced: 0, failed: 0, errors: [] };

  const MAX_RETRIES = 3;
  const MAX_PERMANENT_RETRIES = MAX_RETRIES;
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of activeQueue) {
    try {
      const res = await sendToServer(item.action, item.payload);
      if (res.ok) {
        if (item.id != null) {
          await removeOfflineAction(item.id);
        }
        synced++;
      } else {
        failed++;
        // Check if the failure is a permanent validation rejection (HTTP 400)
        const isPermanentValidation = res.status === 400;

        if (isPermanentValidation) {
          const retries = (item.retryCount || 0) + 1;
          if (retries >= MAX_PERMANENT_RETRIES) {
            // NEVER delete money entries! Move to 'needs_attention' list instead.
            if (item.id != null) {
              await markOfflineActionNeedsAttention(
                item.id,
                res.error || "Validation error: Rejected permanently by server"
              );
            }
            errors.push(`${item.label}: moved to 'Needs Attention' (${res.error || "Validation error"})`);
          } else {
            if (item.id != null) {
              await updateOfflineActionRetry(item.id, retries, res.error);
            }
            errors.push(`${item.label}: validation attempt ${retries}/${MAX_PERMANENT_RETRIES} failed (${res.error || "Validation error"})`);
          }
        } else {
          // Transient failure: 401 (expired login), 5xx server error, or temporary gateway issue.
          // DO NOT increment permanent retry count! DO NOT delete! Keep queued!
          if (item.id != null) {
            await updateOfflineActionStatus(
              item.id,
              "pending",
              res.error || `Server status ${res.status || "sync delay"}`
            );
          }
          errors.push(`${item.label}: sync paused (${res.error || "Login or server reconnection required"})`);
        }
      }
    } catch (err) {
      // Plain network failure, DNS error, or offline drop:
      // DO NOT increment permanent retries! NEVER drop or delete!
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (item.id != null) {
        await updateOfflineActionStatus(item.id, "pending", `Offline network error: ${msg}`);
      }
      errors.push(`${item.label}: network unreachable (${msg})`);
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
