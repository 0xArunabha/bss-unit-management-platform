import React, { type ReactNode } from "react";
import { BN } from "@/lib/i18n-bn";
import { translateServerMessage } from "@/lib/i18n-server-messages";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatTime,
  monthShortName,
  toBnDigits,
  type DateInput,
  type Locale,
} from "@/lib/locale";

export type { Locale } from "@/lib/locale";
/** Values for `{name}` placeholders in `t()`. Numbers get Bengali digits in Bengali; strings are inserted as they are. */
export type Params = Record<string, string | number>;
/** Values for `{name}` placeholders in `tx()`. Anything React can render. */
export type RichParams = Record<string, ReactNode>;

/*
 * How translation works here
 * --------------------------
 * This file is pure (no hooks, no "use client"), so server components such as the receipt page can build
 * their translator from it too. The provider and `useI18n` live in `i18n.tsx`.
 *
 * The English wording is the key: t("Add member") returns "সদস্য যোগ করুন" in Bengali and the same English
 * text otherwise. All Bengali lives in one place, `i18n-bn.ts`. A string with no Bengali entry shows in
 * English (and is reported once in the dev console), so a missing translation never breaks a screen.
 *
 *   t("Dues pending")                              plain text
 *   t("{name} joined in {year}", { name, year })   placeholders; word order is free to differ per language
 *   tx("Open the <b>Dues</b> tab", {})             sentences with bold/code/line breaks inside
 *   ts(result.message)                             wording that arrives from the server in English
 */

const PLACEHOLDER = /\{(\w+)\}/g;
const missing = new Set<string>();

function warnMissing(text: string) {
  if (process.env.NODE_ENV === "production" || missing.has(text) || !/[A-Za-z]{2,}/.test(text)) return;
  missing.add(text);
  console.warn(`[i18n] No Bengali translation for: ${text}`);
  if (typeof window !== "undefined") (window as unknown as { __i18nMissing?: Set<string> }).__i18nMissing = missing;
}

function lookup(locale: Locale, text: string): string {
  if (locale !== "bn") return text;
  const hit = BN[text];
  if (hit !== undefined) return hit;
  warnMissing(text);
  return text;
}

const renderValue = (value: string | number, locale: Locale) => (typeof value === "number" && locale === "bn" ? toBnDigits(String(value)) : String(value));

function fill(template: string, params: Params | undefined, locale: Locale): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (whole, key: string) => (key in params ? renderValue(params[key], locale) : whole));
}

const RICH_TOKEN = /(<\/?(?:b|strong|em|i|code|small)>|<br\s*\/?>|\{\w+\})/;
const RICH_OPEN = /^<(b|strong|em|i|code|small)>$/;
const RICH_CLOSE = /^<\/(b|strong|em|i|code|small)>$/;

function renderRich(template: string, params: RichParams | undefined, locale: Locale): ReactNode {
  const stack: { tag: string | null; children: ReactNode[] }[] = [{ tag: null, children: [] }];
  const top = () => stack[stack.length - 1].children;
  let key = 0;
  const closeTop = () => {
    const frame = stack.pop();
    if (frame && frame.tag) top().push(React.createElement(frame.tag, { key: key++ }, ...frame.children));
  };
  for (const part of template.split(RICH_TOKEN)) {
    if (!part) continue;
    const open = RICH_OPEN.exec(part);
    if (open) { stack.push({ tag: open[1], children: [] }); continue; }
    if (RICH_CLOSE.test(part)) { if (stack.length > 1) closeTop(); continue; }
    if (/^<br\s*\/?>$/.test(part)) { top().push(React.createElement("br", { key: key++ })); continue; }
    const slot = /^\{(\w+)\}$/.exec(part);
    if (slot && params && slot[1] in params) {
      const value = params[slot[1]];
      top().push(typeof value === "number" ? renderValue(value, locale) : React.isValidElement(value) ? React.cloneElement(value, { key: key++ }) : value);
      continue;
    }
    top().push(part);
  }
  while (stack.length > 1) closeTop();
  return React.createElement(React.Fragment, null, ...stack[0].children);
}

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /** Plain-text translation. The English wording is the key; `{name}` placeholders are filled from `params`. */
  t: (text: string, params?: Params) => string;
  /** Translation for sentences that carry inline <b>, <strong>, <em>, <i>, <code>, <small> or <br/>, or React values. */
  tx: (text: string, params?: RichParams) => ReactNode;
  /** Translate a message that came back from the server in English. Unknown messages are shown as they are. */
  ts: (message: string) => string;
  /**
   * Translate content that ships with the app (sample events, the resource library) by exact match. Text a person
   * typed in is not in the dictionary, so it comes back exactly as entered, and a miss is never reported.
   */
  tc: (text: string) => string;
  /** 1234 → "1234" or "১২৩৪" (plain digits, no grouping; use `money` for amounts). */
  num: (value: number) => string;
  /** 1500 → "₹1,500" or "₹১,৫০০". */
  money: (value: number) => string;
  fmtDate: (value: DateInput, options?: Intl.DateTimeFormatOptions) => string;
  fmtTime: (value: DateInput, options?: Intl.DateTimeFormatOptions) => string;
  fmtDateTime: (value: DateInput, options?: Intl.DateTimeFormatOptions) => string;
  /** Short month name, 0 = January. */
  monthShort: (index: number) => string;
  /** Display name for a role value such as "admin" → "Executive" / "কার্যনির্বাহী". */
  roleName: (role: string) => string;
}

const ROLE_NAMES: Record<string, string> = { admin: "Executive", organizer: "Organizer", volunteer: "Volunteer", member: "Member", guest: "Guest" };

export function createI18n(locale: Locale, setLocale: (locale: Locale) => void): I18n {
  const t = (text: string, params?: Params) => fill(lookup(locale, text), params, locale);
  return {
    locale,
    setLocale,
    toggleLocale: () => setLocale(locale === "en" ? "bn" : "en"),
    t,
    tx: (text, params) => renderRich(lookup(locale, text), params, locale),
    ts: (message) => {
      if (locale !== "bn" || !message) return message;
      const exact = BN[message];
      if (exact !== undefined) return exact;
      return translateServerMessage(message) ?? message;
    },
    tc: (text) => (locale === "bn" && text ? BN[text] ?? text : text),
    num: (value) => renderValue(value, locale),
    money: (value) => formatMoney(value, locale),
    fmtDate: (value, options) => formatDate(value, locale, options),
    fmtTime: (value, options) => formatTime(value, locale, options),
    fmtDateTime: (value, options) => formatDateTime(value, locale, options),
    monthShort: (index) => monthShortName(index, locale),
    roleName: (role) => t(ROLE_NAMES[role] ?? role.charAt(0).toUpperCase() + role.slice(1)),
  };
}
