/* Admin panel: commands, players, settings, custom cards, custom packs. */
const clean=s=>String(s==null?'':s).replace(/[<>&"'`\\]/g,'').trim();
function iconPicker(id,val){return `<div class="picker" id="${id}" data-v="${IC[val]?val:'star-circle'}">${ICON_PICK.map(n=>`<button type="button" data-n="${n}" class="${n===(IC[val]?val:'star-circle')?'on':''}" title="${n}">${ic(n)}</button>`).join('')}</div>`}
function wirePicker(id){const p=$('#'+id);p.onclick=e=>{const b=e.target.closest('button');if(!b)return;p.dataset.v=b.dataset.n;p.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}}
let admTab='cmd',cmdQ='',cmdShown=120,editCard=-1;
function vAdmin(){
  if(!(SB_ON&&IS_ADMIN)&&sessionStorageGet('cv.admin')!=='1'){go('packs');return}
  $('#view').onclick=null;
  const tabs=[['cmd','Commands','console-line'],['ply','Players','account-group'],['set','Settings','tune-variant'],['cc','Custom cards','cards-playing'],['cp','Custom packs','package-variant'],['ev','Events','lightning-bolt']];
  $('#view').innerHTML=`${sec('Admin panel','Applies to your account')}<button class="btn ghost sm" id="lock" type="button" style="margin-bottom:14px">${ic('lock')}Lock panel</button>
  <div class="tabs2 wide" id="at">${tabs.map(t=>`<button data-t="${t[0]}" type="button" class="${admTab===t[0]?'on':''}">${ic(t[2])}${t[1]}</button>`).join('')}</div><div id="ab" style="margin-top:18px"></div>`;
  $('#at').onclick=e=>{const b=e.target.closest('button');if(b){admTab=b.dataset.t;vAdmin()}};
  $('#lock').onclick=()=>{sessionStorageSet('cv.admin','0');go('packs')};
  ({cmd:aCmd,ply:aPly,set:aSet,cc:aCards,cp:aPacks,ev:aEvents})[admTab]($('#ab'))}
/* ---- commands ---- */
function aCmd(el){
  el.innerHTML=`<p class="muted">${fmt(CMDS.length)} commands. They apply to your own account.</p>
  <form id="cf" class="bar"><input id="cin" style="flex:1;min-width:220px" placeholder='Type a command, e.g. "coins 5000", "pack mythic 2", "card 777"' aria-label="Command"><button class="btn" type="submit">Run</button></form>
  <div class="log" id="log">Ready.</div>
  <div class="bar" style="margin-top:18px"><input id="cs" placeholder="Search ${fmt(CMDS.length)} commands" value="${cmdQ}" aria-label="Search commands"><span class="muted" id="cc"></span></div><div class="cmds" id="cl"></div>`;
  const log=t=>{$('#log').textContent=t;coinBar()};
  const list=()=>{const q=cmdQ.trim().toLowerCase(),f=q?CMDS.filter(c=>(c.name+' '+c.desc).toLowerCase().includes(q)):CMDS;
    $('#cc').textContent=fmt(f.length)+' shown';
    $('#cl').innerHTML=f.slice(0,cmdShown).map(c=>`<div class="cmd"><div style="min-width:0"><code>${c.name}</code><div class="muted tiny">${c.desc}</div></div><button class="btn" data-n="${c.name}" type="button">Run</button></div>`).join('')+(f.length>cmdShown?'<button class="btn ghost" id="cm" type="button">Show more</button>':'');
    const cm=$('#cm');if(cm)cm.onclick=()=>{cmdShown+=240;list()}};
  list();
  $('#cs').oninput=e=>{cmdQ=e.target.value;cmdShown=120;list()};
  $('#cl').onclick=e=>{const b=e.target.closest('button[data-n]');if(b)log(runCommand(b.dataset.n))};
  $('#cf').onsubmit=e=>{e.preventDefault();log(runCommand($('#cin').value));$('#cin').value=''}}
/* ---- players ---- */
function aPly(el){
  if(SB_ON)return aPlyOnline(el);
  const us=users(),keys=Object.keys(us);
  const packOpts=PK.map(p=>`<option>${p}</option>`).join('');
  el.innerHTML=`<div class="tbw"><table class="pl"><thead><tr><th>Player</th><th>Coins</th><th>Cards</th><th>Unique</th><th>Packs opened</th></tr></thead><tbody>${keys.map(k=>{const d=us[k].data;return `<tr><td>${us[k].name}${k===ME.key?' (you)':''}</td><td>${fmt(d.coins)}</td><td>${fmt(totalCards(d.inv))}</td><td>${fmt(Object.keys(d.inv).length)}</td><td>${fmt(d.opened)}</td></tr>`}).join('')}</tbody></table></div>
  <div class="form"><div><label for="pp">Player</label><select id="pp">${keys.map(k=>`<option value="${k}" ${k===ME.key?'selected':''}>${us[k].name}</option>`).join('')}</select></div>
  <div><label for="pn">Amount</label><input id="pn" type="number" min="1" value="1000"></div>
  <div><label for="pk">Pack</label><select id="pk">${packOpts}</select></div>
  <div><label for="pc">Card number</label><input id="pc" type="number" min="1" max="${TOTALC()}" value="1"></div></div>
  <div class="acts" style="flex-wrap:wrap"><button class="btn" data-a="coins" type="button">Give coins</button><button class="btn" data-a="take" type="button">Take coins</button><button class="btn" data-a="pack" type="button">Give packs</button><button class="btn" data-a="card" type="button">Give card copies</button><button class="btn ghost" data-a="reset" type="button">Reset account</button><button class="btn ghost" data-a="del" type="button">Delete account</button></div>
  <div class="log" id="log">Choose a player and an action.</div>`;
  el.querySelector('.acts').onclick=e=>{const b=e.target.closest('button');if(!b)return;
    const k=$('#pp').value,u=us[k],n=Math.max(1,parseInt($('#pn').value)||1),a=b.dataset.a,L=t=>{$('#log').textContent=t};
    if(!u)return;
    const add=(m,id,q)=>{m[id]=(m[id]||0)+q};
    if(a==='coins'){u.data.coins+=n;L('Gave '+fmt(n)+' coins to '+u.name)}
    else if(a==='take'){u.data.coins=Math.max(0,u.data.coins-n);L('Took '+fmt(n)+' coins from '+u.name)}
    else if(a==='pack'){const p=$('#pk').value;add(u.data.packs,p,n);L('Gave '+n+' '+p+' pack(s) to '+u.name)}
    else if(a==='card'){const id=(parseInt($('#pc').value)||1)-1;if(id<0||id>=TOTALC())return L('Card numbers run 1 to '+TOTALC());add(u.data.inv,id,n);L('Gave '+n+' x '+cardName(id)+' to '+u.name)}
    else if(a==='reset'){u.data=newData();L('Reset '+u.name)}
    else if(a==='del'){if(k===ME.key)return L('You cannot delete the account you are signed in to.');delete us[k];L('Deleted '+u.name)}
    lsSet(DB_KEY,us);coinBar();if(a==='del')aPly(el)}}
/* ---- settings ---- */
function aSet(el){
  const s=CUS.set;
  el.innerHTML=`<p class="muted">These settings apply to every account in this browser.</p><form id="sf" class="form">
  <div><label for="sl">Luck boost (0 to 0.5)</label><input id="sl" type="number" step="0.05" min="0" max="0.5" value="${s.luck}"></div>
  <div><label for="ss">Sell price multiplier</label><input id="ss" type="number" step="0.1" min="0" max="100" value="${s.sellMult}"></div>
  <div><label for="sp">Pack price multiplier</label><input id="sp" type="number" step="0.1" min="0" max="100" value="${s.priceMult}"></div>
  <div><label for="sd">Daily reward multiplier</label><input id="sd" type="number" step="0.1" min="0" max="100" value="${s.dailyMult}"></div>
  <div class="full acts"><button class="btn" type="submit" style="max-width:200px">Save settings</button><button class="btn ghost" id="sr" type="button" style="max-width:200px">Reset to defaults</button></div></form>`;
  const num=(id,d,lo,hi)=>{const v=parseFloat($(id).value);return isNaN(v)?d:Math.min(hi,Math.max(lo,v))};
  $('#sf').onsubmit=e=>{e.preventDefault();CUS.set={luck:num('#sl',0,0,.5),sellMult:num('#ss',1,0,100),priceMult:num('#sp',1,0,100),dailyMult:num('#sd',1,0,100)};saveCustom();toast('Settings saved')};
  $('#sr').onclick=()=>{CUS.set={luck:0,sellMult:1,priceMult:1,dailyMult:1};saveCustom();aSet(el);toast('Defaults restored')}}
/* ---- custom cards ---- */
function aCards(el){
  const c=editCard>=0?CUS.cards[editCard]:null,live=CUS.cards.map((x,i)=>[x,i]).filter(p=>p[0]&&!p[0].del);
  el.innerHTML=`<h3>${c?'Edit custom card':'New custom card'}</h3><form id="cf2" class="form">
  <div><label for="cn">Name</label><input id="cn" maxlength="24" required value="${c?c.n:''}"></div>
  <div class="full"><label>Icon</label>${iconPicker('ci',c?c.i:'star-circle')}</div>
  <div><label for="cr">Rarity</label><select id="cr">${RARS.map((r,i)=>`<option value="${i}" ${c&&c.r===i?'selected':''}>${r.k}</option>`).join('')}</select></div>
  <div><label for="cs">Sell price (blank = rarity default)</label><input id="cs" type="number" min="0" value="${c&&c.s!==null&&c.s!==undefined&&c.s!==''?c.s:''}"></div>
  <div><label for="cd">Where it drops</label><select id="cd"><option value="0">Only in packs that list it</option><option value="1" ${c&&c.inPool?'selected':''}>In every pack (joins the pool)</option></select></div>
  <div style="align-self:end"><button class="btn" type="submit" style="width:100%">${c?'Save card':'Create card'}</button></div></form>
  <h3 style="margin-bottom:12px">Custom cards (${live.length})</h3>`+
  (live.length?`<div class="cards">${live.map(([x,i])=>`<div class="crow">${cardHTML(N_CARDS+i)}<div class="acts"><button class="btn ghost" data-g="${i}" type="button">Give</button><button class="btn ghost" data-e="${i}" type="button">Edit</button><button class="btn ghost" data-d="${i}" type="button">Delete</button></div></div>`).join('')}</div>`:'<p class="muted">No custom cards yet.</p>');
  wirePicker('ci');
  $('#cf2').onsubmit=e=>{e.preventDefault();
    const s=$('#cs').value,o={n:clean($('#cn').value).slice(0,24)||'Custom Card',i:$('#ci').dataset.v,r:+$('#cr').value,s:s===''?null:Math.max(0,parseInt(s)||0),inPool:$('#cd').value==='1'};
    if(editCard>=0)CUS.cards[editCard]=o;else CUS.cards.push(o);
    editCard=-1;saveCustom();toast('Card saved');aCards(el)};
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.g!==undefined){addCard(N_CARDS+ +b.dataset.g);save();toast('Added to your inventory')}
    if(b.dataset.e!==undefined){editCard=+b.dataset.e;aCards(el);window.scrollTo(0,0)}
    if(b.dataset.d!==undefined){const i=+b.dataset.d;CUS.cards[i]={n:'Removed Card',i:'close',r:0,s:0,del:true,inPool:false};
      for(const p of Object.values(CUS.packs))p.cards=(p.cards||[]).filter(id=>id!==N_CARDS+i);
      saveCustom();toast('Card deleted');aCards(el)}}}
