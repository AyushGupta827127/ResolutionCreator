const B=process.env.BASE_URL||"http://localhost:3100";
const post=async(p,b)=>{const r=await fetch(B+p,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)});const ct=r.headers.get("content-type")||"";return{status:r.status,body:ct.includes("json")?await r.json():{binary:(await r.arrayBuffer()).byteLength}}};
let n=0,f=0;const t=(c,m)=>{n++;if(!c){f++;console.log("FAIL",m)}else console.log("ok  ",m)};
const co={company_name:"Tom & Jerry <b>Ltd</b>",cin:"U12345MH2020PTC123456",meeting_date:"2026-10-01",meeting_place:"Mumbai & Pune",agm_ordinal:"10th"};
// borrowing: grouping + escaping + agm ordinal + meeting date in minutes
let r=await post("/api/resolutions/generate",{slug:"approve-borrowing-limits",answers:{...co,borrowing_limit:12345678,borrowing_purpose:"R&D <script>"}});
const d=r.body.document;
t(r.status===200,"borrowing generates");
t(d.body.includes("Rs. 1,23,45,678"),"Indian grouping 1,23,45,678 in body");
t(d.body.includes("R&D <script>")&&!d.body.includes("&amp;")&&!d.body.includes("&lt;"),"plain text, no entity escaping in API output");
t(d.proposal.includes("10th Annual General Meeting"),"agm_ordinal used in proposal");
t(d.minutesGist.includes("1 October 2026")&&d.minutesGist.includes("Mumbai & Pune"),"minutes state meeting date + place");
// dates
r=await post("/api/resolutions/validate",{slug:"approve-borrowing-limits",answers:{...co,meeting_date:"2026-02-31",borrowing_limit:1,borrowing_purpose:"x"}});
t(r.body.inputIssues.some(i=>i.field==="meeting_date"),"2026-02-31 rejected as invalid date");
r=await post("/api/resolutions/validate",{slug:"approve-borrowing-limits",answers:{...co,borrowing_limit:-1,borrowing_purpose:"x"}});
t(r.body.inputIssues.some(i=>i.field==="borrowing_limit"&&i.severity==="critical"),"negative borrowing limit blocked");
r=await post("/api/resolutions/validate",{slug:"approve-borrowing-limits",answers:{...co,borrowing_limit:"1e3x",borrowing_purpose:"x"}});
t(r.body.inputIssues.some(i=>i.field==="borrowing_limit"),"garbage number blocked");
// board: cross-field + whole numbers + quorum w/ interested director
const bd={...co,notice_days:10,total_directors:9,directors_present:3};
r=await post("/api/resolutions/validate",{slug:"approve-related-party-transaction",answers:{...bd,related_party_name:"X",relationship_nature:"y",transaction_nature:"z",transaction_value:5,transaction_terms:"t",interest_disclosed:true}});
t(!r.body.compliance.some(c=>c.ruleId==="RULE-BM-03"),"3 of 9 present meets quorum (3)");
r=await post("/api/resolutions/validate",{slug:"approve-related-party-transaction",answers:{...bd,interested_director_name:"Mr Verma",related_party_name:"X",relationship_nature:"y",transaction_nature:"z",transaction_value:5,transaction_terms:"t",interest_disclosed:true}});
t(r.body.compliance.some(c=>c.ruleId==="RULE-BM-03"),"interested director not counted -> quorum fails (2 < 3)");
r=await post("/api/resolutions/validate",{slug:"open-bank-account",answers:{...co,notice_days:2.5,total_directors:4,directors_present:4}});
t(r.body.inputIssues.some(i=>i.field==="notice_days"),"fractional notice days rejected");
r=await post("/api/resolutions/validate",{slug:"open-bank-account",answers:{...co,notice_days:3,total_directors:4,directors_present:4}});
const bm01=r.body.compliance.find(c=>c.ruleId==="RULE-BM-01");
t(bm01&&bm01.severity==="warning","short notice is an acknowledgeable warning, not a hard block");
// dividend date order
r=await post("/api/resolutions/validate",{slug:"declare-interim-dividend",answers:{...co,notice_days:9,total_directors:3,directors_present:3,dividend_per_share:2,face_value:10,total_dividend_amount:5,funding_source:"p",record_date:"2026-10-20",payment_date:"2026-10-10"}});
t(r.body.inputIssues.some(i=>i.field==="payment_date"),"payment before record date flagged");
// radio option membership
r=await post("/api/resolutions/validate",{slug:"open-bank-account",answers:{...co,notice_days:9,total_directors:3,directors_present:3,internet_banking:"maybe"}});
// docx w/ refined + extra docs gate
r=await post("/api/resolutions/download-docx",{slug:"approve-borrowing-limits",answers:{...co,borrowing_limit:5,borrowing_purpose:"x"},includeCtc:true});
t(r.status===422,"docx with CTC but no signatory -> 422");
r=await post("/api/resolutions/download-docx",{slug:"approve-borrowing-limits",answers:{...co,borrowing_limit:5,borrowing_purpose:"x"},refinedBody:"Refined text here"});
t(r.status===200&&r.body.binary>3000,"docx with refinedBody ok");
// AGM explanatory
r=await post("/api/resolutions/generate",{slug:"appoint-director-retiring-by-rotation",answers:{...co,director_name:"A B",din:"12345678",seeks_reappointment:true,include_explanatory_statement:true}});
t(r.status===200&&!!r.body.document.explanatoryStatement,"explanatory statement present when Yes");
// related party minutes
r=await post("/api/resolutions/generate",{slug:"approve-related-party-transaction",acknowledgeWarnings:true,answers:{...co,notice_days:9,total_directors:5,directors_present:5,interested_director_name:"Mr Verma",interest_disclosed:true,related_party_name:"X",relationship_nature:"y",transaction_nature:"z",transaction_value:5,transaction_terms:"t"}});
t(r.status===200&&r.body.document.minutesGist.includes("Mr Verma, an interested director, disclosed their interest"),"minutes record interested director");
// junk bodies
r=await post("/api/resolutions/generate",{slug:"open-bank-account",answers:"str"});t(r.status===422,"answers not an object -> 422");
r=await post("/api/resolutions/generate",{slug:"open-bank-account",answers:[1,2]});t(r.status===422,"answers array -> 422");
r=await post("/api/resolutions/generate",{slug:{$ne:1},answers:{}});t(r.status===404,"object slug -> 404");
console.log(`\n${f} failures / ${n}`);
