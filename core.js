/* Core: card pool (12,000 cards), packs, accounts, admin command registry. */
const N_CARDS = 12000;
const RARS = [
  {k:'Common',    n:6000, c:'#9a9a9a', sell:10},
  {k:'Uncommon',  n:3000, c:'#4fbf6a', sell:25},
  {k:'Rare',      n:1500, c:'#3d9bff', sell:75},
  {k:'Epic',      n:800,  c:'#b44cff', sell:200},
  {k:'Legendary', n:500,  c:'#ffb02e', sell:600},
  {k:'Mythic',    n:180,  c:'#ff3b4f', sell:2000},
  {k:'Divine',    n:20,   c:'#ffe7a8', sell:10000},
  {k:'Admin',     n:10,   c:'#39ff88', sell:100000}
];
const PACKS = {
  Starter:  {price:100,   g:['#5a1a22','#2a0b10'], w:[700,220,60,15,4,1,0]},
  Crimson:  {price:300,   g:['#c4162c','#5a0a14'], w:[480,300,150,50,17,3,0]},
  Obsidian: {price:800,   g:['#2b2b33','#050507'], w:[250,330,260,110,40,9,1]},
  Inferno:  {price:2000,  g:['#ff6a1a','#8a0d0d'], w:[100,250,330,200,90,28,2]},
  Eclipse:  {price:5000,  g:['#7a1fa8','#12041c'], w:[0,120,330,310,190,45,5]},
  Mythic:   {price:12000, g:['#ff3b4f','#1a0003'], w:[0,0,200,330,330,120,20,0]},
  Hacker:   {event:'hackerpack',price:50000, g:['#0d4a26','#010a04'], w:[0,0,0,0,0,640,357,3]}
};
const PACK_SIZE = 5;
const ADJ = 'Crimson Shadow Burning Hollow Iron Ashen Silent Savage Frozen Ember Wicked Ancient Scarlet Void Feral Radiant Cursed Rusted Gilded Phantom Thunder Blood Obsidian Eternal Broken Hunted Rogue Molten Nameless Dread Lunar Solar Grim Vicious Hidden Fallen Storm Black Red Neon Savagery Twisted Arcane Spectral Brutal Midnight Dusk Rising Doomed Sacred'.split(' ');
const NOUN = 'Wolf Reaper Knight Dragon Oracle Hunter Titan Warden Serpent Phoenix Golem Witch Raven Paladin Specter Assassin Colossus Siren Berserker Alchemist Gargoyle Pharaoh Lich Valkyrie Corsair Banshee Behemoth Cultist Duelist Harbinger Jester Kraken Minotaur Necromancer Outlaw Priest Revenant Samurai Tyrant Vampire Warlock Zealot Marauder Sentinel Prowler Drifter Inquisitor Mercenary Basilisk'.split(' ');
const SETS = ['Ember Core','Night Market','Iron Crown','Dead Orbit','Last Light'];
/* Spread rarities evenly through ids so names and rarity are not correlated. */
const ORDER = new Int32Array(N_CARDS), RIDX = RARS.map(()=>[]);
(function(){let band=[],a=0;RARS.forEach(r=>{band.push(a+=r.n)});
  for(let id=0;id<N_CARDS;id++){const p=(id*7919)%N_CARDS;let r=0;while(p>=band[r])r++;ORDER[id]=r;RIDX[r].push(id)}})();
