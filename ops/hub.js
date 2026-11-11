(() => {
'use strict';
const nameEl=document.getElementById('building-name');
const detailEl=document.getElementById('building-detail');
const fmt=iso=>{try{return new Date(iso).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true})+' PT'}catch{return ''}};
function render(){
 if(!window.WorkStatus){nameEl.textContent='Building status could not load.';nameEl.classList.add('is-empty');detailEl.textContent='';return}
 const status=WorkStatus.read();
 const building=(status.building||'').trim();
 if(building){
  nameEl.textContent=building;
  nameEl.classList.remove('is-empty');
  const bits=[];
  if((status.date||'').trim())bits.push('Timesheet date: '+status.date.trim());
  const when=status.updated?fmt(status.updated):'';
  if(when)bits.push('Updated '+when);
  bits.push('From the latest timesheet on this device.');
  detailEl.textContent=bits.join(' · ');
 }else{
  nameEl.textContent='No building recorded yet.';
  nameEl.classList.add('is-empty');
  detailEl.textContent='Enter a site on the team timesheet and it will show up here. Status is stored on this device only.';
 }
}
render();
window.addEventListener('storage',e=>{if(!window.WorkStatus)return;if(e.key===WorkStatus.KEY||e.key===WorkStatus.TRACKER_KEY)render()});
window.addEventListener('workplanet-unlocked',render);
})();
