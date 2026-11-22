/* Pack-opening stage and admin gate. */
function openPack(type){
  if(!(D().packs[type]>0))return;
  addPack(type,-1);D().opened++;track('open',1);
  const luck=D().luck||0,pulls=[];for(let i=0;i<PACK_SIZE;i++)pulls.push(rollCard(type,luck));
  pulls.sort((a,b)=>cardRar(a)-cardRar(b));pulls.forEach(id=>{noteCard(id);if(cardRar(id)>=3)track('epic',1)});save();coinBar();
  const st=$('#stage'),toPrint=[],dec=new Array(PACK_SIZE).fill(null);st.hidden=false;st.classList.remove('shake');
  const emb=Array.from({length:28},()=>`<i style="left:${Math.random()*100}%;--dx:${(Math.random()*160-80).toFixed(0)}px;animation-duration:${(5+Math.random()*7).toFixed(1)}s;animation-delay:${(Math.random()*6).toFixed(1)}s;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px"></i>`).join('');
  st.innerHTML=`<div class="sbg"></div><div class="embers">${emb}</div><h2>${type} Pack</h2><p class="hint" id="hint">${ic('cards-playing')}Tap the pack to tear it open</p>
  <div class="tearbox" id="pk3">${foilHTML(type,'up')}${foilHTML(type,'dn')}<div class="glow"></div></div>`;
  const pk=$('#pk3');let torn=false;
  pk.onclick=()=>{if(torn)return;torn=true;pk.classList.add('tear');
    setTimeout(()=>{const f=document.createElement('div');f.className='flash';st.appendChild(f);setTimeout(()=>f.remove(),700)},420);
    setTimeout(()=>{pk.remove();deal()},900)};
  function deal(){
    $('#hint').innerHTML=ic('star-four-points')+'Tap each card to reveal it, then choose: sell, print or keep.';
    const h=document.createElement('div');h.className='hand';
    h.innerHTML=pulls.map((id,i)=>`<div class="slot" style="animation-delay:${i*.13}s"><div class="flip r${cardRar(id)}" data-i="${i}"><div class="fi"><div class="bk">${ic('cards')}</div><div class="fr">${cardHTML(id,0,'static')}</div></div></div><span class="ringfx" id="rg${i}" style="--rc:${RARS[cardRar(id)].c}"></span><div class="choice" id="ch${i}"></div></div>`).join('');
    st.appendChild(h);
    const ctl=document.createElement('div');ctl.className='acts';ctl.style='margin-top:26px;width:min(420px,100%)';
    ctl.innerHTML=`<button class="btn ghost" id="revAll" type="button">${ic('eye')}Reveal all</button><button class="btn" id="done" type="button">${ic('check')}Done</button>`;st.appendChild(ctl);
    const reveal=i=>{const f=h.querySelector(`.flip[data-i="${i}"]`);if(f.classList.contains('open'))return;f.classList.add('open');
      const id=pulls[i],ri=cardRar(id);
      if(ri>=3){const rg=$('#rg'+i);rg.classList.remove('go');void rg.offsetWidth;rg.classList.add('go')}
      if(ri===7){const a=document.createElement('div');a.className='admfx';a.innerHTML='<b>Admin<br>pull</b><small>ROOT ACCESS GRANTED</small>';document.body.appendChild(a);setTimeout(()=>a.remove(),2500);st.classList.remove('shake2');void st.offsetWidth;st.classList.add('shake2');for(let k=1;k<=3;k++)setTimeout(()=>{const rg=$('#rg'+i);rg.classList.remove('go');void rg.offsetWidth;rg.classList.add('go')},k*250)}
      if(ri>=5){st.classList.remove('shake');void st.offsetWidth;st.classList.add('shake');const fl=document.createElement('div');fl.className='flash';fl.style.background=RARS[ri].c;st.appendChild(fl);setTimeout(()=>fl.remove(),700)}
      setTimeout(()=>{if(dec[i])return;$('#ch'+i).innerHTML=`<button class="btn gold sm" data-a="sell" type="button">${ic('cash')}${fmt(sellValue(id))}</button><button class="btn ghost sm" data-a="print" type="button">${ic('printer')}Print</button><button class="btn sm" data-a="keep" type="button">${ic('bookmark-check')}Keep</button>`},550)};
    h.onclick=e=>{const b=e.target.closest('button[data-a]');
      if(b){const i=+b.parentElement.id.slice(2),id=pulls[i];if(dec[i])return;dec[i]=b.dataset.a;apply(id,b.dataset.a);
        b.parentElement.innerHTML=`<span class="done">${ic({sell:'cash',print:'printer',keep:'bookmark-check'}[dec[i]])}${{sell:'Sold',print:'Printed',keep:'Kept'}[dec[i]]}</span>`;return}
      const f=e.target.closest('.flip');if(f)reveal(+f.dataset.i)};
    $('#revAll').onclick=()=>pulls.forEach((_,i)=>setTimeout(()=>reveal(i),i*170));
    $('#done').onclick=()=>{pulls.forEach((id,i)=>{if(!dec[i]){dec[i]='keep';apply(id,'keep')}});save();st.hidden=true;st.innerHTML='';toPrint.length?printPage(toPrint):render()}}
  function apply(id,a){if(a==='sell'){D().coins+=sellValue(id);D().sold++;track('sell')}else if(a==='print'){addCard(id,1,'printed');toPrint.push(id);track('print')}else{addCard(id);track('keep')}save();coinBar()}}
/* ---- admin gate ---- */
function adminGate(){
  if(sessionStorageGet('cv.admin')==='1'){go('admin');return}
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<form class="mbox" id="gate" style="text-align:center"><div style="color:var(--red2)">${ic('shield-lock','gic')}</div><h3 style="margin-top:6px">Admin panel locked</h3><label for="gc" style="text-align:left">Access code</label><input id="gc" type="password" inputmode="numeric" maxlength="4" autocomplete="off" style="text-align:center;letter-spacing:.6em;font-size:20px"><p class="err" id="ge"></p><div class="acts"><button class="btn ghost" id="gx" type="button">Cancel</button><button class="btn" type="submit">${ic('lock-open-variant')}Unlock</button></div></form>`;
  document.body.appendChild(m);m.querySelector('#gc').focus();
  m.querySelector('#gx').onclick=()=>m.remove();
  m.querySelector('#gate').onsubmit=e=>{e.preventDefault();if(m.querySelector('#gc').value===ADMIN_CODE){sessionStorageSet('cv.admin','1');m.remove();go('admin')}else{m.querySelector('#ge').textContent='Wrong code.';m.querySelector('#gc').value=''}}}
function sessionStorageGet(k){try{return sessionStorage.getItem(k)}catch(e){return MEM[k]}}
function sessionStorageSet(k,v){try{sessionStorage.setItem(k,v)}catch(e){MEM[k]=v}}
