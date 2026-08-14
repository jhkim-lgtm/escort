/* 테마 로더 — ?theme=이름 으로 진입 시 저장, 이후 전 페이지 유지 */
(function(){
  var OK = ["cheonghwa","heukgeum","dancheong","sumuk","geumsong"];
  var p = new URLSearchParams(location.search).get("theme");
  if(p !== null){
    if(!p || p==="default" || p==="black" || OK.indexOf(p)<0) localStorage.removeItem("escort_theme");
    else localStorage.setItem("escort_theme", p);
  }
  var t = localStorage.getItem("escort_theme");
  if(t && OK.indexOf(t)>=0){
    document.write('<link rel="stylesheet" href="assets/themes/'+t+'.css">');
  }
})();
