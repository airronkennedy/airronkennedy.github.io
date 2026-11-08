(() => {
const fmt=iso=>{try{return new Date(iso).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true})+' PT'}catch{return iso}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function rows(id,list){const tb=document.querySelector('#'+id+' tbody');tb.innerHTML=(list&&list.length)?list.map(r=>`<tr><td>${esc(r.name||'(none)')}</td><td class="n">${r.count}</td></tr>`).join(''):'<tr><td>No data yet</td></tr>'}
fetch('/stats/data.json?t='+Date.now()).then(r=>r.json()).then(d=>{
 document.getElementById('updated').textContent='Last updated: '+(d.updated?fmt(d.updated):'not yet');
 if(d.note){const n=document.getElementById('note');n.textContent=d.note;n.hidden=false}
 document.getElementById('total').textContent=d.total_visits??'—';
 const tb=document.querySelector('#names tbody');
 tb.innerHTML=(d.visitors&&d.visitors.length)?d.visitors.map(v=>`<tr><td>${esc(v.name)}</td><td>${v.time?fmt(v.time):esc(v.day||'')}${v.count>1?' · ×'+v.count:''}</td></tr>`).join(''):'<tr><td colspan="2">No names yet</td></tr>';
 rows('pages',d.pages);rows('refs',d.referrers);rows('locations',d.countries);rows('browsers',d.browsers);rows('systems',d.systems);
}).catch(()=>{document.getElementById('updated').textContent='Could not load stats data.'});
})();
