/* Views for the new systems: Rewards (daily, wheel, quests), Market, Forge, Ranks, Achievements. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seg=(items,cur)=>`<div class="seg">${items.map(([k,l,i])=>`<button type="button" data-seg="${k}" class="${k===cur?'on':''}">${ic(i)}<span>${l}</span></button>`).join('')}</div>`;
const hms=ms=>{const s=Math.max(0,Math.floor(ms/1000)),p=n=>String(n).padStart(2,'0');return p(Math.floor(s/3600))+':'+p(Math.floor(s%3600/60))+':'+p(s%60)};
function modal(html,onClose){const m=document.createElement('div');m.className='modal';m.innerHTML=html;document.body.appendChild(m);
  const close=()=>{m.remove();(onClose||render)()};m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))close()});return m}
/* ---------- rewards ---------- */
let WROT=0,spinning=false,spinTimer=null;
function wheelSVG(){const R=140,pt=(deg,r)=>{const a=deg*Math.PI/180;return [(150+r*Math.sin(a)).toFixed(2),(150-r*Math.cos(a)).toFixed(2)]};
  let s=`<svg id="wheel" viewBox="0 0 300 300" style="transform:rotate(${WROT}deg)" aria-label="Lucky wheel"><circle cx="150" cy="150" r="148" fill="#1b0a0e" stroke="#ffc24a" stroke-width="3"/>`;
  WHEEL.forEach((p,i)=>{const a=pt(i*45,R),b=pt((i+1)*45,R);
    s+=`<path d="M150 150 L${a[0]} ${a[1]} A${R} ${R} 0 0 1 ${b[0]} ${b[1]} Z" fill="${i%2?'#7d0a18':'#2a0a10'}" stroke="#ffc24a66" stroke-width="1"/>`;
    s+=`<text x="150" y="66" transform="rotate(${i*45+22.5} 150 150)" text-anchor="middle" fill="${p.l==='Jackpot'?'#ffc24a':'#fff'}" font-size="17" font-weight="800" style="font-family:var(--disp);letter-spacing:.06em">${p.l}</text>`;
    if(p.k==='c')s+=`<text x="150" y="80" transform="rotate(${i*45+22.5} 150 150)" text-anchor="middle" fill="#ffffffaa" font-size="8" style="letter-spacing:.2em">COINS</text>`});
  return s+`<circle cx="150" cy="150" r="24" fill="#0b0507" stroke="#ffc24a" stroke-width="3"/></svg>`}
