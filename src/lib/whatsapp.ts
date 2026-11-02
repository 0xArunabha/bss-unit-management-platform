import { identity } from "@/lib/identity";
import type { Circular, UnitEvent, Profile } from "@/lib/types";

export function formatCircularBroadcast(notice: Circular, locale: "en" | "bn" = "bn"): string {
  const isBn = locale === "bn";
  const dateFormatted = new Date(notice.createdAt).toLocaleDateString(isBn ? "bn-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return isBn
    ? `📢 *বিজ্ঞপ্তি ও সার্কুলার · ${identity.name.toUpperCase()}*
_${identity.fullName}_

📌 *${notice.title}*
🏷️ *বিভাগ:* ${notice.category}
🗓️ *তারিখ:* ${dateFormatted}

${notice.content}

──────────────
🏛️ *${identity.fullName}*
✊ _${identity.bengaliMotto}_
📍 শাখা: ${identity.city}, ${identity.state}`
    : `📢 *OFFICIAL NOTICE · ${identity.name.toUpperCase()}*
_${identity.fullName}_

📌 *${notice.title}*
🏷️ *Category:* ${notice.category}
🗓️ *Date:* ${dateFormatted}

${notice.content}

──────────────
🏛️ *${identity.fullName}*
✊ _${identity.motto}_
📍 Unit: ${identity.city}, ${identity.state}`;
}

export function formatEventBroadcast(event: UnitEvent, locale: "en" | "bn" = "bn"): string {
  const isBn = locale === "bn";
  const startDate = new Date(event.startsAt);
  const dateFormatted = startDate.toLocaleDateString(isBn ? "bn-IN" : "en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatted = startDate.toLocaleTimeString(isBn ? "bn-IN" : "en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return isBn
    ? `🔬 *বিজ্ঞান কর্মসূচি আহ্বান · ${identity.name.toUpperCase()}*
_${identity.fullName}_

🎯 *কর্মসূচির নাম:* ${event.title}
📅 *তারিখ:* ${dateFormatted}
⏰ *সময়:* ${timeFormatted}
📍 *স্থান:* ${event.location}
🏷️ *বিভাগ:* ${event.category}
👥 *প্রয়োজনীয় স্বেচ্ছাসেবক:* ${event.volunteers} জন

📝 *বিবরণ:*
${event.description}

✊ _সকল সদস্য, কর্মী ও বিজ্ঞানপ্রেমী সাথীদের উপস্থিত থাকার জন্য সনির্বন্ধ অনুরোধ জানানো হচ্ছে!_
──────────────
🏛️ *${identity.fullName}*
✊ _${identity.bengaliMotto}_`
    : `🔬 *FIELD EVENT CALLOUT · ${identity.name.toUpperCase()}*
_${identity.fullName}_

🎯 *Programme:* ${event.title}
📅 *Date:* ${dateFormatted}
⏰ *Time:* ${timeFormatted}
📍 *Venue:* ${event.location}
🏷️ *Category:* ${event.category}
👥 *Volunteers Needed:* ${event.volunteers}

📝 *Description:*
${event.description}

✊ _All unit members, volunteer organizers, and science advocates are warmly called to join!_
──────────────
🏛️ *${identity.fullName}*
✊ _${identity.motto}_`;
}

export function formatDuesReminderBroadcast(member: Profile, locale: "en" | "bn" = "bn"): string {
  const isBn = locale === "bn";
  const isOverdue = member.unpaidMonths > 0;

  return isBn
    ? `🧾 *সদস্য চাঁদা হিসাব আপডেট · ${identity.name.toUpperCase()}*
_${identity.fullName}_

👤 *সদস্যের নাম:* ${member.fullName}
💰 *মাসিক অঙ্গীকার:* ₹${member.monthlyPledge}/মাস
📊 *বর্তমান অবস্থা:* ${isOverdue ? `বাকি রয়েছে: ${member.unpaidMonths} মাস` : "নিয়মিত ও সম্পূর্ণ পরিশোধিত ✓"}

বিজ্ঞান আন্দোলন, কুসংস্কার বিরোধী অভিযান ও শিক্ষার্থীদের মাঝে অনুসন্ধিৎসা গড়ে তুলতে আপনার নিয়মিত মাসিক চাঁদা আমাদের প্রধান শক্তি।
_নগদ, ইউপিআই বা ব্যাঙ্ক ট্রান্সফারের মাধ্যমে সহজেই চাঁদা প্রদান করতে পারেন।_

──────────────
🏛️ *${identity.fullName}*
✊ _${identity.bengaliMotto}_`
    : `🧾 *MEMBERSHIP DUES STATUS · ${identity.name.toUpperCase()}*
_${identity.fullName}_

👤 *Member Name:* ${member.fullName}
💰 *Monthly Pledge:* ₹${member.monthlyPledge}/month
📊 *Current Status:* ${isOverdue ? `Pending: ${member.unpaidMonths} month(s)` : "Up to date & fully contributed ✓"}

Your regular monthly contribution sustains our grassroots science advocacy, anti-superstition campaigns, and school outreach in Jalpaiguri.
_Contributions accepted via Cash, UPI, or Bank Transfer._

──────────────
🏛️ *${identity.fullName}*
✊ _${identity.motto}_`;
}

export function shareViaWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank", "noopener,noreferrer");
}

export async function copyBroadcastText(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}
