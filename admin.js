/* Admin command registry: generated programmatically, 1,000+ commands. */
const ADMIN_CODE='0355';
const RK=RARS.map(r=>r.k);
function buildCommands(){
  const C=[];const add=(name,desc,run)=>C.push({name,desc,run});
  const ok=m=>m;
  for(let n=100;n<=10000;n+=100)add('addcoins '+n,'Add '+n+' coins',()=>{D().coins+=n;return ok('+'+n+' coins')});
  for(let n=100;n<=5000;n+=100)add('removecoins '+n,'Remove '+n+' coins',()=>{D().coins=Math.max(0,D().coins-n);return '-'+n+' coins'});
  for(const n of [0,50,250,500,1000,2500,5000,10000,25000,50000,100000,250000,500000,1000000])add('setcoins '+n,'Set coins to '+n,()=>{D().coins=n;return 'Coins = '+n});
  for(const p of PK)for(let n=1;n<=25;n++)add('givepack '+p.toLowerCase()+' '+n,'Give '+n+' '+p+' pack(s)',()=>{addPack(p,n);return '+'+n+' '+p+' packs'});
  for(const p of PK)for(let n=1;n<=20;n++)add('removepack '+p.toLowerCase()+' '+n,'Remove '+n+' '+p+' pack(s)',()=>{addPack(p,-n);return '-'+n+' '+p+' packs'});
  for(let n=1;n<=30;n++)add('giveallpacks '+n,'Give '+n+' of every pack type',()=>{PK.filter(p=>!PACKS[p].event).forEach(p=>addPack(p,n));return '+'+n+' of each pack'});
  RARS.forEach((R,ri)=>{
    for(let n=1;n<=30;n++)add('givecard '+R.k.toLowerCase()+' '+n,'Give '+n+' random '+R.k+' card(s)',()=>{for(let i=0;i<n;i++)addCard(RIDX[ri][Math.floor(Math.random()*RIDX[ri].length)]);return '+'+n+' '+R.k});
    add('sellall '+R.k.toLowerCase(),'Sell every '+R.k+' card in inventory',()=>{let g=0;for(const id of Object.keys(D().inv))if(cardRar(+id)===ri){g+=D().inv[id]*sellValue(+id);delete D().inv[id]}D().coins+=g;return 'Sold '+R.k+' for '+g});
    add('clearinv '+R.k.toLowerCase(),'Delete every '+R.k+' card from inventory',()=>{for(const id of Object.keys(D().inv))if(cardRar(+id)===ri)delete D().inv[id];return 'Cleared '+R.k});
    add('completerarity '+R.k.toLowerCase(),'Own one of every '+R.k+' card',()=>{RIDX[ri].forEach(id=>{if(!D().inv[id])addCard(id)});return 'Completed '+R.k+' ('+RIDX[ri].length+')'});
  });
  for(let i=0;i<200;i++){const id=Math.floor(i*N_CARDS/200);add('givecardid '+(id+1),'Give '+cardName(id)+' (#'+(id+1)+')',()=>{addCard(id);return 'Gave '+cardName(id)})}
  for(let i=0;i<100;i++){const id=Math.floor(i*N_CARDS/100)+7;add('burncard '+(id+1),'Remove #'+(id+1)+' from inventory',()=>{const had=takeCard(id);return had?'Burned #'+(id+1):'You do not own #'+(id+1)})}
  for(let s=0;s<5;s++)add('completeset '+(s+1),'Own one of every card in set '+(s+1)+' ('+SETS[s]+')',()=>{for(let id=s*2400;id<(s+1)*2400;id++)if(!D().inv[id])addCard(id);return 'Completed set '+SETS[s]});
  for(let n=1;n<=7;n++)add('setstreak '+n,'Set daily streak to '+n,()=>{D().streak=n;return 'Streak '+n});
  for(let n=1;n<=20;n++)add('givedivine '+n,'Give '+n+' Divine card(s)',()=>{for(let i=0;i<n;i++)addCard(RIDX[6][Math.floor(Math.random()*20)]);return '+'+n+' Divine'});
  for(let n=1;n<=20;n++)add('givemythic '+n,'Give '+n+' Mythic card(s)',()=>{for(let i=0;i<n;i++)addCard(RIDX[5][Math.floor(Math.random()*180)]);return '+'+n+' Mythic'});
  for(let n=1;n<=10;n++)add('giveadmincard '+n,'Give '+n+' Admin card(s)',()=>{for(let i=0;i<n;i++)addCard(ADMIN_IDS[Math.floor(Math.random()*10)]);noteCard(ADMIN_IDS[0]);return '+'+n+' Admin'});
  for(let n=1;n<=10;n++)add('giveadmin '+n,'Give '+n+' Admin card(s)',()=>{for(let i=0;i<n;i++)addCard(ADMIN_IDS[Math.floor(Math.random()*10)]);noteCard(ADMIN_IDS[0]);return '+'+n+' Admin'});
  for(let n=1;n<=10;n++)add('givehackerpack '+n,'Give '+n+' Hacker pack(s)',()=>{addPack('Hacker',n);return '+'+n+' Hacker packs'});
  add('resetspin','Allow a free wheel spin now',()=>{D().spinAt=0;return 'Wheel ready'});
  add('resetquests','Roll fresh daily quests',()=>{D().q={day:'',prog:{},claimed:[]};return 'Quests reset'});
  add('resetmarket','Restock today\'s market purchases',()=>{D().mk={day:'',bought:[]};return 'Market reset'});
  add('claimachievements','Mark every achievement as claimed (no reward)',()=>{D().ach=ACH.map(x=>x.id);return 'Achievements marked'});
  add('resetdaily','Allow claiming the daily reward again',()=>{D().last='';return 'Daily reset'});
  add('clearprinted','Empty the printed collection',()=>{D().printed={};return 'Printed cleared'});
  add('wipeinv','Delete the entire inventory',()=>{D().inv={};return 'Inventory wiped'});
  add('wipeall','Reset this account to a fresh start',()=>{ME.rec.data=newData();return 'Account reset'});
  add('printall','Move all duplicates into the printed collection',()=>{let n=0;for(const id of Object.keys(D().inv))while(D().inv[id]>1){takeCard(+id);addCard(+id,1,'printed');n++}return 'Printed '+n+' duplicates'});
  add('sellduplicates','Sell every duplicate, keep one of each',()=>{let g=0;for(const id of Object.keys(D().inv)){const x=D().inv[id]-1;if(x>0){g+=x*sellValue(+id);D().inv[id]=1}}D().coins+=g;return 'Sold duplicates for '+g});
  add('stats','Show account statistics',()=>'Coins '+D().coins+', cards '+totalCards(D().inv)+', unique '+Object.keys(D().inv).length+', packs opened '+D().opened);
  return C}
let CMDS=buildCommands();
function rebuildCmds(){CMDS=buildCommands()}
/* Console: exact registry names, plus shorthand like "coins 500", "pack inferno 3", "card 77". */
function runCommand(txt){
  txt=txt.trim().toLowerCase().replace(/\s+/g,' ');if(!txt)return '';
  const hit=CMDS.find(c=>c.name===txt);if(hit){const m=hit.run();save();return m}
  let m;
  if(m=txt.match(/^coins ([+-]?\d+)$/)){D().coins=Math.max(0,D().coins+ +m[1]);save();return 'Coins '+(+m[1]>0?'+':'')+m[1]}
  if(m=txt.match(/^pack (\w+) (\d+)$/)){const p=PK.find(x=>x.toLowerCase()===m[1]);if(!p)return 'Unknown pack. Try: '+PK.join(', ');addPack(p,+m[2]);save();return '+'+m[2]+' '+p}
  if(m=txt.match(/^card (\d+)$/)){const id=+m[1]-1;if(id<0||id>=TOTALC())return 'Card ids run 1 to '+TOTALC();addCard(id);save();return 'Gave '+cardName(id)}
  return 'Unknown command. Search the list below or try "coins 500", "pack inferno 3", "card 77".'}
