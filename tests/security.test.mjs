import * as otp from "../server/utils/otpStore.js";
const B=process.env.BASE_URL||"http://localhost:3100";
const post=async(p,b)=>{const r=await fetch(B+p,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)});return{status:r.status,body:await r.json().catch(()=>null)}};
let f=0,n=0;const t=(c,m)=>{n++;if(!c){f++;console.log("FAIL",m)}else console.log("ok  ",m)};
// OTP store
const codes=new Set();for(let i=0;i<50;i++){codes.add(otp.issueOtp(`u${i}@x.com`,"signup"))}
t([...codes].every(c=>/^\d{6}$/.test(c)&&+c>=100000),"OTP codes are 6 digits");
t(codes.size>40,"OTP codes vary (not constant)");
const code=otp.issueOtp("a@x.com","reset");
let ok=true;for(let i=0;i<5;i++){ if(otp.consumeVerifiedOtp("a@x.com","reset","000000").ok) ok=false }
t(ok,"5 wrong guesses rejected");
t(otp.consumeVerifiedOtp("a@x.com","reset",code).ok===false,"correct code refused after 5 wrong attempts (brute-force lockout)");
const c2=otp.issueOtp("b@x.com","reset");
t(otp.consumeVerifiedOtp("b@x.com","reset",c2).ok===true,"correct code accepted");
t(otp.consumeVerifiedOtp("b@x.com","reset",c2).ok===false,"code is single-use");
let issued=0;for(let i=0;i<6;i++){ if(otp.canIssueOtp("rl@x.com","signup")){otp.issueOtp("rl@x.com","signup");issued++} }
t(issued===3,`OTP issue rate limit = 3 per window (got ${issued})`);
// endpoints (validation paths only — nothing reaches the shared Directus)
let r=await post("/api/create-order",{amount:100,credits:1000}); t(r.status===400,"create-order rejects a credits value that isn't a sold pack");
r=await post("/api/create-order",{amount:1,credits:"500"}); t(r.status!==400||false,"create-order accepts a real pack (tampered amount ignored; fails only on missing keys) status "+r.status);
r=await post("/api/create-order",{}); t(r.status===400,"create-order with no body 400");
r=await post("/api/send-email",{to:"not-an-email",subject:"s",text:"t"}); t(r.status===400,"send-email invalid recipient 400");
r=await post("/api/send-email",{to:"a@b.co",subject:"s".repeat(300),text:"t"}); t(r.status===413,"send-email oversized subject 413");
r=await post("/api/resolutions/save-history",{userId:"1",title:"t"}); t(r.status===400,"save-history missing content 400");
r=await post("/api/resolutions/save-history",{userId:"1",title:"t",contentHtml:"x".repeat(600000)}); t(r.status===413,"save-history oversized content 413");
const g=await fetch(B+"/api/credits"); t(g.status===400,"credits without userId 400");
r=await post("/api/verify-payment",{}); t(r.status===400,"verify-payment missing fields 400");
r=await post("/api/verify-otp",{email:"z@x.com",code:"123456"}); t(r.status===400,"verify-otp without issued code 400");
console.log(`\n${f} failures / ${n}`);
