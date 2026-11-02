export interface OperationalTeam {
  id: string;
  nameEn: string;
  nameBn: string;
  inChargeName: string;
  memberNames: string[];
  descriptionEn: string;
  descriptionBn: string;
}

export const OPERATIONAL_TEAMS: OperationalTeam[] = [
  {
    id: "office",
    nameEn: "Office Team",
    nameBn: "অফিস টিম",
    inChargeName: "Arunabha Ghosh",
    memberNames: ["Hrithik Sen", "Pritam Ghosh", "Nilanjan Roy"],
    descriptionEn: "Administrative coordination, communication, unit office logistics, and record maintenance.",
    descriptionBn: "প্রশাসনিক সমন্বয়, যোগাযোগ, অফিস ব্যবস্থাপনা এবং নথিপত্র রক্ষণাবেক্ষণ।",
  },
  {
    id: "experiment",
    nameEn: "Experiment Team",
    nameBn: "এক্সপেরিমেন্ট টিম",
    inChargeName: "Avash Rajak",
    memberNames: ["Sreelekha Sarkar", "Samarpan Chakraborty", "Joydev Adhikary", "Anirban Kar", "Arnish Hossain"],
    descriptionEn: "Hands-on science demonstration kits, anti-superstition lab experiments, and school workshops.",
    descriptionBn: "হাতে-কলমে বিজ্ঞানের মডেল, কুসংস্কার বিরোধী পরীক্ষা প্রদর্শনী এবং স্কুল কর্মশালা।",
  },
  {
    id: "membership",
    nameEn: "Membership Team",
    nameBn: "মেম্বারশীপ টিম",
    inChargeName: "Ananya Kar",
    memberNames: ["Debasmita Bhandari", "Shree Roy (শ্রী রায়)", "Shree Roy", "Avash Rajak"],
    descriptionEn: "Member enrollment, dues tracking, volunteer onboarding, and member engagement.",
    descriptionBn: "নতুন সদস্য অন্তর্ভুক্তি, চাঁদা পর্যবেক্ষণ, স্বেচ্ছাসেবক অন্তর্ভুক্তি ও সাংগঠনিক যোগাযোগ।",
  },
  {
    id: "digital",
    nameEn: "Digital Team",
    nameBn: "ডিজিটাল টিম",
    inChargeName: "Arunabha Ghosh",
    memberNames: ["Soham Das", "Shree Roy (শ্রী রায়)", "Shree Roy", "Avash Rajak"],
    descriptionEn: "Web platform maintenance, social advocacy, digital circulars, and outreach campaigns.",
    descriptionBn: "ওয়েব প্ল্যাটফর্ম পরিচালনা, সোশ্যাল মিডিয়া প্রচারণা, ডিজিটাল সার্কুলার ও তথ্যপ্রযুক্তি।",
  },
  {
    id: "culture",
    nameEn: "Culture Team & Magazine",
    nameBn: "সংস্কৃতি টিম ও পত্রিকা",
    inChargeName: "Dipta Paul",
    memberNames: ["Hari Roy", "Kaustubhi Singha", "Kaushiki Ray", "Debasmita Bhandari"],
    descriptionEn: "Unit bulletins, street plays, science drama, songs, posters, and literary publication.",
    descriptionBn: "বিজ্ঞান পত্রিকা, বুলেটিন, পথনাটক, বিজ্ঞান সঙ্গীত, পোস্টার ও সাংস্কৃতিক আন্দোলন।",
  },
  {
    id: "astronomy",
    nameEn: "Sky Observation Team",
    nameBn: "আকাশ পর্যবেক্ষণ টিম",
    inChargeName: "Anirban Kar",
    memberNames: ["Arunabha Ghosh", "Supriyo Mondal", "Supriyo Roy", "Sreelekha Sarkar"],
    descriptionEn: "Telescope operations, night sky watching camps, celestial event outreach, and astrophysics talks.",
    descriptionBn: "টেলিস্কোপ পরিচালনা, আকাশ পর্যবেক্ষণ শিবির, মহাজাগতিক ঘটনা পর্যবেক্ষণ ও জ্যোতির্বিজ্ঞান।",
  },
  {
    id: "research",
    nameEn: "Research Team",
    nameBn: "গবেষণা টিম",
    inChargeName: "Arindam Bhattacharya",
    memberNames: ["Debarghya Biswas", "Debarghya Das", "Samarpan Chakraborty", "Nilanjan Roy", "Sreelekha Sarkar", "Avash Rajak", "Anirban Kar"],
    descriptionEn: "Scientific literature analysis, local environmental and health studies, and debate forums.",
    descriptionBn: "বৈজ্ঞানিক প্রবন্ধ পর্যালোচনা, স্থানীয় পরিবেশ ও স্বাস্থ্য বিষয়ক সমীক্ষা এবং বিজ্ঞান বিতর্ক।",
  },
];

