/* shared helpers for the extra pages (copied from index.html) */
const $ = id => document.getElementById(id);
const usd = v => "$" + Math.round(v).toLocaleString("en-US");
const pct = (v,s) => (s && v>0 ? "+" : "") + (v<0?"−":"") + Math.abs(Math.round(v*100)) + "%";
const big = v => v>=1e6 ? "$"+(v/1e6).toFixed(v>=1e7?0:1)+"M" : v>=1e3 ? "$"+Math.round(v/1e3)+"k" : "$"+Math.round(v);
const NS = "http://www.w3.org/2000/svg";
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
function path(xs,ys){let s="",pen=false;xs.forEach((x,i)=>{const y=ys[i];if(y==null||!isFinite(y)){pen=false;return}s+=(pen?"L":"M")+x.toFixed(1)+" "+y.toFixed(1);pen=true});return s}
function logTicks(lo,hi){const out=[];for(let e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++)[1,2,5].forEach(m=>{const v=m*10**e;if(v>=lo&&v<=hi)out.push(v)});return out}
function makeZoom(svg,bar,redraw,minPts=8){
  const z={a:0,b:1,n:2};                 // visible window as fractions of the full data range
  z.win=n=>{ z.n=n; const i0=Math.max(0,Math.floor(z.a*(n-1)+1e-9)), i1=Math.min(n-1,Math.ceil(z.b*(n-1)-1e-9)); ui(); return [i0,Math.max(i1,i0+1)]; };
  const minSpan=()=>Math.min(1,minPts/Math.max(1,z.n-1));
  const set=(a,sp)=>{ sp=Math.max(minSpan(),Math.min(1,sp)); a=Math.max(0,Math.min(1-sp,a)); if(Math.abs(a-z.a)<1e-6&&Math.abs(a+sp-z.b)<1e-6) return; z.a=a; z.b=a+sp; redraw(); };
  z.zoom=(f,c)=>{ const sp=z.b-z.a, g=z.a+c*sp, ns=Math.max(minSpan(),Math.min(1,sp*f)); set(g-c*ns,ns); };
  z.reset=()=>{ z.a=0; z.b=1; };
  const mk=(txt,label,fn)=>{ const b=document.createElement("button"); b.type="button"; b.className="zbtn"; b.textContent=txt; b.title=label; b.setAttribute("aria-label",label); b.onclick=fn; bar.appendChild(b); return b; };
  const rs=mk("Reset","Reset zoom",()=>{ z.reset(); redraw(); }), out=mk("−","Zoom out",()=>z.zoom(2,0.5)), inn=mk("+","Zoom in",()=>z.zoom(0.5,0.5));
  rs.classList.add("zreset");
  function ui(){ const zoomed=z.b-z.a<0.999; out.disabled=!zoomed; rs.hidden=!zoomed; inn.disabled=z.b-z.a<=minSpan()+1e-9; svg.classList.toggle("zoomed",zoomed); }
  const frac=x=>{ const r=svg.getBoundingClientRect(); return Math.max(0,Math.min(1,(x-r.left)/r.width)); };
  svg.addEventListener("wheel",e=>{ if(!(e.ctrlKey||e.metaKey)) return; e.preventDefault(); z.zoom(Math.exp(Math.max(-50,Math.min(50,e.deltaY))*0.01),frac(e.clientX)); },{passive:false});
  svg.addEventListener("dblclick",e=>{ e.preventDefault(); z.zoom(e.shiftKey?2:0.5,frac(e.clientX)); });
  const pts=new Map(); let pinch=0;
  svg.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; pts.set(e.pointerId,e.clientX); pinch=0; try{svg.setPointerCapture(e.pointerId)}catch(_){} });
  svg.addEventListener("pointermove",e=>{ if(!pts.has(e.pointerId)) return; const prev=pts.get(e.pointerId); pts.set(e.pointerId,e.clientX);
    if(pts.size===2){ const [x1,x2]=[...pts.values()], d=Math.abs(x1-x2); if(pinch>20&&d>20) z.zoom(pinch/d,frac((x1+x2)/2)); pinch=d; return; }
    if(pts.size===1&&z.b-z.a<0.999){ const dx=(e.clientX-prev)/svg.getBoundingClientRect().width*(z.b-z.a); set(z.a-dx,z.b-z.a); } });
  const up=e=>{ pts.delete(e.pointerId); pinch=0; };
  ["pointerup","pointercancel"].forEach(t=>svg.addEventListener(t,up));
  ui(); return z;
}
function timeAxis(svg,dates,X,top,bottom){
  const n=dates.length, days=(Date.parse(dates[n-1])-Date.parse(dates[0]))/864e5, M=d=>+d.slice(5,7);
  const mon=d=>new Date(d+"T00:00:00Z").toLocaleString("en-US",{month:"short",timeZone:"UTC"});
  const [key,keep,fmt]= days>2200?[d=>d.slice(0,4),d=>+d.slice(0,4)%2===0,d=>d.slice(0,4)]
    : days>700?[d=>d.slice(0,4),()=>1,d=>d.slice(0,4)]
    : days>400?[d=>d.slice(0,7),d=>(M(d)-1)%3===0,d=>M(d)===1?d.slice(0,4):mon(d)]
    : days>75?[d=>d.slice(0,7),()=>1,d=>M(d)===1?mon(d)+" ’"+d.slice(2,4):mon(d)]
    : [d=>d,()=>1,d=>mon(d)+" "+(+d.slice(8,10))];
  let prev=key(dates[0]), lastX=-1e9;
  dates.forEach((d,i)=>{ const k=key(d); if(k===prev) return; prev=k; if(!keep(d)) return; const x=X(i); if(x-lastX<48) return; lastX=x;
    el("line",{x1:x,x2:x,y1:top,y2:bottom,stroke:"var(--border)","stroke-width":1},svg); el("text",{x,y:bottom+16,"text-anchor":"middle",class:"tick"},svg).textContent=fmt(d); });
}
function fitSvg(svg,hDesk,hPhone){ const W=Math.max(280,Math.round(svg.getBoundingClientRect().width)||900), H=W<600?hPhone:hDesk; svg.setAttribute("viewBox",`0 0 ${W} ${H}`); return {W,H,L:W<600?48:62,R:W-(W<600?6:10)}; }
async function spotPrice(){
  try{
    const [t,st]=await Promise.all(["ticker","stats"].map(k=>fetch("https://api.exchange.coinbase.com/products/BTC-USD/"+k).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})));
    return {price:+t.price, chg:+t.price/+st.open-1};
  }catch(e){
    const r=await fetch("https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT"); if(!r.ok) throw new Error("binance "+r.status);
    const j=await r.json(); return {price:+j.lastPrice, chg:+j.priceChangePercent/100};
  }
}
async function updateTicker(){
  try{ const {price,chg}=await spotPrice(); if(!isFinite(price)) return;
    $("tk-price").textContent="BTC "+usd(price);
    const c=$("tk-chg"); c.textContent=(chg>=0?"+":"−")+Math.abs(chg*100).toFixed(1)+"% 24h"; c.className=chg>=0?"up":"down";
  }catch(e){ console.warn("spot price failed:",e.message); }
}
updateTicker(); setInterval(()=>{ if(!document.hidden) updateTicker(); },30000);

