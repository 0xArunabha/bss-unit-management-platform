import { identity } from "@/lib/identity";
import { db } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities } from "@/db/schema";
import { REAL_MEMBERS } from "@/lib/demo-data";
import { and, eq, sql } from "drizzle-orm";

export const ADMIN_ID = "10000000-0000-4000-8000-000000000001";
export const OPENING_BALANCE = 24800;
let ready: Promise<void> | null = null;
const uid = (group: number, n: number) => `${group}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const sampleVenues = [
  { previous: "Jadavpur Vidyapith, Kolkata", location: `Community outreach venue, ${identity.city}` },
  { previous: "BSS Unit Office, Jadavpur", location: `${identity.name} meeting venue, ${identity.city}` },
  { previous: "Sukanta Setu Community Hall", location: `Community meeting point, ${identity.city}` },
  { previous: "Jadavpur Community Centre", location: `Workshop venue, ${identity.city}` },
];
const originalCircularContent = "Our National Science Day outreach is coming up. We invite every member to help make science accessible, joyful, and rooted in evidence.\n\nPlease reach the venue one hour before the programme. Demonstration volunteers should review the safety checklist and bring their assigned materials.\n\nTogether, we can build a culture that welcomes questions. Contact the unit secretary if you would like to join the outreach team.";
const unitCircularTitle = `Science for every ${identity.city} neighbourhood`;
const unitCircularContent = originalCircularContent.replace("Our National Science Day outreach", `${identity.name}’s ${identity.city} outreach`);

const teamsCircularTitle = "Proposal for Constituting Operational Teams & Working Committees";
const teamsCircularContent = `In accordance with the consensus of members present at the unit meeting held on March 22nd at the Light of Science club room, a formal proposal has been introduced to constitute operational teams for the smooth governance and execution of club activities. This proposal will be adopted as an official resolution based on the feedback and collective opinion of all members.

Any suggestions or recommendations regarding this proposal should be communicated privately to Swarndeep Sen. Everyone's active feedback and input are earnestly invited.

1. Office Team
• Arunabha Ghosh (In-charge)
• Hrithik Sen
• Pritam Ghosh
• Nilanjan Roy

2. Experiment Team
• Avash Rajak (In-charge)
• Sreelekha Sarkar
• Samarpan Chakraborty
• Joydev Adhikary
• Anirban Kar
• Arnish Hossain

3. Membership Team
• Ananya Kar (In-charge)
• Debasmita Bhandari
• Shree Roy
• Avash Rajak

4. Digital Team
• Arunabha Ghosh (In-charge)
• Soham Das
• Shree Roy
• Avash Rajak

5. Culture Team & Magazine
• Dipta Paul (In-charge)
• Hari Roy
• Kaustubhi Singha
• Kaushiki Ray
• Debasmita Bhandari

6. Sky Observation Team
• Anirban Kar (In-charge)
• Arunabha Ghosh
• Supriyo Mondal
• Sreelekha Sarkar

7. Research Team
• Arindam Bhattacharya (In-charge)
• Debarghya Biswas
• Samarpan Chakraborty
• Nilanjan Roy
• Sreelekha Sarkar
• Avash Rajak
• Anirban Kar

Kunal Roy (President, Light of Science · BSS State Executive) · Swarndeep Sen (Working President) · Pritam Sarkar (Secretary) · Avash Rajak (Joint Secretary)

───────────────────────────────
মূল বাংলা প্রস্তাব (Original Bengali Reference):
গত ২২শে মার্চ লাইট অফ সাইন্সের ক্লাব ঘরে অনুষ্ঠিত হওয়া মিটিংয়ে উপস্থিত সদস্যদের মত অনুসারে ক্লাবের কাজ সুষ্ঠুভাবে পরিচালনা করার কতগুলি টিম তৈরি করার প্রস্তাব এসেছে। ক্লাবের সকল সদস্যদের মতামতের ভিত্তিতে এই প্রস্তাব সিদ্ধান্ত হিসেবে গৃহীত হবে।

কুণাল রায় (সভাপতি, লাইট অফ সায়েন্স · বিএসএস রাজ্য কার্যনির্বাহী সদস্য) · স্বর্ণদ্বীপ সেন (কার্যকরী সভাপতি) · প্রীতম সরকার (সম্পাদক) · আভাস রজক (যুগ্ম সম্পাদক)