/* Admin rarity: 10 hand-named cards taken from the top of the id range. Never in normal packs. */
const ADMIN_IDS=[11990,11991,11992,11993,11994,11995,11996,11997,11998,11999];
const ADMIN_DEF=[['Root Access','key'],['Sudo Overlord','shield-lock'],['Kernel Panic','flash-alert'],['Ban Hammer','hammer'],['The Moderator','eye'],['Zero Day','bug'],['Source Code','code-braces'],['Terminal King','console'],['Rogue Admin','robot-angry'],['Admin Crown','crown']];
ADMIN_IDS.forEach(id=>{const i=RIDX[ORDER[id]].indexOf(id);if(i>=0)RIDX[ORDER[id]].splice(i,1);ORDER[id]=7;RIDX[7].push(id)});
const cardRar = id => id>=N_CARDS?cus(id).r:ORDER[id];
const cardName = id => id>=N_CARDS?cus(id).n:ORDER[id]===7?ADMIN_DEF[id-11990][0]:ADJ[id%50]+' '+NOUN[Math.floor(id/50)%48];
const cardSet = id => id>=N_CARDS?'Custom':SETS[Math.floor(id/2400)];
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cardIcon = id => id>=N_CARDS?cus(id).i:ORDER[id]===7?ADMIN_DEF[id-11990][1]:NOUN_ICON[NOUN[Math.floor(id/50)%48]]||'star-four-points';
const PACK_ICON={Starter:'cards-playing',Crimson:'water',Obsidian:'diamond-stone',Inferno:'fire',Eclipse:'moon-waning-crescent',Mythic:'eye-circle',Hacker:'console'};
const packIcon=t=>{const p=PACKS[t];return p&&p.icon&&IC[p.icon]?p.icon:(PACK_ICON[t]||'cards')};
function cardHTML(id,count,extra){
  const ri=cardRar(id),R=RARS[ri],r=rng(id*7+3),h=Math.floor(r()*44)-22,rot=Math.floor(r()*360);
  const stars=ic('star').repeat(Math.min(ri+1,7));
  return `<div class="card r${ri} ${ri>=3?'holo':''} ${extra||''}" style="--rc:${R.c};--h:${h};--rot:${rot}deg" title="${cardName(id)} #${id+1}"><div class="in"><div class="hd"><span class="nm">${cardName(id)}</span></div><div class="art"><div class="rays"></div><div class="orb"></div>${ic(cardIcon(id),'glyph')}</div><div class="stars">${stars}</div><div class="ft"><span>${R.k}</span><span>#${id+1}</span></div></div><div class="foilfx"></div>${count>1?`<span class="ct">x${count}</span>`:''}</div>`}
function rollCard(type,luckBoost){
  const P=PACKS[type];
  if(P.cards&&P.cards.length){const live=P.cards.filter(id=>!cus(id).del);if(live.length)return live[Math.floor(Math.random()*live.length)]}
  luckBoost=(luckBoost||0)+CUS.set.luck+(typeof evMods==='function'?evMods().luck:0);
  const w=P.w,tot=w.reduce((a,b)=>a+b,0);let x=Math.random()*tot,r=0;
  while(r<w.length-1&&x>=w[r]){x-=w[r];r++}
  if(luckBoost&&r<6&&Math.random()<luckBoost)r++;
  let pool=RIDX[r];while(!pool.length&&r<6)pool=RIDX[++r];return pool[Math.floor(Math.random()*pool.length)]}
