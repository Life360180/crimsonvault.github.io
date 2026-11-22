/* Online admin tools: the Players tab talks to the shared database through each player's inbox. */
function aPlyOnline(el){
  el.innerHTML='<p class="muted">Loading players...</p>';
  SB.listProfiles('val').then(rows=>{
    const packOpts=PK.map(p=>`<option>${p}</option>`).join('');
    el.innerHTML=`<p class="muted">Actions are delivered to the player and applied the next time they are online (instantly if they are playing now).</p>
    <div class="tbw"><table class="pl"><thead><tr><th>Player</th><th>Collection value</th><th>Unique</th><th>Packs opened</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}${r.id===ME.key?' (you)':''}</td><td>${fmt(r.val||0)}</td><td>${fmt(r.uniq||0)}</td><td>${fmt(r.opened||0)}</td></tr>`).join('')}</tbody></table></div>
    <div class="form"><div><label for="pp">Player</label><select id="pp">${rows.map(r=>`<option value="${r.id}" ${r.id===ME.key?'selected':''}>${esc(r.name)}</option>`).join('')}</select></div>
    <div><label for="pn">Amount</label><input id="pn" type="number" min="1" value="1000"></div>
    <div><label for="pk">Pack</label><select id="pk">${packOpts}</select></div>
    <div><label for="pc">Card number</label><input id="pc" type="number" min="1" max="${TOTALC()}" value="1"></div></div>
    <div class="acts" style="flex-wrap:wrap"><button class="btn" data-a="coins" type="button">Give coins</button><button class="btn" data-a="take" type="button">Take coins</button><button class="btn" data-a="pack" type="button">Give packs</button><button class="btn" data-a="card" type="button">Give card copies</button><button class="btn ghost" data-a="reset" type="button">Reset account</button></div>
    <div class="log" id="log">Choose a player and an action. To delete an account, use the Supabase dashboard.</div>`;
    el.querySelector('.acts').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
      const uid=$('#pp').value,name=$('#pp').selectedOptions[0].textContent,n=Math.max(1,parseInt($('#pn').value)||1),a=b.dataset.a,L=t=>{$('#log').textContent=t};let msg;
      if(a==='coins')msg={t:'coins',n};else if(a==='take')msg={t:'coins',n:-n};
      else if(a==='pack')msg={t:'pack',p:$('#pk').value,n};
      else if(a==='card'){const id=(parseInt($('#pc').value)||1)-1;if(id<0||id>=TOTALC())return L('Card numbers run 1 to '+TOTALC());msg={t:'card',id,n}}
      else if(a==='reset')msg={t:'reset'};
      const err=await SB.sendInbox(uid,msg);L(err?'Failed: '+err:'Sent to '+name)}
  }).catch(()=>{el.innerHTML='<p class="muted">Could not load players.</p>'})}
