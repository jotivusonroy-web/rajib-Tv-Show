const $=s=>document.querySelector(s);
const grid=$("#channelGrid"), search=$("#search"), resultCount=$("#resultCount"), countPill=$("#countPill");
const video=$("#video"), empty=$("#playerEmpty"), loading=$("#loading"), statusText=$("#statusText"), statusDot=$("#statusDot"), nowTitle=$("#nowTitle");
let channels=[], currentFilter="all", currentChannel=null, hls=null;
const favorites=new Set(JSON.parse(localStorage.getItem("rajib-tv-favorites")||"[]"));

function category(name){
  const n=name.toLowerCase();
  if(/cricket|sports|sport|bein|star sports|fifa|football|golf|tennis|nhl|n sports|bahrain sports/.test(n)) return "Sports";
  if(/news|cnn|bbc|ndtv|aaj tak|abp|zee news|jago|somoy|ekattor|dbc|independent/.test(n)) return "News";
  if(/movie|cinema|hbo|star gold|colors cineplex|sony max|hits|mnx|movies now/.test(n)) return "Movies";
  if(/cartoon|kids|doraemon|tom|jerry|pogo|nick|sonic|disney|hungama|bal bharat|wowkidz|jungle book/.test(n)) return "Kids";
  if(/star jalsha|zee bangla|bangla|atn|ekushey|rtv|channel i|channel s|ntv|g tv|global tv|deshi|maasranga|deepto|duronto/.test(n)) return "Bangla";
  return "Entertainment";
}
function initials(name){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"TV"}
function saveFav(){localStorage.setItem("rajib-tv-favorites",JSON.stringify([...favorites]))}
function render(){
  const q=search.value.trim().toLowerCase();
  let list=channels.filter(c=>(currentFilter==="all"||category(c.name)===currentFilter)&&(c.name+" "+c.display).toLowerCase().includes(q));
  if($("#favOnlyBtn").classList.contains("active")) list=list.filter(c=>favorites.has(c.url));
  resultCount.textContent=`${list.length} CHANNELS`;
  grid.innerHTML="";
  list.forEach((c,idx)=>{
    const card=document.createElement("article");card.className="channel-card";card.style.animationDelay=Math.min(idx*18,450)+"ms";
    const isFav=favorites.has(c.url);
    card.innerHTML=`<button class="fav ${isFav?"on":""}" title="Favorite">${isFav?"♥":"♡"}</button>
      <div class="card-top">${c.logo?`<img class="logo" src="${esc(c.logo)}" alt="" loading="lazy" onerror="this.replaceWith(makeFallback('${esc(c.name)}'))">`:`<div class="fallback-logo">${initials(c.name)}</div>`}</div>
      <div class="card-bottom"><div class="card-name" title="${esc(c.name)}">${esc(c.name)}</div><div class="card-meta"><span>${category(c.name).toUpperCase()}</span><span>LIVE</span></div></div>`;
    card.querySelector(".fav").onclick=e=>{e.stopPropagation();favorites.has(c.url)?favorites.delete(c.url):favorites.add(c.url);saveFav();render()};
    card.onclick=()=>play(c);
    grid.appendChild(card);
  });
}
function makeFallback(n){const d=document.createElement("div");d.className="fallback-logo";d.textContent=initials(n);return d}
window.makeFallback=makeFallback;
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function setStatus(t,ok=false){statusText.textContent=t;statusDot.style.background=ok?"#22d3ee":"#666";statusDot.style.boxShadow=ok?"0 0 12px #22d3ee":"none"}
function play(c){
  currentChannel=c;nowTitle.textContent=c.name;empty.style.display="none";video.style.display="block";loading.style.display="flex";setStatus("CONNECTING…");
  if(hls){hls.destroy();hls=null} video.pause();video.removeAttribute("src");
  const url=c.url.split("#fb:")[0];
  if(window.Hls && Hls.isSupported()){
    hls=new Hls({enableWorker:true,maxBufferLength:30});
    hls.loadSource(url);hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED,()=>{loading.style.display="none";setStatus("LIVE",true);video.play().catch(()=>{})});
    hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal){loading.style.display="none";setStatus("STREAM ERROR");}});
  }else if(video.canPlayType("application/vnd.apple.mpegurl")){
    video.src=url;video.addEventListener("loadedmetadata",()=>{loading.style.display="none";setStatus("LIVE",true);video.play().catch(()=>{})},{once:true});
  }else{loading.style.display="none";setStatus("HLS NOT SUPPORTED")}
}
search.addEventListener("input",render);
$("#filters").addEventListener("click",e=>{const b=e.target.closest(".filter");if(!b)return;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentFilter=b.dataset.filter;render()});
$("#favOnlyBtn").onclick=()=>{$("#favOnlyBtn").classList.toggle("active");$("#favOnlyBtn").style.color=$("#favOnlyBtn").classList.contains("active")?"#ff6c8e":"";render()};
$("#muteBtn").onclick=()=>{video.muted=!video.muted;$("#muteBtn").textContent=video.muted?"🔇":"🔊"};
$("#fullBtn").onclick=()=>{$("#videoStage").requestFullscreen?.()};
$("#themeBtn").onclick=()=>document.body.classList.toggle("brighter");
fetch("channels.json").then(r=>r.json()).then(data=>{channels=data;countPill.textContent=`${channels.length} CHANNELS`;render()}).catch(()=>{grid.innerHTML="<div style='color:#aaa;padding:30px'>Could not load channels.json.</div>"});