/* ---- custom packs ---- */
function aPacks(el){
  const live=CUS.cards.map((x,i)=>[x,i]).filter(p=>p[0]&&!p[0].del),base=PACKS.Crimson.w.concat([0]);
  el.innerHTML=`<h3>New custom pack</h3><p class="muted tiny">Saving a name that already exists replaces that custom pack. Pick featured cards to make the pack draw only from them, or leave the list empty to use the rarity chances.</p>
  <form id="pf" class="form">
  <div><label for="pn1">Pack name</label><input id="pn1" maxlength="14" required placeholder="e.g. Haunted"></div>
  <div><label for="pr">Price (coins)</label><input id="pr" type="number" min="0" value="500"></div>
  <div class="full"><label>Pack icon</label>${iconPicker('pi','package-variant')}</div>
  <div><label for="pc1">Color 1</label><input id="pc1" type="color" value="#c4162c"></div>
  <div><label for="pc2">Color 2</label><input id="pc2" type="color" value="#2a0b10"></div>
  <div class="full muted tiny" style="margin-top:6px">Rarity chances (relative weights)</div>
  ${RARS.map((r,i)=>`<div><label for="w${i}">${r.k}</label><input id="w${i}" type="number" min="0" max="1000" value="${base[i]}"></div>`).join('')}
  <div class="full"><label for="pf2">Featured cards (hold Ctrl or Cmd to pick several)</label><select id="pf2" multiple>${live.map(([x,i])=>`<option value="${N_CARDS+i}">${x.n} (${RARS[x.r].k})</option>`).join('')}</select></div>
  <div class="full"><button class="btn" type="submit" style="max-width:220px">Create pack</button></div></form>
  <h3 style="margin-bottom:12px">Custom packs (${Object.keys(CUS.packs).length})</h3><div class="grid" id="pl2"></div>`;
  $('#pl2').innerHTML=Object.entries(CUS.packs).map(([k,p])=>`<div class="pk" style="--c1:${p.c[0]}">${foilHTML(k,'sm')}<div class="muted tiny">${fmt(p.price)} coins${p.cards&&p.cards.length?' · '+p.cards.length+' featured cards':''}</div><div class="acts"><button class="btn ghost" data-g="${k}" type="button">Give me 1</button><button class="btn ghost" data-d="${k}" type="button">Delete</button></div></div>`).join('')||'<p class="muted">No custom packs yet.</p>';
  wirePicker('pi');
  $('#pf').onsubmit=e=>{e.preventDefault();
    const name=clean($('#pn1').value).replace(/[^A-Za-z0-9 ]/g,'').slice(0,14).trim();
    if(name.length<2)return toast('Use 2 to 14 letters or numbers for the name.');
    if(CORE_PACKS.some(p=>p.toLowerCase()===name.toLowerCase()))return toast('That name belongs to a built-in pack.');
    const w=RARS.map((r,i)=>Math.max(0,parseInt($('#w'+i).value)||0)),cards=[...$('#pf2').selectedOptions].map(o=>+o.value);
    if(!cards.length&&!w.some(x=>x>0))return toast('Give at least one rarity a chance above 0, or pick featured cards.');
    const old=Object.keys(CUS.packs).find(k=>k.toLowerCase()===name.toLowerCase());if(old)delete CUS.packs[old];
    CUS.packs[name]={price:Math.max(0,parseInt($('#pr').value)||0),icon:$('#pi').dataset.v,c:[$('#pc1').value,$('#pc2').value],w,cards};
    saveCustom();toast('Pack created');aPacks(el)};
  $('#pl2').onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.g){addPack(b.dataset.g,1);save();toast('Added a '+b.dataset.g+' pack')}
    if(b.dataset.d){delete CUS.packs[b.dataset.d];saveCustom();toast('Pack deleted');aPacks(el)}}}
boot();
