// utils/matchListingToSearch.js

function textMatch(listing, text) {
  if (!text) return true;
  const t = String(text).toLowerCase();
  const pool = [
    listing.title,
    listing.description,
    listing.skillOffered,
    listing.skillWanted,
    ...(listing.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return pool.includes(t);
}

function tagMatch(listing, tags) {
  if (!tags || !tags.length) return true;
  const set = new Set((listing.tags || []).map((s) => String(s).toLowerCase()));
  return tags.some((t) => set.has(String(t).toLowerCase()));
}

function budgetMatch(listing, min, max) {
  if (min == null && max == null) return true;
  const budget = listing.salaryMin ?? listing.salaryMax ?? null;
  if (budget == null) return false;
  if (min != null && budget < min) return false;
  if (max != null && budget > max) return false;
  return true;
}

function geoMatch(listing, point, radiusKm) {
  if (!point || !radiusKm) return true;
  const coords =
    listing?.location?.coordinates?.coordinates ||
    listing?.location?.coordinates;
  if (!coords || coords.length !== 2) return false;

  const [lng1, lat1] = coords;
  const [lng2, lat2] = point.coordinates;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(a));
  return d <= radiusKm;
}

// Optional synonym map to make category matching more forgiving.
// Extend this if you use alternative labels in UI vs DB.
const CATEGORY_SYNONYMS = {
  teacher: "tutoring",
  tutors: "tutoring",
  tutoring: "tutoring",
};

function normalizeCategory(v) {
  const raw = v == null ? "" : String(v).trim().toLowerCase();
  return CATEGORY_SYNONYMS[raw] || raw;
}

function matches(listing, s) {
  if (s.enabled === false) return false;

  // robust, case-insensitive, trimmed comparisons
  const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());

  // status (e.g., "active") — compare case-insensitively
  if (s.status && listing.status && norm(s.status) !== norm(listing.status)) {
    return false;
  }

  // category — compare case-insensitively + through synonym map
  if (s.category && listing.category) {
    if (
      normalizeCategory(s.category) !== normalizeCategory(listing.category)
    ) {
      return false;
    }
  }

  if (
    typeof s.isService === "boolean" &&
    s.isService !== listing.isService
  ) {
    return false;
  }
  if (!textMatch(listing, s.text)) return false;
  if (!tagMatch(listing, s.tags)) return false;
  if (!budgetMatch(listing, s.minBudget, s.maxBudget)) return false;
  if (!geoMatch(listing, s.location, s.radiusKm)) return false;

  return true;
}

module.exports = { matches };
