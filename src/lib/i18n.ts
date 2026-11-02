"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Locale = "en" | "bn";

export interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

export const DICTIONARY: Translations = {
  // Navigation & Core Views
  overview: { en: "Overview", bn: "সারসংক্ষেপ" },
  members: { en: "Members", bn: "সদস্য তালিকা" },
  dues: { en: "Membership dues", bn: "চাঁদা ও তহবিল" },
  donations: { en: "Donations", bn: "গণ-অনুদান" },
  events: { en: "Events & campaigns", bn: "অনুষ্ঠান ও কর্মসূচি" },
  procurement: { en: "Procurement", bn: "ফিল্ড রিকুইজিশন" },
  circulars: { en: "Circulars & notices", bn: "নোটিশ বোর্ড" },
  resources: { en: "Science resources", bn: "বিজ্ঞান উপাদান ও আর্কাইভ" },
  settings: { en: "Unit settings", bn: "সেটিংস" },

  // Group headers
  navWorkspace: { en: "WORKSPACE", bn: "কার্যক্ষেত্র" },
  navKnowledge: { en: "KNOWLEDGE & OUTREACH", bn: "বিজ্ঞান প্রচার ও আর্কাইভ" },
  navUnitWorkspace: { en: "YOUR UNIT WORKSPACE", bn: "আপনার ইউনিট কার্যক্ষেত্র" },

  // Roles
  roleAdmin: { en: "Executive", bn: "কার্যনির্বাহী" },
  roleOrganizer: { en: "Organizer", bn: "সংগঠক" },
  roleVolunteer: { en: "Volunteer", bn: "স্বেচ্ছাসেবক" },
  roleMember: { en: "Member", bn: "সদস্য" },

  // Common buttons
  quickCollect: { en: "Quick collect", bn: "চাঁদা সংগ্রহ" },
  addMember: { en: "Add member", bn: "সদস্য যোগ" },
  createEvent: { en: "Create event", bn: "অনুষ্ঠান যোগ" },
  publishCircular: { en: "Publish circular", bn: "নোটিশ জারি" },
  addRequisition: { en: "Add requisition", bn: "রিকুইজিশন যোগ" },
  recordDonation: { en: "Record donation", bn: "অনুদান লিপিবদ্ধ" },
  searchPlaceholder: { en: "Search the unit…", bn: "অনুসন্ধান করুন…" },
  searchDirections: { en: "Find your way around the unit.", bn: "ইউনিট কার্যক্ষেত্রের যেকোনো তথ্য খুঁজুন।" },

  // Member Table
  memberCodeCol: { en: "CODE & MEMBER", bn: "কোড ও সদস্য" },
  roleCol: { en: "ROLE", bn: "দায়িত্ব" },
  monthlyPledgeCol: { en: "MONTHLY PLEDGE", bn: "মাসিক অঙ্গীকার" },
  duesAuditStatusCol: { en: "DUES AUDIT STATUS", bn: "চাঁদা নিরীক্ষা অবস্থা" },
  enrolledCol: { en: "ENROLLED", bn: "যোগদানের তারিখ" },
  actionCol: { en: "ACTION", bn: "পদক্ষেপ" },
  viewIdCard: { en: "ID Card", bn: "পরিচয়পত্র" },
  collectDues: { en: "Collect dues", bn: "চাঁদা জমা" },
  allMembersTab: { en: "All members", bn: "সকল সদস্য" },
  activeRosterTab: { en: "Active roster", bn: "নিয়মিত সদস্য" },
  duesPendingTab: { en: "Dues pending (6+ mo)", bn: "চাঁদা বাকি (৬+ মাস)" },
  organizersCadreTab: { en: "Organizers & cadre", bn: "সংগঠক ও কর্মী" },
  upToDate: { en: "UP TO DATE", bn: "নিয়মিত" },
  flaggedInactive: { en: "FLAGGED INACTIVE", bn: "অনিয়মিত" },
  monthsPending: { en: "mo pending", bn: "মাস বাকি" },

  // WhatsApp & Share
  shareWhatsApp: { en: "Share via WhatsApp", bn: "হোয়াটসঅ্যাপে পাঠান" },
  shareWhatsAppGroup: { en: "WhatsApp Group Broadcast", bn: "হোয়াটসঅ্যাপ গ্রুপ সম্প্রচার" },
  copyWhatsAppText: { en: "Copy for WhatsApp", bn: "হোয়াটসঅ্যাপ বার্তা কপি" },
  copiedSuccess: { en: "Copied to clipboard!", bn: "ক্লিপবোর্ডে কপি হয়েছে!" },

  // ID Card
  virtualIdCard: { en: "Virtual Member ID Card", bn: "ডিজিটাল সদস্য পরিচয়পত্র" },
  flipCard: { en: "Flip Card", bn: "উল্টে দেখুন" },
  printCard: { en: "Print Card", bn: "প্রিন্ট করুন" },
  societyHeader: { en: "Breakthrough Science Society", bn: "ব্রেকথ্রু সায়েন্স সোসাইটি" },
  unitSubtitle: { en: "Jalpaiguri Unit · West Bengal", bn: "জলপাইগুড়ি শাখা · পশ্চিমবঙ্গ" },
  validPeriod: { en: "Valid: 2026 – 2027", bn: "মেয়াদ: ২০২৬ – ২০২৭" },
  authorizedSignatory: { en: "Authorized Signatory", bn: "অনুমোদিত স্বাক্ষর" },
  mottoBn: { en: "Science for Man. Science for Society. Science in Thinking.", bn: "বিজ্ঞান মানুষের জন্য, বিজ্ঞান সমাজের জন্য, বিজ্ঞান চিন্তায়" },

  // Status & Badges
  statusNeeded: { en: "NEEDED", bn: "প্রয়োজন" },
  statusPurchased: { en: "PURCHASED", bn: "সংগৃহীত" },
  statusVerified: { en: "VERIFIED", bn: "যাচাইকৃত" },
  allNotices: { en: "All notices", bn: "সকল নোটিশ" },
  pinnedTab: { en: "Pinned", bn: "পিন করা" },

  // System & Connection
  onlineStatus: { en: "Workspace online", bn: "অনলাইন সংযুক্ত" },
  offlineStatus: { en: "Field offline queue", bn: "অফলাইন কিউ" },
  needHelp: { en: "Need a helping hand?", bn: "সহায়তা প্রয়োজন?" },
  curiosityMotto: { en: "Built on curiosity. Powered by people.", bn: "কৌতূহল বিজ্ঞানের ভিত। মানুষই আমাদের শক্তি।" },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key, fallback) => fallback || key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bss-locale") as Locale | null;
      if (saved === "bn" || saved === "en") {
        setLocaleState(saved);
      }
    } catch {
      // localStorage may fail in restricted environments
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("bss-locale", l);
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "bn" : "en");
  };

  const t = (key: string, fallback?: string): string => {
    const item = DICTIONARY[key];
    if (item && item[locale]) {
      return item[locale];
    }
    return fallback || key;
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, toggleLocale, t } },
    children
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
