export type Role = "admin" | "organizer" | "volunteer" | "member" | "guest";
export type View = "overview" | "members" | "dues" | "donations" | "events" | "procurement" | "circulars" | "resources" | "settings";
export type Profile = {
  id: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: string;
  monthlyPledge: number;
  avatarColor: string;
  unpaidMonths: number;
  createdAt: string;
  hasGoogleLinked?: boolean;
  googleEmail?: string | null;
  googleSub?: string | null;
  isMinor?: boolean;
};
export type DuesRecord = { id: string; memberId: string; month: number; year: number; amount: number; paymentMode: string; collectedBy: string | null; paidAt: string; idempotencyKey?: string | null };
export type UnitEvent = { id: string; title: string; description: string; location: string; startsAt: string; category: string; volunteers: number; image: string; createdAt: string };
export type Procurement = { id: string; eventId: string; itemName: string; quantity: string; estimatedCost: number; actualCost: number | null; status: "needed" | "purchased" | "verified"; purchasedBy: string | null; purchasedAt: string | null; verifiedBy: string | null; verifiedAt: string | null; createdBy: string | null; createdAt: string; receiptPhotoUrl?: string | null };
export type Donation = { id: string; donorName: string; donorPhone: string | null; amount: number; eventId: string | null; paymentMode: string; transactionRef: string | null; receiptNo: string; smsSent: boolean; receivedBy: string | null; createdAt: string; idempotencyKey?: string | null };
export type Circular = { id: string; title: string; content: string; category: string; pinned: boolean; authorId: string | null; createdAt: string };
export type Activity = { id: string; type: string; title: string; description: string; actorId: string | null; targetId: string | null; amount: number | null; createdAt: string };

export type ClaimCode = {
  id: string;
  code?: string;
  memberId: string;
  memberName?: string;
  expiresAt: string;
  claimedAt?: string | null;
  claimedByGoogleSub?: string | null;
  createdAt: string;
};

export type MembershipApplication = {
  id: string;
  googleSub: string;
  googleEmail: string;
  fullName: string;
  phone: string;
  isMinor: boolean;
  guardianName?: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type WorkspaceData = {
  profiles: Profile[];
  dues: DuesRecord[];
  events: UnitEvent[];
  procurements: Procurement[];
  donations: Donation[];
  circulars: Circular[];
  activities: Activity[];
  currentUserId: string;
  currentUserRole?: Role;
  openingBalance: number;
  claimCodes?: ClaimCode[];
  applications?: MembershipApplication[];
};
export type ActionResult = { data: WorkspaceData; message: string; receiptId?: string; claimCode?: string };
export type PerformAction = (action: string, payload: Record<string, unknown>) => Promise<ActionResult | null>;
export const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
export const initials = (name: string) => name.split(" ").slice(0, 2).map((part) => part[0]).join("");
export const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
