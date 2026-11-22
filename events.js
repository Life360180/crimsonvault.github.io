/* Site events: admin-triggered effects that run for everyone using this browser. */
const EVKEY='crimsonvault.events';
let EVS={active:{},banner:''},EVRUN={},EVFIRST=true;
function evLoad(){if(window.SUPABASE_CONFIG){EVS={active:{},banner:''};return}const d=lsGet(EVKEY,null);EVS=d&&d.active?d:{active:{},banner:''}}
function evSave(){if(SB_ON){if(IS_ADMIN)SB.pushConfig('events',EVS)}else lsSet(EVKEY,EVS)}
const evActive=id=>{const e=EVS.active[id];return e!==undefined&&(e===0||e>Date.now())};
function evMods(){return {price:evActive('sale')?.5:1,sell:evActive('double')?2:1,luck:evActive('lucky')?.25:0}}
const rnd=(a,b)=>a+Math.random()*(b-a);
function fxRoot(){let r=document.getElementById('fx');if(!r){r=document.createElement('div');r.id='fx';document.body.appendChild(r)}return r}
const bodyClass=c=>({start(){document.documentElement.classList.add(c)},stop(){document.documentElement.classList.remove(c)}});
/* shared helpers for timer-based effects */
function timed(fn,ms){let t=null;return {start(){fn();t=setInterval(fn,ms)},stop(){clearInterval(t)}}}
/* ---- cat memes ---- */
const TOPS=['I CAN HAS','NO MORE','BONK','ME WHEN','HUMAN','ERROR 404','PURRFECT','BREAKING NEWS','WHEN THE','NOT THE'];
const BOTS=['PACKS?','MYTHIC PULL','DIVINE CARD','NAP TIME','FEED ME','DOG NOT FOUND','TAX EVASION','STILL HUNGRY','MEOW MEOW MEOW','CARDS ARE LIFE','SELL ME THE VAULT','I AM LEGENDARY'];
const pickOne=a=>a[Math.floor(Math.random()*a.length)];
function memeEl(){const el=document.createElement('div');el.className='memepop';const h=Math.floor(Math.random()*360);
  el.style.setProperty('--h',h);el.innerHTML=`<div class="mtop">${pickOne(TOPS)}</div>${ic('cat')}<div class="mbot">${pickOne(BOTS)}</div>`;return el}
