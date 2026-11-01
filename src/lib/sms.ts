import { identity } from "@/lib/identity";

export interface SendSmsParams {
  donorName: string;
  donorPhone: string | null;
  amount: number;
  receiptNo: string;
  receiptId: string;
  origin?: string;
}

export interface SendSmsResult {
  success: boolean;
  provider: "fast2sms" | "msg91" | "simulation";
  simulated: boolean;
  messageId?: string;
  message: string;
  phone: string;
  rawResponse?: unknown;
}

/**
 * Clean and normalize an Indian phone number to 10 digits.
 * Returns null if not a valid 10-digit Indian mobile number.
 */
export function sanitizeIndianPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  // If formatted as 919832012345 (12 digits starting with 91)
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(local)) return local;
  }
  // If formatted as 09832012345 (11 digits starting with 0)
  if (digits.length === 11 && digits.startsWith("0")) {
    const local = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(local)) return local;
  }
  // If direct 10 digits
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

/**
 * Builds the standard DLT-compliant contribution receipt SMS text.
 */
export function buildReceiptSmsText({
  donorName,
  amount,
  receiptNo,
  receiptId,
  origin,
}: {
  donorName: string;
  amount: number;
  receiptNo: string;
  receiptId: string;
  origin?: string;
}): string {
  const base = origin || "http://localhost:3000";
  const receiptUrl = `${base}/receipts/${receiptId}`;
  return `[${identity.name.toUpperCase()} · ${identity.organisationShort}] Received with thanks Rs.${amount.toLocaleString(
    "en-IN"
  )} from ${donorName}. Receipt No: ${receiptNo}. Official digital slip: ${receiptUrl} — Breakthrough Science Society, ${identity.unit}.`;
}

/**
 * Dispatch real or simulated SMS notification to donor phone.
 */
export async function sendDonationSms(params: SendSmsParams): Promise<SendSmsResult> {
  const cleanPhone = sanitizeIndianPhone(params.donorPhone);
  const smsText = buildReceiptSmsText(params);

  if (!cleanPhone) {
    throw new Error(
      `Please provide a valid 10-digit Indian mobile number for the donor (received: "${params.donorPhone || "none"}").`
    );
  }

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const msg91Key = process.env.MSG91_AUTH_KEY;
  const providerConfig = (process.env.SMS_PROVIDER || "").toLowerCase();

  // 1. Fast2SMS Provider (Active when FAST2SMS_API_KEY is configured)
  if (fast2smsKey && (providerConfig === "fast2sms" || !providerConfig)) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "v3",
          sender_id: process.env.FAST2SMS_SENDER_ID || "TXTIND",
          message: smsText,
          language: "english",
          flash: 0,
          numbers: cleanPhone,
        }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.return) {
        return {
          success: true,
          provider: "fast2sms",
          simulated: false,
          messageId: String(data.request_id || Date.now()),
          message: `SMS dispatched via Fast2SMS to +91 ${cleanPhone}.`,
          phone: `+91 ${cleanPhone}`,
          rawResponse: data,
        };
      } else {
        console.warn("[Fast2SMS] Gateway warning/error:", data);
        // If Fast2SMS returned an error, return failure with gateway details
        return {
          success: false,
          provider: "fast2sms",
          simulated: false,
          message: data?.message?.[0] || data?.message || "Fast2SMS gateway dispatch failed.",
          phone: `+91 ${cleanPhone}`,
          rawResponse: data,
        };
      }
    } catch (err) {
      console.error("[Fast2SMS] Network error:", err);
      throw new Error(`Unable to reach Fast2SMS gateway: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. MSG91 Provider (Active when MSG91_AUTH_KEY is configured)
  if (msg91Key && (providerConfig === "msg91" || !providerConfig)) {
    try {
      const flowId = process.env.MSG91_FLOW_ID;
      const response = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          authkey: msg91Key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: flowId,
          sender: process.env.MSG91_SENDER_ID || "BSSJPG",
          short_url: "0",
          recipients: [
            {
              mobiles: `91${cleanPhone}`,
              donor: params.donorName,
              amount: params.amount,
              receipt: params.receiptNo,
              url: `${params.origin || "http://localhost:3000"}/receipts/${params.receiptId}`,
            },
          ],
        }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && (data?.type === "success" || data?.message === "Successfully Sent")) {
        return {
          success: true,
          provider: "msg91",
          simulated: false,
          messageId: String(data.message || Date.now()),
          message: `SMS dispatched via MSG91 to +91 ${cleanPhone}.`,
          phone: `+91 ${cleanPhone}`,
          rawResponse: data,
        };
      }
    } catch (err) {
      console.error("[MSG91] Network error:", err);
      throw new Error(`Unable to reach MSG91 gateway: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Fallback: Simulated Outbound Gateway (Standard Carrier Simulator)
  // Operates when no real SMS credentials are provided, providing accurate carrier delivery payload preview
  const simulatedId = `SIM-JPG-${Date.now().toString(36).toUpperCase()}`;
  console.log(`[SMS Gateway Simulator] Outbound SMS dispatched to +91 ${cleanPhone}:`);
  console.log(`Payload: "${smsText}" (MessageId: ${simulatedId})`);

  return {
    success: true,
    provider: "simulation",
    simulated: true,
    messageId: simulatedId,
    message: `Carrier simulation confirmed. In production, configure FAST2SMS_API_KEY in .env.local to dispatch via telecom networks.`,
    phone: `+91 ${cleanPhone}`,
  };
}
