import { identity } from "@/lib/identity";
import { sendDonationSms } from "@/lib/sms";
import type { WorkspaceData, Profile, DuesRecord, UnitEvent, Procurement, Donation, Circular, Activity } from "@/lib/types";

export const DEMO_ADMIN_ID = "10000000-0000-4000-8000-000000000001";
export const DEMO_OPENING_BALANCE = 24800;

const uid = (group: number, n: number) => `${group}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const sampleVenues = [
  { location: `Community outreach venue, ${identity.city}` },
  { location: `${identity.name} meeting venue, ${identity.city}` },
  { location: `Community meeting point, ${identity.city}` },
  { location: `Workshop venue, ${identity.city}` },
];

const unitCircularTitle = `Science for every ${identity.city} neighbourhood`;
const unitCircularContent = `Our ${identity.name}’s ${identity.city} outreach is coming up. We invite every member to help make science accessible, joyful, and rooted in evidence.\n\nPlease reach the venue one hour before the programme. Demonstration volunteers should review the safety checklist and bring their assigned materials.\n\nTogether, we can build a culture that welcomes questions. Contact unit executive Arunabha Ghosh or the organizing committee if you would like to join the outreach team.`;

export interface RealMemberSpec {
  id: string;
  fullName: string;
  phone: string | null;
  role: "admin" | "organizer" | "volunteer" | "member";
  monthlyPledge: number;
  avatarColor: "peach" | "sage" | "blue" | "lavender" | "sand";
  paid: boolean;
}

export const REAL_MEMBERS: RealMemberSpec[] = [
  { id: DEMO_ADMIN_ID, fullName: "Arunabha Ghosh", phone: "9832012345", role: "admin", monthlyPledge: 100, avatarColor: "peach", paid: true },
  { id: uid(1, 2), fullName: "Utsav Sen", phone: null, role: "volunteer", monthlyPledge: 50, avatarColor: "sage", paid: true },
  { id: uid(1, 3), fullName: "Pritam Sarkar", phone: null, role: "organizer", monthlyPledge: 50, avatarColor: "blue", paid: true },
  { id: uid(1, 4), fullName: "Hari Roy", phone: null, role: "volunteer", monthlyPledge: 20, avatarColor: "sand", paid: true },
  { id: uid(1, 5), fullName: "Soham Das", phone: null, role: "volunteer", monthlyPledge: 20, avatarColor: "lavender", paid: true },
  { id: uid(1, 6), fullName: "Samarpan Chakraborty", phone: null, role: "organizer", monthlyPledge: 50, avatarColor: "peach", paid: true },
  { id: uid(1, 7), fullName: "Kunal Roy", phone: null, role: "volunteer", monthlyPledge: 20, avatarColor: "sage", paid: true },
  { id: uid(1, 8), fullName: "Kaushiki Ray", phone: null, role: "volunteer", monthlyPledge: 20, avatarColor: "blue", paid: true },
  { id: uid(1, 9), fullName: "Udita Roy Basunia", phone: null, role: "organizer", monthlyPledge: 50, avatarColor: "sand", paid: true },
  { id: uid(1, 10), fullName: "Debarghya Das", phone: null, role: "volunteer", monthlyPledge: 50, avatarColor: "lavender", paid: true },
  { id: uid(1, 11), fullName: "Dwija", phone: null, role: "volunteer", monthlyPledge: 20, avatarColor: "peach", paid: true },
  { id: uid(1, 12), fullName: "Anirban Kar", phone: null, role: "organizer", monthlyPledge: 50, avatarColor: "sage", paid: true },
  { id: uid(1, 13), fullName: "Dipta Paul", phone: null, role: "member", monthlyPledge: 20, avatarColor: "blue", paid: false },
  { id: uid(1, 14), fullName: "Supriyo Roy", phone: null, role: "member", monthlyPledge: 20, avatarColor: "sand", paid: false },
  { id: uid(1, 15), fullName: "Supriyo Sarkar", phone: null, role: "member", monthlyPledge: 20, avatarColor: "lavender", paid: false },
  { id: uid(1, 16), fullName: "Member (+91 93826 18134)", phone: "+91 93826 18134", role: "member", monthlyPledge: 20, avatarColor: "peach", paid: false },
  { id: uid(1, 17), fullName: "Member (+91 98327 37610)", phone: "+91 98327 37610", role: "member", monthlyPledge: 20, avatarColor: "sage", paid: false },
  { id: uid(1, 18), fullName: "Joydev Adhikary", phone: null, role: "member", monthlyPledge: 20, avatarColor: "blue", paid: false },
  { id: uid(1, 19), fullName: "Anowar Hossain", phone: null, role: "member", monthlyPledge: 20, avatarColor: "sand", paid: false },
  { id: uid(1, 20), fullName: "Member (+91 95316 26335)", phone: "+91 95316 26335", role: "member", monthlyPledge: 20, avatarColor: "lavender", paid: false },
  { id: uid(1, 21), fullName: "Pritam Ghosh", phone: null, role: "member", monthlyPledge: 20, avatarColor: "peach", paid: false },
  { id: uid(1, 22), fullName: "Hrithik Sen", phone: null, role: "member", monthlyPledge: 20, avatarColor: "sage", paid: false },
  { id: uid(1, 23), fullName: "Kaustubhi Singha", phone: null, role: "member", monthlyPledge: 20, avatarColor: "blue", paid: false },
  { id: uid(1, 24), fullName: "Shree Roy (শ্রী রায়)", phone: null, role: "member", monthlyPledge: 20, avatarColor: "sand", paid: false },
];

function createInitialState(): {
  profiles: Profile[];
  dues: DuesRecord[];
  events: UnitEvent[];
  procurements: Procurement[];
  donations: Donation[];
  circulars: Circular[];
  activities: Activity[];
} {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();
  const upcoming = (days: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  const people: Profile[] = REAL_MEMBERS.map((m, idx) => ({
    id: m.id,
    fullName: m.fullName,
    phone: m.phone,
    role: m.role,
    status: "active",
    monthlyPledge: m.monthlyPledge,
    avatarColor: m.avatarColor,
    unpaidMonths: m.paid ? 0 : 1,
    createdAt: new Date(year - 1, idx % 12, 10).toISOString(),
  }));

  const duesRecords: DuesRecord[] = [];
  let duesCounter = 1;

  for (const member of REAL_MEMBERS) {
    if (member.paid) {
      // Payment done: paid for all months up to current, plus 1 advance month for organizers & executive
      const maxMonth = ["admin", "organizer"].includes(member.role) ? Math.min(12, currentMonth + 1) : currentMonth;
      for (let m = 1; m <= maxMonth; m++) {
        duesRecords.push({
          id: uid(6, duesCounter++),
          memberId: member.id,
          month: m,
          year,
          amount: member.monthlyPledge,
          paymentMode: member.role === "admin" ? "upi" : duesCounter % 2 === 0 ? "cash" : "upi",
          collectedBy: DEMO_ADMIN_ID,
          paidAt: new Date(year, m - 1, 8).toISOString(),
        });
      }
    } else {
      // Payment due: paid past months up to currentMonth - 1, but current month is unpaid
      for (let m = 1; m < currentMonth; m++) {
        duesRecords.push({
          id: uid(6, duesCounter++),
          memberId: member.id,
          month: m,
          year,
          amount: member.monthlyPledge,
          paymentMode: "cash",
          collectedBy: DEMO_ADMIN_ID,
          paidAt: new Date(year, m - 1, 10).toISOString(),
        });
      }
    }
  }

  const unitEvents: UnitEvent[] = [
    { id: uid(2, 1), title: "National Science Day outreach", description: "Take science beyond the classroom. Hands-on demonstrations, science quiz, and conversations on scientific temper. All unit volunteers meet one hour before setup.", location: sampleVenues[0].location, startsAt: upcoming(1, 10), category: "Outreach", volunteers: 18, image: "/images/science-outreach.jpg", createdAt: ago(1000) },
    { id: uid(2, 2), title: "Unit volunteers’ meeting", description: "Our monthly gathering to review outreach plans, collect membership dues, and coordinate the next round of community programmes. All unit members welcome.", location: sampleVenues[1].location, startsAt: upcoming(3, 17), category: "Unit meeting", volunteers: 24, image: "/images/conference.jpg", createdAt: ago(2000) },
    { id: uid(2, 3), title: "A greener neighbourhood", description: "A community discussion on North Bengal ecological challenges, followed by a neighbourhood clean-up and awareness walk in Jalpaiguri.", location: sampleVenues[2].location, startsAt: upcoming(6, 8), category: "Campaign", volunteers: 12, image: "/images/environment-campaign.jpg", createdAt: ago(3000) },
    { id: uid(2, 4), title: "Science, not superstition", description: "An open street demonstration and discussion exploring the science behind everyday ‘miracles’. Encouraging inquiry, evidence, and rational thought.", location: sampleVenues[3].location, startsAt: upcoming(10, 15), category: "Workshop", volunteers: 9, image: "/images/science-march.jpg", createdAt: ago(4000) },
  ];

  const procurementsList: Procurement[] = [
    { id: uid(3, 1), eventId: uid(2, 1), itemName: "Science demonstration kits", quantity: "4 kits", estimatedCost: 2400, actualCost: null, status: "needed", purchasedBy: null, purchasedAt: null, verifiedBy: null, verifiedAt: null, createdBy: uid(1, 6), createdAt: ago(35) },
    { id: uid(3, 2), eventId: uid(2, 1), itemName: "Printed outreach leaflets", quantity: "500 copies", estimatedCost: 800, actualCost: null, status: "needed", purchasedBy: null, purchasedAt: null, verifiedBy: null, verifiedAt: null, createdBy: DEMO_ADMIN_ID, createdAt: ago(90) },
    { id: uid(3, 3), eventId: uid(2, 1), itemName: "Extension boards & cables", quantity: "3 sets", estimatedCost: 1200, actualCost: 1080, status: "purchased", purchasedBy: uid(1, 3), purchasedAt: ago(75), verifiedBy: null, verifiedAt: null, createdBy: DEMO_ADMIN_ID, createdAt: ago(200) },
    { id: uid(3, 4), eventId: uid(2, 1), itemName: "Volunteer badges", quantity: "30 pieces", estimatedCost: 450, actualCost: 420, status: "verified", purchasedBy: uid(1, 6), purchasedAt: ago(300), verifiedBy: uid(1, 9), verifiedAt: ago(120), createdBy: DEMO_ADMIN_ID, createdAt: ago(480) },
    { id: uid(3, 5), eventId: uid(2, 3), itemName: "Reusable collection bags", quantity: "20 bags", estimatedCost: 600, actualCost: null, status: "needed", purchasedBy: null, purchasedAt: null, verifiedBy: null, verifiedAt: null, createdBy: uid(1, 9), createdAt: ago(260) },
    { id: uid(3, 6), eventId: uid(2, 1), itemName: "Drinking water canisters", quantity: "2 × 20 litres", estimatedCost: 200, actualCost: 180, status: "purchased", purchasedBy: DEMO_ADMIN_ID, purchasedAt: ago(180), verifiedBy: null, verifiedAt: null, createdBy: uid(1, 3), createdAt: ago(400) },
  ];

  const donationsList: Donation[] = [
    { id: uid(4, 1), donorName: "Jalpaiguri Science Club Patrons", donorPhone: null, amount: 5000, eventId: uid(2, 1), paymentMode: "upi", transactionRef: "UPI-4819-2041", receiptNo: `${identity.receiptPrefix}-${year}-001`, smsSent: true, receivedBy: DEMO_ADMIN_ID, createdAt: ago(25) },
    { id: uid(4, 2), donorName: `${identity.city} community supporters`, donorPhone: null, amount: 3500, eventId: uid(2, 1), paymentMode: "bank_transfer", transactionRef: "NEFT-9281-01", receiptNo: `${identity.receiptPrefix}-${year}-002`, smsSent: false, receivedBy: uid(1, 6), createdAt: ago(1500) },
    { id: uid(4, 3), donorName: "North Bengal Teachers Forum", donorPhone: null, amount: 1000, eventId: null, paymentMode: "cash", transactionRef: null, receiptNo: `${identity.receiptPrefix}-${year}-003`, smsSent: false, receivedBy: DEMO_ADMIN_ID, createdAt: ago(2800) },
    { id: uid(4, 4), donorName: "Friends of Science Jalpaiguri", donorPhone: null, amount: 6000, eventId: uid(2, 3), paymentMode: "bank_transfer", transactionRef: "IMPS-110293", receiptNo: `${identity.receiptPrefix}-${year}-004`, smsSent: true, receivedBy: uid(1, 3), createdAt: ago(4200) },
    { id: uid(4, 5), donorName: "Town School Science Circle", donorPhone: null, amount: 2000, eventId: null, paymentMode: "upi", transactionRef: "UPI-7712-4019", receiptNo: `${identity.receiptPrefix}-${year}-005`, smsSent: false, receivedBy: DEMO_ADMIN_ID, createdAt: ago(6000) },
    { id: uid(4, 6), donorName: "Local community collection", donorPhone: null, amount: 1000, eventId: uid(2, 1), paymentMode: "cash", transactionRef: null, receiptNo: `${identity.receiptPrefix}-${year}-006`, smsSent: false, receivedBy: uid(1, 9), createdAt: ago(7200) },
  ];

  const circularsList: Circular[] = [
    { id: uid(5, 1), title: unitCircularTitle, content: unitCircularContent, category: "Unit circular", pinned: true, authorId: DEMO_ADMIN_ID, createdAt: ago(180) },
    { id: uid(5, 2), title: "February unit meeting: agenda & updates", content: "The next unit meeting will cover:\n\n1. Review of recent outreach activities\n2. Membership dues and treasury report\n3. Procurement and volunteer coordination\n4. Upcoming environmental campaign\n\nMembers can pay dues by cash, UPI, or bank transfer during the meeting. Advance contributions are welcome, with a minimum of ₹20 per month.", category: "Meeting agenda", pinned: false, authorId: uid(1, 6), createdAt: ago(1560) },
    { id: uid(5, 3), title: "New in the archive: demonstration handbook", content: "The volunteer resource archive now includes a practical guide for science demonstrations. It covers planning, participant safety, explaining evidence, and encouraging questions.\n\nVisit Science resources to explore the handbook, environmental outreach notes, and the conference poster archive.", category: "Resource update", pinned: false, authorId: uid(1, 3), createdAt: ago(3200) },
  ];

  const activitiesList: Activity[] = [
    { id: uid(7, 1), type: "dues", title: "Membership contribution recorded", description: "Arunabha Ghosh collected monthly dues from Utsav Sen.", actorId: DEMO_ADMIN_ID, targetId: uid(1, 2), amount: 50, createdAt: ago(25) },
    { id: uid(7, 2), type: "procurement", title: "Science demonstration kits needed", description: "Samarpan added 4 kits to tomorrow’s outreach checklist.", actorId: uid(1, 6), targetId: uid(3, 1), amount: null, createdAt: ago(35) },
    { id: uid(7, 3), type: "dues", title: "Membership dues collected", description: "Pritam Sarkar paid his monthly contribution via UPI.", actorId: DEMO_ADMIN_ID, targetId: null, amount: 50, createdAt: ago(55) },
    { id: uid(7, 4), type: "purchase", title: "Extension boards purchased", description: "Pritam logged the exact spend. Ready for peer verification.", actorId: uid(1, 3), targetId: uid(3, 3), amount: 1080, createdAt: ago(75) },
    { id: uid(7, 5), type: "verified", title: "Volunteer badges verified", description: "Udita verified Samarpan’s purchase at the venue. Complete!", actorId: uid(1, 9), targetId: uid(3, 4), amount: 420, createdAt: ago(120) },
  ];

  return {
    profiles: people,
    dues: duesRecords,
    events: unitEvents,
    procurements: procurementsList,
    donations: donationsList,
    circulars: circularsList,
    activities: activitiesList,
  };
}

let inMemoryState: ReturnType<typeof createInitialState> | null = null;

export function getInMemoryState() {
  if (!inMemoryState) {
    inMemoryState = createInitialState();
  }
  return inMemoryState;
}

export function resetInMemoryState() {
  inMemoryState = createInitialState();
  return inMemoryState;
}

const demoPins = new Map<string, string>();
const demoGoogle = new Map<string, string>();

export function getDemoWorkspace(userId?: string): WorkspaceData {
  const state = getInMemoryState();
  const people = state.profiles.map((p) => ({
    ...p,
    hasGoogleLinked: Boolean(demoGoogle.get(p.id) || p.googleEmail),
    googleEmail: p.id === userId ? (demoGoogle.get(p.id) || p.googleEmail || null) : (demoGoogle.get(p.id) || p.googleEmail) ? "Linked" : null,
    needsPinChange: Boolean(p.needsPinChange),
  }));
  const currentUserId = people.some((p) => p.id === userId) ? (userId as string) : "";
  return JSON.parse(JSON.stringify({
    ...state,
    profiles: people,
    currentUserId,
    openingBalance: DEMO_OPENING_BALANCE,
  })) as WorkspaceData;
}

export async function executeDemoAction(action: string, body: any, currentUserId: string): Promise<{ message: string; receiptId?: string; nextUser?: string }> {
  const state = getInMemoryState();
  const user = state.profiles.find((p) => p.id === currentUserId) || state.profiles[0];
  let message = "Action completed.";
  let receiptId: string | undefined;
  let nextUser = user.id;

  switch (action) {
    case "login": {
      const selected = state.profiles.find((p) => p.id === body.memberId);
      if (!selected) throw new Error("Member profile not found.");
      const currentPin = demoPins.get(selected.id) || "1234";
      const pinInput = String(body.pin || "").trim();
      if (pinInput !== currentPin) {
        throw new Error("Incorrect 4-digit PIN. Please try again.");
      }
      nextUser = selected.id;
      message = `Welcome back, ${selected.fullName}!`;
      break;
    }
    case "logout": {
      nextUser = "";
      message = "You have logged out of the unit workspace.";
      break;
    }
    case "changePin": {
      const oldPin = String(body.oldPin || "").trim();
      const newPin = String(body.newPin || "").trim();
      if (!/^\d{4,6}$/.test(newPin)) throw new Error("PIN must be 4 to 6 numbers.");
      const currentPin = demoPins.get(user.id) || "1234";
      if (!user.needsPinChange && currentPin !== oldPin) {
        throw new Error("Current PIN does not match.");
      }
      demoPins.set(user.id, newPin);
      user.needsPinChange = false;
      message = "PIN updated successfully.";
      break;
    }
    case "linkGoogle": {
      const googleEmail = String(body.googleEmail || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail)) throw new Error("Please enter a valid Google email address.");
      demoGoogle.set(user.id, googleEmail);
      user.googleEmail = googleEmail;
      user.hasGoogleLinked = true;
      message = `Google account linked: ${googleEmail}`;
      break;
    }
    case "resetPinWithGoogle": {
      const target = state.profiles.find((p) => p.id === body.memberId);
      if (!target) throw new Error("Member not found.");
      const linked = demoGoogle.get(target.id) || target.googleEmail;
      const googleEmail = String(body.googleEmail || "").trim().toLowerCase();
      const newPin = String(body.newPin || "").trim();
      if (!/^\d{4,6}$/.test(newPin)) throw new Error("New PIN must be 4 to 6 numbers.");
      if (!linked || linked.toLowerCase() !== googleEmail) {
        throw new Error(`Google account does not match the recovery email for ${target.fullName}. Contact unit secretary Arunabha Ghosh.`);
      }
      demoPins.set(target.id, newPin);
      target.needsPinChange = false;
      nextUser = target.id;
      message = `Identity verified via ${googleEmail}. New PIN set and logged in!`;
      break;
    }
    case "adminResetPin": {
      if (user.role !== "admin") throw new Error("Only unit executives can reset PINs.");
      const target = state.profiles.find((p) => p.id === body.memberId);
      if (!target) throw new Error("Member not found.");
      demoPins.set(target.id, "1234");
      target.needsPinChange = true;
      message = `PIN for ${target.fullName} has been reset to default (1234).`;
      break;
    }
    case "switchUser": {
      const selected = state.profiles.find((p) => p.id === body.userId);
      if (selected) {
        nextUser = selected.id;
        message = `Now previewing as ${selected.fullName}.`;
      }
      break;
    }
    case "collectDues": {
      const member = state.profiles.find((p) => p.id === body.memberId);
      const total = Number(body.amount) || 20;
      const monthly = Number(body.monthlyAmount) || 20;
      let m = Number(body.month) || 1;
      let y = Number(body.year) || new Date().getFullYear();
      let remaining = total;
      let count = 0;
      while (remaining > 0 && count < 24) {
        const amount = Math.min(monthly, remaining);
        state.dues.push({
          id: uid(6, state.dues.length + 1),
          memberId: body.memberId,
          month: m,
          year: y,
          amount,
          paymentMode: body.paymentMode || "cash",
          collectedBy: user.id,
          paidAt: new Date().toISOString(),
        });
        remaining -= amount;
        count++;
        m = m === 12 ? 1 : m + 1;
        if (m === 1) y++;
      }
      if (member) {
        member.unpaidMonths = 0;
        member.status = "active";
      }
      message = `₹${total} recorded across ${count} month(s).`;
      state.activities.unshift({
        id: uid(7, state.activities.length + 1),
        type: "dues",
        title: "Membership dues collected",
        description: `${member?.fullName || "Member"} contributed ₹${total}. Collected by ${user.fullName}.`,
        actorId: user.id,
        targetId: body.memberId,
        amount: total,
        createdAt: new Date().toISOString(),
      });
      break;
    }
    case "addDonation": {
      const amount = Number(body.amount) || 500;
      const donationId = uid(4, state.donations.length + 1);
      const newDonation: Donation = {
        id: donationId,
        donorName: body.donorName || "Supporter",
        donorPhone: body.donorPhone || null,
        amount,
        eventId: body.eventId || null,
        paymentMode: body.paymentMode || "cash",
        transactionRef: body.transactionRef || null,
        receiptNo: `${identity.receiptPrefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        smsSent: false,
        receivedBy: user.id,
        createdAt: new Date().toISOString(),
      };
      state.donations.unshift(newDonation);
      receiptId = donationId;
      message = "Donation recorded. Shareable receipt is ready.";
      state.activities.unshift({
        id: uid(7, state.activities.length + 1),
        type: "donation",
        title: "New donation recorded",
        description: `${newDonation.donorName} contributed ₹${amount}.`,
        actorId: user.id,
        targetId: donationId,
        amount,
        createdAt: new Date().toISOString(),
      });
      break;
    }
    case "sendSms": {
      const donation = state.donations.find((d) => d.id === body.id);
      if (donation) {
        if (body.phone) donation.donorPhone = String(body.phone).trim();
        donation.smsSent = true;
        try {
          const res = await sendDonationSms({
            donorName: donation.donorName,
            donorPhone: donation.donorPhone,
            amount: donation.amount,
            receiptNo: donation.receiptNo,
            receiptId: donation.id,
          });
          message = res.message;
        } catch (err) {
          message = err instanceof Error ? err.message : `SMS dispatch recorded for ${donation.receiptNo}.`;
        }
      }
      break;
    }
    case "addProcurement": {
      const newItem: Procurement = {
        id: uid(3, state.procurements.length + 1),
        eventId: body.eventId,
        itemName: body.itemName,
        quantity: body.quantity || "1",
        estimatedCost: Number(body.estimatedCost) || 0,
        actualCost: null,
        status: "needed",
        purchasedBy: null,
        purchasedAt: null,
        verifiedBy: null,
        verifiedAt: null,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      state.procurements.unshift(newItem);
      message = "Item added to the procurement checklist.";
      state.activities.unshift({
        id: uid(7, state.activities.length + 1),
        type: "procurement",
        title: `${newItem.itemName} needed`,
        description: `${user.fullName} added ${newItem.itemName} to event checklist.`,
        actorId: user.id,
        targetId: newItem.id,
        amount: null,
        createdAt: new Date().toISOString(),
      });
      break;
    }
    case "purchase": {
      const item = state.procurements.find((p) => p.id === body.id);
      if (item) {
        item.status = "purchased";
        item.actualCost = Number(body.actualCost) || item.estimatedCost;
        item.purchasedBy = user.id;
        item.purchasedAt = new Date().toISOString();
        message = "Purchase recorded. Ready for peer verification.";
        state.activities.unshift({
          id: uid(7, state.activities.length + 1),
          type: "purchase",
          title: `${item.itemName} purchased`,
          description: `${user.fullName} logged spend of ₹${item.actualCost}.`,
          actorId: user.id,
          targetId: item.id,
          amount: item.actualCost,
          createdAt: new Date().toISOString(),
        });
      }
      break;
    }
    case "verify": {
      const item = state.procurements.find((p) => p.id === body.id);
      if (item) {
        item.status = "verified";
        item.verifiedBy = user.id;
        item.verifiedAt = new Date().toISOString();
        message = "Item verified and closed by peer.";
        state.activities.unshift({
          id: uid(7, state.activities.length + 1),
          type: "verified",
          title: `${item.itemName} verified`,
          description: `${user.fullName} peer-verified the purchase at venue.`,
          actorId: user.id,
          targetId: item.id,
          amount: item.actualCost,
          createdAt: new Date().toISOString(),
        });
      }
      break;
    }
    case "addMember": {
      const newMember: Profile = {
        id: uid(1, state.profiles.length + 1),
        fullName: body.fullName,
        phone: body.phone || null,
        role: body.role || "member",
        status: "active",
        monthlyPledge: Number(body.monthlyPledge) || 20,
        avatarColor: "sage",
        unpaidMonths: 0,
        createdAt: new Date().toISOString(),
      };
      state.profiles.push(newMember);
      message = "New member registered.";
      break;
    }
    case "createEvent": {
      const newEvent: UnitEvent = {
        id: uid(2, state.events.length + 1),
        title: body.title,
        description: body.description || "",
        location: body.location || identity.city,
        startsAt: new Date(body.startsAt).toISOString(),
        category: body.category || "Outreach",
        volunteers: 0,
        image: "/images/science-outreach.jpg",
        createdAt: new Date().toISOString(),
      };
      state.events.unshift(newEvent);
      message = "Event published.";
      break;
    }
    case "publishCircular": {
      const newCircular: Circular = {
        id: uid(5, state.circulars.length + 1),
        title: body.title,
        content: body.content,
        category: body.category || "Unit circular",
        pinned: Boolean(body.pinned),
        authorId: user.id,
        createdAt: new Date().toISOString(),
      };
      state.circulars.unshift(newCircular);
      message = "Circular published to notice board.";
      break;
    }
  }

  return { message, receiptId, nextUser };
}