function catCursor(){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path fill="#ff9f43" stroke="#000" stroke-width="1" d="${IC.cat}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 18 18, auto`}
const CATS=(()=>{let tFall=null,tPop=null,raf=0,bounce=[],style=null;
  const frame=()=>{bounce.forEach(b=>{b.x+=b.vx;b.y+=b.vy;const W=innerWidth-b.w,H=innerHeight-b.w;if(b.x<0||b.x>W)b.vx*=-1;if(b.y<0||b.y>H)b.vy*=-1;b.el.style.transform=`translate(${b.x}px,${b.y}px) rotate(${b.x/20}deg)`});raf=requestAnimationFrame(frame)};
  return {start(){const root=fxRoot();
    style=document.createElement('style');style.textContent=`html.ev-cats,html.ev-cats *{cursor:${catCursor()}!important}`;document.head.appendChild(style);document.documentElement.classList.add('ev-cats');
    bounce=Array.from({length:4},()=>{const el=memeEl();el.classList.add('bounce');root.appendChild(el);return {el,w:150,x:rnd(0,innerWidth-150),y:rnd(0,innerHeight-150),vx:rnd(1.4,2.6)*(Math.random()<.5?-1:1),vy:rnd(1.2,2.4)*(Math.random()<.5?-1:1)}});
    frame();
    tFall=setInterval(()=>{const e=document.createElement('i');e.className='catfall';e.innerHTML=ic('cat');e.style.cssText=`left:${rnd(0,98)}%;--c:hsl(${Math.floor(rnd(0,360))} 75% 62%);--rot:${Math.floor(rnd(-540,540))}deg;--s:${rnd(26,70).toFixed(0)}px;animation-duration:${rnd(4,9).toFixed(1)}s`;
      e.addEventListener('animationend',()=>e.remove());root.appendChild(e)},260);
    tPop=setInterval(()=>{const el=memeEl();el.classList.add('pop');el.style.left=rnd(2,80)+'%';el.style.top=rnd(8,75)+'%';el.style.setProperty('--r',Math.floor(rnd(-16,16))+'deg');el.addEventListener('animationend',()=>el.remove());root.appendChild(el)},1300)},
   stop(){clearInterval(tFall);clearInterval(tPop);cancelAnimationFrame(raf);bounce=[];document.documentElement.classList.remove('ev-cats');if(style)style.remove();document.querySelectorAll('#fx .memepop,#fx .catfall').forEach(e=>e.remove())}}})();
/* ---- canvas effects ---- */
function canvasFx(draw,init){let cv,cx,raf=0,S={};
  const size=()=>{cv.width=innerWidth;cv.height=innerHeight};
  return {start(){cv=document.createElement('canvas');cv.className='fxcv';fxRoot().appendChild(cv);cx=cv.getContext('2d');size();addEventListener('resize',size);S=init(cv)||{};
      const loop=()=>{draw(cx,cv,S);raf=requestAnimationFrame(loop)};loop()},
    stop(){cancelAnimationFrame(raf);removeEventListener('resize',size);if(cv)cv.remove()}}}
const MATRIX=canvasFx((cx,cv,S)=>{cx.globalCompositeOperation='destination-out';cx.fillStyle='rgba(0,0,0,.09)';cx.fillRect(0,0,cv.width,cv.height);cx.globalCompositeOperation='source-over';
  cx.font='16px ui-monospace,Menlo,monospace';const cols=Math.ceil(cv.width/16);while(S.d.length<cols)S.d.push(Math.random()*cv.height/16);
  for(let i=0;i<cols;i++){const ch='0123456789ABCDEF'[Math.floor(Math.random()*16)];cx.fillStyle='#ffd0d4';cx.fillText(ch,i*16,S.d[i]*16);cx.fillStyle='#e11d33';cx.fillText(ch,i*16,(S.d[i]-1)*16);
    if(S.d[i]*16>cv.height&&Math.random()>.975)S.d[i]=0;S.d[i]+=1}},()=>({d:[]}));
const CONF=canvasFx((cx,cv,S)=>{cx.clearRect(0,0,cv.width,cv.height);for(let i=0;i<6;i++)S.p.push({x:rnd(0,cv.width),y:-12,vx:rnd(-1.2,1.2),vy:rnd(2,5),r:rnd(0,6.28),vr:rnd(-.2,.2),w:rnd(6,12),h:rnd(4,8),c:pickOne(['#ff4d5e','#ffc24a','#3ddc84','#3ea0ff','#b66bff','#ffffff'])});
  S.p=S.p.filter(p=>p.y<cv.height+20);S.p.forEach(p=>{p.x+=p.vx+Math.sin(p.y/30);p.y+=p.vy;p.r+=p.vr;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore()})},()=>({p:[]}));
/* ---- coin rain, jumpscare, disco ---- */
const COINS=(()=>{let t=null;return {start(){const root=fxRoot();t=setInterval(()=>{const b=document.createElement('button');b.type='button';b.className='coinfall';b.setAttribute('aria-label','Collect coin');b.innerHTML=ic('cash');
  b.style.cssText=`left:${rnd(2,94)}%;animation-duration:${rnd(4,8).toFixed(1)}s`;b.addEventListener('animationend',()=>b.remove());
  b.onclick=()=>{if(!ME)return toast('Log in to collect coins.');D().coins+=25;save();coinBar();b.classList.add('got');b.textContent='+25';setTimeout(()=>b.remove(),500)};root.appendChild(b)},520)},
  stop(){clearInterval(t);document.querySelectorAll('#fx .coinfall').forEach(e=>e.remove())}}})();
const SCARE=(()=>{let t=null;const go=()=>{const s=document.createElement('div');s.className='scare';s.innerHTML=ic('ghost');fxRoot().appendChild(s);s.addEventListener('animationend',()=>s.remove());t=setTimeout(go,rnd(5000,12000))};
  return {start(){t=setTimeout(go,rnd(1500,4000))},stop(){clearTimeout(t);document.querySelectorAll('#fx .scare').forEach(e=>e.remove())}}})();
const DISCO={start(){const d=document.createElement('div');d.className='disco';fxRoot().appendChild(d)},stop(){document.querySelectorAll('#fx .disco').forEach(e=>e.remove())}};
/* ---- definitions ---- */
const EVENTS=[
 {id:'cats',n:'Cat meme storm',ic:'cat',d:'Cats rain down, cat memes bounce across the site and your cursor becomes a cat.',fx:CATS},
 {id:'disco',n:'Disco',ic:'creation',d:'Rotating rainbow spotlights wash over everything.',fx:DISCO},
 {id:'confetti',n:'Confetti party',ic:'gift',d:'Confetti falls over the whole site.',fx:CONF},
 {id:'matrix',n:'Red rain',ic:'console-line',d:'Falling red code in the background.',fx:MATRIX},
 {id:'coins',n:'Coin rain',ic:'cash-multiple',d:'Gold coins fall. Players click them for +25 coins each.',fx:COINS},
 {id:'scare',n:'Jumpscare',ic:'ghost',d:'A ghost flashes across the screen at random.',fx:SCARE},
 {id:'quake',n:'Earthquake',ic:'lightning-bolt',d:'The whole page shakes.',fx:bodyClass('ev-quake')},
 {id:'upside',n:'Upside down',ic:'refresh',d:'Content flips upside down.',fx:bodyClass('ev-upside')},
 {id:'mirror',n:'Mirror world',ic:'swap-horizontal',d:'Content is mirrored left to right.',fx:bodyClass('ev-mirror')},
 {id:'drunk',n:'Drunk mode',ic:'flask',d:'Everything sways and blurs.',fx:bodyClass('ev-drunk')},
 {id:'glitch',n:'Glitch',ic:'alert-circle-outline',d:'Screen tears and color split.',fx:bodyClass('ev-glitch')},
 {id:'rainbow',n:'Rainbow shift',ic:'shimmer',d:'Colors cycle through the whole spectrum.',fx:bodyClass('ev-rainbow')},
 {id:'comic',n:'Comic font',ic:'drama-masks',d:'Every font becomes a comic font.',fx:bodyClass('ev-comic')},
 {id:'sale',n:'Pack sale',ic:'sale',d:'All packs cost half price.',mod:true},
 {id:'hackerpack',n:'Hacker pack in the shop',ic:'console',d:'The secret Hacker pack (Admin, Divine and Mythic cards) appears in the pack shop while this runs.',mod:true},
 {id:'lucky',n:'Lucky hour',ic:'star-circle',d:'Better rarity odds on every pack.',mod:true},
 {id:'double',n:'Double sell',ic:'cash-plus',d:'Selling a card pays twice as much.',mod:true},
 {id:'freespin',n:'Free spins',ic:'dice-6',d:'The lucky wheel has no cooldown.',mod:true}];
const EVD={};EVENTS.forEach(e=>EVD[e.id]=e);
/* ---- runtime ---- */
function evStart(id,secs){EVS.active[id]=secs?Date.now()+secs*1000:0;evSave();evTick()}
function evStop(id){delete EVS.active[id];evSave();evTick()}
function evTick(){
  EVENTS.forEach(e=>{const on=evActive(e.id);
    if(on&&!EVRUN[e.id]){EVRUN[e.id]=true;if(e.fx)e.fx.start();if(!EVFIRST&&typeof toast==='function')toast('Event started: '+e.n,e.ic)}
    if(!on&&EVRUN[e.id]){EVRUN[e.id]=false;if(e.fx)e.fx.stop();if(EVS.active[e.id]!==undefined&&!evActive(e.id)){delete EVS.active[e.id];evSave()}}});
  const bn=document.getElementById('banner');if(bn){bn.hidden=!EVS.banner;const sp=bn.querySelector('span');if(sp&&sp.textContent!==EVS.banner)sp.textContent=EVS.banner}
  const bar=document.getElementById('evbar');
  if(bar){const act=EVENTS.filter(e=>evActive(e.id));bar.hidden=!act.length;
    bar.innerHTML=act.map(e=>`<span class="evchip">${ic(e.ic)}<b>${e.n}</b>${EVS.active[e.id]?'<em>'+hms(EVS.active[e.id]-Date.now())+'</em>':''}</span>`).join('')}
  if(typeof ME!=='undefined'&&ME&&view==='packs'&&(window.__evmods!==JSON.stringify(evMods())+evActive('hackerpack'))){window.__evmods=JSON.stringify(evMods())+evActive('hackerpack');if(!EVFIRST)render()}
  EVFIRST=false}
evLoad();setInterval(evTick,1000);addEventListener('storage',e=>{if(e.key===EVKEY){evLoad();evTick()}});
setTimeout(evTick,0);
/* ---- one-shot actions ---- */
const ONESHOT=[
 {id:'gift',n:'Free pack for everyone',ic:'gift-open',run(){if(SB_ON){SB.bumpDrop('gift');return 'Every online player gets an Obsidian pack'}Object.values(users()).forEach(u=>{u.data.packs.Obsidian=(u.data.packs.Obsidian||0)+1});return 'Gave every account an Obsidian pack'}},
 {id:'shower',n:'1,000 coin shower',ic:'cash-multiple',run(){if(SB_ON){SB.bumpDrop('shower');return 'Every online player gets 1,000 coins'}Object.values(users()).forEach(u=>{u.data.coins+=1000});return 'Gave every account 1,000 coins'}},
 {id:'adminrain',n:'Admin card for everyone',ic:'shield-star',run(){if(SB_ON){SB.bumpDrop('admincard');return 'Every online player gets an Admin card'}Object.values(users()).forEach(u=>{const id=ADMIN_IDS[Math.floor(Math.random()*10)];u.data.inv[id]=(u.data.inv[id]||0)+1;u.data.stats.best=Math.max(u.data.stats.best||0,7)});return 'Gave every account a random Admin card'}},
 {id:'hackerdrop',n:'Hacker pack for everyone',ic:'console',run(){if(SB_ON){SB.bumpDrop('hacker');return 'Every online player gets a Hacker pack'}Object.values(users()).forEach(u=>{u.data.packs.Hacker=(u.data.packs.Hacker||0)+1});return 'Gave every account a Hacker pack'}},
 {id:'chaos',n:'Chaos (5 random effects)',ic:'lightning-bolt',run(){const vis=EVENTS.filter(e=>!e.mod).sort(()=>Math.random()-.5).slice(0,5);vis.forEach(e=>{EVS.active[e.id]=Date.now()+60000});evSave();evTick();return 'Chaos for 1 minute: '+vis.map(e=>e.n).join(', ')}}];
/* ---- admin tab ---- */
function aEvents(el){
  el.innerHTML=`<p class="muted">Events run for everyone using this browser, on every open tab.</p>
  <div class="evtools panel"><div><label for="evd">Duration</label><select id="evd"><option value="30">30 seconds</option><option value="120" selected>2 minutes</option><option value="600">10 minutes</option><option value="3600">1 hour</option><option value="0">Until stopped</option></select></div>
  <div class="evbanner"><label for="evb">Announcement banner</label><input id="evb" maxlength="140" placeholder="Message shown across the top of the site" value="${EVS.banner.replace(/"/g,'&quot;')}"></div>
  <div class="facts"><button class="btn sm" id="evPost" type="button">${ic('check')}Post banner</button><button class="btn ghost sm" id="evClr" type="button">${ic('close')}Clear banner</button><button class="btn ghost sm" id="evStopAll" type="button">${ic('lock')}Stop all events</button></div></div>
  <h3 style="margin:22px 0 12px;font-size:22px">One-time actions</h3><div class="evgrid">${ONESHOT.map(o=>`<div class="evcard">${ic(o.ic,'eic')}<div class="qb"><b>${o.n}</b></div><button class="btn sm gold" data-one="${o.id}" type="button">Run</button></div>`).join('')}</div>
  <h3 style="margin:22px 0 12px;font-size:22px">Events</h3><div class="evgrid" id="evg"></div>`;
  const paint=()=>{if(!document.getElementById('evg'))return;$('#evg').innerHTML=EVENTS.map(e=>{const on=evActive(e.id);
    return `<div class="evcard ${on?'live':''}">${ic(e.ic,'eic')}<div class="qb"><b>${e.n}${e.mod?' <small class="muted">(bonus)</small>':''}</b><small class="muted">${e.d}</small><small class="${on?'livet':'muted'}">${on?'LIVE'+(EVS.active[e.id]?' · '+hms(EVS.active[e.id]-Date.now()):' · until stopped'):'Off'}</small></div>
    <button class="btn sm ${on?'ghost':''}" data-ev="${e.id}" type="button">${on?'Stop':'Start'}</button></div>`}).join('')};
  paint();const iv=setInterval(()=>{if(!document.getElementById('evg')||view!=='admin'||admTab!=='ev'){clearInterval(iv);return}paint()},1000);
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.ev){const id=b.dataset.ev;evActive(id)?evStop(id):evStart(id,+$('#evd').value);paint()}
    else if(b.dataset.one){const o=ONESHOT.find(x=>x.id===b.dataset.one);const m=o.run();save();coinBar();toast(m,o.ic);paint()}
    else if(b.id==='evPost'){EVS.banner=clean($('#evb').value);evSave();evTick();toast('Banner posted','check-circle')}
    else if(b.id==='evClr'){EVS.banner='';$('#evb').value='';evSave();evTick()}
    else if(b.id==='evStopAll'){EVS.active={};evSave();evTick();paint()}}}
