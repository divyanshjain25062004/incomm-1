// ── Buyer Role mapping from job title ───────────────────────────────────────
const BUYER_ROLE_MAP = [
  { role: 'Economic Buyer',  match: /\b(CEO|CFO|CTO|CMO|COO|CRO|CHRO|SVP|President|Founder|Owner)\b/i },
  { role: 'Champion',        match: /\b(VP of Sales|VP of Engineering|Director of Sales|Head of Sales|Sales Director)\b/i },
  { role: 'Decision Maker',  match: /\b(VP|Vice President|Director|Regional Director|Managing Director)\b/i },
  { role: 'Influencer',      match: /\b(Manager|Senior|Product|Marketing|Project|Program|Brand|Content|Growth|Demand)\b/i },
  { role: 'User',            match: /\b(Account Manager|Account Executive|Representative|Rep|Specialist|Associate|Coordinator)\b/i },
  { role: 'Gatekeeper',      match: /\b(HR|Human Resources|Operations|Admin|Procurement|Legal|Compliance|Finance|Controller)\b/i },
];

// ── Seniority Tier ───────────────────────────────────────────────────────────
const SENIORITY_MAP = [
  { tier: 'C-Suite',                match: /\b(CEO|CFO|CTO|CMO|COO|CRO|CHRO|Chief|President|Founder|Owner)\b/i },
  { tier: 'SVP / EVP',              match: /\b(SVP|EVP|Senior Vice President|Executive Vice President)\b/i },
  { tier: 'VP Level',               match: /\b(VP|Vice President)\b/i },
  { tier: 'Director',               match: /\b(Director|Head of)\b/i },
  { tier: 'Manager',                match: /\b(Manager|Lead|Principal|Senior [A-Z])\b/i },
  { tier: 'Individual Contributor', match: /.*/  },
];

// ── Recommended content from buyer role ──────────────────────────────────────
const CONTENT_MAP = {
  'Economic Buyer':  'Executive Briefing · ROI Framework',
  'Champion':        'Product Deep Dive · Technical Win',
  'Decision Maker':  'Competitive Battle Card · Case Studies',
  'Influencer':      'Feature Demo · Use Case Library',
  'User':            'Onboarding Path · Quick Start',
  'Gatekeeper':      'Compliance & Security Pack',
};

function getBuyerRole(title) {
  if (!title) return 'Unknown';
  for (const { role, match } of BUYER_ROLE_MAP) {
    if (match.test(title)) return role;
  }
  return 'Influencer';
}

function getSeniority(title) {
  if (!title) return 'Individual Contributor';
  for (const { tier, match } of SENIORITY_MAP) {
    if (match.test(title)) return tier;
  }
  return 'Individual Contributor';
}

// ── Country normalisation ────────────────────────────────────────────────────
const COUNTRY_NORM = { 'US': 'United States', 'USA': 'United States', 'UK': 'United Kingdom', 'GB': 'United Kingdom' };

export function transformContact(raw) {
  // Accept both raw Dynamics shape and already-transformed shape
  const r = raw;
  const title = r.jobtitle || r.job_title || '';
  const buyerRole = getBuyerRole(title);
  const country = r.address1_country || r.country || '';

  return {
    mt_contact_id:       r.contactid   || r.mt_contact_id   || '',
    first_name:          r.firstname   || r.first_name       || '',
    last_name:           r.lastname    || r.last_name        || '',
    display_name:        r.fullname    || r.display_name     || `${r.firstname||r.first_name||''} ${r.lastname||r.last_name||''}`.trim(),
    email_address:       r.emailaddress1 || r.email_address  || '',
    job_title:           title,
    business_unit:       r.department  || r.business_unit    || '',
    phone_number:        r.telephone1  || r.phone_number     || '',
    mobile_number:       r.mobilephone || r.mobile_number    || '',
    street_address:      r.address1_line1 || r.street_address || '',
    city:                r.address1_city  || r.city           || '',
    region:              r.address1_stateorprovince || r.region || '',
    country:             COUNTRY_NORM[country] || country,
    postal_code:         r.address1_postalcode || r.postal_code || '',
    crm_created_date:    r.createdon   || r.crm_created_date  || '',
    last_synced_at:      r.modifiedon  || r.last_synced_at    || '',
    // Derived fields
    buyer_role:          buyerRole,
    seniority_tier:      getSeniority(title),
    recommended_content: CONTENT_MAP[buyerRole] || '',
  };
}
