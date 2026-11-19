(() => {
const fmt=iso=>{try{return new Date(iso).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true})+' PT'}catch{return iso}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function rows(id,list){const tb=document.querySelector('#'+id+' tbody');tb.innerHTML=(list&&list.length)?list.map(r=>`<tr><td>${esc(r.name||'(none)')}</td><td class="n">${r.count}</td></tr>`).join(''):'<tr><td>No data yet</td></tr>'}
const SB='https://agdjsmtluawwmrkqazfl.supabase.co',SBK='sb_publishable_Dt4XzAh4Ac_xfhekaV7mMw_onG3Ajwx';
function showPlayers(players,live){
 const sessions=players.reduce((n,p)=>n+(p.count||1),0);
 const unique=new Set(players.map(p=>p.name)).size;
 document.getElementById('arena-counts').textContent=(players.length?`${unique} unique name${unique===1?'':'s'} · ${sessions} session${sessions===1?'':'s'}`:'No sessions yet')+(live?' · live':'');
 const atb=document.querySelector('#arena-players tbody');
 atb.innerHTML=players.length?players.map(v=>`<tr><td>${esc(v.name)}</td><td>${v.time?(v.approx?'around '+fmt(v.time).replace(/:\d\d /,' '):fmt(v.time)):esc(v.day||'')}${v.count>1?' · ×'+v.count:''}${v.source&&v.source!=='web'&&!v.approx?' · '+esc(v.source):''}</td></tr>`).join(''):'<tr><td colspan="2">No players yet</td></tr>';
}
let liveTimer=null;
function loadLivePlayers(){
 let code=null;try{code=sessionStorage.getItem('airron-stats-code')}catch{}
 if(!code)return;
 fetch(SB+'/rest/v1/rpc/arena_players_recent',{method:'POST',headers:{apikey:SBK,'Content-Type':'application/json'},body:JSON.stringify({p_code:code})})
  .then(r=>r.ok?r.json():Promise.reject(r.status))
  .then(list=>showPlayers(list.map(p=>({name:p.name,time:p.played_at,source:p.source,approx:/hour only/.test(p.source||'')})),true))
  .catch(()=>{});
 if(!liveTimer)liveTimer=setInterval(loadLivePlayers,30000);
}
window.addEventListener('stats-unlocked',loadLivePlayers);
fetch('/stats/data.json?t='+Date.now()).then(r=>r.json()).then(d=>{
 document.getElementById('updated').textContent='Last updated: '+(d.updated?fmt(d.updated):'not yet');
 if(d.note){const n=document.getElementById('note');n.textContent=d.note;n.hidden=false}
 document.getElementById('total').textContent=d.total_visits??'—';
 const tb=document.querySelector('#names tbody');
 tb.innerHTML=(d.visitors&&d.visitors.length)?d.visitors.map(v=>`<tr><td>${esc(v.name)}</td><td>${v.time?fmt(v.time):esc(v.day||'')}${v.count>1?' · ×'+v.count:''}</td></tr>`).join(''):'<tr><td colspan="2">No names yet</td></tr>';
 showPlayers(d.arena_players||[],false);
 loadLivePlayers();
 rows('pages',d.pages);rows('refs',d.referrers);rows('locations',d.countries);rows('browsers',d.browsers);rows('systems',d.systems);
}).catch(()=>{document.getElementById('updated').textContent='Could not load stats data.'});
})();
