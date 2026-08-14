/* 테마 로더 — 기본 디자인은 블랙카드로 고정 (BK 지시 2026-08-14).
   ?theme=이름 이 URL에 있을 때만 해당 페이지에 시안 적용, 저장·유지 없음. */
(function(){
  var OK = ["cheonghwa","heukgeum","dancheong","sumuk","geumsong"];
  try { localStorage.removeItem("escort_theme"); } catch(e){}
  var p = new URLSearchParams(location.search).get("theme");
  if(p && OK.indexOf(p) >= 0){
    document.write('<link rel="stylesheet" href="assets/themes/'+p+'.css">');
  }
})();
