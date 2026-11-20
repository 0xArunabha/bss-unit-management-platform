import type { I18n } from "@/lib/i18n-core";
import type { Resource } from "@/lib/resources";
import type { WorkspaceData } from "@/lib/types";
import { toBnDigits } from "@/lib/locale";

/*
 * Content that ships with the app (the sample events and checklist items, the resource library) is written in
 * English in the data. These helpers swap in the Bengali by exact match. Anything a person typed in is not in the
 * dictionary, so it passes through exactly as entered; the app never rewrites people's own words.
 */

type Translate = Pick<I18n, "locale" | "t" | "tc" | "ts">;

const BENGALI_SCRIPT = /[\u0980-\u09FF]/;
const ORIGINAL_SEPARATOR = "───────────────────────────────";

/**
 * Exact lookup of one line. Bengali typed on different keyboards spells ড়, ঢ় and য় either as one character or as a
 * letter plus a dot sign; they look identical, so a line is also tried in its normalised form before giving up.
 */
const lookupLine = (tc: (text: string) => string, line: string): string => {
  const hit = tc(line);
  if (hit !== line) return hit;
  const normal = line.normalize("NFC");
  if (normal === line) return line;
  const normalHit = tc(normal);
  return normalHit !== normal ? normalHit : line;
};

/**
 * Some circulars were written in Bengali first and carry the English as a translation, with the Bengali original
 * after a divider. In Bengali the original is the better text, so it is shown as written (plus a translated
 * "LABEL: value" header, if the circular has one). Other circulars that ship with the app are looked up whole or,
 * failing that, line by line, so a changed line only costs that line its translation. A circular a person wrote is
 * never touched line by line: `shipped` is true only when the title is one the app itself provides.
 */
function localizeCircularContent(content: string, tc: (text: string) => string, shipped: boolean): string {
  const whole = tc(content);
  if (whole !== content) return whole;
  const cut = content.indexOf(ORIGINAL_SEPARATOR);
  if (cut >= 0) {
    const original = content.slice(cut + ORIGINAL_SEPARATOR.length).split("\n").slice(2).join("\n").trim();
    if (BENGALI_SCRIPT.test(original)) {
      const header = content.slice(0, cut).split("\n\n")[0].split("\n").filter((line) => /^[A-Z][A-Z ]+: /.test(line)).map((line) => lookupLine(tc, line));
      return header.length ? `${header.join("\n")}\n\n${original}` : original;
    }
  }
  if (!shipped) return content;
  // Minutes: a header, the Bengali record and an English summary of it, each section between two "====" rules.
  const sections = content.split(/^={10,}[ \t]*$/m);
  if (sections.length >= 5 && BENGALI_SCRIPT.test(sections[2])) {
    const header = sections[0].split("\n").filter((line) => line.trim()).map((line) => lookupLine(tc, line));
    return `${header.join("\n")}\n\n${sections[2].trim()}`;
  }
  return content.split("\n").map((line) => lookupLine(tc, line)).join("\n");
}

/** The data the screens show. In English it is returned untouched (same object), so nothing re-renders for no reason. */
export function localizeData(data: WorkspaceData, i18n: Translate): WorkspaceData {
  if (i18n.locale !== "bn") return data;
  const { tc, ts } = i18n;
  return {
    ...data,
    events: data.events.map((e) => ({
      ...e,
      title: tc(e.title),
      description: tc(e.description),
      location: tc(e.location),
      targetGoal: e.targetGoal ? tc(e.targetGoal) : e.targetGoal,
      milestones: e.milestones?.map((m) => ({ ...m, title: tc(m.title), description: tc(m.description), completedDate: m.completedDate ? toBnDigits(m.completedDate) : m.completedDate })),
    })),
    procurements: data.procurements.map((p) => ({ ...p, itemName: tc(p.itemName), quantity: tc(p.quantity) })),
    circulars: data.circulars.map((c) => {
      const title = tc(c.title);
      return { ...c, title, content: localizeCircularContent(c.content, tc, title !== c.title) };
    }),
    activities: data.activities.map((a) => ({ ...a, title: ts(a.title), description: ts(a.description) })),
  };
}

const PUBLIC_SUMMARY = /^\[Summary for Public Viewers\] ([\s\S]*?) (Log in with your unit member account to view full chemical safety checklists, reagent proportions, and demonstration protocols\.)$/;

export function localizeResource(resource: Resource, i18n: Translate): Resource {
  if (i18n.locale !== "bn") return resource;
  const { tc, t } = i18n;
  const summary = resource.content ? PUBLIC_SUMMARY.exec(resource.content) : null;
  return {
    ...resource,
    title: tc(resource.title),
    description: tc(resource.description),
    kind: tc(resource.kind),
    readTime: tc(resource.readTime),
    keyQuestion: resource.keyQuestion ? tc(resource.keyQuestion) : resource.keyQuestion,
    materials: resource.materials?.map(tc),
    safetyNotes: resource.safetyNotes?.map(tc),
    // Visitors who are not signed in get a short public summary built from the description.
    content: summary ? t("[Summary for Public Viewers] {description} Log in with your unit member account to view full chemical safety checklists, reagent proportions, and demonstration protocols.", { description: tc(resource.description) }) : resource.content ? tc(resource.content) : resource.content,
  };
}

/** The Mashkalaibari campaign and its report are found by name; the name is spelled differently in each language. */
export const isMashkalaibari = (text: string) => /Mashkalaibari|মাষকলাইবাড়ি|মাসকলাইবাড়ি/.test(text);

/** The World Environment Day rally and the club-room session carry their own photo galleries; match by either language. */
export const isEnvironmentDayText = (text: string) => /environment day|karala|পরিবেশ দিবস|করলা/i.test(text);
export const isDhimanSessionText = (text: string) => /dhiman|robotics|ধীমান|রোবোটিক্স/i.test(text);
export const isPrafullaRayText = (text: string) => /prafulla|ray|acharya|প্রফুল্ল|আচার্য্য|আসাম.*ত্রাণ|flood relief/i.test(text);
