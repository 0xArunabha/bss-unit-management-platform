import { BN, BN_SERVER } from "@/lib/i18n-bn";
import { toBnDigits } from "@/lib/locale";

/**
 * Server messages that carry names or amounts, matched by pattern. Messages with fixed wording are looked up exactly
 * in `BN`; the ones here have {placeholders} in the English and a Bengali template with the same placeholders.
 *
 *   "Application from Rina Das was rejected."  matches  "Application from {name} was rejected."
 *   → "Rina Das-এর আবেদন নাকচ করা হয়েছে।"
 *
 * What a placeholder captured is carried across as follows: numbers get Bengali digits, anything that is a known
 * phrase (an item or event that ships with the app, a field label) is translated, and everything else (a member's
 * name, a phone number, a code) is left exactly as it was written.
 */

/** Placeholders that hold a number or an amount; their digits become Bengali digits. */
const NUMERIC = new Set(["amount", "count", "max", "min", "month", "pledge", "seconds", "total", "unpaid", "year"]);
/** Placeholders that must never be translated or re-digited: identifiers the person may need to read out or type. */
const VERBATIM = new Set(["code", "email", "phone", "receipt"]);

interface Pattern {
  re: RegExp;
  slots: string[];
  bn: string;
  /** Characters of fixed wording; patterns with more of it are tried first so the generic ones cannot swallow them. */
  weight: number;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let patterns: Pattern[] | null = null;

function compile(): Pattern[] {
  return Object.entries(BN_SERVER)
    .map(([english, bn]) => {
      const slots: string[] = [];
      const source = english
        .split(/(\{\w+\})/)
        .map((part) => {
          const slot = /^\{(\w+)\}$/.exec(part);
          if (!slot) return escapeRegExp(part);
          slots.push(slot[1]);
          if (NUMERIC.has(slot[1])) return "(\\d[\\d,.]*)";
          return slot[1] === "message" ? "([\\s\\S]+)" : "([\\s\\S]+?)";
        })
        .join("");
      return { re: new RegExp(`^${source}$`), slots, bn, weight: english.replace(/\{\w+\}/g, "").length };
    })
    .sort((a, b) => b.weight - a.weight);
}

function carryOver(slot: string, value: string): string {
  if (NUMERIC.has(slot)) return toBnDigits(value);
  if (VERBATIM.has(slot)) return value;
  if (slot === "message") return translateServerMessage(value) ?? BN[value] ?? value;
  return BN[value] ?? value;
}

/** Bengali for an English server message with names or amounts in it, or null when no pattern fits. */
export function translateServerMessage(message: string): string | null {
  patterns ??= compile();
  for (const pattern of patterns) {
    const match = pattern.re.exec(message);
    if (!match) continue;
    return pattern.bn.replace(/\{(\w+)\}/g, (whole, slot: string) => {
      const index = pattern.slots.indexOf(slot);
      return index < 0 ? whole : carryOver(slot, match[index + 1]);
    });
  }
  return null;
}
