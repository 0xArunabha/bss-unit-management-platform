/**
 * Locale primitives that are safe on both the server and the client (no React, no "use client").
 * The interactive pieces (provider, hook, `t`) live in `i18n.tsx`; anything a server component
 * needs, such as the receipt page, comes from here.
 *
 * English output is exactly what the app produced before localisation (en-IN formatting).
 * Bengali output deliberately does not lean on ICU for everything: its abbreviated month names
 * ("নভেঃ") and its "১২ নভেম্বর এ ২:০৫ PM" date-time pattern read oddly, so those are composed by hand.
 */
export type Locale = "en" | "bn";

/** Cookie and localStorage key. The cookie lets the server render the right language on first paint. */
export const LOCALE_COOKIE = "bss-locale";
export const LOCALE_STORAGE_KEY = "bss-locale";

export const parseLocale = (value: string | null | undefined): Locale | undefined => (value === "bn" || value === "en" ? value : undefined);

/** BCP 47 tags used for Intl formatting. Both use Indian digit grouping (12,34,567). */
export const intlTag = (locale: Locale) => (locale === "bn" ? "bn-IN" : "en-IN");

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
/** Latin digits to Bengali digits. Everything else in the string is left alone. */
export const toBnDigits = (value: string) => value.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);

export const formatNumber = (value: number, locale: Locale) => value.toLocaleString(intlTag(locale));
export const formatMoney = (value: number, locale: Locale) => `₹${formatNumber(value, locale)}`;

export const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTHS_BN = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"] as const;
const MONTHS_BN_LONG = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"] as const;
export const monthShortName = (index: number, locale: Locale) => (locale === "bn" ? MONTHS_BN : MONTHS_EN)[index] ?? "";

export type DateInput = Date | string | number;
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

type Options = Intl.DateTimeFormatOptions | undefined;
const hasDateFields = (o: Options) => Boolean(o && (o.weekday || o.day || o.month || o.year));
const hasTimeFields = (o: Options) => Boolean(o && (o.hour || o.minute));

/** Bengali clock the way people say it: "বিকেল ২:০৫" rather than "২:০৫ PM". */
function bnClock(date: Date): string {
  const hour = date.getHours();
  const period = hour < 4 ? "রাত" : hour < 6 ? "ভোর" : hour < 12 ? "সকাল" : hour < 16 ? "দুপুর" : hour < 18 ? "বিকেল" : hour < 20 ? "সন্ধ্যা" : "রাত";
  const clock = `${hour % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${period} ${toBnDigits(clock)}`;
}

function bnDate(date: Date, options: Options): string {
  if (!hasDateFields(options)) return date.toLocaleDateString("bn-IN");
  const o = options as Intl.DateTimeFormatOptions;
  const named = o.month === "short" || o.month === "long" || o.month === "narrow";
  const parts = new Intl.DateTimeFormat("bn-IN", { weekday: o.weekday, day: o.day, month: named ? "long" : o.month, year: o.year }).formatToParts(date);
  return parts
    .map((part) => (part.type === "month" && named ? (o.month === "long" ? MONTHS_BN_LONG : MONTHS_BN)[date.getMonth()] : part.value))
    .join("")
    .trim();
}

export function formatDate(value: DateInput, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  return locale === "bn" ? bnDate(date, options) : date.toLocaleDateString("en-IN", options);
}

export function formatTime(value: DateInput, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  return locale === "bn" ? bnClock(date) : date.toLocaleTimeString("en-IN", options);
}

export function formatDateTime(value: DateInput, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  if (locale !== "bn") return date.toLocaleString("en-IN", options);
  const wantsTime = !options || hasTimeFields(options);
  const wantsDate = !options || hasDateFields(options) || !hasTimeFields(options);
  return [wantsDate ? bnDate(date, options) : "", wantsTime ? bnClock(date) : ""].filter(Boolean).join(", ");
}