function vRewards(){
  const d=D(),t=today(),y=today(new Date(Date.now()-864e5)),can=d.last!==t,cur=can?(d.last===y?d.streak:0):d.streak,next=can?(cur%7)+1:cur;
  const R=n=>({c:Math.round(n*200*CUS.set.dailyMult),p:n===3?'Crimson':n===5?'Obsidian':n===7?'Inferno':null});
  const qs=questsToday();
  $('#view').innerHTML=sec('Rewards','Daily streak, lucky wheel and quests')+`<div class="week">`+[1,2,3,4,5,6,7].map(n=>{const r=R(n),done=n<=cur&&!(can&&n===next);
    return `<div class="day ${done?'done':''} ${can&&n===next?'now':''}">${done?ic('check-circle','ck'):''}${ic(n===7?'treasure-chest':r.p?'package-variant':n>3?'cash-multiple':'cash')}<small>Day ${n}</small><b>${fmt(r.c)}</b><small>${r.p?'+ '+r.p+' pack':'coins'}</small></div>`}).join('')+
  `</div><button id="claim" class="btn gold big" style="max-width:340px" type="button" ${can?'':'disabled'}>${ic(can?'gift':'check')}${can?'Claim day '+next:'Claimed. Come back tomorrow'}</button>
  <div class="duo"><div class="panel wheelp"><h3>Lucky wheel</h3><p class="muted tiny" style="margin:2px 0 12px">One free spin every 8 hours. Win coins, packs or a Rare card.</p>
  <div class="wheelbox"><div class="ptr"></div>${wheelSVG()}</div><button id="spin" class="btn gold big" type="button">${ic('dice-6')}Spin</button><p class="muted tiny" id="spinT" style="text-align:center;margin:10px 0 0"></p></div>
  <div class="panel"><h3>Daily quests</h3><p class="muted tiny" style="margin:2px 0 12px">New quests every day.</p><div class="quests">`+qs.map(q=>{const p=Math.min(q.need,d.q.prog[q.id]||0),done=p>=q.need,cl=d.q.claimed.includes(q.id);
    return `<div class="quest ${cl?'cl':''}">${ic(q.ic)}<div class="qb"><b>${q.title}</b><div class="prog"><i style="width:${p/q.need*100}%"></i></div><small class="muted">${p}/${q.need}</small></div><button class="btn sm ${done&&!cl?'gold':'ghost'}" data-q="${q.id}" type="button" ${done&&!cl?'':'disabled'}>${cl?ic('check')+'Done':done?'Claim '+q.reward:fmt(q.reward)}</button></div>`}).join('')+`</div></div></div>`;
  const sp=$('#spin'),stT=$('#spinT');
  const upd=()=>{const e=$('#spinT');if(!e||view!=='daily'){clearInterval(spinTimer);return}const l=wheelLeft();e.textContent=spinning?'Spinning...':l?'Next free spin in '+hms(l):'Your spin is ready';$('#spin').disabled=spinning||l>0};
  clearInterval(spinTimer);upd();spinTimer=setInterval(upd,1000);
  $('#claim').onclick=()=>{const r=R(next);d.coins+=r.c;if(r.p)addPack(r.p,1);d.streak=next;d.last=t;save();render();toast('+'+fmt(r.c)+' coins'+(r.p?' and a '+r.p+' pack':''),'gift')};
  sp.onclick=()=>{if(spinning||wheelLeft())return;spinning=true;
    const i=pickWheel(),c=i*45+22.5,add=360*6+((360-c)-(WROT%360)+360)%360;WROT+=add;
    const card=grantWheel(i);d.spinAt=Date.now();track('spin');save();coinBar();upd();
    const w=$('#wheel');w.style.transition='transform 5.6s cubic-bezier(.12,.72,.08,1)';w.style.transform=`rotate(${WROT}deg)`;
        setTimeout(()=>{spinning=false;if(!ME)return;const p=WHEEL[i];
      modal(`<div class="mbox" style="text-align:center"><span class="pill" style="--rc:var(--gold);margin-bottom:10px">Lucky wheel</span>`+(card!==null?`<div style="display:grid;justify-items:center;margin:12px 0">${cardHTML(card,0,'big static')}</div><h3>${RARS[cardRar(card)].k} card</h3>`:`<div style="color:var(--gold);margin:12px 0">${ic(p.k==='c'?'cash-multiple':'package-variant','gic')}</div><h3>${p.k==='c'?fmt(p.v)+' coins':p.v+' pack'}</h3>`)+`<div class="acts" style="margin-top:16px"><button class="btn" data-close type="button">Nice</button></div></div>`)},5800)};
  $('#view').onclick=e=>{const b=e.target.closest('button[data-q]');if(!b)return;const q=QUESTS.find(x=>x.id===b.dataset.q);
    if((d.q.prog[q.id]||0)>=q.need&&!d.q.claimed.includes(q.id)){d.q.claimed.push(q.id);d.coins+=q.reward;save();render();toast('+'+q.reward+' coins','trophy')}}}
const vDaily=vRewards;
/* ---------- market ---------- */
function vMarket(){
  const offers=marketOffers(),st=marketState(),d=D(),m=new Date();m.setHours(24,0,0,0);
  $('#view').innerHTML=sec('Market','Same offers for everyone today')+seg([['market','Daily market','store'],['forge','Forge','hammer']],'market')+`<p class="muted" style="margin:10px 0 18px">${ic('clock-outline')} New offers in <b id="mkT">${hms(m-Date.now())}</b></p>
  <div class="cards">`+offers.map(o=>{const sold=st.bought.includes(o.i);
    return `<div class="crow offer ${sold?'sold':''}">${o.disc?`<span class="disc">-${o.disc}%</span>`:''}${cardHTML(o.id)}${sold?`<div class="soldtag">Sold out</div>`:''}<button class="btn gold sm" data-buy="${o.i}" type="button" ${sold?'disabled':''}>${ic('cash')}${fmt(o.price)}</button></div>`}).join('')+'</div>';
  const iv=setInterval(()=>{const e=$('#mkT');if(!e||view!=='market'){clearInterval(iv);return}e.textContent=hms(m-Date.now())},1000);
  $('#view').onclick=e=>{const sg=e.target.closest('.seg button');if(sg){go(sg.dataset.seg);return}
    const b=e.target.closest('button[data-buy]');if(!b)return;const o=offers[+b.dataset.buy];
    if(st.bought.includes(o.i))return;if(d.coins<o.price)return toast('Not enough coins.','alert-circle-outline');
    d.coins-=o.price;addCard(o.id);noteCard(o.id);st.bought.push(o.i);track('buy');save();render();toast('Bought '+cardName(o.id),'store')}}
