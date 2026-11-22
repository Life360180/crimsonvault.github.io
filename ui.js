/* UI: auth, shop, daily, inventory, print page, card detail. */
const $=s=>document.querySelector(s), fmt=n=>Number(n).toLocaleString();
let view='packs',authMode='sign',invShown=60,invRar='all',invQ='',invSort='rar';
const hydrate=root=>(root||document).querySelectorAll('i[data-ic]').forEach(e=>e.outerHTML=ic(e.dataset.ic));
function toast(t,icon){const e=$('#toast');e.innerHTML=ic(icon||'check-circle')+'<span>'+t+'</span>';e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2400)}
function coinBar(){$('#coinBox').textContent=fmt(D().coins)}
const sec=(t,sub)=>`<div class="sec"><h2>${t}</h2>${sub?`<span class="muted">${sub}</span>`:''}</div>`;
function showcase(){const pick=[RIDX[3][3],RIDX[5][7],RIDX[4][9]];$('#ashow').innerHTML=pick.map(i=>cardHTML(i,0,'static')).join('')}
async function boot(){hydrate();showcase();
  if(window.__sbReady){try{SB=await window.__sbReady}catch(e){SB=null}SB_ON=!!SB;if(!SB_ON)toast('Could not reach the online server. Running in local demo mode.','alert-circle-outline')}
  $('#uPass').minLength=SB_ON?6:4;$('#modeNote').textContent=SB_ON?'Your progress is saved online to your account.':'Local demo mode: progress is saved in this browser only.';
  let ok=false;try{ok=await resume()}catch(e){toast('Could not load your account. Check your connection.','alert-circle-outline')}
  if(ok)showApp();else{$('#auth').hidden=false;$('#app').hidden=true}}
function showApp(){$('#auth').hidden=true;$('#app').hidden=false;$('#av').textContent=ME.rec.name[0];document.querySelector('#nav [data-v="admin"]').hidden=SB_ON&&!IS_ADMIN;go('packs')}
function go(v){view=v;const nv={print:'inv',sheet:'inv',forge:'market',ach:'ranks'}[v]||v;document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===nv));window.scrollTo(0,0);render()}
function render(){coinBar();if(SB_ON&&view==='admin'&&!IS_ADMIN)view='packs';({packs:vPacks,daily:vRewards,market:vMarket,forge:vForge,ranks:vRanks,ach:vAch,inv:vInv,print:vPrint,sheet:vSheet,admin:vAdmin})[view]()}
/* card tilt and holo glare follow the pointer */
document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.cards .card, .ashow .card');if(!c)return;
  const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  c.style.setProperty('--ry',((x-.5)*18).toFixed(1)+'deg');c.style.setProperty('--rx',((.5-y)*18).toFixed(1)+'deg');c.style.setProperty('--mx',(x*100).toFixed(0)+'%');c.style.setProperty('--my',(y*100).toFixed(0)+'%')});
/* ---- auth ---- */
function setMode(m){authMode=m;$('#tabSign').classList.toggle('on',m==='sign');$('#tabLog').classList.toggle('on',m==='log');
  $('#uPass2').hidden=$('#pass2Label').hidden=m==='log';$('#authGo').textContent=m==='sign'?'Create account':'Log in';$('#authErr').textContent=''}
$('#tabSign').onclick=()=>setMode('sign');$('#tabLog').onclick=()=>setMode('log');
$('#authForm').onsubmit=async e=>{e.preventDefault();const n=$('#uName').value,p=$('#uPass').value,btn=$('#authGo');let err='';btn.disabled=true;
  try{if(authMode==='sign'){err=p!==$('#uPass2').value?'Passwords do not match.':await signup(n,p)}else err=await login(n,p)}catch(x){err='Could not reach the server. Try again.'}
  btn.disabled=false;$('#authErr').textContent=err;if(!err){$('#authForm').reset();showApp()}};
$('#logout').onclick=async()=>{await logout();$('#auth').hidden=false;$('#app').hidden=true};
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b)b.dataset.v==='admin'?(SB_ON?(IS_ADMIN?go('admin'):null):adminGate()):go(b.dataset.v)};
/* ---- shop ---- */
function foilHTML(t,cls){const g=PACKS[t].g;return `<div class="foil ${cls||''}" style="--c1:${g[0]};--c2:${g[1]}"><div class="crimp t"></div><div class="emb">${ic(packIcon(t))}</div><div class="pn" style="font-size:${Math.min(2.7,13/t.length).toFixed(2)}em">${t}</div><div class="ps">${PACK_SIZE} CARDS</div><div class="crimp b"></div><div class="shine"></div></div>`}
function packOdds(t){const P=PACKS[t];let w=P.w;
  if(P.cards&&P.cards.length){w=RARS.map(()=>0);P.cards.forEach(id=>{if(!cus(id).del)w[cardRar(id)]++})}
  const tot=w.reduce((a,b)=>a+b,0)||1,top=w.map((x,i)=>x?i:-1).filter(i=>i>=0).pop();
  const pct=top>=0?w[top]/tot*100:0;
  return {bar:w.map((x,i)=>x?`<i style="width:${x/tot*100}%;background:${RARS[i].c}" title="${RARS[i].k} ${(x/tot*100).toFixed(1)}%"></i>`:'').join(''),
    best:top>=0?`<span>Best pull</span><b style="color:${RARS[top].c}">${RARS[top].k} ${pct<1?pct.toFixed(1):Math.round(pct)}%</b>`:''}}