/* Accounts live in localStorage on this browser. */
const DB_KEY='crimsonvault.users',SES_KEY='crimsonvault.session';
function lsGet(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
const MEM={users:null,session:null};
function users(){if(!MEM.users)MEM.users=lsGet(DB_KEY,{});return MEM.users}
function hashPw(s){let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)+s.length}
function ensure(d){d.stats=Object.assign({best:0,forged:0,spins:0},d.stats||{});d.q=d.q||{day:'',prog:{},claimed:[]};d.ach=d.ach||[];d.spinAt=d.spinAt||0;d.mk=d.mk||{day:'',bought:[]};return d}
function newData(){return ensure({coins:1000,packs:{Starter:2},inv:{},printed:{},streak:0,last:'',opened:0,sold:0})}
let ME=null,SB=null,SB_ON=false,IS_ADMIN=false;
function save(){if(ME){if(SB_ON){sbQueueSave();return}users()[ME.key]=ME.rec;lsSet(DB_KEY,users())}}
function scoreOf(d){const all={};for(const m of [d.inv,d.printed||{}])for(const [i,c] of Object.entries(m))all[i]=(all[i]||0)+c;let val=0,best=-1,bid=0;for(const [i0,c] of Object.entries(all)){const i=+i0,r=cardRar(i);val+=RARS[r].sell*c;if(r>best||(r===best&&i<bid)){best=r;bid=i}}return {val,uniq:Object.keys(all).length,opened:d.opened||0,best,bid}}
function today(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function localSignup(name,pw){const key=name.trim().toLowerCase();if(!/^[a-z0-9_ ]{2,20}$/.test(key))return 'Use 2-20 letters, numbers or underscores.';
  if(users()[key])return 'That username is taken.';users()[key]={name:name.trim(),pw:hashPw(pw),data:newData()};
  lsSet(DB_KEY,users());ME={key,rec:users()[key]};ensure(ME.rec.data);lsSet(SES_KEY,key);return ''}
function localLogin(name,pw){const key=name.trim().toLowerCase(),u=users()[key];if(!u||u.pw!==hashPw(pw))return 'Wrong username or password.';
  ME={key,rec:u};ensure(ME.rec.data);lsSet(SES_KEY,key);return ''}
function localResume(){const k=lsGet(SES_KEY,null);if(k&&users()[k]){ME={key:k,rec:users()[k]};ensure(ME.rec.data);return true}return false}
async function signup(n,p){return SB_ON?sbSignup(n,p):localSignup(n,p)}
async function login(n,p){return SB_ON?sbLogin(n,p):localLogin(n,p)}
async function resume(){return SB_ON?sbResume():localResume()}
async function logout(){if(SB_ON){await sbFlush();sbLeave()}ME=null;IS_ADMIN=false;try{localStorage.removeItem(SES_KEY)}catch(e){}}
const D=()=>ME.rec.data;
function addCard(id,n,to){const m=D()[to||'inv'];m[id]=(m[id]||0)+(n||1)}
function takeCard(id,from){const m=D()[from||'inv'];if(!m[id])return false;if(--m[id]<=0)delete m[id];return true}
function addPack(t,n){const p=D().packs;p[t]=Math.max(0,(p[t]||0)+n);if(!p[t])delete p[t]}
function totalCards(m){return Object.values(m).reduce((a,b)=>a+b,0)}

/* Custom cards, custom packs and global settings made in the admin panel (shared by all accounts in this browser). */
const CKEY='crimsonvault.custom',CORE_PACKS=Object.keys(PACKS);
let CUS={cards:[],packs:{},set:{luck:0,sellMult:1,priceMult:1,dailyMult:1}},PK=Object.keys(PACKS);
const cus=id=>CUS.cards[id-N_CARDS]||{n:'Removed Card',i:'close',r:0,s:0,del:true};
const TOTALC=()=>N_CARDS+CUS.cards.length;
const sellValue=id=>{const c=id>=N_CARDS?cus(id):null,base=c&&c.s!==null&&c.s!==''&&c.s!==undefined?+c.s:RARS[cardRar(id)].sell;return Math.max(0,Math.round(base*CUS.set.sellMult*(typeof evMods==='function'?evMods().sell:1)))};
const packVisible=t=>{const P=PACKS[t];return !P.event||(D().packs[t]||0)>0||(typeof evActive==='function'&&evActive(P.event))};
const packPrice=t=>Math.max(0,Math.round(PACKS[t].price*CUS.set.priceMult*(typeof evMods==='function'?evMods().price:1)));
function applyCustom(){
  for(let r=0;r<RARS.length;r++)RIDX[r]=RIDX[r].filter(id=>id<N_CARDS);
  CUS.cards.forEach((c,i)=>{if(c&&!c.del&&c.inPool)RIDX[c.r].push(N_CARDS+i)});
  for(const k of Object.keys(PACKS))if(!CORE_PACKS.includes(k))delete PACKS[k];
  for(const [k,p] of Object.entries(CUS.packs))PACKS[k]={price:p.price,icon:p.icon,g:p.c,w:p.w,cards:p.cards||[]};
  PK=Object.keys(PACKS);
  if(typeof rebuildCmds==='function')rebuildCmds()}
function loadCustom(){const d=lsGet(CKEY,null);if(d){CUS.cards=d.cards||[];CUS.packs=d.packs||{};CUS.set=Object.assign(CUS.set,d.set||{})}applyCustom()}
function saveCustom(){if(SB_ON){if(IS_ADMIN)SB.pushConfig('custom',CUS)}else lsSet(CKEY,CUS);applyCustom()}
loadCustom();