এই প্রস্তাব বিষয়ক যেকোন সাজেশন স্বর্ণদ্বীপ সেনের কাছে ব্যক্তিগত ভাবে পাঠাবেন। সকলের মতামত কাম্য।`;

const mashkalaibariReportTitle = "Field Investigation: Mashkalaibari Crematorium Mismanagement & Furnace Emissions";
const mashkalaibariReportContent = `DATE OF ON-SITE INSPECTION: November 3, 2026
LOCATION: Mashkalaibari Crematorium & Adjacent Neighbourhoods, Jalpaiguri
INSPECTED BY: Field Delegation, Light of Science (Breakthrough Science Society, Jalpaiguri Unit)

1. EXECUTIVE SUMMARY & FIELD FINDINGS
Following distress calls and complaints from local residents, a representative delegation from Light of Science, Jalpaiguri visited the Mashkalaibari cremation ground and neighbouring residential lanes on the morning of November 3, 2026. The inspection revealed alarming public health, civic, and environmental hazards:

• Toxic Furnace Emissions & Odour:
Incomplete combustion inside the crematorium furnace releases dense, foul-smelling smoke directly into residential quarters. Residents face severe respiratory distress, burning eyes, chronic headaches, and acute psychological trauma.

• Failure of Municipal "Patch-up" Maintenance:
Local conscious citizen Babul Choudhury, along with neighbourhood residents, had previously protested and petitioned Jalpaiguri Municipality. However, the civic body performed only superficial, temporary patch-up repairs. Within days of restart, the furnace relapsed into severe malfunction, leaving residents unprotected.

• Complete Absence of Waste Management:
There are no designated disposal bins or incinerators for ritual remnants. Used clothes, plastic wrappings, and bio-waste are dumped indiscriminately across the open grounds and into the adjacent riverbed, severely degrading the aquatic ecosystem.

• Jungle Overgrowth & Antisocial Activities:
Due to chronic municipal neglect, the rear crematorium grounds and adjoining burial areas are overgrown with thick jungle, providing shelter for antisocial elements and compromising neighbourhood safety.

2. UNIT ACTION PLAN & PROPOSED RESOLUTIONS
In light of this critical environmental and civic breakdown, Light of Science, Jalpaiguri resolves:
1. Convene an emergency meeting with local youth and resident representatives (Babul Choudhury and neighbours).
2. Form a joint "Mashkalaibari Anti-Pollution & Civic Health Committee".
3. Submit a technical deputation to Jalpaiguri Municipality & West Bengal Pollution Control Board demanding an automated Air Pollution Control System (APCS) with wet scrubber, proper chimney filtration, systematic solid waste management, and illumination of the premises.

───────────────────────────────
মূল বাংলা প্রতিবেদন (Original Bengali Field Report · 03/11/2026):
মাষকলাইবাড়ি শ্মশানের অব্যবস্থা ও চুল্লির দূষণ: স্থানীয় বাসিন্দাদের চরম দুর্ভোগ এবং ক্ষোভ

জলপাইগুড়ি: 
আজ সকালে ‘লাইট অফ সায়েন্স, জলপাইগুড়ি’-র পক্ষ থেকে মাশকালীবাড়ি শ্মশান ও তার পার্শ্ববর্তী পাড়াগুলোতে পরিদর্শনে যাওয়া হয়। এই পরিদর্শনের সময় স্থানীয় কিছু যুবকের সঙ্গে কথা বলে এক গুরুতর চিত্র সামনে এসেছে। এলাকাবাসীর অভিযোগ, শ্মশানের চুল্লির তীব্র গন্ধ এবং দূষণের কারণে সেখানে টেকা দায় হয়ে পড়েছে। এর ফলে সাধারণ মানুষের মনে মারাত্মক মানসিক চাপ সৃষ্টি হচ্ছে এবং নানা ধরনের শারীরিক সমস্যাও দেখা দিচ্ছে।

