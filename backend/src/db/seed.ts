import type { PGlite } from "@electric-sql/pglite";

/** Returns an ISO timestamp N days offset from now (negative = past). */
function daysFromNow(days: number, hour = 10): string {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

interface CompanySeed {
  name: string;
  industry: string;
  website: string;
  hue: number;
}

interface ContactSeed {
  company: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface DealSeed {
  title: string;
  company: string;
  contact?: string;
  stage: "lead" | "contacted" | "proposal" | "won" | "lost";
  amount: number;
  probability: number;
  createdDaysAgo: number;
  closedDaysAgo?: number;
  expectedCloseInDays?: number;
  notes?: string;
}

interface ReminderSeed {
  dealTitle: string;
  title: string;
  dueOffsetDays: number;
  done?: boolean;
}

const COMPANIES: CompanySeed[] = [
  { name: "Solstice Coffee Roasters", industry: "Food & Beverage", website: "solsticeroasters.co", hue: 24 },
  { name: "Amber & Oak Furniture", industry: "Retail", website: "amberoak.shop", hue: 34 },
  { name: "Willowbrook Landscaping", industry: "Home Services", website: "willowbrooklandscape.com", hue: 96 },
  { name: "Petal & Stem Florists", industry: "Retail", website: "petalandstem.com", hue: 340 },
  { name: "Kinfolk Marketing Studio", industry: "Professional Services", website: "kinfolkstudio.co", hue: 265 },
  { name: "Northline Bike Repair", industry: "Retail & Services", website: "northlinebikes.com", hue: 200 },
  { name: "Sage & Salt Catering", industry: "Food & Beverage", website: "sageandsalt.com", hue: 150 },
  { name: "Driftwood Yoga Collective", industry: "Health & Wellness", website: "driftwoodyoga.com", hue: 175 },
  { name: "Cobblestone Bookshop", industry: "Retail", website: "cobblestonebooks.com", hue: 14 },
  { name: "Harbor Digital Agency", industry: "Professional Services", website: "harbordigital.io", hue: 210 },
  { name: "Meridian Pet Grooming", industry: "Home Services", website: "meridianpets.com", hue: 45 },
  { name: "Foundry Coworking", industry: "Real Estate & Services", website: "foundryco.work", hue: 18 },
];

const CONTACTS: ContactSeed[] = [
  { company: "Solstice Coffee Roasters", name: "Mara Ellison", email: "mara@solsticeroasters.co", phone: "(503) 555-0114", role: "Owner" },
  { company: "Amber & Oak Furniture", name: "Devon Price", email: "devon@amberoak.shop", phone: "(415) 555-0182", role: "General Manager" },
  { company: "Willowbrook Landscaping", name: "Rosa Kim", email: "rosa@willowbrooklandscape.com", phone: "(720) 555-0143", role: "Owner" },
  { company: "Petal & Stem Florists", name: "Isla Novak", email: "isla@petalandstem.com", phone: "(312) 555-0199", role: "Owner" },
  { company: "Kinfolk Marketing Studio", name: "Theo Marsh", email: "theo@kinfolkstudio.co", phone: "(212) 555-0126", role: "Creative Director" },
  { company: "Northline Bike Repair", name: "Casey Odom", email: "casey@northlinebikes.com", phone: "(206) 555-0167", role: "Owner" },
  { company: "Sage & Salt Catering", name: "Priya Anand", email: "priya@sageandsalt.com", phone: "(617) 555-0155", role: "Events Lead" },
  { company: "Driftwood Yoga Collective", name: "Nadia Torres", email: "nadia@driftwoodyoga.com", phone: "(305) 555-0138", role: "Studio Director" },
  { company: "Cobblestone Bookshop", name: "Owen Blake", email: "owen@cobblestonebooks.com", phone: "(773) 555-0171", role: "Owner" },
  { company: "Harbor Digital Agency", name: "Simone Feld", email: "simone@harbordigital.io", phone: "(646) 555-0193", role: "Operations Lead" },
  { company: "Harbor Digital Agency", name: "Jonah Reyes", email: "jonah@harbordigital.io", phone: "(646) 555-0102", role: "Founder" },
  { company: "Meridian Pet Grooming", name: "Faye Whitaker", email: "faye@meridianpets.com", phone: "(512) 555-0184", role: "Owner" },
  { company: "Foundry Coworking", name: "Adrian Voss", email: "adrian@foundryco.work", phone: "(971) 555-0121", role: "Community Manager" },
  { company: "Cobblestone Bookshop", name: "Lena Park", email: "lena@cobblestonebooks.com", phone: "(773) 555-0188", role: "Events Coordinator" },
];

const DEALS: DealSeed[] = [
  // Lead
  { title: "POS system upgrade", company: "Northline Bike Repair", contact: "Casey Odom", stage: "lead", amount: 3200, probability: 20, createdDaysAgo: -2, expectedCloseInDays: 30, notes: "Inbound from referral, wants a demo." },
  { title: "Loyalty app integration", company: "Solstice Coffee Roasters", contact: "Mara Ellison", stage: "lead", amount: 4800, probability: 20, createdDaysAgo: -4, expectedCloseInDays: 35, notes: "Interested after seeing competitor's app." },
  { title: "Seasonal storefront refresh", company: "Petal & Stem Florists", contact: "Isla Novak", stage: "lead", amount: 2100, probability: 15, createdDaysAgo: -1, expectedCloseInDays: 21 },
  { title: "Member directory rebuild", company: "Foundry Coworking", contact: "Adrian Voss", stage: "lead", amount: 5400, probability: 25, createdDaysAgo: -6, expectedCloseInDays: 40 },
  { title: "Inventory tracking rollout", company: "Cobblestone Bookshop", contact: "Owen Blake", stage: "lead", amount: 2900, probability: 20, createdDaysAgo: -3, expectedCloseInDays: 28 },
  { title: "Grooming booking widget", company: "Meridian Pet Grooming", contact: "Faye Whitaker", stage: "lead", amount: 1800, probability: 15, createdDaysAgo: -1, expectedCloseInDays: 18 },

  // Contacted
  { title: "Brand refresh & new signage", company: "Amber & Oak Furniture", contact: "Devon Price", stage: "contacted", amount: 7600, probability: 40, createdDaysAgo: -10, expectedCloseInDays: 25, notes: "Sent intro deck, follow-up call scheduled." },
  { title: "Quarterly maintenance contract", company: "Willowbrook Landscaping", contact: "Rosa Kim", stage: "contacted", amount: 9200, probability: 45, createdDaysAgo: -12, expectedCloseInDays: 20 },
  { title: "Studio class-booking platform", company: "Driftwood Yoga Collective", contact: "Nadia Torres", stage: "contacted", amount: 6100, probability: 40, createdDaysAgo: -8, expectedCloseInDays: 22 },
  { title: "Holiday catering package", company: "Sage & Salt Catering", contact: "Priya Anand", stage: "contacted", amount: 11400, probability: 50, createdDaysAgo: -9, expectedCloseInDays: 15 },
  { title: "Client portal build", company: "Kinfolk Marketing Studio", contact: "Theo Marsh", stage: "contacted", amount: 8900, probability: 40, createdDaysAgo: -14, expectedCloseInDays: 26 },
  { title: "Community events sponsorship", company: "Foundry Coworking", contact: "Adrian Voss", stage: "contacted", amount: 3400, probability: 35, createdDaysAgo: -7, expectedCloseInDays: 19 },

  // Proposal
  { title: "Full e-commerce migration", company: "Amber & Oak Furniture", contact: "Devon Price", stage: "proposal", amount: 14800, probability: 65, createdDaysAgo: -22, expectedCloseInDays: 10, notes: "Proposal sent, awaiting board sign-off." },
  { title: "Annual design retainer", company: "Kinfolk Marketing Studio", contact: "Theo Marsh", stage: "proposal", amount: 18000, probability: 70, createdDaysAgo: -25, expectedCloseInDays: 12 },
  { title: "Multi-site landscaping bid", company: "Willowbrook Landscaping", contact: "Rosa Kim", stage: "proposal", amount: 15600, probability: 60, createdDaysAgo: -18, expectedCloseInDays: 9 },
  { title: "Wedding season package", company: "Petal & Stem Florists", contact: "Isla Novak", stage: "proposal", amount: 6700, probability: 65, createdDaysAgo: -16, expectedCloseInDays: 8 },
  { title: "Website + booking rebuild", company: "Driftwood Yoga Collective", contact: "Nadia Torres", stage: "proposal", amount: 8300, probability: 60, createdDaysAgo: -20, expectedCloseInDays: 11 },
  { title: "Corporate catering retainer", company: "Sage & Salt Catering", contact: "Priya Anand", stage: "proposal", amount: 21000, probability: 70, createdDaysAgo: -19, expectedCloseInDays: 7 },

  // Won (closed at varying points over the last ~4 months for the revenue chart)
  { title: "Brand identity package", company: "Cobblestone Bookshop", contact: "Owen Blake", stage: "won", amount: 5200, probability: 100, createdDaysAgo: -118, closedDaysAgo: -104, notes: "Delivered on time, client thrilled." },
  { title: "Website relaunch", company: "Harbor Digital Agency", contact: "Simone Feld", stage: "won", amount: 12600, probability: 100, createdDaysAgo: -101, closedDaysAgo: -88 },
  { title: "POS + inventory system", company: "Solstice Coffee Roasters", contact: "Mara Ellison", stage: "won", amount: 6400, probability: 100, createdDaysAgo: -84, closedDaysAgo: -70 },
  { title: "Spring campaign design", company: "Petal & Stem Florists", contact: "Isla Novak", stage: "won", amount: 3800, probability: 100, createdDaysAgo: -66, closedDaysAgo: -55 },
  { title: "Fleet route optimization", company: "Willowbrook Landscaping", contact: "Rosa Kim", stage: "won", amount: 9900, probability: 100, createdDaysAgo: -49, closedDaysAgo: -38 },
  { title: "Studio membership app", company: "Driftwood Yoga Collective", contact: "Nadia Torres", stage: "won", amount: 7300, probability: 100, createdDaysAgo: -33, closedDaysAgo: -21 },
  { title: "Office fit-out consult", company: "Foundry Coworking", contact: "Adrian Voss", stage: "won", amount: 10400, probability: 100, createdDaysAgo: -27, closedDaysAgo: -13 },
  { title: "Grooming loyalty program", company: "Meridian Pet Grooming", contact: "Faye Whitaker", stage: "won", amount: 2600, probability: 100, createdDaysAgo: -19, closedDaysAgo: -5 },

  // Lost
  { title: "Rebrand + new fleet wraps", company: "Northline Bike Repair", contact: "Casey Odom", stage: "lost", amount: 4200, probability: 0, createdDaysAgo: -70, closedDaysAgo: -50, notes: "Went with a cheaper local vendor." },
  { title: "Seasonal pop-up kiosk", company: "Amber & Oak Furniture", contact: "Devon Price", stage: "lost", amount: 3100, probability: 0, createdDaysAgo: -55, closedDaysAgo: -40, notes: "Budget cut before signing." },
  { title: "Custom CRM integration", company: "Harbor Digital Agency", contact: "Jonah Reyes", stage: "lost", amount: 16500, probability: 0, createdDaysAgo: -40, closedDaysAgo: -24, notes: "Scope too large for their timeline." },
  { title: "Annual print catalog", company: "Cobblestone Bookshop", contact: "Lena Park", stage: "lost", amount: 2400, probability: 0, createdDaysAgo: -30, closedDaysAgo: -17, notes: "Decided to go digital-only." },
];

const REMINDERS: ReminderSeed[] = [
  { dealTitle: "Full e-commerce migration", title: "Call Devon to confirm board decision", dueOffsetDays: -1 },
  { dealTitle: "Annual design retainer", title: "Send revised retainer proposal", dueOffsetDays: 0 },
  { dealTitle: "Multi-site landscaping bid", title: "Follow up on site-visit scheduling", dueOffsetDays: 1 },
  { dealTitle: "Holiday catering package", title: "Confirm headcount with Priya", dueOffsetDays: 2 },
  { dealTitle: "Wedding season package", title: "Send updated moodboard", dueOffsetDays: 3 },
  { dealTitle: "Corporate catering retainer", title: "Prep contract redlines for legal review", dueOffsetDays: -2 },
  { dealTitle: "Client portal build", title: "Second discovery call with Theo", dueOffsetDays: 5 },
  { dealTitle: "POS system upgrade", title: "Send product demo recording", dueOffsetDays: 4 },
  { dealTitle: "Community events sponsorship", title: "Draft sponsorship tiers doc", dueOffsetDays: -3 },
  { dealTitle: "Loyalty app integration", title: "Share pricing tiers with Mara", dueOffsetDays: 7 },
  { dealTitle: "Studio class-booking platform", title: "Kickoff call recap sent", dueOffsetDays: -12, done: true },
  { dealTitle: "Brand refresh & new signage", title: "Intro deck follow-up", dueOffsetDays: -6, done: true },
];

export async function seedIfEmpty(db: PGlite): Promise<{ seeded: boolean }> {
  const existing = await db.query<{ count: string }>("SELECT count(*)::text FROM companies");
  const count = Number(existing.rows[0]?.count ?? "0");
  if (count > 0) {
    return { seeded: false };
  }

  const companyIds = new Map<string, number>();
  for (const c of COMPANIES) {
    const res = await db.query<{ id: number }>(
      "INSERT INTO companies (name, industry, website, logo_hue) VALUES ($1, $2, $3, $4) RETURNING id",
      [c.name, c.industry, c.website, c.hue]
    );
    companyIds.set(c.name, res.rows[0].id);
  }

  const contactIds = new Map<string, number>();
  for (const p of CONTACTS) {
    const companyId = companyIds.get(p.company);
    const res = await db.query<{ id: number }>(
      "INSERT INTO contacts (company_id, name, email, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [companyId, p.name, p.email, p.phone, p.role]
    );
    contactIds.set(p.name, res.rows[0].id);
  }

  const dealIds = new Map<string, number>();
  let position = 0;
  for (const d of DEALS) {
    const companyId = companyIds.get(d.company) ?? null;
    const contactId = d.contact ? contactIds.get(d.contact) ?? null : null;
    const createdAt = daysFromNow(d.createdDaysAgo);
    const closedAt = d.closedDaysAgo !== undefined ? daysFromNow(d.closedDaysAgo) : null;
    const expectedClose = d.expectedCloseInDays !== undefined ? daysFromNow(d.expectedCloseInDays).slice(0, 10) : null;
    const res = await db.query<{ id: number }>(
      `INSERT INTO deals
        (title, company_id, contact_id, stage, amount, probability, expected_close_date, notes, position, created_at, updated_at, closed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        d.title,
        companyId,
        contactId,
        d.stage,
        d.amount,
        d.probability,
        expectedClose,
        d.notes ?? null,
        position++,
        createdAt,
        closedAt ?? createdAt,
        closedAt,
      ]
    );
    dealIds.set(d.title, res.rows[0].id);
  }

  for (const r of REMINDERS) {
    const dealId = dealIds.get(r.dealTitle) ?? null;
    await db.query(
      "INSERT INTO reminders (deal_id, title, due_at, done) VALUES ($1, $2, $3, $4)",
      [dealId, r.title, daysFromNow(r.dueOffsetDays, 9), r.done ?? false]
    );
  }

  return { seeded: true };
}