/* ---------- forge ---------- */
let FG={ri:0,sel:{}};
function vForge(){
  const d=D(),ri=FG.ri,need=FORGE_NEED[ri],rec=d.inv,own=RARS.map(()=>0);
  Object.entries(rec).forEach(([id,c])=>own[cardRar(+id)]+=c);
  for(const id of Object.keys(FG.sel))if(cardRar(+id)!==ri||(rec[id]||0)<FG.sel[id])delete FG.sel[id];
  const n=Object.values(FG.sel).reduce((a,b)=>a+b,0),ids=Object.keys(rec).map(Number).filter(i=>cardRar(i)===ri).sort((a,b)=>rec[b]-rec[a]||a-b),nx=RARS[ri+1];
  $('#view').innerHTML=sec('Forge','Melt cards into a higher rarity')+seg([['market','Daily market','store'],['forge','Forge','hammer']],'forge')+
  `<div class="chips" style="margin-top:14px">${RARS.slice(0,6).map((r,i)=>`<button class="chip ${i===ri?'on':''}" data-ri="${i}" style="--rc:${r.c}" type="button"><i></i>${r.k}<span>${own[i]}/${FORGE_NEED[i]}</span></button>`).join('')}</div>
  <div class="fbar panel"><div class="fslots">${Array.from({length:need},(_,k)=>`<i class="${k<n?'on':''}" style="--rc:${RARS[ri].c}"></i>`).join('')}</div>${ic('arrow-right','farr')}<div class="ftarget" style="--rc:${nx.c}">${ic('star-four-points')}<span>1 random <b style="color:${nx.c}">${nx.k}</b> card</span></div>
  <div class="facts"><button class="btn ghost sm" id="fAuto" type="button">${ic('shimmer')}Auto-pick</button><button class="btn ghost sm" id="fClr" type="button">${ic('close')}Clear</button><button class="btn gold" id="fGo" type="button" ${n===need?'':'disabled'}>${ic('hammer')}Forge ${n}/${need}</button></div></div>`+
  (ids.length?`<div class="cards">${ids.map(i=>`<button class="cbtn ${FG.sel[i]?'sel':''}" data-id="${i}" type="button" aria-label="${cardName(i)}">${cardHTML(i,rec[i])}${FG.sel[i]?`<span class="selb">${FG.sel[i]}</span>`:''}</button>`).join('')}</div>`:`<div class="empty">${ic('hammer')}<b>You have no ${RARS[ri].k} cards to forge.</b><span>Open packs to collect some.</span></div>`);
  $('#view').onclick=e=>{const sg=e.target.closest('.seg button');if(sg){go(sg.dataset.seg);return}
    const ch=e.target.closest('.chip');if(ch){FG={ri:+ch.dataset.ri,sel:{}};vForge();return}
    const b=e.target.closest('.cbtn');if(b){const id=b.dataset.id,cur=FG.sel[id]||0;
      if(cur<rec[id]&&n<need)FG.sel[id]=cur+1;else if(cur>0)delete FG.sel[id];else toast('That is all '+need+' you need.','information-outline');vForge();return}
    if(e.target.closest('#fClr')){FG.sel={};vForge();return}
    if(e.target.closest('#fAuto')){FG.sel={};let left=need;const dup=ids.filter(i=>rec[i]>1),sing=ids.filter(i=>rec[i]===1);
      dup.forEach(i=>{const k=Math.min(left,rec[i]-1);if(k>0){FG.sel[i]=k;left-=k}});sing.forEach(i=>{if(left>0){FG.sel[i]=1;left--}});
      dup.forEach(i=>{if(left>0){const k=Math.min(left,1);FG.sel[i]=(FG.sel[i]||0)+k;left-=k}});
      if(left>0){FG.sel={};toast('You need '+need+' '+RARS[ri].k+' cards.','alert-circle-outline')}vForge();return}
    if(e.target.closest('#fGo')){const out=forgeCards(FG.sel,ri);if(out===null)return;FG.sel={};coinBar();
      const m=modal(`<div class="mbox" style="text-align:center;min-width:min(320px,100%)"><div class="forging">${ic('hammer','gic')}<p class="muted">Forging...</p></div></div>`,()=>render());
      setTimeout(()=>{const R2=RARS[cardRar(out)];m.firstChild.innerHTML=`<span class="pill" style="--rc:${R2.c};margin-bottom:10px">Forged</span><div style="display:grid;justify-items:center;margin:12px 0">${cardHTML(out,0,'big static')}</div><h3>${cardName(out)}</h3><div class="acts" style="margin-top:16px"><button class="btn" data-close type="button">${ic('check')}Great</button></div>`},1500)}}}