স্থানীয়দের জোরালো প্রতিবাদ ও পৌরসভার উদাসীনতা: 
এখানকারই এক সচেতন বাসিন্দা বাবুল চৌধুরী এবং এলাকার অন্যান্য পাড়াপ্রতিবেশীরা একসঙ্গে মিলে এর আগেও এই মাষকলাইবাড়ি শ্মশানের নানা অনিয়ম ও সমস্যার বিরুদ্ধে প্রতিবাদ জানিয়েছেন এবং পৌরসভার দ্বারস্থ হয়েছেন। কিন্তু দুঃখের বিষয় হলো, স্থানীয় বাসিন্দাদের এই সম্মিলিত প্রচেষ্টার পরেও সম্প্রতি চুল্লিটিকে আবারও কেবল সাময়িক মেরামত করা হয়েছে, কিন্তু এর থেকে খুব একটা রেহাই পাননি এলাকাবাসী। জোড়াতালি দিয়ে কাজ চালানোর কিছুদিন পরেই চুল্লির সেই পুরনো সমস্যা আবার ফিরে আসছে।

পরিদর্শনে উঠে আসা অন্যান্য গুরুতর সমস্যাগুলি: 
• বর্জ্য ব্যবস্থাপনার অভাব: শ্মশান চত্বরে আবর্জনা ফেলার কোনো নির্দিষ্ট বা স্থায়ী জায়গা নেই। ফলে মৃত মানুষের শেষকৃত্যের পর তাঁদের ব্যবহৃত কাপড়-চোপড় ও অন্যান্য সামগ্রী যত্রতত্র শ্মশান চত্বরে ও নদীতে ফেলে দেওয়া হচ্ছে, যা পরিবেশকে মারাত্মকভাবে নোংরা করছে।
• জঙ্গল ও ঝোপঝাড়: সঠিক রক্ষণাবেক্ষণ ও পরিচর্যার অভাবে শ্মশানের পেছনের চত্বর এবং কবরস্থান চত্বরটি আজ ঘন জঙ্গলে ও ঝোপঝাড়ে ভরে গেছে।
• অসামাজিক কার্যকলাপ: স্থানীয় বাসিন্দাদের অভিযোগ, এই অবহেলার সুযোগ নিয়ে শ্মশান ও কবরস্থানের চত্বরে নানা ধরনের অসামাজিক কাজকর্মও মাথাচাড়া দিয়ে উঠছে, যা এলাকার সামগ্রিক নিরাপত্তার পরিবেশকে গুরুতরভাবে বিঘ্নিত করছে।

এমতাবস্থায় আমরা কীভাবে বিষয়টা দেখবো? এবিষয়ে একটা মিটিং করলে ভালো হয়।`;

const envReportTitle = "Field Action Report: World Environment Day Rally for Karala River & Civic Dumping Ground";
const envReportContent = `LOCATION: Jalpaiguri (Kotwali Thana More to Kadamtala)
DATE: June 5, 2026
ORGANIZED BY: Light of Science (Breakthrough Science Society, Jalpaiguri Unit) in solidarity with Relief and Public Welfare Society

1. KEY ENVIRONMENTAL DEMANDS:
• Complete ecological restoration, desiltation, and sewage prevention for River Karala.
• Immediate relocation and scientific management of the open-air toxic municipal dumping ground away from town residential wards.

2. RALLY SUMMARY:
A massive youth and citizens' rally marched from Thana More to Kadamtala carrying scientific placards and banners ("Love the Earth, It's our Home", "There is no Planet B", "চাই বৈজ্ঞানিক বর্জ্য নিয়ন্ত্রণ", "করলা আমাদের মা, তাকে রক্ষা করা আমাদের কর্তব্য").

3. ADDRESSES & SOLIDARITY:
• Avash Rajak (Joint Secretary, Light of Science): Addressed administrative negligence and called for scientific desiltation.
• Swarndeep Sen (Acting President, Light of Science): Highlighted severe respiratory and groundwater risks of municipal dumping.
• Kunal Roy (President, Light of Science): Emphasized continuous civic scientific vigilance beyond symbolic annual observance.
• Aditi Chowdhury addressed the gathering.