/* full daily BTC/USD history since 2010: live from blockchain.info, falling back to the copy saved with the site */
async function loadHistory(){
  let src="blockchain.com", d;
  try{
    const r=await fetch("https://api.blockchain.info/charts/market-price?timespan=all&format=json&sampled=false&cors=true");
    if(!r.ok) throw new Error(r.status); const v=(await r.json()).values.filter(p=>p.y>0);
    if(v.length<5000) throw new Error("short"); d={t:v.map(p=>p.x*1000),p:v.map(p=>p.y)};
  }catch(e){
    const j=await fetch("/data/btc-history.json").then(r=>r.json()); src="saved copy"; const t0=Date.parse(j.start+"T00:00:00Z");
    d={t:j.p.map((_,i)=>t0+i*864e5),p:j.p};
  }
  d.d=d.t.map(t=>new Date(t).toISOString().slice(0,10)); d.src=src; return d;
}
const GENESIS=Date.UTC(2009,0,3), daysSince=t=>(t-GENESIS)/864e5;
const HALVINGS=["2012-11-28","2016-07-09","2020-05-11","2024-04-20"];

/* power-law fit: log10(price) = a + b·log10(days since genesis), least squares over every daily close */
function powerLaw(H){
  let n=0,sx=0,sy=0,sxx=0,sxy=0;
  H.t.forEach((t,i)=>{ const x=Math.log10(daysSince(t)), y=Math.log10(H.p[i]); n++; sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; });
  const b=(n*sxy-sx*sy)/(n*sxx-sx*sx), a=(sy-b*sx)/n, fair=t=>10**(a+b*Math.log10(daysSince(t)));
  let low=Infinity, lowT=0; const since=Date.UTC(2015,0,1);          // single lowest day since 2015 (a crash wick)
  H.t.forEach((t,i)=>{ const m=H.p[i]/fair(t); if(t>=since&&m<low){ low=m; lowT=t; } });
  const PL={a,b,fair,low,lowT};
  // floor = lowest confirmed bear-market bottom vs fair value
  const bots=findCycles(H).filter(c=>c.botDone&&c.iBot>=0).map(c=>({m:H.p[c.iBot]/fair(H.t[c.iBot]),t:H.t[c.iBot]}));
  const f0=bots.reduce((x,y)=>y.m<x.m?y:x,{m:Infinity}); PL.floor=f0.m; PL.floorT=f0.t; return PL;
}
/* each halving cycle: top = highest close within 2 years after the halving, bottom = lowest close within 550 days after that top */
function findCycles(H){
  const now=H.t[H.t.length-1], at=d=>Date.parse(d+"T00:00:00Z");
  return HALVINGS.map(h=>{
    const ht=at(h), i0=H.t.findIndex(t=>t>=ht); let iTop=i0;
    for(let i=i0;i<H.t.length&&H.t[i]<=ht+730*864e5;i++) if(H.p[i]>H.p[iTop]) iTop=i;
    let iBot=-1; for(let i=iTop+1;i<H.t.length&&H.t[i]<=H.t[iTop]+550*864e5;i++) if(iBot<0||H.p[i]<H.p[iBot]) iBot=i;
    return {h,ht,i0,iTop,iBot,topDone:now>ht+730*864e5,botDone:now>H.t[iTop]+550*864e5};
  });
}
const fmtDate=t=>new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const money=v=>v<1?"$"+v.toFixed(2):v<10?"$"+v.toFixed(1):v<1000?"$"+Math.round(v):big(v);