/** Return specific operational team roles or designations for a given member name */
export function getMemberDesignations(fullName: string): {
  primaryTitleEn: string;
  primaryTitleBn: string;
  teams: string[];
} {
  const normalized = fullName.trim().toLowerCase();
  
  // Executive leadership
  if (normalized.includes("swarndeep")) {
    return {
      primaryTitleEn: "Working President",
      primaryTitleBn: "কার্যকরী সভাপতি",
      teams: ["Executive Committee"],
    };
  }
  if (normalized.includes("pritam sarkar")) {
    return {
      primaryTitleEn: "Secretary",
      primaryTitleBn: "সম্পাদক",
      teams: ["Executive Committee"],
    };
  }
  if (normalized.includes("avash") || normalized.includes("abhas")) {
    return {
      primaryTitleEn: "Joint Secretary & In-charge (Experiment)",
      primaryTitleBn: "যুগ্ম সম্পাদক ও ইনচার্জ (এক্সপেরিমেন্ট)",
      teams: ["Experiment", "Membership", "Digital", "Research"],
    };
  }
  if (normalized.includes("arunabha")) {
    return {
      primaryTitleEn: "Executive Officer & In-charge (Office & Digital)",
      primaryTitleBn: "কার্যনির্বাহী ও ইনচার্জ (অফিস ও ডিজিটাল)",
      teams: ["Office", "Digital", "Sky Observation"],
    };
  }
  if (normalized.includes("ananya kar")) {
    return {
      primaryTitleEn: "In-charge (Membership Team)",
      primaryTitleBn: "ইনচার্জ (মেম্বারশীপ টিম)",
      teams: ["Membership"],
    };
  }
  if (normalized.includes("dipta paul")) {
    return {
      primaryTitleEn: "In-charge (Culture Team & Magazine)",
      primaryTitleBn: "ইনচার্জ (সংস্কৃতি টিম ও পত্রিকা)",
      teams: ["Culture & Magazine"],
    };
  }
  if (normalized.includes("anirban kar")) {
    return {
      primaryTitleEn: "In-charge (Sky Observation Team)",
      primaryTitleBn: "ইনচার্জ (আকাশ পর্যবেক্ষণ টিম)",
      teams: ["Sky Observation", "Experiment", "Research"],
    };
  }
  if (normalized.includes("arindam")) {
    return {
      primaryTitleEn: "In-charge (Research Team)",
      primaryTitleBn: "ইনচার্জ (গবেষণা টিম)",
      teams: ["Research"],
    };
  }
  if (normalized.includes("samarpan")) {
    return {
      primaryTitleEn: "Organizer",
      primaryTitleBn: "সংগঠক",
      teams: ["Experiment", "Research"],
    };
  }

  // Find member teams
  const matchedTeams: string[] = [];
  for (const team of OPERATIONAL_TEAMS) {
    if (team.memberNames.some((m) => m.toLowerCase().includes(normalized) || normalized.includes(m.toLowerCase()))) {
      matchedTeams.push(team.nameEn.replace(" Team", ""));
    }
  }

  if (matchedTeams.length > 0) {
    return {
      primaryTitleEn: `Member (${matchedTeams.join(", ")})`,
      primaryTitleBn: `সদস্য (${matchedTeams.join(", ")})`,
      teams: matchedTeams,
    };
  }

  return {
    primaryTitleEn: "Unit Member & Field Advocate",
    primaryTitleBn: "ইউনিট সদস্য ও বিজ্ঞান কর্মী",
    teams: [],
  };
}
