export type Resource = {
  id: string;
  title: string;
  description: string;
  category: "Demonstrations" | "Environment" | "Publications" | "Organising" | "Advocacy";
  kind: string;
  readTime: string;
  icon: "flask" | "leaf" | "book" | "presentation" | "shield" | "poster";
  content?: string;
  url?: string;
  image?: string;
  materials?: string[];
  safetyNotes?: string[];
  keyQuestion?: string;
};

export const resources: Resource[] = [
  {
    id: "fire-miracle",
    title: "Spontaneous fire without matchsticks: chemical trick debunked",
    description: "How fake godmen trigger flames from 'divine prayers'. Step-by-step field demonstration script using potassium permanganate and glycerin.",
    category: "Demonstrations",
    kind: "ANTI-SUPERSTITION DEMO PROTOCOL",
    readTime: "6 min protocol",
    icon: "flask",
    materials: [
      "Potassium permanganate (KMnO₄) crystals (dry, finely powdered, 1 teaspoon)",
      "Glycerin (glycerol) in dropper bottle (approx. 4-5 drops)",
      "Non-flammable ceramic tile or sand tray",
      "Safety goggles and leather demonstration tongs",
      "Fire extinguisher or water bucket within arm's reach",
    ],
    safetyNotes: [
      "Never perform on bare ground or wooden tables; always use a heavy ceramic tile.",
      "Stand at least 2 metres back once glycerin is added; delay is typically 15–40 seconds.",
      "Clear spectators from downwind to avoid smoke inhalation.",
      "Never allow children or attendees to handle the reagents.",
    ],
    keyQuestion: "Can chemical energy release heat and flames without any supernatural intervention?",
    content: `SPONTANEOUS FIRE WITHOUT MATCHSTICKS
Breakthrough Science Society — Field Science & Miracle-Busting Protocol

1. THE CONTEXT IN THE FIELD
In rural and peri-urban melas, self-proclaimed godmen sprinkle 'holy water' on a bowl of 'holy black ashes' (havan kund) and chant mantras. Within half a minute, smoke billows and fire bursts out. Gullible families are told divine spirits have visited, often parting with money or jewels.

2. THE ACTUAL SCIENCE (EXOTHERMIC OXIDATION)
Potassium permanganate (KMnO₄) is a powerful oxidising agent. Glycerin (C₃H₈O₃) is an easily oxidisable polyhydric alcohol.
When glycerin drops contact finely powdered KMnO₄, an intense exothermic oxidation reaction starts slowly, creating heat:
14 KMnO₄ + 4 C₃H₅(OH)₃ → 7 K₂CO₃ + 7 Mn₂O₃ + 5 CO₂ + 16 H₂O + ΔH (Heat)
As temperature climbs past glycerin's autoignition point (~370°C), spontaneous combustion occurs, producing purple-tinged flames from potassium ions.

3. VOLUNTEER NARRATION SCRIPT
• First stage: Place the black powder on the tile. Ask: "What does this look like? Just black crystals."
• Second stage: Add 4 drops of glycerin. Count aloud with the children: "1, 2, 3... 15 seconds."
• Third stage: As smoke starts and flames erupt, explain: "No mantra was chanted. The delay is the reaction heating up to its ignition point. Anyone in the world who mixes these two substances gets the exact same fire, regardless of belief."

4. CONVERSATION PROMPTS FOR THE GATHERING
• Ask: "If someone charges you ₹500 for a miracle that anyone can buy for ₹10 at a pharmacy, who is gaining and who is being deceived?"
• Reiterate: Nature obeys predictable physical laws; true wonder lies in understanding nature through evidence.`,
  },
  {
    id: "bleeding-lemon",
    title: "The 'bleeding lemon' illusion: acid-base & complexation exposed",
    description: "Exposing how occult practitioners stab a lemon to claim evil spirits have been extracted as fresh blood.",
    category: "Demonstrations",
    kind: "ANTI-SUPERSTITION DEMO PROTOCOL",
    readTime: "5 min protocol",
    icon: "flask",
    materials: [
      "Fresh yellow lemons",
      "Ferric Chloride solution (FeCl₃, diluted in water)",
      "Potassium Thiocyanate (KSCN) or Ammonium Thiocyanate (diluted)",
      "Hypodermic syringe (handled strictly by lead volunteer)",
      "Demonstration knife (stainless steel or kitchen knife)",
    ],
    safetyNotes: [
      "Thiocyanate and Ferric salts must never be ingested or come near mucous membranes.",
      "Discard used lemons in hazardous waste bucket; do not allow attendees to touch.",
      "Wash hands thoroughly after demonstration.",
    ],
    keyQuestion: "Is red fluid coming from a fruit evidence of demonic blood, or simply an inorganic chemical reaction?",
    content: `THE 'BLEEDING LEMON' ILLUSION EXPOSED
Breakthrough Science Society — Miracle-Busting Working Guide

1. THE FRAUD EXPLAINED
An exorcist or 'tantrik' visits a troubled household. He claims negative energy has possessed the house. He takes a clean-looking lemon, chants incantations, slices it with his special knife—and blood-red liquid drips onto the floor. The family is terrified and agrees to expensive 'shanti' rituals.

2. THE CHEMICAL REACTION
Before the demonstration, the practitioner treats the knife with Ferric Chloride (FeCl₃) or injects a small amount of Potassium Thiocyanate (KSCN) inside the lemon beforehand.
When the ferric ion (Fe³⁺) meets the thiocyanate ion (SCN⁻), it instantly forms the deep blood-red complex ion:
Fe³⁺(aq) + SCN⁻(aq) ⇌ [Fe(SCN)]²⁺(aq) (Iron thiocyanate - deep blood-red color)
Because the lemon juice contains citric acid and moisture, it quickly dissolves the knife coating, producing the exact appearance of arterial blood.

3. HOW TO DEMONSTRATE AT THE SCIENCE CAMP
• Show two cups: one transparent water-like solution (KSCN), one pale yellow (FeCl₃).
• Mix them together: watch the instant deep blood-red liquid form before the audience's eyes.
• Now cut the treated lemon in front of them with the treated knife.
• Invite a student volunteer to inspect the knife and explain the complex ion formation.
• Conclude: "Demons do not bleed ferric thiocyanate. Chemistry does."`,
  },
  {
    id: "fire-walking",
    title: "Walking on hot coals: thermal conductivity & Leidenfrost physics",
    description: "The physical principles of low thermal conductivity, ash insulation, and brief contact time behind fire-walking rituals.",
    category: "Demonstrations",
    kind: "PHYSICS FIELD PROTOCOL",
    readTime: "5 min read",
    icon: "shield",
    content: `WALKING ON BURNING COALS (ANGAAR)
Physics analysis for science communicators & school camps

1. THE CLAIM
Religious ceremonies claim that only participants endowed with divine blessings or deep devotion can cross a 3-metre bed of glowing red embers without burning their feet. Those who doubt or lack faith are warned they will be scorched.

2. THE PHYSICAL FACTS
Fire-walking is entirely governed by thermodynamics and thermal physics:
• Material: The embers are wood charcoal, not metal. While charcoal glows red at ~500°C–600°C, wood has an extremely poor thermal conductivity (k ≈ 0.08–0.15 W/m·K) and a very low volumetric heat capacity.
• Contrast with metals: Walking on red-hot iron plate (k ≈ 50 W/m·K) would inflict severe burns instantly, because metal transfers heat thousands of times faster than charcoal.
• Ash layer: Red embers are covered by a fine layer of white ash, which acts as a thermal insulator.
• Contact time: A confident stride across 3 metres takes approximately 1.5 to 2 seconds. Each foot touches an ember for merely 0.35 to 0.45 seconds—insufficient time for significant thermal energy to conduct through the thick stratum corneum (dead outer skin) of the sole.
• Moisture: Slight sweat or dampness on the sole can briefly create a vapor barrier (Leidenfrost effect).

3. CRITICAL FIELD SAFETY
• BSS does NOT encourage spectators to fire-walk carelessly: if an ember sticks to the arch of the foot, or if embers contain hidden metal nails or stones, severe third-degree burns occur.
• Use thermal conductivity comparison props: Heat a copper spoon and a wooden spoon in hot water; let students feel how fast heat reaches their fingers on copper versus wood.
• Message: "Thermal conductivity is not religious faith. Physical laws apply to believers and non-believers identically."`,
  },
  {
    id: "anti-superstition-bill",
    title: "Draft resolution: National Anti-Superstition Act demand",
    description: "Comprehensive legislative framework demanding legal safeguards against black magic, human sacrifice, and occult extortion across India.",
    category: "Advocacy",
    kind: "POLICY & LEGISLATIVE BRIEF",
    readTime: "7 min read",
    icon: "shield",
    content: `RESOLUTION DEMANDING AN ANTI-SUPERSTITION ACT ACROSS INDIA
Adopted at the All India Science Conference & BSS Unit Conventions

PREAMBLE
Despite significant scientific progress and high literacy in many states, medieval superstitious practices, black magic, faith-healing extortion, and targeted violence against vulnerable women continue to cause physical harm, financial ruin, and loss of life across our country.

CORE DEMANDS
1. ENFORCEMENT OF CONSTITUTIONAL DUTY
Article 51A(h) of the Constitution of India explicitly mandates every citizen to 'develop the scientific temper, humanism and the spirit of inquiry and reform'. Government policy must actively align with this constitutional obligation.

2. CRIMINALISATION OF OCULT EXPLOITATION
• Punitive laws prohibiting human sacrifice, torture under the guise of exorcism, branding, and parading women as witches.
• Criminalising false claims of miracle cures for terminal illnesses that prevent patients from seeking life-saving medical care.
• Strict prohibition of advertisements offering supernatural intervention for wealth, child sex determination, or disease eradication.

3. PROTECTION OF RATIONALISTS & EDUCATORS
Legal protection for science activists, teachers, and whistleblowers who expose fraud, drawing from the legacy of martyrs of rational thought such as Dr. Narendra Dabholkar, Govind Pansare, and MM Kalburgi.

4. INCLUSION IN CURRICULUM
Compulsory modules on scientific temper, logic, evidence-based reasoning, and verification from primary school levels.`,
  },
  {
    id: "poster-2025",
    title: "All India Science Conference 2025 official poster",
    description: "The society’s national conference poster: science, education, climate, and scientific temper at Tagore Theatre, Thiruvananthapuram.",
    category: "Publications",
    kind: "ORIGINAL BSS POSTER ARCHIVE",
    readTime: "High-resolution poster",
    icon: "poster",
    url: "/images/conference-poster.jpg",
    image: "/images/conference-poster.jpg",
  },
  {
    id: "environment-toolkit",
    title: "Save the environment week: Jalpaiguri & North Bengal toolkit",
    description: "Community environmental monitoring guide for tea garden water runoff, Teesta riverbed ecology, and local biodiversity.",
    category: "Environment",
    kind: "FIELD CAMPAIGN TOOLKIT",
    readTime: "5 min read",
    icon: "leaf",
    content: `SAVE THE ENVIRONMENT WEEK — NORTH BENGAL FIELD MANUAL
Breakthrough Science Society — Jalpaiguri Unit Environmental Sub-committee

1. LOCAL ECOLOGICAL CONTEXT
Jalpaiguri and the Dooars region sit in an ecologically sensitive zone facing rapid habitat fragmentation, pesticide runoff from intensive tea plantations, unmonitored plastic pollution in Teesta and Karala river basins, and seasonal floods.

2. THREE-STAGE CITIZEN SCIENCE PROTOCOL
• Water Testing: Measure basic physical parameters (pH, turbidity, temperature, dissolved oxygen using standard testing kits) at three points along local water bodies: upstream, urban runoff point, and downstream.
• Plastic Audit: Document single-use plastic waste density per 100 square metres in local public markets.
• Biodiversity Mapping: Organize school student walks to record native bird and plant species along riverbanks before and after monsoon.

3. ENGAGING LOCAL RESIDENTS
• Avoid academic jargon: speak about drinking water quality, groundwater table depletion, and soil health.
• Share verified laboratory findings transparently with municipality and panchayat bodies.
• Plant native saplings (e.g. Neem, Peepal, Arjun) instead of water-depleting commercial monocultures.`,
  },
  {
    id: "sky-gazing",
    title: "Sky-gazing & astronomical awareness camp manual",
    description: "Organising community telescope observation nights, solar filter safety, and busting astrological eclipse superstitions.",
    category: "Organising",
    kind: "CAMP ORGANISER'S MANUAL",
    readTime: "6 min read",
    icon: "presentation",
    content: `ASTRONOMY OUTREACH & SKY-GAZING CAMP MANUAL
Breakthrough Science Society — Sky Gazing Cell

1. OBJECTIVE OF POPULAR ASTRONOMY
Astronomy is the greatest gateway to scientific temper. When a schoolchild sees Jupiter's four Galilean moons or Saturn's rings with their own eyes through a telescope, the universe ceases to be a playground of astrological omens and becomes an observable, rational cosmos.

2. ESSENTIAL SAFETY FOR SOLAR OBSERVATIONS
• NEVER look directly at the Sun through binoculars or telescopes without a certified solar filter (e.g., Baader solar film).
• Never use sunglasses, photographic film, or smoked glass; these let through dangerous infrared radiation that destroys retinas.
• Prefer solar projection methods onto white cardstock for public solar eclipse viewings.

3. NIGHT SKY CAMP PREPARATION
• Choose an open ground with minimal street light glare (e.g., Jalpaiguri Town Club ground or school campus).
• Point out prominent constellations (Ursa Major/Saptarshi Mandal, Orion/Kaalpurush).
• Explain planetary orbits, lunar phases, and why eclipses are mere celestial shadows, completely harmless to pregnant women, food, or life.`,
  },
  {
    id: "journal-archive",
    title: "Breakthrough: journal of science and society",
    description: "Official publication of Breakthrough Science Society, featuring peer-reviewed research critiques, essays on scientific method, and history of science.",
    category: "Publications",
    kind: "OFFICIAL BSS JOURNAL",
    readTime: "Quarterly archive",
    icon: "book",
    url: "https://breakthroughindia.org/",
  },
];
