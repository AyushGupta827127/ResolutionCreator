// Builds API payloads for every resolution in several variants (normal / stress) so the
// document outputs can be generated and checked in bulk.
import fs from "node:fs";
const B = process.env.BASE_URL || "http://localhost:3100";
import { fileURLToPath } from "node:url";
const out = fileURLToPath(new URL("./out/payloads", import.meta.url));
fs.mkdirSync(out, { recursive: true });

const LONG = "Authorised to negotiate, finalise and execute all agreements, applications, indemnities and other documents with the Bank, to operate the account through internet banking, to give instructions for transfers within the limits approved by the Board, and to do all such other acts, deeds and things as may be necessary or incidental to give effect to this resolution, including the right to delegate. ";
const HINDI = "राहुल शर्मा";
const URLISH = "https://www.finaceindia.com/compliance/board-resolutions/very-long-path-that-never-breaks-on-its-own/segment-two/segment-three/file.pdf";

const variants = {
  normal: { long: 1, devanagari: false, longword: false },
  stress: { long: 14, devanagari: false, longword: true }, // many pages + unbreakable word
  hindi: { long: 2, devanagari: true, longword: false },
};

const search = (await (await fetch(`${B}/api/resolutions/search`)).json()).results;
for (const { slug } of search) {
  const res = await (await fetch(`${B}/api/resolutions/${slug}`)).json();
  for (const [vname, v] of Object.entries(variants)) {
    const a = {};
    for (const q of res.questions) {
      if (q.type === "number") a[q.field] = q.field === "notice_days" ? 10 : q.field === "total_directors" ? 6 : q.field === "directors_present" ? 5 : 2500000;
      else if (q.type === "date") a[q.field] = "2026-09-25";
      else if (q.type === "radio" || q.type === "select") a[q.field] = q.options[0].value;
      else if (q.type === "textarea") a[q.field] = LONG.repeat(v.long).trim();
      else if (q.field === "cin") a[q.field] = "U74999BR2020PTC045678";
      else if (q.field === "din") a[q.field] = "01234567";
      else if (q.field === "company_name") a[q.field] = v.devanagari ? "फिनेस इंडिया प्राइवेट लिमिटेड" : "Finace India Private Limited";
      else if (q.field === "meeting_place") a[q.field] = "Registered Office, Patna";
      else if (/name|signatory|director/i.test(q.field)) a[q.field] = v.devanagari ? HINDI : "Rahul Sharma";
      else if (q.field === "funding_source" || q.field === "borrowing_purpose" || q.field === "transaction_terms") a[q.field] = LONG.repeat(v.long).trim();
      else a[q.field] = "Sample " + q.field.replace(/_/g, " ");
    }
    for (const q of res.questions) if (q.conditions?.length && !q.conditions.every((c) => a[c.field] === c.value)) delete a[q.field];
    if (v.longword) a.meeting_place = URLISH;
    const extras = { meeting_time: "11:00 AM", ctc_signatory_name: v.devanagari ? HINDI : "Rahul Sharma", ctc_signatory_designation: "Managing Director", ctc_signatory_id: "01234567", ctc_place: "Patna", ctc_date: "2026-09-26", registered_office: "4th Floor, Bhagwati Complex, Exhibition Road, Patna 800001, Bihar", company_email: "compliance@finaceindia.com" };
    const payload = { slug, answers: { ...a, ...extras }, includeNotice: true, includeCtc: true, includeLetterhead: true, acknowledgeWarnings: true };
    fs.writeFileSync(`${out}/${slug}.${vname}.json`, JSON.stringify(payload));
  }
}
console.log("payloads written for", search.length, "resolutions x", Object.keys(variants).length, "variants");