4. MASS PARTICIPATION:
Members of Relief and Public Welfare Society, student science cadres, and conscious citizens of Jalpaiguri actively participated in the demonstration.`;

async function seed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7428101)`);
    await tx.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        monthly_pledge NUMERIC(12, 2) NOT NULL DEFAULT 20,
        avatar_color TEXT NOT NULL DEFAULT 'peach',
        unpaid_months INTEGER NOT NULL DEFAULT 0,
        google_email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_email TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_sub TEXT;
      -- One Google account links to at most one profile (NULL, meaning "not linked", may repeat). Enforced here so
      -- two requests racing each other cannot both win. The block keeps startup working if old data already holds
      -- a duplicate: it raises a NOTICE and skips the index instead of failing. That notice may not reach the
      -- application logs, so check the index exists after deploying (the patch README shows how to fix a duplicate).
      DO $$ BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_google_sub_key ON profiles (google_sub);
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'profiles_google_sub_key was not created because duplicate google_sub values exist';
      END $$;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS membership_dues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        dues_month INTEGER NOT NULL,
        dues_year INTEGER NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        payment_mode TEXT NOT NULL DEFAULT 'cash',
        collected_by UUID REFERENCES profiles(id),
        paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT member_month_year UNIQUE(member_id, dues_month, dues_year)
      );

      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        category TEXT NOT NULL,
        volunteers INTEGER NOT NULL DEFAULT 0,
        image TEXT NOT NULL DEFAULT '/images/science-outreach.jpg',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE events ADD COLUMN IF NOT EXISTS is_ongoing BOOLEAN DEFAULT FALSE;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS target_goal TEXT;

      CREATE TABLE IF NOT EXISTS event_procurements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        estimated_cost NUMERIC(12, 2) NOT NULL,
        actual_cost NUMERIC(12, 2),
        status TEXT NOT NULL DEFAULT 'needed',
        purchased_by UUID REFERENCES profiles(id),
        purchased_at TIMESTAMPTZ,
        receipt_photo_url TEXT,
        verified_by UUID REFERENCES profiles(id),
        verified_at TIMESTAMPTZ,
        created_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        donor_name TEXT NOT NULL,
        donor_phone TEXT,
        amount NUMERIC(12, 2) NOT NULL,
        event_id UUID REFERENCES events(id) ON DELETE SET NULL,
        payment_mode TEXT NOT NULL DEFAULT 'cash',
        transaction_ref TEXT,
        receipt_no TEXT NOT NULL UNIQUE,
        sms_sent BOOLEAN NOT NULL DEFAULT false,
        received_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS circulars (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        pinned BOOLEAN NOT NULL DEFAULT false,
        author_id UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        actor_id UUID REFERENCES profiles(id),
        target_id UUID,
        amount NUMERIC(12, 2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- PostgreSQL engine-level integrity check constraints
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dues_valid_month') THEN
          ALTER TABLE membership_dues ADD CONSTRAINT dues_valid_month CHECK (dues_month >= 1 AND dues_month <= 12);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'minimum_dues') THEN
          ALTER TABLE membership_dues ADD CONSTRAINT minimum_dues CHECK (amount >= 20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'different_verifier') THEN
          ALTER TABLE event_procurements ADD CONSTRAINT different_verifier CHECK (verified_by IS NULL OR verified_by != purchased_by);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'procurement_status_check') THEN
          ALTER TABLE event_procurements ADD CONSTRAINT procurement_status_check CHECK (status IN ('needed', 'purchased', 'verified'));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_donation') THEN
          ALTER TABLE donations ADD CONSTRAINT positive_donation CHECK (amount > 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'minimum_pledge') THEN
          ALTER TABLE profiles ADD CONSTRAINT minimum_pledge CHECK (monthly_pledge >= 20);
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS action_idempotency (
        key TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        user_id UUID REFERENCES profiles(id),
        response_payload TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE membership_dues ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
      -- Guard: only touch the pin column if it still exists (legacy databases)
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin') THEN
          ALTER TABLE profiles ALTER COLUMN pin DROP DEFAULT;
          ALTER TABLE profiles ALTER COLUMN pin DROP NOT NULL;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL,
        image TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        expires_at TIMESTAMPTZ NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMPTZ,
        refresh_token_expires_at TIMESTAMPTZ,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- The column names of claim_codes and membership_applications must match src/db/schema.ts exactly.
      -- A database that already has these tables keeps the columns it was created with (see the patch README).
      -- Nothing is seeded into claim_codes and no profile is bound to an e-mail address here: the first executive
      -- is created with "npm run setup:admin", which prints a random one-time code that is never stored in the source.
      CREATE TABLE IF NOT EXISTS claim_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code_hash TEXT NOT NULL UNIQUE,
        member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        issued_by UUID NOT NULL REFERENCES profiles(id),
        claimed_by_google_sub TEXT,
        claimed_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS membership_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_sub TEXT NOT NULL,
        google_email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        is_minor BOOLEAN NOT NULL DEFAULT FALSE,
        guardian_name TEXT,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Self-healing schema migrations for claim_codes and membership_applications:
      -- Upgrades databases created before patch 0003 without requiring manual SQL.
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claim_codes' AND column_name = 'created_by') THEN
          ALTER TABLE claim_codes RENAME COLUMN created_by TO issued_by;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claim_codes' AND column_name = 'claimed_by_sub') THEN
          ALTER TABLE claim_codes RENAME COLUMN claimed_by_sub TO claimed_by_google_sub;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claim_codes' AND column_name = 'issued_by') THEN
          ALTER TABLE claim_codes ADD COLUMN issued_by UUID REFERENCES profiles(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claim_codes' AND column_name = 'claimed_by_google_sub') THEN
          ALTER TABLE claim_codes ADD COLUMN claimed_by_google_sub TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_applications' AND column_name = 'email') THEN
          ALTER TABLE membership_applications RENAME COLUMN email TO google_email;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_applications' AND column_name = 'google_email') THEN
          ALTER TABLE membership_applications ADD COLUMN google_email TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_applications' AND column_name = 'is_minor') THEN
          ALTER TABLE membership_applications ADD COLUMN is_minor BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_applications' AND column_name = 'guardian_name') THEN
          ALTER TABLE membership_applications ADD COLUMN guardian_name TEXT;
        END IF;
      END $$;
    `);
    if ((await tx.select({ id: profiles.id }).from(profiles).limit(1)).length) {
      // Localize only untouched, fixed-ID sample records. Never reset user data or ledger history.
      // Clean up legacy sample events from initial project template
      try {
        await tx.execute(sql`
          DELETE FROM events
          WHERE id IN (${uid(2, 1)}, ${uid(2, 2)}, ${uid(2, 3)}, ${uid(2, 4)})
             OR title ILIKE '%greener neighbourhood%'
             OR image LIKE '%environment-campaign%'
        `);
      } catch (err) {
        console.warn("[Seed] Legacy events cleanup notice:", err);
      }

      try {
        await tx.execute(sql`
          INSERT INTO events (
            id,
            title,
            description,
            location,
            starts_at,
            category,
            volunteers,
            image,
            is_ongoing,
            progress_percent,
            target_goal,
            created_at
          ) VALUES (
            ${uid(2, 5)},
            'Campaign: Clean Mashkalaibari — Stop Furnace Emissions & River Dumping',
            'Grassroots citizen advocacy and environmental intervention to end toxic crematorium furnace smoke, open waste dumping in the riverbed, and municipal inaction at Mashkalaibari, Jalpaiguri.',
            'Mashkalaibari Crematorium & Neighbourhoods, Jalpaiguri',
            '2026-11-03 08:00:00+00',
            'Campaign',
            18,
            '/images/field-reports/mashkalaibari/inspection-1.jpg',
            true,
            20,
            'Installation of automated Air Pollution Control System (APCS) & River Protection',
            '2026-11-03 08:00:00+00'
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            location = EXCLUDED.location,
            starts_at = EXCLUDED.starts_at,
            category = EXCLUDED.category,
            volunteers = EXCLUDED.volunteers,
            image = EXCLUDED.image,
            is_ongoing = EXCLUDED.is_ongoing,
            progress_percent = EXCLUDED.progress_percent,
            target_goal = EXCLUDED.target_goal
        `);
      } catch (err) {
        console.warn("[Seed] Mashkalaibari event upsert notice:", err);
      }

      try {
        await tx.execute(sql`
          INSERT INTO events (
            id,
            title,
            description,
            location,
            starts_at,
            category,
            volunteers,
            image,
            is_ongoing,
            progress_percent,
            target_goal,
            created_at
          ) VALUES (
            ${uid(2, 6)},
            'World Environment Day: Rejuvenate Karala River & Relocate Civic Dumping Ground',
            'Mass rally and civic awareness demonstration from Kotwali Thana More to Kadamtala organized by Light of Science Club with Relief and Public Welfare Society demanding immediate restoration of Karala River and relocation of toxic municipal dumping grounds.',
            'Kotwali Thana More to Kadamtala, Jalpaiguri',
            '2026-06-05 09:30:00+00',
            'Awareness Rally',
            35,
            '/images/field-reports/environment-day-2026/karala-rally-march.jpg',
            false,
            100,
            'Restoration of Karala River & Relocation of Municipal Dumping Ground',
            '2026-06-05 09:30:00+00'
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            location = EXCLUDED.location,
            starts_at = EXCLUDED.starts_at,
            category = EXCLUDED.category,
            volunteers = EXCLUDED.volunteers,
            image = EXCLUDED.image,
            is_ongoing = EXCLUDED.is_ongoing,
            progress_percent = EXCLUDED.progress_percent,
            target_goal = EXCLUDED.target_goal
        `);
      } catch (err) {
        console.warn("[Seed] Environment Day event upsert notice:", err);
      }
      await tx.update(donations).set({ donorName: `${identity.city} community supporters` }).where(and(eq(donations.id, uid(4, 2)), eq(donations.donorName, "Jadavpur Vidyapith")));
      // Align sample receipt numbering with the unit prefix. Only untouched, fixed-ID demo rows change.
      await tx.update(donations).set({ receiptNo: sql`replace(${donations.receiptNo}, 'BSS-', ${identity.receiptPrefix + "-"})` }).where(and(eq(donations.id, uid(4, 1)), sql`${donations.receiptNo} like 'BSS-%'`));
      for (const index of [2, 3, 4, 5, 6]) {
        await tx.update(donations).set({ receiptNo: sql`replace(${donations.receiptNo}, 'BSS-', ${identity.receiptPrefix + "-"})` }).where(and(eq(donations.id, uid(4, index)), sql`${donations.receiptNo} like 'BSS-%'`));
      }
      await tx.update(circulars).set({ title: unitCircularTitle, content: unitCircularContent }).where(and(eq(circulars.id, uid(5, 1)), eq(circulars.title, "Let’s take science to every neighbourhood"), eq(circulars.content, originalCircularContent)));
      await tx.execute(sql`
        INSERT INTO circulars (id, title, content, category, pinned, author_id, created_at)
        VALUES (${uid(5, 6)}, ${envReportTitle}, ${envReportContent}, 'Campaign report', true, ${uid(1, 26)}, '2026-06-05 10:00:00+00')
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, pinned = EXCLUDED.pinned
      `);
      await tx.execute(sql`
        INSERT INTO circulars (id, title, content, category, pinned, author_id, created_at)
        VALUES (${uid(5, 5)}, ${mashkalaibariReportTitle}, ${mashkalaibariReportContent}, 'Campaign report', true, ${ADMIN_ID}, '2026-11-03 08:00:00+00')
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, pinned = EXCLUDED.pinned
      `);
      await tx.execute(sql`
        INSERT INTO circulars (id, title, content, category, pinned, author_id, created_at)
        VALUES (${uid(5, 4)}, ${teamsCircularTitle}, ${teamsCircularContent}, 'Unit circular', true, ${uid(1, 3)}, NOW())
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, pinned = EXCLUDED.pinned
      `);
      const year = new Date().getFullYear();
      if ((await tx.select().from(dues).where(and(eq(dues.memberId, uid(1, 1)), eq(dues.month, 11), eq(dues.year, year)))).length === 0) {
        await tx.insert(dues).values([
          { memberId: uid(1, 1), month: 11, year, amount: 100, paymentMode: "upi", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
          { memberId: uid(1, 1), month: 12, year, amount: 100, paymentMode: "upi", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
          { memberId: uid(1, 2), month: 11, year, amount: 50, paymentMode: "cash", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
          { memberId: uid(1, 2), month: 12, year, amount: 50, paymentMode: "cash", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
        ]).onConflictDoNothing();
      }
      for (const member of REAL_MEMBERS) {
        await tx.execute(sql`
          INSERT INTO profiles (id, full_name, phone, role, status, monthly_pledge, avatar_color, unpaid_months, google_email, created_at)
          VALUES (${member.id}, ${member.fullName}, ${member.phone}, ${member.role}, 'active', ${member.monthlyPledge}, ${member.avatarColor}, ${member.paid ? 0 : 1}, NULL, NOW())
          ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone
        `);
      }
      return;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000);
    const upcoming = (days: number, hour: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d; };

    const people = REAL_MEMBERS.map((m, idx) => {
      return {
        id: m.id,
        fullName: m.fullName,
        phone: m.phone,
        role: m.role,
        status: "active",
        monthlyPledge: m.monthlyPledge,
        avatarColor: m.avatarColor,
        unpaidMonths: m.paid ? 0 : 1,
        googleEmail: null,
        createdAt: new Date(year - 1, idx % 12, 10),
      };
    });
    await tx.insert(profiles).values(people);

    const payments: { memberId: string; month: number; year: number; amount: number; paymentMode: string; collectedBy: string; paidAt: Date }[] = [];
    for (const member of REAL_MEMBERS) {
      if (member.paid) {
        const maxMonth = ["admin", "organizer"].includes(member.role) ? Math.min(12, month + 1) : month;
        for (let m = 1; m <= maxMonth; m++) {
          payments.push({
            memberId: member.id,
            month: m,
            year,
            amount: member.monthlyPledge,
            paymentMode: member.role === "admin" ? "upi" : payments.length % 2 === 0 ? "cash" : "upi",
            collectedBy: ADMIN_ID,
            paidAt: new Date(year, m - 1, 8),
          });
        }
      } else {
        for (let m = 1; m < month; m++) {
          payments.push({
            memberId: member.id,
            month: m,
            year,
            amount: member.monthlyPledge,
            paymentMode: "cash",
            collectedBy: ADMIN_ID,
            paidAt: new Date(year, m - 1, 10),
          });
        }
      }
    }
    if (payments.length) await tx.insert(dues).values(payments);

    await tx.insert(events).values([
      {
        id: uid(2, 5),
        title: "Campaign: Clean Mashkalaibari — Stop Furnace Emissions & River Dumping",
        description: "Grassroots citizen advocacy and environmental intervention to end toxic crematorium furnace smoke, open waste dumping in the riverbed, and municipal inaction at Mashkalaibari, Jalpaiguri.",
        location: "Mashkalaibari Crematorium & Neighbourhoods, Jalpaiguri",
        startsAt: new Date("2026-11-03T08:00:00.000Z"),
        category: "Campaign",
        volunteers: 18,
        image: "/images/field-reports/mashkalaibari/inspection-1.jpg",
        isOngoing: true,
        progressPercent: 20,
        targetGoal: "Installation of automated Air Pollution Control System (APCS) & River Protection",
      },
      {
        id: uid(2, 6),
        title: "World Environment Day: Rejuvenate Karala River & Relocate Civic Dumping Ground",
        description: "Mass rally and civic awareness demonstration from Kotwali Thana More to Kadamtala organized by Light of Science Club with Relief and Public Welfare Society demanding immediate restoration of Karala River and relocation of toxic municipal dumping grounds.",
        location: "Kotwali Thana More to Kadamtala, Jalpaiguri",
        startsAt: new Date("2026-06-05T09:30:00.000Z"),
        category: "Awareness Rally",
        volunteers: 35,
        image: "/images/field-reports/environment-day-2026/karala-rally-march.jpg",
        isOngoing: false,
        progressPercent: 100,
        targetGoal: "Restoration of Karala River & Relocation of Municipal Dumping Ground",
      },
    ]);
    // await tx.insert(procurements).values([...]);

    await tx.insert(donations).values([
      { id: uid(4, 1), donorName: "Jalpaiguri Science Club Patrons", donorPhone: null, amount: 5000, eventId: null, paymentMode: "upi", receiptNo: `${identity.receiptPrefix}-${year}-001`, receivedBy: ADMIN_ID, createdAt: ago(25) },
      { id: uid(4, 2), donorName: `${identity.city} community supporters`, donorPhone: null, amount: 3500, eventId: null, paymentMode: "bank_transfer", receiptNo: `${identity.receiptPrefix}-${year}-002`, receivedBy: uid(1, 6), createdAt: ago(1500) },
      { id: uid(4, 3), donorName: "North Bengal Teachers Forum", donorPhone: null, amount: 1000, eventId: null, paymentMode: "cash", receiptNo: `${identity.receiptPrefix}-${year}-003`, receivedBy: ADMIN_ID, createdAt: ago(2800) },
      { id: uid(4, 4), donorName: "Friends of Science Jalpaiguri", donorPhone: null, amount: 6000, eventId: null, paymentMode: "bank_transfer", receiptNo: `${identity.receiptPrefix}-${year}-004`, receivedBy: uid(1, 3), createdAt: ago(4200) },
      { id: uid(4, 5), donorName: "Town School Science Circle", donorPhone: null, amount: 2000, eventId: null, paymentMode: "upi", receiptNo: `${identity.receiptPrefix}-${year}-005`, receivedBy: ADMIN_ID, createdAt: ago(6000) },
      { id: uid(4, 6), donorName: "Local community collection", donorPhone: null, amount: 1000, eventId: null, paymentMode: "cash", receiptNo: `${identity.receiptPrefix}-${year}-006`, receivedBy: uid(1, 9), createdAt: ago(7200) },
    ]);

    await tx.insert(circulars).values([
      { id: uid(5, 6), title: envReportTitle, content: envReportContent, category: "Campaign report", pinned: true, authorId: uid(1, 26), createdAt: new Date("2026-06-05T10:00:00.000Z") },
      { id: uid(5, 5), title: mashkalaibariReportTitle, content: mashkalaibariReportContent, category: "Campaign report", pinned: true, authorId: ADMIN_ID, createdAt: new Date("2026-11-03T08:00:00.000Z") },
      { id: uid(5, 4), title: teamsCircularTitle, content: teamsCircularContent, category: "Unit circular", pinned: true, authorId: uid(1, 3), createdAt: ago(30) },
      { id: uid(5, 1), title: unitCircularTitle, content: unitCircularContent, category: "Unit circular", pinned: false, authorId: ADMIN_ID, createdAt: ago(180) },
      { id: uid(5, 2), title: "February unit meeting: agenda & updates", content: "The next unit meeting will cover:\n\n1. Review of recent outreach activities\n2. Membership dues and treasury report\n3. Procurement and volunteer coordination\n4. Upcoming environmental campaign\n\nMembers can pay dues by cash, UPI, or bank transfer during the meeting. Advance contributions are welcome, with a minimum of ₹20 per month.", category: "Meeting agenda", authorId: uid(1, 6), createdAt: ago(1560) },
      { id: uid(5, 3), title: "New in the archive: demonstration handbook", content: "The volunteer resource archive now includes a practical guide for science demonstrations. It covers planning, participant safety, explaining evidence, and encouraging questions.\n\nVisit Science resources to explore the handbook, environmental outreach notes, and the conference poster archive.", category: "Resource update", authorId: uid(1, 3), createdAt: ago(3200) },
    ]);

    await tx.insert(activities).values([
      { type: "dues", title: "Membership contribution recorded", description: "Arunabha Ghosh collected monthly dues from Utsav Sen.", actorId: ADMIN_ID, targetId: uid(1, 2), amount: 50, createdAt: ago(25) },
      { type: "procurement", title: "Science demonstration kits needed", description: "Samarpan added 4 kits to tomorrow’s outreach checklist.", actorId: uid(1, 6), targetId: uid(3, 1), createdAt: ago(35) },
      { type: "dues", title: "Membership dues collected", description: "Pritam Sarkar paid his monthly contribution via UPI.", actorId: ADMIN_ID, amount: 50, createdAt: ago(55) },
      { type: "purchase", title: "Extension boards purchased", description: "Pritam logged the exact spend. Ready for peer verification.", actorId: uid(1, 3), targetId: uid(3, 3), amount: 1080, createdAt: ago(75) },
      { type: "verified", title: "Volunteer badges verified", description: "Udita verified Samarpan’s purchase at the venue. Complete!", actorId: uid(1, 9), targetId: uid(3, 4), amount: 420, createdAt: ago(120) },
    ]);
  });
}

export function ensureSeed() {
  if (!ready) {
    ready = seed().catch((error) => {
      console.error("[Seed] Migration / seed warning:", error);
      ready = null;
    });
  }
  return ready;
}
