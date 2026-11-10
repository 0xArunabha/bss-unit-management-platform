"use client";

import { identity } from "@/lib/identity";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CircleAlert, CircleCheck, Copy, Download, ExternalLink, HeartHandshake, Info, MapPin, MessageCircle, MessageSquare, Package, Printer, ReceiptText, Send, ShieldAlert, ShieldCheck, Users, Wallet } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { type WorkspaceData, type Donation, type UnitEvent, type Procurement, type Circular, type DuesRecord, type PerformAction, money, months } from "@/lib/types";
import { type Resource } from "@/lib/resources";
import { Avatar, Badge, Button, FormField, Modal, SubmitButton } from "@/components/ui";
import { TreasurerSignatureBlock, UnitOfficialSeal } from "@/components/unit-seal";
import { VirtualIdCard } from "@/components/id-card";
import { formatCircularBroadcast, formatEventBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";
import type { Profile } from "@/lib/types";
import type { Navigate, OpenModal } from "@/components/overview";

export type ModalState = { type: string; record?: unknown } | null;
type Props = { modal: ModalState; data: WorkspaceData; close: () => void; open: OpenModal; perform: PerformAction; busy: boolean; error: string; navigate: Navigate; notify: (message: string) => void };

function SmsPreviewModal({
  donation,
  close,
  notify,
  save,
  busy,
}: {
  donation: Donation;
  close: () => void;
  notify: (msg: string) => void;
  save: (action: string, values: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [recipientPhone, setRecipientPhone] = useState(donation.donorPhone || "");
  const receiptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/receipts/${donation.id}`;
  const smsMessage = `[${identity.name.toUpperCase()} · ${identity.organisationShort}] Received with thanks ₹${donation.amount.toLocaleString("en-IN")} from ${donation.donorName} on ${new Date(donation.createdAt).toLocaleDateString("en-IN")}. Official Receipt No: ${donation.receiptNo}. Digital verification slip: ${receiptUrl} — Breakthrough Science Society, ${identity.unit}.`;

  const copySms = async () => {
    try {
      await navigator.clipboard.writeText(smsMessage);
      notify("SMS text copied to clipboard.");
    } catch {
      notify("Please copy the text manually from the screen.");
    }
  };

  return (
    <Modal title="SMS Notification Gateway" subtitle="DLT-compliant automated SMS receipt dispatched to donor mobile" onClose={close}>
      <div className="sms-handset-preview">
        <div className="sms-header">
          <MessageSquare size={16} />
          <span>OUTBOUND CARRIER GATEWAY (FAST2SMS / MSG91)</span>
          <Badge tone={donation.smsSent ? "green" : "yellow"}>
            {donation.smsSent ? "Dispatched" : "Ready to Send"}
          </Badge>
        </div>

        <div className="sms-recipient-line" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>To (Indian Mobile):</span>
          <input
            type="tel"
            placeholder="+91 98320 XXXXX"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            disabled={donation.smsSent}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: "bold",
              padding: "4px 8px",
              border: "1px solid var(--rule-soft, #ddd)",
              borderRadius: "4px",
              fontSize: "13px",
              minWidth: "180px",
            }}
          />
          <small>· DLT Header: <strong>BSSJPG</strong></small>
        </div>

        <div className="sms-bubble">
          <p>{smsMessage}</p>
          <time className="sms-timestamp">
            {new Date(donation.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
          </time>
        </div>

        <div className="sms-meta-strip">
          <ShieldCheck size={14} />
          <span>Sender ID: <strong>BSSJPG</strong> · Length: {smsMessage.length} chars · DLT Transactional Route</span>
        </div>
      </div>

      <div className="modal-actions">
        <Button variant="secondary" icon={Copy} onClick={() => void copySms()}>Copy SMS text</Button>
        {!donation.smsSent && (
          <Button
            icon={Send}
            onClick={() => {
              void save("sendSms", { id: donation.id, phone: recipientPhone });
            }}
            disabled={busy}
          >
            Dispatch SMS receipt
          </Button>
        )}
        <Button variant="secondary" onClick={close}>Close</Button>
      </div>
    </Modal>
  );
}

export function WorkspaceModals(props: Props) {
  const { modal, data, close, open, perform, busy, error, navigate, notify } = props;
  if (!modal) return null;
  const formProps = { busy, error, close };

  const save = async (action: string, values: Record<string, unknown>) => {
    const result = await perform(action, values);
    if (result) {
      if (result.receiptId) open("receipt", result.data.donations.find((d) => d.id === result.receiptId));
      else if (result.claimCode) open("showInviteCode", { code: result.claimCode, message: result.message });
      else close();
    }
  };

  if (modal.type === "showInviteCode") {
    const record = modal.record as { code: string; message?: string };
    const code = record?.code || "";
    return (
      <Modal title="Single-Use Member Invite Code" subtitle="Hand over in person or via direct WhatsApp" onClose={close}>
        <div className="invite-code-modal-content">
          <div className="invite-code-box">
            <span className="invite-code-eyebrow">8-CHARACTER CROCKFORD BASE32 CODE</span>
            <div className="invite-code-digits">{code}</div>
            <span className="invite-code-validity">Single-use · Expires in 14 days · Stored hashed</span>
          </div>

          <div className="invite-handover-card">
            <h4>In-Person Handover Checklist:</h4>
            <ul>
              <li>Give this code directly to the member in person or via verified WhatsApp.</li>
              <li>Member taps <strong>Member Login with Google</strong> on their device.</li>
              <li>They enter <strong>{code}</strong> to link their permanent Google ID.</li>
              <li>Once linked, this code permanently stops working. No recovery flow to attack!</li>
            </ul>
          </div>

          <div className="modal-actions">
            <Button
              icon={Copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  notify("Code copied to clipboard!");
                } catch {
                  notify("Please copy the code manually.");
                }
              }}
            >
              Copy Code
            </Button>
            <Button variant="secondary" onClick={close}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (modal.type === "reviewApplications") {
    const apps = data.applications || [];
    const pending = apps.filter((a) => a.status === "pending");
    return (
      <Modal title="Pending Membership Applications" subtitle="Review and approve public applicants" onClose={close}>
        <div className="applications-modal-content">
          {pending.length === 0 ? (
            <p className="empty-text">No pending membership applications at this time.</p>
          ) : (
            pending.map((app) => (
              <div key={app.id} className="application-item-card">
                <div className="app-item-top">
                  <div>
                    <strong>{app.fullName}</strong>
                    <span className="app-sub-meta">📱 +91 {app.phone} · 📧 {app.googleEmail}</span>
                  </div>
                  <Badge tone={app.isMinor ? "orange" : "blue"}>{app.isMinor ? "Under 18 (Minor)" : "18+ Adult"}</Badge>
                </div>
                {app.isMinor && app.guardianName && (
                  <div className="guardian-notice">
                    <span>Parent/Guardian: <strong>{app.guardianName}</strong> (DPDP Act Verified)</span>
                  </div>
                )}
                <div className="app-reason-box">
                  <small>STATEMENT OF INTEREST:</small>
                  <p>&ldquo;{app.reason}&rdquo;</p>
                </div>
                <div className="app-item-buttons">
                  <Button
                    onClick={async () => {
                      await perform("reviewApplication", { applicationId: app.id, status: "approved" });
                      notify(`Enrolled ${app.fullName} as unit member!`);
                    }}
                  >
                    Approve & Enroll
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await perform("reviewApplication", { applicationId: app.id, status: "rejected" });
                      notify(`Declined application for ${app.fullName}.`);
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
          <div className="modal-actions">
            <Button variant="secondary" onClick={close}>Close</Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (modal.type === "idCard") {
    const raw = modal.record as Profile | { member: Profile; memberCode?: string };
    const member = raw && typeof raw === "object" && "member" in raw ? raw.member : (raw as Profile);
    const memberCode = raw && typeof raw === "object" && "memberCode" in raw && raw.memberCode ? raw.memberCode : `JPG-${String(Math.max(1, data.profiles.findIndex((p) => p.id === member.id) + 1)).padStart(3, "0")}`;
    return (
      <Modal title="Member Credential Card" subtitle="Official Light of Science Digital ID Badge" onClose={close}>
        <VirtualIdCard member={member} memberCode={memberCode} onClose={close} />
      </Modal>
    );
  }

  if (modal.type === "dues") return <DuesCollector data={data} record={modal.record as { memberId?: string; month?: number; year?: number } | undefined} save={save} {...formProps} />;

  if (modal.type === "duesDetail") {
    const payment = modal.record as DuesRecord;
    const member = data.profiles.find((p) => p.id === payment.memberId)!;
    const collector = data.profiles.find((p) => p.id === payment.collectedBy);
    const dateFormatted = new Date(payment.paidAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

    return (
      <Modal title="Treasury Receipt Audit Slip" subtitle={`${months[payment.month - 1]} ${payment.year} · Member Contribution`} onClose={close}>
        <div className="payment-detail print-tech-slip">
          <span className="print-mark print-mark-tl slip-mark" />
          <span className="print-mark print-mark-tr slip-mark" />
          <span className="print-mark print-mark-bl slip-mark" />
          <span className="print-mark print-mark-br slip-mark" />

          <div className="payment-brand-row">
            <span className="stamp-verified">AUDITED ENTRY</span>
            <span className="mono text-[length:max(10px,var(--fs-floor,0px))] text-muted">{identity.unit}</span>
          </div>

          <h3 className="mono">{money(payment.amount)}</h3>
          <p>{months[payment.month - 1]} {payment.year} Membership Contribution</p>

          <div className="receipt-details">
            <div><span>Member Name</span><strong>{member.fullName}</strong></div>
            <div><span>Pledge Rate</span><strong>{money(member.monthlyPledge)} / month</strong></div>
            <div><span>Payment Mode</span><strong className="uppercase">{payment.paymentMode.replace("bank_transfer", "Bank Transfer")}</strong></div>
            <div><span>Collector Stamp</span><strong>{collector?.fullName || "Unit Executive"} ({collector?.role || "Admin"})</strong></div>
            <div><span>Logged In Ledger</span><strong className="mono">{dateFormatted}</strong></div>
            <div><span>Unit Treasury</span><strong>{identity.fullName}</strong></div>
          </div>

          <div className="soft-info mt-4">
            <ShieldCheck size={16} />
            <span>This contribution is locked in the unit&apos;s persistent ledger. Minimum ₹20 baseline with voluntary higher pledges.</span>
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>Close audit slip</Button>
        </div>
      </Modal>
    );
  }

  if (modal.type === "donation") {
    return (
      <Modal title="Record Public / Patron Donation" subtitle="Enter contribution details and issue an official verifiable receipt slip." onClose={close}>
        <ActionForm action="addDonation" save={save} {...formProps} submit="Record & generate receipt">
          <FormField label="Donor, school, or organization name" required>
            <input name="donorName" placeholder="e.g. Jalpaiguri Science Patron / Town High School" maxLength={150} required />
          </FormField>
          <div className="form-columns">
            <FormField label="Contribution amount (INR)" required>
              <div className="currency-input large-input">
                <span>₹</span>
                <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
              </div>
            </FormField>
            <FormField label="Payment instrument" required>
              <select name="paymentMode">
                <option value="upi">UPI instant transfer</option>
                <option value="cash">Cash in hand</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
              </select>
            </FormField>
          </div>
          <FormField label="Donor mobile number (for SMS receipt gateway)" hint="Optional. Format: +91 94340 XXXXX. Automated SMS alert dispatched upon entry.">
            <input type="tel" name="donorPhone" placeholder="+91" maxLength={16} />
          </FormField>
          <FormField label="Allocated outreach purpose">
            <select name="eventId">
              <option value="">General Science Outreach & Unit Fund</option>
              {data.events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Transaction / cheque reference" hint="UPI Transaction ID, bank UTR, or physical receipt serial.">
            <input name="transactionRef" placeholder="e.g. UPI/2026/918237" maxLength={100} />
          </FormField>
          <div className="soft-info">
            <ReceiptText size={17} />
            <span>Digital slip is signed with the official society registration ({identity.registrationNo}) and optimized for WhatsApp, Telegram & print.</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "smsPreview") {
    return (
      <SmsPreviewModal
        donation={modal.record as Donation}
        close={close}
        notify={notify}
        save={save}
        busy={busy}
      />
    );
  }

  if (modal.type === "receipt") {
    return <ReceiptModal donation={modal.record as Donation} data={data} close={close} notify={notify} save={save} busy={busy} open={open} />;
  }

  if (modal.type === "member") {
    return (
      <Modal title="Enroll New Member" subtitle={`Add advocate or volunteer organizer to ${identity.fullName}`} onClose={close}>
        <ActionForm action="addMember" save={save} {...formProps} submit="Enroll member">
          <FormField label="Full name" required>
            <input name="fullName" placeholder="Member’s full legal name" required maxLength={150} />
          </FormField>
          <FormField label="Mobile number (optional)">
            <input name="phone" type="tel" placeholder="10-digit mobile number" maxLength={30} />
          </FormField>
          <div className="form-columns">
            <FormField label="Designated role">
              <select name="role">
                <option value="member">General Member / Student</option>
                <option value="volunteer">Active Volunteer</option>
                <option value="organizer">Field Organizer</option>
                <option value="admin">Unit Executive / Office-Bearer</option>
              </select>
            </FormField>
            <FormField label="Monthly contribution pledge" hint="Strict baseline minimum: ₹20/month. No upper cap." required>
              <div className="currency-input">
                <span>₹</span>
                <input name="monthlyPledge" type="number" min="20" step="0.01" defaultValue="20" required />
              </div>
            </FormField>
          </div>
          <div className="soft-info">
            <HeartHandshake size={17} />
            <span>Members may contribute monthly or via multi-month advance lump-sums. 6 consecutive unpaid months flags Inactive on rosters.</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "procurement") {
    const record = modal.record as { eventId?: string } | undefined;
    return (
      <Modal title="New Requisition Voucher" subtitle="Post an item needed for an upcoming science programme" onClose={close}>
        <ActionForm action="addProcurement" save={save} {...formProps} submit="Post requisition voucher">
          <FormField label="Associated science event" required>
            <select name="eventId" defaultValue={record?.eventId || data.events[0]?.id}>
              {data.events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Item description" required>
            <input name="itemName" placeholder="e.g. Potassium permanganate reagent & dropper bottles" maxLength={150} required />
          </FormField>
          <div className="form-columns">
            <FormField label="Quantity required" required>
              <input name="quantity" placeholder="e.g. 4 bottles / 500 leaflets" required maxLength={80} />
            </FormField>
            <FormField label="Estimated reference cost" required hint="Reference estimate only. Exact spend will be logged by buyer.">
              <div className="currency-input">
                <span>₹</span>
                <input name="estimatedCost" type="number" min="0" step="0.01" placeholder="0.00" required />
              </div>
            </FormField>
          </div>
          <div className="soft-info">
            <Info size={17} />
            <span>If the event is within 48 hours, an urgent field alert is broadcast immediately to all active cadre.</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "purchase") {
    const item = modal.record as Procurement;
    return (
      <Modal title="Log Out-of-Pocket Purchase" subtitle="Record exact spend paid by buyer. No pre-approval ceiling blocks procurement." onClose={close}>
        <ActionForm action="purchase" save={save} {...formProps} submit="Log exact purchase">
          <input type="hidden" name="id" value={item.id} />
          <div className="item-detail-summary">
            <span className="stat-icon stat-icon-orange"><Package size={22} /></span>
            <div>
              <h3>{item.itemName}</h3>
              <p>{item.quantity} · {data.events.find((e) => e.id === item.eventId)?.title}</p>
            </div>
          </div>
          <div className="reference-line">
            <span>Reference Estimated Cost</span>
            <strong className="mono">{money(item.estimatedCost)}</strong>
          </div>
          <FormField
            label="Exact amount paid by buyer"
            required
            hint="Record the real amount spent, whether below, matching, or exceeding the estimated budget. No pre-approval restriction blocks logging."
          >
            <div className="currency-input large-input">
              <span>₹</span>
              <input name="actualCost" type="number" min="0" step="0.01" placeholder="0.00" required />
            </div>
          </FormField>
          <div className="soft-info">
            <Users size={17} />
            <span>Status changes to &apos;Ready to verify&apos;. A second volunteer must physically inspect the item at the venue to close it.</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "verify") {
    const item = modal.record as Procurement;
    const own = item.purchasedBy === data.currentUserId;
    const buyer = data.profiles.find((p) => p.id === item.purchasedBy);

    return (
      <Modal title="Peer Physical Inspection & Verification" subtitle="Dual-verification protocol: peer confirmation alone closes the voucher" onClose={close}>
        <ActionForm action="verify" save={save} {...formProps} submit="Confirm peer verification & close voucher" disabled={own || item.status !== "purchased"}>
          <input type="hidden" name="id" value={item.id} />
          <div className="item-detail-summary">
            <span className="stat-icon stat-icon-sage"><ShieldCheck size={22} /></span>
            <div>
              <h3>{item.itemName}</h3>
              <p>{item.quantity} · Buyer: <strong>{buyer?.fullName || "Volunteer"}</strong></p>
            </div>
          </div>
          <div className="reference-line">
            <span>Exact Out-of-Pocket Spend Recorded</span>
            <strong className="mono text-rust">{money(item.actualCost || 0)}</strong>
          </div>

          {own ? (
            <div className="form-warning">
              <ShieldAlert size={22} />
              <div>
                <strong>Anti-Collusion Enforcement: Self-verification blocked.</strong>
                <p>
                  Database constraint <code>CHECK (verified_by != purchased_by)</code> is strictly enforced. You logged this purchase, so another active volunteer must physically inspect it at the venue.
                </p>
              </div>
            </div>
          ) : item.status !== "purchased" ? (
            <div className="form-warning">Only purchased items can be verified by a peer.</div>
          ) : (
            <>
              <label className="confirmation-check">
                <input type="checkbox" required />
                <span>
                  I have physically examined this item at the venue, checked its quantity, condition, and confirm it is ready for the programme.
                </span>
              </label>
              <div className="soft-info">
                <CircleCheck size={17} />
                <span>Verification finality: peer confirmation marks the voucher complete and closed. No multi-level approval bottleneck required.</span>
              </div>
            </>
          )}
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "createEvent") {
    return (
      <Modal title="Schedule Unit Programme / Convention" subtitle="Publish field activity, school camp, or public convention to calendar" onClose={close}>
        <ActionForm action="createEvent" save={save} {...formProps} submit="Publish to unit calendar">
          <FormField label="Programme title" required>
            <input name="title" placeholder="e.g. Anti-Superstition Demonstration Camp" maxLength={150} required />
          </FormField>
          <div className="form-columns">
            <FormField label="Date & start time" required>
              <input name="startsAt" type="datetime-local" required />
            </FormField>
            <FormField label="Programme category">
              <select name="category">
                <option>Outreach</option>
                <option>Unit meeting</option>
                <option>Campaign</option>
                <option>Workshop</option>
                <option>Convention</option>
              </select>
            </FormField>
          </div>
          <FormField label="Venue / field location" required>
            <input name="location" placeholder="e.g. Jalpaiguri Town Club Ground" maxLength={200} required />
          </FormField>
          <FormField label="Programme agenda & briefing for cadre" required>
            <textarea name="description" placeholder="Briefing notes, objectives, volunteer arrival time..." rows={4} maxLength={4000} required />
          </FormField>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "event") {
    const event = modal.record as UnitEvent;
    const eventItems = data.procurements.filter((p) => p.eventId === event.id);
    const date = new Date(event.startsAt);

    return (
      <Modal title={event.title} subtitle={`${event.category} · ${identity.unit}`} onClose={close} wide>
        <img className="event-detail-image" src={event.image} alt={event.title} />
        <div className="event-detail-body">
          <div className="event-detail-meta">
            <span><CalendarDays size={17} />{date.toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</span>
            <span><MapPin size={17} />{event.location}</span>
            <span><Users size={17} />{event.volunteers} active volunteers assigned</span>
          </div>
          <p className="event-detail-description">{event.description}</p>
          <div className="event-checklist-summary">
            <Package size={20} />
            <div>
              <strong>Field Requisition Status</strong>
              <p>{eventItems.length} items logged · {eventItems.filter((p) => p.status === "needed").length} needed · {eventItems.filter((p) => p.status === "verified").length} verified</p>
            </div>
            <ArrowRight size={17} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="button button-secondary button-whatsapp" onClick={() => shareViaWhatsApp(formatEventBroadcast(event))}>
            <MessageCircle size={15} />
            Mobilize on WhatsApp
          </button>
          <Button variant="secondary" icon={Download} onClick={() => { downloadCalendar(event); notify("iCal event file downloaded."); }}>
            Add to calendar
          </Button>
          <Button icon={Package} onClick={() => { close(); navigate("procurement", event.id); }}>
            Open procurement checklist
          </Button>
        </div>
      </Modal>
    );
  }

  if (modal.type === "publishCircular") {
    return (
      <Modal title="Publish Digital Circular" subtitle="Issue official unit notice, meeting agenda, or urgent campaign circular" onClose={close}>
        <ActionForm action="publishCircular" save={save} {...formProps} submit="Publish circular">
          <FormField label="Circular title" required>
            <input name="title" placeholder="e.g. Call for Volunteers: World Environment Day Rally" maxLength={150} required />
          </FormField>
          <FormField label="Classification">
            <select name="category">
              <option>Unit circular</option>
              <option>Meeting agenda</option>
              <option>Resource update</option>
              <option>Urgent update</option>
            </select>
          </FormField>
          <FormField label="Circular text" required>
            <textarea name="content" rows={7} placeholder="Text of the resolution or notice..." maxLength={10000} required />
          </FormField>
          <label className="confirmation-check">
            <input name="pinned" type="checkbox" />
            <span>Pin this circular to the top of the unit notice board.</span>
          </label>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "circular") {
    const notice = modal.record as Circular;
    const author = data.profiles.find((p) => p.id === notice.authorId);

    return (
      <Modal title={notice.title} subtitle={`${notice.category} · Official Circular`} onClose={close} wide>
        <article className="circular-reader print-tech-slip">
          {author && (
            <div className="reader-byline">
              <Avatar person={author} size="small" />
              <span>
                {author.fullName} ({author.role})
                <small>{new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</small>
              </span>
              {notice.pinned && <span className="stamp-verified stamp-needed">PINNED</span>}
            </div>
          )}
          <div className="reader-content">{notice.content}</div>
          <div className="reader-signoff">
            In the cause of scientific temper and humanism,<br />
            <strong>{identity.name}<br />{identity.organisation} · {identity.unit}</strong>
          </div>
        </article>
        <div className="modal-actions">
          <button className="button button-secondary button-whatsapp" onClick={() => shareViaWhatsApp(formatCircularBroadcast(notice))}>
            <MessageCircle size={15} />
            Share to WhatsApp Group
          </button>
          <Button variant="secondary" onClick={close}>Back to board</Button>
        </div>
      </Modal>
    );
  }

  if (modal.type === "resource") {
    const r = modal.record as Resource;

    return (
      <Modal title={r.title} subtitle={`${r.kind} · ${r.category}`} onClose={close} wide>
        {r.image ? (
          <div className="poster-view">
            <img src={r.image} alt="Official Breakthrough Science Society Conference Poster" />
            <p>Original Poster Archive · Breakthrough Science Society</p>
          </div>
        ) : (
          <article className="resource-reader">
            {r.keyQuestion && (
              <div className="resource-key-question">
                <strong>CORE SCIENTIFIC QUESTION:</strong>
                <p>{r.keyQuestion}</p>
              </div>
            )}

            {r.materials && r.materials.length > 0 && (
              <div className="resource-materials-box">
                <h4>REAGENTS & MATERIALS CHECKLIST</h4>
                <ul>
                  {r.materials.map((m, idx) => (
                    <li key={idx}>
                      <span className="mono">✓</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.safetyNotes && r.safetyNotes.length > 0 && (
              <div className="resource-safety-box">
                <h4><ShieldAlert size={15} /> MANDATORY FIELD SAFETY PROTOCOLS</h4>
                <ul>
                  {r.safetyNotes.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="resource-body-text">
              {r.content?.split("\n\n").map((para, i) =>
                i === 0 ? <h3 key={i}>{para}</h3> : <p key={i}>{para}</p>
              )}
            </div>
          </article>
        )}

        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>Close</Button>
          {r.content ? (
            <Button icon={Download} onClick={() => { downloadText(`${identity.filePrefix}-${r.id}-protocol.txt`, r.content!); notify("Field protocol downloaded."); }}>
              Download protocol
            </Button>
          ) : (
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
              {...(r.image ? { download: "BSS-Conference-Poster.jpg" } : {})}
            >
              {r.image ? <Download size={15} /> : <ExternalLink size={15} />}
              {r.image ? "Download high-res poster" : "Visit official portal"}
            </a>
          )}
        </div>
      </Modal>
    );
  }

  if (modal.type === "help") {
    return (
      <Modal title="Platform Architecture & Field Workflows" subtitle="Light of Science · Breakthrough Science Society, Jalpaiguri Unit" onClose={close} wide>
        <div className="help-content">
          {[
            ["Module A: Membership Dues & Treasury Ledger", "Baseline minimum of ₹20/month with no upper cap. Advance lump-sum allocations automatically distribute across consecutive upcoming unpaid months. Members with 6+ consecutive unpaid months are flagged as Inactive / Dues Pending on rosters."],
            ["Module B: Donation Register & Extensible Receipts", "External patron contributions generate signed digital slips carrying the official society registration (S/86180 of 1996-97), unit seal, and authorized treasurer signature. Universal sharing is formatted for WhatsApp, Telegram, or A4 PDF print. Carrier SMS notification tracking is integrated."],
            ["Module C: Real-Time Event Procurement & Dual Verification", "3-stage lifecycle: needed → purchased → verified. Buyers log exact out-of-pocket spend without pre-approval caps. Dual verification rule (CHECK verified_by != purchased_by) prevents self-verification. Peer physical inspection closes the item."],
            ["Module D: Real-Time Notifications & Broadcasts", "Triggers include urgent procurements within 48 hours, peer verification confirmations to buyers, dues receipts, and high-priority broadcast circulars. Web Push API is integrated with service worker background delivery."],
            ["Module E: Science Outreach & Miracle-Busting Lab", "Interactive repertoire of anti-superstition chemical demonstrations (spontaneous combustion, bleeding lemon, thermal conductivity of fire-walking, lever-arm rod bending) plus legislative policy drafts and astronomy manuals."],
          ].map(([title, desc], i) => (
            <details key={title} open={i === 0}>
              <summary>{title}<span className="help-plus">+</span></summary>
              <p>{desc}</p>
            </details>
          ))}
          <div className="soft-info mt-3">
            <Info size={17} />
            <span>Light of Science, Jalpaiguri Unit, West Bengal. Registered under West Bengal Societies Registration Act, 1961.</span>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
}

function ActionForm({ action, save, children, busy, error, close, submit, disabled = false }: { action: string; save: (action: string, values: Record<string, unknown>) => Promise<void>; children: ReactNode; busy: boolean; error: string; close: () => void; submit: string; disabled?: boolean }) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget));
    if (action === "createEvent" && values.startsAt) values.startsAt = new Date(String(values.startsAt)).toISOString();
    void save(action, values);
  };
  return (
    <form onSubmit={onSubmit}>
      <div className="form-body">
        {children}
        {error && <div className="form-error" role="alert">{error}</div>}
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
        {disabled ? <Button disabled>{submit}</Button> : <SubmitButton busy={busy}>{submit}</SubmitButton>}
      </div>
    </form>
  );
}

function DuesCollector({ data, record, save, busy, error, close }: { data: WorkspaceData; record?: { memberId?: string; month?: number; year?: number }; save: (action: string, values: Record<string, unknown>) => Promise<void>; busy: boolean; error: string; close: () => void }) {
  const now = new Date();
  const [memberId, setMemberId] = useState(record?.memberId || data.profiles[0]?.id || "");
  const selected = data.profiles.find((p) => p.id === memberId) || data.profiles[0];
  const [amount, setAmount] = useState(String(selected?.monthlyPledge || 50));
  const [monthly, setMonthly] = useState(String(selected?.monthlyPledge || 50));
  const [month, setMonth] = useState(record?.month || now.getMonth() + 1);
  const [year, setYear] = useState(record?.year || now.getFullYear());

  const allocations: { month: number; year: number; amount: number }[] = [];
  let remaining = Number(amount), m = month, y = year, guard = 0;
  if (Number(monthly) >= 20 && remaining >= 20 && year >= 2024) {
    const paid = new Set(data.dues.filter((d) => d.memberId === memberId).map((d) => `${d.year}-${d.month}`));
    while (remaining >= 19.999 && guard < 1200) {
      guard++;
      if (!paid.has(`${y}-${m}`)) {
        let value = Math.min(Number(monthly), remaining);
        if (remaining - value > 0 && remaining - value < 20) value = remaining;
        allocations.push({ month: m, year: y, amount: value });
        remaining = Math.round((remaining - value) * 100) / 100;
      }
      m = m === 12 ? 1 : m + 1;
      if (m === 1) y++;
    }
  }

  const collector = data.profiles.find((p) => p.id === data.currentUserId);

  return (
    <Modal title="Meeting Quick-Collector" subtitle="Record dues during unit meeting with automatic multi-month allocation" onClose={close}>
      <ActionForm action="collectDues" save={save} busy={busy} error={error} close={close} submit="Record & map to ledger">
        <FormField label="Member name" required>
          <select
            name="memberId"
            value={memberId}
            onChange={(e) => {
              const p = data.profiles.find((pr) => pr.id === e.target.value)!;
              setMemberId(p.id);
              setMonthly(String(p.monthlyPledge));
              setAmount(String(p.monthlyPledge));
            }}
          >
            {data.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.role.toUpperCase()}) — Pledge: ₹{p.monthlyPledge}/mo
              </option>
            ))}
          </select>
        </FormField>

        <div className="form-columns">
          <FormField label="Total received (lump-sum allowed)" required>
            <div className="currency-input large-input">
              <span>₹</span>
              <input type="number" name="amount" value={amount} min="20" step="0.01" onChange={(e) => setAmount(e.target.value)} required />
            </div>
          </FormField>
          <FormField label="Monthly dues rate" required hint="Strict baseline: min ₹20. Custom higher recurring pledge allowed.">
            <div className="currency-input large-input">
              <span>₹</span>
              <input type="number" name="monthlyAmount" value={monthly} min="20" step="0.01" onChange={(e) => setMonthly(e.target.value)} required />
            </div>
          </FormField>
        </div>

        <div className="form-columns three-columns">
          <FormField label="Start month">
            <select name="month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {months.map((mon, i) => (
                <option value={i + 1} key={mon}>{mon}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Ledger year">
            <input name="year" type="number" min="2024" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
          </FormField>
          <FormField label="Payment mode">
            <select name="paymentMode">
              <option value="cash">Cash in meeting</option>
              <option value="upi">UPI transfer</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </FormField>
        </div>

        <div className="allocation-preview">
          <div>
            <span><Wallet size={15} />ADVANCE MULTI-MONTH ALLOCATION</span>
            <strong>{allocations.length} {allocations.length === 1 ? "month" : "months"} mapped</strong>
          </div>
          {allocations.length ? (
            <>
              <div className="allocation-months">
                {allocations.slice(0, 8).map((a) => (
                  <span key={`${a.year}-${a.month}`}>
                    <small>{months[a.month - 1]} {a.year}</small>
                    <strong>{money(a.amount)}</strong>
                    <Check size={11} />
                  </span>
                ))}
                {allocations.length > 8 && <span className="allocation-more">+{allocations.length - 8} more</span>}
              </div>
              <p>Consecutive upcoming months are automatically occupied on the ledger matrix, skipping any previously settled months.</p>
            </>
          ) : (
            <p>Enter at least ₹20 to preview how this payment distributes across consecutive months.</p>
          )}
        </div>

        <p className="collector-stamp">
          <ShieldCheck size={14} />
          Collector attribution stamp: <strong>{collector?.fullName}</strong> ({collector?.role})
        </p>
      </ActionForm>
    </Modal>
  );
}

function ReceiptModal({
  donation,
  data,
  close,
  notify,
  save,
  busy,
  open,
}: {
  donation: Donation;
  data: WorkspaceData;
  close: () => void;
  notify: (message: string) => void;
  save: (action: string, values: Record<string, unknown>) => Promise<void>;
  busy: boolean;
  open: OpenModal;
}) {
  if (!donation) return null;
  const receiptUrl = () => `${typeof window !== "undefined" ? window.location.origin : ""}/receipts/${donation.id}`;

  const shareText = () =>
    `Light of Science (Breakthrough Science Society, Jalpaiguri Unit)\nDonation Acknowledgement\nDonor: ${donation.donorName}\nAmount: ${money(donation.amount)}\nReceipt No: ${donation.receiptNo}\nVerification slip: ${receiptUrl()}\nScience for Man. Science for Society. Science in Thinking.`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${identity.name} · donation receipt`,
          text: shareText(),
          url: receiptUrl(),
        });
      } else {
        await navigator.clipboard.writeText(receiptUrl());
        notify("Receipt link copied. Ready for WhatsApp, Telegram, or email.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") notify("Open the receipt below to share its link from your browser.");
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(shareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(receiptUrl());
    const text = encodeURIComponent(shareText());
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  const collector = data.profiles.find((p) => p.id === donation.receivedBy);
  const dateFormatted = new Date(donation.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Modal title="Official Donation Digital Slip" subtitle="Multi-channel receipt with official society registration & unit seal" onClose={close}>
      <div className="receipt-slip-wrap">
        <div className="receipt-slip print-tech-slip">
          <span className="print-mark print-mark-tl slip-mark" />
          <span className="print-mark print-mark-tr slip-mark" />
          <span className="print-mark print-mark-bl slip-mark" />
          <span className="print-mark print-mark-br slip-mark" />

          {/* Letterhead */}
          <div className="receipt-brand">
            <img src="/images/bss-logo.svg" alt="BSS emblem" />
            <div>
              <strong>{identity.name}</strong>
              <span>{identity.organisation}</span>
              <span>{identity.unit} · {identity.state}</span>
              <small className="mono text-[length:max(8.5px,var(--fs-floor,0px))] text-muted block mt-0.5">Regd. No. {identity.registrationNo}</small>
            </div>
          </div>

          <div className="receipt-slip-title">
            <span>OFFICIAL DONATION ACKNOWLEDGEMENT</span>
            <span className="stamp-verified">RECORDED</span>
          </div>

          <div className="receipt-amount-row my-2">
            <div>
              <span className="mono text-[length:max(8px,var(--fs-floor,0px))] text-muted block">CONTRIBUTION AMOUNT</span>
              <div className="receipt-amount mono">{money(donation.amount)}</div>
            </div>
            <UnitOfficialSeal size={84} />
          </div>

          <p className="receipt-thanks">
            Received with thanks from <strong>{donation.donorName}</strong> for grassroots science advocacy.
          </p>

          <div className="receipt-details">
            <div><span>Receipt Serial</span><strong className="mono text-rust">{donation.receiptNo}</strong></div>
            <div><span>Date Issued</span><strong>{dateFormatted}</strong></div>
            <div><span>Payment Mode</span><strong className="uppercase">{donation.paymentMode === "bank_transfer" ? "Bank Transfer" : donation.paymentMode}</strong></div>
            <div><span>Supporting Event</span><strong>{data.events.find((e) => e.id === donation.eventId)?.title || "General Science Fund"}</strong></div>
            <div><span>Authorized Receiver</span><strong>{collector?.fullName || "Unit Treasurer"}</strong></div>
          </div>

          <div className="my-2 border-t border-dashed border-rule-soft pt-2">
            <TreasurerSignatureBlock officerName={collector?.fullName || "Arunabha Ghosh"} date={dateFormatted} />
          </div>

          <div className="receipt-bottom">
            <HeartHandshake size={18} />
            <span>Science for Man. Science for Society. Science in Thinking.</span>
          </div>

          <div className="receipt-carbon">
            {identity.unit} · {identity.organisation} — ARCHIVE COPY
          </div>
        </div>
      </div>

      {/* Sharing and SMS Channel Action Bar */}
      <div className="receipt-sharing">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(receiptUrl());
              notify("Receipt link copied.");
            } catch {
              notify("Copy URL from browser address bar.");
            }
          }}
        >
          <Copy size={15} />Copy link
        </button>

        <button onClick={shareWhatsApp} className="text-[#25D366]">
          <MessageCircle size={15} />WhatsApp
        </button>

        <button onClick={shareTelegram} className="text-[#0088cc]">
          <Send size={15} />Telegram
        </button>

        <button onClick={() => open("smsPreview", donation)}>
          <MessageSquare size={15} />SMS Gateway
        </button>

        <a href={`/receipts/${donation.id}?print=1`} target="_blank" rel="noreferrer">
          <Printer size={15} />Print A4
        </a>
      </div>

      <div className="modal-actions">
        <Button variant="secondary" onClick={close}>Done</Button>
        <Button icon={ArrowUpRight} onClick={() => void share()}>Share digital slip</Button>
      </div>
    </Modal>
  );
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCalendar(event: UnitEvent) {
  const escape = (v: string) => v.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\r", "");
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + 2 * 3600000);
  downloadText(
    `${identity.filePrefix}-event.ics`,
    `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Light of Science//BSS Jalpaiguri Unit//EN\r\nBEGIN:VEVENT\r\nUID:${event.id}@light-of-science-workspace\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${escape(event.title)}\r\nLOCATION:${escape(event.location)}\r\nDESCRIPTION:${escape(event.description)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
    "text/calendar;charset=utf-8"
  );
}
