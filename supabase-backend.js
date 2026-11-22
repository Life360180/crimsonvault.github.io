/* Online mode: Supabase auth, saves, shared events, leaderboard, admin inbox.
   Only active when supabase-config.js defines window.SUPABASE_CONFIG = {url, anonKey}. */
(function(){
  const CFG=window.SUPABASE_CONFIG;
  if(!CFG||!window.__sbResolve)return;
  const CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  let CL=null,uid=null,saveT=null,dirty=false,saving=null,chan=null,poll=null,cfgSeen={};
  const emailOf=n=>n.trim().toLowerCase().replace(/ /g,'_')+'@crimsonvault.game';
  const NAME_RE=/^[a-z0-9_ ]{2,20}$/;
  const loadLib=()=>new Promise((ok,no)=>{if(window.supabase)return ok();const s=document.createElement('script');s.src=CDN;s.onload=ok;s.onerror=()=>no(new Error('Could not load Supabase'));document.head.appendChild(s)});
  /* ---- applying shared config and gifts ---- */
  function gift(k,n){const d=D();
    if(k==='gift'){addPack('Obsidian',n);return n+' Obsidian pack(s)'}
    if(k==='shower'){d.coins+=1000*n;return fmt(1000*n)+' coins'}
    if(k==='hacker'){addPack('Hacker',n);return n+' Hacker pack(s)'}
    if(k==='admincard'){for(let i=0;i<n;i++)addCard(ADMIN_IDS[Math.floor(Math.random()*10)]);noteCard(ADMIN_IDS[0]);return n+' Admin card(s)'}
    return ''}
  function applyDrops(v,silent){if(!ME)return;const d=D();d.drops=d.drops||{};let got=[];
    for(const [k,n] of Object.entries(v||{})){const seen=d.drops[k]||0;if(n>seen){if(!silent){const t=gift(k,n-seen);if(t)got.push(t)}d.drops[k]=n}}
    if(got.length||silent){save()}
    if(got.length){toast('Gift from the admins: '+got.join(', '),'gift-open');coinBar();if(view==='packs'||view==='inv')render()}}
  function applyConfig(key,v){
    if(!v)return;
    if(key==='events'){EVS=v.active?v:{active:{},banner:''};evTick()}
    else if(key==='custom'){CUS.cards=v.cards||[];CUS.packs=v.packs||{};CUS.set=Object.assign({luck:0,sellMult:1,priceMult:1,dailyMult:1},v.set||{});applyCustom();if(ME&&(view==='packs'||view==='inv'))render()}
    else if(key==='drops')applyDrops(v,false)}
  async function loadConfig(){const {data}=await CL.from('config').select('key,value');const m={};(data||[]).forEach(r=>m[r.key]=r.value);return m}
  /* ---- admin inbox: player-management actions land here and are applied by the player's own client ---- */
  function applyMsg(m){const d=D();
    if(m.t==='coins')d.coins=Math.max(0,d.coins+(+m.n||0));
    else if(m.t==='pack'&&PACKS[m.p])addPack(m.p,+m.n||1);
    else if(m.t==='card'&&m.id>=0&&m.id<TOTALC())addCard(m.id,+m.n||1);
    else if(m.t==='reset'){const dr=d.drops;ME.rec.data=newData();ME.rec.data.drops=dr}}
  async function drainInbox(){const {data}=await CL.from('inbox').select('id,msg').eq('user_id',uid).order('id');
    if(!data||!data.length)return;data.forEach(r=>applyMsg(r.msg));
    await CL.from('inbox').delete().in('id',data.map(r=>r.id));save();coinBar();toast('An admin updated your account','shield-star');if(view)render()}
  /* ---- session ---- */
  async function enter(name,isNew){
    const {data:ad}=await CL.from('admins').select('id').eq('id',uid).maybeSingle();IS_ADMIN=!!ad;
    let {data:row}=await CL.from('player_data').select('data').eq('id',uid).maybeSingle();
    const cfg=await loadConfig();
    let data=row&&row.data?row.data:newData();ensure(data);
    ME={key:uid,rec:{name,data}};
    if(!row||isNew){data.drops=Object.assign({},cfg.drops||{}); /* new players do not get old drops */
      await CL.from('player_data').upsert({id:uid,data});await pushScore()}
    applyConfig('events',cfg.events);applyConfig('custom',cfg.custom);
    cfgSeen=cfg;if(row&&!isNew)applyDrops(cfg.drops,false);
    subscribe();await drainInbox().catch(()=>{});
    clearInterval(poll);poll=setInterval(async()=>{try{const c=await loadConfig();for(const k of ['events','custom','drops'])if(JSON.stringify(c[k])!==JSON.stringify(cfgSeen[k]))applyConfig(k,c[k]);cfgSeen=c;await drainInbox()}catch(e){}},20000)}
  function subscribe(){unsub();
    chan=CL.channel('cv-'+uid)
      .on('postgres_changes',{event:'*',schema:'public',table:'config'},p=>{const r=p.new;if(r&&r.key){cfgSeen[r.key]=r.value;applyConfig(r.key,r.value)}})
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'inbox',filter:'user_id=eq.'+uid},()=>drainInbox().catch(()=>{}))
      .subscribe()}
  function unsub(){if(chan){try{CL.removeChannel(chan)}catch(e){}chan=null}}
  async function pushScore(){const s=scoreOf(D());await CL.from('profiles').update({val:s.val,uniq:s.uniq,opened:s.opened,best:s.best,bid:s.bid,updated_at:new Date().toISOString()}).eq('id',uid)}
  async function flush(){clearTimeout(saveT);if(!dirty||!ME||!uid)return;dirty=false;
    try{await CL.from('player_data').upsert({id:uid,data:D(),updated_at:new Date().toISOString()});await pushScore()}catch(e){dirty=true}}
  /* ---- globals used by core.js and ui.js ---- */
  window.sbQueueSave=()=>{dirty=true;clearTimeout(saveT);saveT=setTimeout(flush,1200)};
  window.sbFlush=flush;
  window.sbLeave=()=>{unsub();clearInterval(poll);clearTimeout(saveT);dirty=false;uid=null;CL.auth.signOut().catch(()=>{})};
  window.sbSignup=async(name,pw)=>{const key=name.trim().toLowerCase();
    if(!NAME_RE.test(key))return 'Use 2-20 letters, numbers or underscores.';
    if(pw.length<6)return 'Password must be at least 6 characters.';
    const {data,error}=await CL.auth.signUp({email:emailOf(name),password:pw});
    if(error)return /registered|exists/i.test(error.message)?'That username is taken.':error.message;
    if(!data.session)return 'Sign-ups need "Confirm email" switched off in Supabase. See SETUP.md.';
    uid=data.user.id;
    const {error:pe}=await CL.from('profiles').insert({id:uid,name:name.trim()});
    if(pe){await CL.auth.signOut();uid=null;return /duplicate|unique/i.test(pe.message)?'That username is taken.':pe.message}
    await enter(name.trim(),true);return ''};
  window.sbLogin=async(name,pw)=>{
    const {data,error}=await CL.auth.signInWithPassword({email:emailOf(name),password:pw});
    if(error)return 'Wrong username or password.';
    uid=data.user.id;const {data:p}=await CL.from('profiles').select('name').eq('id',uid).maybeSingle();
    await enter(p?p.name:name.trim(),!p);return ''};
  window.sbResume=async()=>{const {data}=await CL.auth.getSession();if(!data||!data.session)return false;
    uid=data.session.user.id;const {data:p}=await CL.from('profiles').select('name').eq('id',uid).maybeSingle();
    if(!p){uid=null;return false}await enter(p.name,false);return true};
  addEventListener('visibilitychange',()=>{if(document.hidden)flush()});addEventListener('pagehide',()=>{flush()});
  /* ---- API object handed to the app as SB ---- */
  const API={
    async pushConfig(key,value){await CL.from('config').upsert({key,value,updated_at:new Date().toISOString()})},
    async bumpDrop(k){const {error}=await CL.rpc('bump_drop',{k});if(error)toast('Could not send: '+error.message,'alert-circle-outline')},
    async listProfiles(col){const {data,error}=await CL.from('profiles').select('id,name,val,uniq,opened,best,bid').order(col,{ascending:false}).limit(100);if(error)throw error;return data||[]},
    async sendInbox(userId,msg){const {error}=await CL.from('inbox').insert({user_id:userId,msg});return error?error.message:''}};
  loadLib().then(()=>{CL=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});window.__sbResolve(API)},e=>{window.__sbResolve(null)});
})();
