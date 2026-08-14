/* ESCORT app — client-side data layer (demo, localStorage) */
const KEY = "escort_app_v1";
const TIERS = { rose:{name:"Rose", rate:0.05, next:"활동 친구 3명"}, lady:{name:"Lady", rate:0.08, next:"활동 친구 10명"}, madam:{name:"Madam", rate:0.12, next:"최고 등급"} };
const PRICE = { open:50000, exchange:350000, pass:290000 };
const REWARD = { refereeSignup:30000, referrerSignup:10000, match:30000, review:30000, rating:40000, cap:100000 };

/* ── store ── */
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
function reset(){ localStorage.removeItem(KEY); }
function patch(fn){ const s = load(); fn(s); save(s); return s; }

/* ── ref 코드 딥링크 캡처 (가입 후 7일 소급 대응: 코드만 저장) ── */
(function(){
  const ref = new URLSearchParams(location.search).get("ref");
  if(ref){ patch(s => { s.pendingRef = ref.toUpperCase(); }); }
})();

/* ── 사주 라이트 엔진 (데모: 생년월일 기반 결정적 산출) ── */
const STEMS = ["갑목(甲木)","을목(乙木)","병화(丙火)","정화(丁火)","무토(戊土)","기토(己土)","경금(庚金)","신금(辛金)","임수(壬水)","계수(癸水)"];
const HARMONY = [
  "천간 합(合)이 성립해 명리에서 가장 강한 부부 합으로 봅니다. 배우자궁 상충 없음.",
  "오행 상생(相生) 구조 — 상대의 기운이 당신의 부족한 오행을 정확히 채웁니다.",
  "두 사람 모두 배우자궁에 도화(桃花)가 자리해 첫 만남의 호감도가 높은 조합입니다.",
  "일지 육합(六合) — 갈등이 생겨도 회복이 빠른, 오래 가는 인연의 구조입니다.",
  "대운의 흐름이 겹치는 시기 — 올해 만나는 인연이 결혼으로 이어질 확률이 높습니다."
];
function hashStr(str){ let h=0; for(const c of String(str)){ h=(h*31+c.charCodeAt(0))>>>0; } return h; }
function dayStem(birth){ return STEMS[hashStr(birth)%10]; }
function compat(myBirth, otherBirth){
  const h = hashStr(myBirth+"|"+otherBirth);
  return { score: 82 + h%17, desc: HARMONY[h%HARMONY.length] };
}

/* ── 상대 카드 풀 (여성 프로필, 가상) ── */
const WOMEN = [
  {id:"w1", ini:"Y", name:"윤○영", age:29, job:"승무원", area:"반포", birth:"19970304", grad:"linear-gradient(160deg,#5a5a62,#1c1c20)", verify:"Vouched by two members · ID verified · Lifestyle screened"},
  {id:"w2", ini:"S", name:"서○진", age:27, job:"피부과 코디네이터", area:"청담", birth:"19990812", grad:"linear-gradient(160deg,#66666e,#222226)", verify:"Vouched by two members · ID verified"},
  {id:"w3", ini:"J", name:"정○원", age:31, job:"갤러리스트", area:"한남", birth:"19950126", grad:"linear-gradient(160deg,#4e4e56,#18181c)", verify:"Vouched by two members · Members party guest"},
  {id:"w4", ini:"H", name:"한○서", age:28, job:"아나운서", area:"성수", birth:"19980617", grad:"linear-gradient(160deg,#585850,#1c1c18)", verify:"Vouched by two members · ID verified"},
  {id:"w5", ini:"L", name:"이○아", age:30, job:"변호사", area:"서초", birth:"19960923", grad:"linear-gradient(160deg,#50565e,#181c20)", verify:"Vouched by two members · ID verified · Lifestyle screened"},
  {id:"w6", ini:"K", name:"김○윤", age:26, job:"발레리나", area:"평창동", birth:"20000411", grad:"linear-gradient(160deg,#5e5658,#201819)", verify:"Vouched by two members · ID verified"}
];

/* ── 가입/유저 ── */
function makeCode(name){
  const base = (name||"ME").replace(/[^가-힣a-zA-Z]/g,"").slice(-2);
  const romap = {"윤":"YOON","김":"KIM","이":"LEE","박":"PARK","서":"SEO","정":"JUNG","한":"HAN","최":"CHOI"};
  const tail = /[가-힣]/.test(base) ? (romap[base[0]]||"VIP")+String(hashStr(name)%90+10) : base.toUpperCase()+String(hashStr(name)%90+10);
  return "ESC-"+tail;
}
function currentUser(){ return load().user || null; }
function requireUser(){ const u = currentUser(); if(!u){ location.href = "join.html"; } return u; }

/* ── 남성: 카드 발급/결제 ── */
function issueCard(s){
  const seen = (s.cards||[]).map(c=>c.wid);
  const next = WOMEN.find(w=>!seen.includes(w.id));
  if(!next) return null;
  const cp = compat(s.user.birth||"19900101", next.birth);
  const card = { id:"c"+Date.now(), wid:next.id, ...next,
    score:cp.score, sajuDesc:cp.desc, status:"sent",
    deadline: Date.now()+48*3600*1000, isFree: (s.freeLeft||0)>0 };
  s.cards = s.cards||[]; s.cards.push(card);
  return card;
}
function activeCard(s){
  const c = (s.cards||[]).filter(c=>["sent","pending_female","matched","met"].includes(c.status)).slice(-1)[0];
  if(c && c.status==="sent" && Date.now()>c.deadline){ c.status="expired"; save(s); return null; }
  return c || null;
}
function addPayment(s, type, amount, note){
  s.payments = s.payments||[];
  s.payments.push({id:"p"+Date.now(), type, amount, note, at:new Date().toISOString().slice(0,16).replace("T"," "), status:"paid"});
}
/* 교환권 결제 시 리워드 원장 기록 (여성/추천인 분배 시뮬레이션) */
function ledgerOnExchange(s, card){
  s.ledger = s.ledger||[];
  s.ledger.push({at:Date.now(), event:"exchange", card:card.name,
    company: PRICE.exchange - REWARD.match, woman: REWARD.match, referrer: Math.round(PRICE.exchange*0.08)});
}

/* ── 여성: 수익 ── */
function addReward(s, type, amount, note){
  s.rewards = s.rewards||[];
  s.rewards.push({id:"r"+Date.now(), type, amount, note, at:new Date().toISOString().slice(0,10), status:"approved"});
}
function rewardTotal(s){ return (s.rewards||[]).reduce((a,r)=>a+r.amount,0); }
function activeFriends(s){ return (s.friends||[]).length; }
function tierOf(s){
  const n = activeFriends(s);
  if(n>=10) return "madam"; if(n>=3) return "lady"; return "rose";
}

/* ── util ── */
function fmt(n){ return n.toLocaleString("ko-KR"); }
function toast(msg){
  const t = document.getElementById("toast"); if(!t) return;
  t.textContent = msg; t.style.opacity = 1;
  clearTimeout(window._tt); window._tt = setTimeout(()=>t.style.opacity=0, 2600);
}
function show(id){ document.getElementById(id).classList.add("on"); }
function closeM(){ document.querySelectorAll(".mbg").forEach(m=>m.classList.remove("on")); }
function clock(el, deadline, tmrEl){
  clearInterval(window._ck);
  window._ck = setInterval(()=>{
    const s = Math.max(0, Math.floor((deadline-Date.now())/1000));
    el.textContent = `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
    if(tmrEl && s < 6*3600) tmrEl.classList.add("urgent");
    if(s<=0){ clearInterval(window._ck); location.reload(); }
  }, 1000);
}