function vPacks(){
  const d=D(),first=PK.find(t=>d.packs[t]>0),uniq=Object.keys(d.inv).length;
  $('#view').onclick=null;
  $('#view').innerHTML=`<section class="hero"><div><h1>Crack a pack.<br><em>Chase the legend.</em></h1><p>Open foil packs, pull from ${fmt(TOTALC())} cards across eight rarities, then sell, print or keep every one.</p>
    <div class="acts" style="max-width:420px"><button class="btn" id="hOpen" type="button" ${first?'':'disabled'}>${ic('cards-playing')}${first?'Open a '+first+' pack':'No packs to open'}</button><button class="btn ghost" id="hDaily" type="button">${ic('gift-outline')}Daily reward</button></div></div>
    <div class="stats"><div class="stat">${ic('bag-personal')}<div><b>${fmt(totalCards(d.inv))}</b><span>Cards owned</span></div></div><div class="stat">${ic('star-four-points')}<div><b>${fmt(uniq)}</b><span>of ${fmt(TOTALC())} unique</span></div></div>
    <div class="stat">${ic('cards')}<div><b>${fmt(d.opened)}</b><span>Packs opened</span></div></div><div class="stat">${ic('fire')}<div><b>${d.streak}</b><span>Day streak</span></div></div></div></section>
  ${sec('Pack shop',PACK_SIZE+' cards per pack')}<div class="shop">`+
  PK.filter(packVisible).map(t=>{const own=d.packs[t]||0,P=PACKS[t],o=packOdds(t);
    return `<div class="pk" style="--c1:${P.g[0]}">${own?`<span class="own">${ic('cards-playing')}${own}</span>`:''}${foilHTML(t)}<h3>${t}</h3>
    <div class="odds"><div class="bar">${o.bar}</div><p>${o.best}</p></div>
    <div class="acts"><button class="btn ghost" data-buy="${t}" type="button">${ic('cash')}${fmt(packPrice(t))}</button><button class="btn" data-open="${t}" type="button" ${own?'':'disabled'}>Open</button></div></div>`}).join('')+'</div>';
  $('#hOpen').onclick=()=>first&&openPack(first);$('#hDaily').onclick=()=>go('daily');
  $('#view').onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.buy){const t=b.dataset.buy;if(!packVisible(t)){render();return toast('That pack is not for sale right now.','alert-circle-outline')}if(D().coins<packPrice(t))return toast('Not enough coins.','alert-circle-outline');D().coins-=packPrice(t);addPack(t,1);save();render();toast('Bought a '+t+' pack','cards-playing')}
    if(b.dataset.open)openPack(b.dataset.open)}}
/* ---- inventory / printed ---- */
function listCards(src,title,empty,showSell){
  const rec=D()[src];let ids=Object.keys(rec).map(Number);
  const own=RARS.map(()=>0);ids.forEach(i=>own[cardRar(i)]++);
  if(invRar!=='all')ids=ids.filter(i=>cardRar(i)===+invRar);
  if(invQ)ids=ids.filter(i=>(cardName(i)+' '+(i+1)).toLowerCase().includes(invQ));
  ids.sort((a,b)=>invSort==='rar'?cardRar(b)-cardRar(a)||a-b:invSort==='num'?a-b:rec[b]-rec[a]);
  const uniq=Object.keys(rec).length,pct=(uniq/TOTALC()*100).toFixed(2);
  $('#view').onclick=null;
  $('#view').innerHTML=seg([['inv','Inventory','bag-personal'],['print','Printed','printer']],src==='inv'?'inv':'print')+sec(title,`${fmt(totalCards(rec))} cards · ${fmt(uniq)} of ${fmt(TOTALC())} unique (${pct}%)`)+`<div class="prog" style="margin-bottom:18px"><i style="width:${Math.max(.6,uniq/TOTALC()*100)}%"></i></div>
  <div class="chips"><button class="chip ${invRar==='all'?'on':''}" data-r="all" style="--rc:#fff" type="button">All</button>${RARS.map((r,i)=>`<button class="chip ${invRar==i?'on':''}" data-r="${i}" style="--rc:${r.c}" type="button"><i></i>${r.k}<span>${own[i]}/${r.n}</span></button>`).join('')}</div>
  <div class="toolbar"><label class="search" for="q" style="margin:0">${ic('magnify')}<input id="q" placeholder="Search name or number" value="${invQ}"></label><select id="so" aria-label="Sort"><option value="rar" ${invSort=='rar'?'selected':''}>Rarest first</option><option value="num" ${invSort=='num'?'selected':''}>Card number</option><option value="cnt" ${invSort=='cnt'?'selected':''}>Most copies</option></select>${src==='printed'&&uniq?`<button class="btn" id="goPrint" type="button">${ic('printer')}Open print page</button>`:''}</div>`+
  (ids.length?`<div class="cards">${ids.slice(0,invShown).map(i=>`<button class="cbtn" data-id="${i}" type="button" aria-label="${cardName(i)}">${cardHTML(i,rec[i])}</button>`).join('')}</div>${ids.length>invShown?`<p style="text-align:center;margin-top:22px"><button id="more" class="btn ghost" type="button">Show more (${fmt(ids.length-invShown)} left)</button></p>`:''}`:`<div class="empty">${ic(src==='inv'?'bag-personal':'printer')}<b>${uniq?'No cards match.':empty}</b></div>`);
  $('#q').oninput=e=>{invQ=e.target.value.toLowerCase();invShown=60;listCards(src,title,empty,showSell);const q=$('#q');q.focus();q.setSelectionRange(99,99)};
  $('#so').onchange=e=>{invSort=e.target.value;render()};
  const m=$('#more');if(m)m.onclick=()=>{invShown+=60;render()};
  const gp=$('#goPrint');if(gp)gp.onclick=()=>{PRINT_BATCH=null;go('sheet')};
  $('#view').onclick=e=>{const sg=e.target.closest('.seg button');if(sg){go(sg.dataset.seg);return}const c=e.target.closest('.chip');if(c){invRar=c.dataset.r;invShown=60;render();return}const b=e.target.closest('.cbtn');if(b)cardModal(+b.dataset.id,src,showSell)}}
