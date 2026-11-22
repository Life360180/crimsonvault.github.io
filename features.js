/* Game systems: stats, daily quests, achievements, lucky wheel, daily market, forge, sound effects. */
const seedOf=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
function noteCard(id){const s=D().stats;s.best=Math.max(s.best||0,cardRar(id))}
/* ---- quests ---- */
const QUESTS=[
 {id:'open2',evt:'open',need:2,title:'Open 2 packs',reward:200,ic:'cards'},
 {id:'open5',evt:'open',need:5,title:'Open 5 packs',reward:500,ic:'cards-playing'},
 {id:'sell5',evt:'sell',need:5,title:'Sell 5 cards',reward:150,ic:'cash'},
 {id:'keep3',evt:'keep',need:3,title:'Keep 3 cards',reward:150,ic:'bookmark-check'},
 {id:'print1',evt:'print',need:1,title:'Print a card',reward:200,ic:'printer'},
 {id:'epic1',evt:'epic',need:1,title:'Pull an Epic or better',reward:300,ic:'star-four-points'},
 {id:'spin1',evt:'spin',need:1,title:'Spin the lucky wheel',reward:150,ic:'dice-6'},
 {id:'forge1',evt:'forge',need:1,title:'Forge a card',reward:300,ic:'hammer'},
 {id:'buy1',evt:'buy',need:1,title:'Buy from the market',reward:200,ic:'store'}];
function questsToday(){const d=D(),t=today();
  if(d.q.day!==t||!d.q.ids){const r=rng(seedOf(t+ME.key)),pool=QUESTS.slice(),ids=[];while(ids.length<3)ids.push(pool.splice(Math.floor(r()*pool.length),1)[0].id);d.q={day:t,ids,prog:{},claimed:[]};save()}
  return d.q.ids.map(id=>QUESTS.find(q=>q.id===id))}
function track(evt,n){const d=D();questsToday();QUESTS.forEach(q=>{if(q.evt===evt&&d.q.ids.includes(q.id))d.q.prog[q.id]=(d.q.prog[q.id]||0)+(n||1)});if(evt==='forge')d.stats.forged++;if(evt==='spin')d.stats.spins++;save()}
/* ---- achievements ---- */
const uniqAll=d=>new Set([...Object.keys(d.inv),...Object.keys(d.printed)]).size;
const ACH=[
 {id:'p1',t:'First pack',d:'Open 1 pack',ic:'cards',n:1,r:100,v:d=>d.opened},
 {id:'p10',t:'Pack hunter',d:'Open 10 packs',ic:'cards',n:10,r:400,v:d=>d.opened},
 {id:'p50',t:'Pack addict',d:'Open 50 packs',ic:'cards-playing',n:50,r:1500,v:d=>d.opened},
 {id:'p200',t:'Pack legend',d:'Open 200 packs',ic:'treasure-chest',n:200,r:6000,v:d=>d.opened},
 {id:'u10',t:'Collector',d:'Own 10 different cards',ic:'bag-personal',n:10,r:200,v:uniqAll},
 {id:'u100',t:'Curator',d:'Own 100 different cards',ic:'book-open-variant',n:100,r:1500,v:uniqAll},
 {id:'u500',t:'Archivist',d:'Own 500 different cards',ic:'shield-star',n:500,r:6000,v:uniqAll},
 {id:'u2000',t:'Vault keeper',d:'Own 2,000 different cards',ic:'crown',n:2000,r:25000,v:uniqAll},
 {id:'leg',t:'Golden pull',d:'Pull a Legendary card',ic:'star-circle',n:1,r:1000,v:d=>d.stats.best>=4?1:0},
 {id:'myth',t:'Crimson pull',d:'Pull a Mythic card',ic:'fire-circle',n:1,r:4000,v:d=>d.stats.best>=5?1:0},
 {id:'div',t:'Touched by light',d:'Pull a Divine card',ic:'diamond-stone',n:1,r:20000,v:d=>d.stats.best>=6?1:0},
 {id:'adm',t:'Root access',d:'Pull an Admin card',ic:'console',n:1,r:100000,v:d=>d.stats.best>=7?1:0},
 {id:'forge10',t:'Blacksmith',d:'Forge 10 cards',ic:'hammer',n:10,r:1500,v:d=>d.stats.forged},
 {id:'sell100',t:'Dealer',d:'Sell 100 cards',ic:'cash-multiple',n:100,r:1000,v:d=>d.sold},
 {id:'spin10',t:'High roller',d:'Spin the wheel 10 times',ic:'dice-6',n:10,r:800,v:d=>d.stats.spins},
 {id:'streak',t:'Dedicated',d:'Reach a 7 day streak',ic:'fire',n:7,r:1200,v:d=>d.streak}];
/* ---- lucky wheel ---- */
const WHEEL=[{l:'100',k:'c',v:100,w:22},{l:'Starter',k:'p',v:'Starter',w:16},{l:'250',k:'c',v:250,w:18},{l:'Rare card',k:'r',v:2,w:12},{l:'500',k:'c',v:500,w:12},{l:'Crimson',k:'p',v:'Crimson',w:10},{l:'1,000',k:'c',v:1000,w:6},{l:'Jackpot',k:'c',v:5000,w:2}];
const SPIN_MS=8*3600*1000;
const wheelLeft=()=>(typeof evActive==='function'&&evActive('freespin'))?0:Math.max(0,D().spinAt+SPIN_MS-Date.now());
function pickWheel(){const tot=WHEEL.reduce((a,b)=>a+b.w,0);let x=Math.random()*tot;for(let i=0;i<WHEEL.length;i++){x-=WHEEL[i].w;if(x<0)return i}return 0}
function grantWheel(i){const p=WHEEL[i],d=D();let card=null;
  if(p.k==='c')d.coins+=p.v;else if(p.k==='p')addPack(p.v,1);else{const pool=RIDX[p.v];card=pool[Math.floor(Math.random()*pool.length)];addCard(card);noteCard(card)}
  return card}
/* ---- market ---- */
function marketOffers(){const t=today(),r=rng(seedOf('mk'+t));
  return [2,2,3,3,4,5].map((ri,i)=>{const pool=RIDX[ri],id=pool[Math.floor(r()*pool.length)],disc=[0,0,10,20][Math.floor(r()*4)];
    return {i,id,disc,price:Math.max(1,Math.round(sellValue(id)*3*(1-disc/100)))}})}
function marketState(){const d=D(),t=today();if(d.mk.day!==t){d.mk={day:t,bought:[]};save()}return d.mk}
/* ---- forge ---- */
const FORGE_NEED=[5,5,5,5,5,8];
function forgeCards(sel,ri){const d=D(),need=FORGE_NEED[ri];let n=0;
  for(const [id,c] of Object.entries(sel)){if(cardRar(+id)!==ri||(d.inv[id]||0)<c)return null;n+=c}
  if(n!==need)return null;
  for(const [id,c] of Object.entries(sel))for(let k=0;k<c;k++)takeCard(+id);
  const pool=RIDX[ri+1],out=pool[Math.floor(Math.random()*pool.length)];addCard(out);noteCard(out);track('forge');save();return out}
