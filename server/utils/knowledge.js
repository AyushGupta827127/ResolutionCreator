// The knowledge layer. Everything resolution-specific — questions, rule
// content, template text — is data, loaded here from `knowledge/`, never
// hardcoded into a route. Swapping this for a live Directus-backed loader
// later means changing only this file's internals, not its exported shape.
import resOpenBankAccount from "../../knowledge/resolutions/open-bank-account.json";
import resAppointAdditionalDirector from "../../knowledge/resolutions/appoint-additional-director.json";
import resAppointManagingDirector from "../../knowledge/resolutions/appoint-managing-director.json";
import resApproveRelatedPartyTransaction from "../../knowledge/resolutions/approve-related-party-transaction.json";
import resChangeBankSignatories from "../../knowledge/resolutions/change-bank-signatories.json";
import resAppointDirectorRetiringByRotation from "../../knowledge/resolutions/appoint-director-retiring-by-rotation.json";
import resDeclareInterimDividend from "../../knowledge/resolutions/declare-interim-dividend.json";
import resAppointStatutoryAuditor from "../../knowledge/resolutions/appoint-statutory-auditor.json";
import resApproveBorrowingLimits from "../../knowledge/resolutions/approve-borrowing-limits.json";
import resChangeRegisteredOffice from "../../knowledge/resolutions/change-registered-office-local-limits.json";
import complianceRules from "../../knowledge/compliance-rules.json";
import ctcTemplate from "../../knowledge/ctc-template.json";
import letterheadTemplate from "../../knowledge/letterhead-template.json";
import noticeTemplate from "../../knowledge/notice-template.json";

const RESOLUTIONS = [
  resOpenBankAccount,
  resAppointAdditionalDirector,
  resAppointManagingDirector,
  resApproveRelatedPartyTransaction,
  resChangeBankSignatories,
  resAppointDirectorRetiringByRotation,
  resDeclareInterimDividend,
  resAppointStatutoryAuditor,
  resApproveBorrowingLimits,
  resChangeRegisteredOffice,
];

export function listResolutions() {
  return RESOLUTIONS;
}

export function getResolutionBySlug(slug) {
  return RESOLUTIONS.find((r) => r.slug === slug) || null;
}

/** Exact title match -> keyword match -> category match, in that order. */
export function searchResolutions(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return RESOLUTIONS;

  const exact = RESOLUTIONS.filter((r) => r.title.toLowerCase() === q);
  const titleMatch = RESOLUTIONS.filter(
    (r) => r.title.toLowerCase().includes(q) && !exact.includes(r)
  );
  const keywordMatch = RESOLUTIONS.filter(
    (r) =>
      !exact.includes(r) &&
      !titleMatch.includes(r) &&
      (r.keywords || []).some((k) => k.toLowerCase().includes(q))
  );
  const categoryMatch = RESOLUTIONS.filter(
    (r) =>
      !exact.includes(r) &&
      !titleMatch.includes(r) &&
      !keywordMatch.includes(r) &&
      r.category.toLowerCase().includes(q)
  );

  return [...exact, ...titleMatch, ...keywordMatch, ...categoryMatch];
}

export function getComplianceRules(ids) {
  const set = new Set(ids || []);
  return complianceRules.filter((r) => set.has(r.id));
}

export function getAllComplianceRules() {
  return complianceRules;
}

export function getCtcTemplate() {
  return ctcTemplate;
}

export function getLetterheadTemplate() {
  return letterheadTemplate;
}

export function getNoticeTemplate() {
  return noticeTemplate;
}