function vInv(){listCards('inv','Inventory','Your inventory is empty. Open a pack to start your collection.',true)}
function vPrint(){listCards('printed','Printed','Nothing printed yet. Choose Print on a card you pull.',false)}
/* ---- print page: pick one card ---- */
let PRINT_BATCH=null,PRINT_SEL=null;
function printPage(ids){PRINT_BATCH=ids;PRINT_SEL=ids.length===1?ids[0]:null;go('sheet')}
function vSheet(){
  const src=PRINT_BATCH&&PRINT_BATCH.length?PRINT_BATCH:Object.keys(D().printed).map(Number);
  const ids=[...new Set(src)];if(!ids.includes(PRINT_SEL))PRINT_SEL=null;
  $('#view').onclick=null;
  $('#view').innerHTML=`<div class="noprint">${sec('Print page','Pick one card')}<div class="acts" style="max-width:420px;margin-bottom:12px"><button class="btn ghost" id="pBack" type="button">${ic('arrow-left')}Back</button><button class="btn" id="pGo" type="button" ${PRINT_SEL===null?'disabled':''}>${ic('printer')}Print selected card</button></div>
  <p class="muted tiny" id="pHint">It prints at 63 x 88 mm. If the Print button does nothing, press Ctrl+P (Cmd+P on Mac) to open your printer dialog.</p>
  <div class="cards" id="pickgrid">${ids.map(i=>`<button class="pickc ${i===PRINT_SEL?'sel':''}" data-id="${i}" type="button" aria-pressed="${i===PRINT_SEL}">${cardHTML(i)}</button>`).join('')}</div></div>
  ${PRINT_SEL!==null?`<h3 class="noprint" style="margin:26px 0 12px;font-size:22px">Print preview</h3><div class="sheet">${cardHTML(PRINT_SEL,0,'static')}</div>`:''}`;
  $('#pBack').onclick=()=>{PRINT_BATCH=null;PRINT_SEL=null;go('print')};
  $('#pGo').onclick=()=>{try{window.print()}catch(e){}$('#pHint').style.color='var(--gold)'};
  $('#pickgrid').onclick=e=>{const b=e.target.closest('.pickc');if(b){PRINT_SEL=+b.dataset.id;vSheet()}}}
/* ---- card detail ---- */
function cardModal(id,src,sell){
  const R=RARS[cardRar(id)],m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="mbox cd" style="--rc:${R.c}"><div>${cardHTML(id,0,'big static')}</div><div><span class="pill">${R.k}</span><h3 style="margin-top:8px">${cardName(id)}</h3>
  <div class="kv"><span>Number</span><b>#${id+1}</b><span>Set</span><b>${cardSet(id)}</b><span>Owned</span><b>${D()[src][id]}</b><span>Sell value</span><b style="color:var(--gold)">${fmt(sellValue(id))} coins</b></div>
  <div class="acts" style="flex-wrap:wrap">${sell?`<button class="btn gold sm" id="mSell" type="button">${ic('cash')}Sell</button><button class="btn ghost sm" id="mPrint" type="button">${ic('printer')}Print</button>`:''}<button class="btn ghost sm" id="mX" type="button">${ic('close')}Close</button></div></div></div>`;
  document.body.appendChild(m);const close=()=>{m.remove();render()};
  m.querySelector('#mX').onclick=close;m.onclick=e=>{if(e.target===m)close()};
  if(sell){m.querySelector('#mSell').onclick=()=>{takeCard(id);D().coins+=sellValue(id);D().sold++;save();toast('Sold for '+fmt(sellValue(id)),'cash');close()};
    m.querySelector('#mPrint').onclick=()=>{takeCard(id);addCard(id,1,'printed');save();m.remove();printPage([id])}}}