/* ---------- ranks and achievements ---------- */
let RSORT='value';
async function rankRows(){
  if(SB_ON){const k={value:'val',uniq:'uniq',packs:'opened'}[RSORT],rows=await SB.listProfiles(k);return rows.map(r=>({k:r.id,name:r.name,val:+r.val||0,uniq:r.uniq||0,packs:r.opened||0,best:r.best==null?-1:r.best,bid:r.bid||0}))}
  const us=users(),f={value:'val',uniq:'uniq',packs:'packs'}[RSORT];
  return Object.keys(us).map(k=>{const s=scoreOf(us[k].data);return {k,name:us[k].name,val:s.val,uniq:s.uniq,packs:s.opened,best:s.best,bid:s.bid}}).sort((a,b)=>b[f]-a[f])}
async function vRanks(){
  $('#view').onclick=null;let rows=[];
  try{rows=await rankRows()}catch(e){toast('Could not load the leaderboard.','alert-circle-outline')}
  if(view!=='ranks')return;
  $('#view').innerHTML=sec('Ranks',SB_ON?'Every player online':'Everyone playing in this browser')+seg([['ranks','Leaderboard','podium'],['ach','Achievements','trophy']],'ranks')+
  `<div class="chips" style="margin-top:14px">${[['value','Collection value'],['uniq','Unique cards'],['packs','Packs opened']].map(([k,l])=>`<button class="chip ${RSORT===k?'on':''}" data-rk="${k}" style="--rc:#fff" type="button">${l}</button>`).join('')}</div>
  <div class="rank">`+(rows.length?rows.map((r,i)=>`<div class="rrow ${r.k===ME.key?'me':''}"><span class="rn ${i<3?'m'+i:''}">${i<3?ic(i===0?'trophy':'medal'):i+1}</span><span class="av">${esc(r.name[0]||'?')}</span><b class="rname">${esc(r.name)}${r.k===ME.key?' (you)':''}</b>
  <span class="rv">${ic('cash')}${fmt(r.val)}</span><span class="rv hide">${ic('star-four-points')}${fmt(r.uniq)}</span><span class="rv hide">${ic('cards')}${fmt(r.packs)}</span><span class="rbest" style="color:${r.best>=0?RARS[r.best].c:'var(--dim)'}">${r.best>=0?ic(cardIcon(r.bid))+RARS[r.best].k:'No cards'}</span></div>`).join(''):`<div class="empty">${ic('podium')}<b>No players yet.</b></div>`)+`</div>`;
  $('#view').onclick=e=>{const sg=e.target.closest('.seg button');if(sg){go(sg.dataset.seg);return}const c=e.target.closest('.chip');if(c){RSORT=c.dataset.rk;vRanks()}}}
function vAch(){
  const d=D();
  $('#view').innerHTML=sec('Achievements',d.ach.length+' of '+ACH.length+' claimed')+seg([['ranks','Leaderboard','podium'],['ach','Achievements','trophy']],'ach')+`<div class="achs">`+ACH.map(a=>{const v=Math.min(a.n,a.v(d)),done=v>=a.n,cl=d.ach.includes(a.id);
    return `<div class="ach ${cl?'cl':done?'rdy':''}">${ic(a.ic,'aic')}<div class="qb"><b>${a.t}</b><small class="muted">${a.d}</small><div class="prog"><i style="width:${v/a.n*100}%"></i></div><small class="muted">${fmt(v)}/${fmt(a.n)}</small></div><button class="btn sm ${done&&!cl?'gold':'ghost'}" data-a="${a.id}" type="button" ${done&&!cl?'':'disabled'}>${cl?ic('check')+'Done':done?'Claim '+fmt(a.r):ic('cash')+fmt(a.r)}</button></div>`}).join('')+'</div>';
  $('#view').onclick=e=>{const sg=e.target.closest('.seg button');if(sg){go(sg.dataset.seg);return}const b=e.target.closest('button[data-a]');if(!b)return;
    const a=ACH.find(x=>x.id===b.dataset.a);if(a.v(d)>=a.n&&!d.ach.includes(a.id)){d.ach.push(a.id);d.coins+=a.r;save();render();toast('+'+fmt(a.r)+' coins','trophy')}}}
