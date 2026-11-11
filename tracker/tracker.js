(() => {
'use strict';
const storageKey='airron-team-tracker-v1',archiveKey='airron-team-tracker-archive-v1',draftsKey='airron-team-tracker-drafts-v1';
const app=document.getElementById('tracker-app'),status=document.getElementById('save-status');
const inventory=window.TRACKER_SUPPLIES||{},buildings=Object.keys(inventory);
const tz='America/Los_Angeles';
let active='timesheet',storageOK=true,saved={},archive={},drafts={},currentDay='';
try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={}}catch{storageOK=false}
try{archive=JSON.parse(localStorage.getItem(archiveKey)||'{}');if(!archive||typeof archive!=='object'||Array.isArray(archive))archive={}}catch{archive={}}
try{drafts=JSON.parse(localStorage.getItem(draftsKey)||'{}');if(!drafts||typeof drafts!=='object'||Array.isArray(drafts))drafts={}}catch{drafts={}}
const makeOption=(value,text)=>new Option(text,value);
const siteInput=document.getElementById('supply-site'),site=document.createElement('select');
site.id='supply-site';site.setAttribute('aria-label','Supply request site');
site.add(makeOption('','Choose site…'));buildings.forEach(b=>site.add(makeOption(b,b)));site.add(makeOption('__other','Other / type site…'));
const siteWrap=document.createElement('span');siteWrap.className='site-field';
siteInput.replaceWith(siteWrap);siteWrap.append(site);
const siteOther=document.createElement('input');siteOther.id='supply-site-other';siteOther.setAttribute('aria-label','Other site name');siteOther.placeholder='Type site';siteOther.hidden=true;siteWrap.append(siteOther);
const sitePrint=document.createElement('span');sitePrint.className='site-print';siteWrap.append(sitePrint);
const note=document.createElement('p');note.className='site-note';note.hidden=true;note.textContent='OCB: Currently only providing trash liners. The complete photographed list is retained for reference.';document.querySelector('.control-deck').append(note);
const supplyRows=[];
for(let i=0;i<18;i++){
 const free=document.getElementById(`supply-${i}`),row=document.createElement('div');row.className='supply-row';
 free.replaceWith(row);free.classList.remove('ruled');free.placeholder='Type item and unit';free.hidden=true;
 const choice=document.createElement('select');choice.id=`supply-choice-${i}`;choice.setAttribute('aria-label',`Supply needed line ${i+1}`);
 const slot=document.createElement('span');slot.className='item-slot';slot.append(choice,free);
 const qty=document.createElement('input');qty.id=`supply-qty-${i}`;qty.className='supply-qty';qty.placeholder='Qty';qty.setAttribute('aria-label',`Quantity for supply line ${i+1}`);qty.inputMode='decimal';qty.maxLength=12;
 const print=document.createElement('span');print.className='supply-print';row.append(slot,qty,print);
 supplyRows.push({row,choice,free,qty,print});
}
const list=document.createElement('datalist');list.id='building-options';buildings.forEach(b=>list.append(makeOption(b,b)));app.append(list);
for(let i=0;i<9;i++)document.getElementById(`site-${i}`).setAttribute('list',list.id);
const fields=[...app.querySelectorAll('.paper input,.paper select')];
const timesheetFields=[...document.getElementById('timesheet').querySelectorAll('input,select')].filter(el=>el.id);
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
function todayYmd(){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=t=>parts.find(p=>p.type===t).value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
function formatLong(ymd){
 const [y,m,d]=ymd.split('-').map(Number);
 if(!y||!m||!d)return ymd;
 return new Date(Date.UTC(y,m-1,d,12)).toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'});
}
function validYmd(y,m,d){
 if(y<100)y+=2000;
 if(!y||m<1||m>12||d<1||d>31)return null;
 const dt=new Date(Date.UTC(y,m-1,d));
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return null;
 return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function parseDate(raw){
 const s=String(raw||'').trim();
 if(!s)return null;
 let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(m)return validYmd(+m[1],+m[2],+m[3]);
 m=s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
 if(m)return validYmd(+m[3],+m[1],+m[2]);
 m=s.match(/^(?:[A-Za-z]+,?\s+)?([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
 if(m){const month=MONTHS[m[1].toLowerCase()];if(month)return validYmd(+m[3],month,+m[2])}
 return null;
}
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{storageOK=false;return false}}
function timesheetSnapshot(){return Object.fromEntries(timesheetFields.map(el=>[el.id,el.value]))}
function timesheetHasContent(data){return Object.entries(data||{}).some(([k,v])=>k!=='sheet-date'&&String(v||'').trim())}
function applyTimesheet(data){
 timesheetFields.forEach(el=>{el.value=data&&typeof data[el.id]==='string'?data[el.id]:''});
}
function clearTimesheetFields(){timesheetFields.forEach(el=>{el.value=''})}
function filingDate(){return parseDate(document.getElementById('sheet-date').value)||todayYmd()}
// Migrate pre-dropdown free-text sheets without losing typed content.
if(saved['supply-site']&&!buildings.includes(saved['supply-site'])&&saved['supply-site']!=='__other'){
 saved['supply-site-other']=saved['supply-site'];saved['supply-site']='__other';
}
site.value=typeof saved['supply-site']==='string'?saved['supply-site']:'';
function populateChoices(preserve){
 const items=inventory[site.value]||[];
 supplyRows.forEach(({choice,free})=>{
  const previous=choice.value,previousLabel=choice.selectedOptions[0]?.textContent||previous;
  choice.replaceChildren(makeOption('','Select item…'));
  items.forEach(({item,unit})=>choice.add(makeOption(item,`${item} (${unit})`)));
  choice.add(makeOption('__other','Other / type item…'));
  if(preserve&&previous){
   if(previous==='__other'||items.some(x=>x.item===previous))choice.value=previous;
   else{free.value=previousLabel;choice.value='__other'}
  }
 });
}
populateChoices(false);
fields.forEach(el=>{if(typeof saved[el.id]==='string')el.value=saved[el.id]});
const today=todayYmd();
const workingDate=parseDate(document.getElementById('sheet-date').value);
if(workingDate&&workingDate!==today){
 const snap=timesheetSnapshot();
 if(timesheetHasContent(snap)){
  drafts[workingDate]=snap;
  persist(draftsKey,drafts);
  // Rescue an unfiled previous day so starting today does not drop it.
  if(!archive[workingDate]){archive[workingDate]=snap;persist(archiveKey,archive)}
 }
 if(archive[today])applyTimesheet(archive[today]);
 else if(drafts[today])applyTimesheet(drafts[today]);
 else{clearTimesheetFields();document.getElementById('sheet-date').value=formatLong(today)}
}else if(!workingDate){
 if(archive[today])applyTimesheet(archive[today]);
 else document.getElementById('sheet-date').value=formatLong(today);
}
currentDay=parseDate(document.getElementById('sheet-date').value)||today;
const supplyDate=document.getElementById('supply-date');
if(supplyDate&&!String(supplyDate.value||'').trim())supplyDate.value=formatLong(today);
supplyRows.forEach(({choice,free})=>{
 if(!choice.value&&free.value)choice.value='__other';
 if(!choice.value&&saved[choice.id]){free.value=saved[choice.id];choice.value='__other'}
});
function renderLines(){
 siteOther.hidden=site.value!=='__other';
 sitePrint.textContent=site.value==='__other'?siteOther.value:site.value;
 note.hidden=active!=='supply'||site.value!=='OCB';
 supplyRows.forEach(({row,choice,free,qty,print})=>{
  const other=choice.value==='__other';free.hidden=!other;row.classList.toggle('custom-item',other);
  const entry=(inventory[site.value]||[]).find(x=>x.item===choice.value);
  const item=other?free.value:(entry?`${entry.item} (${entry.unit})`:'');
  print.textContent=[item,qty.value?`Qty: ${qty.value}`:''].filter(Boolean).join(' — ');
 });
}
function snapshot(){return Object.fromEntries(fields.map(el=>[el.id,el.value]))}
function maybeSyncStatus(){
 if(!window.WorkStatus)return;
 if(filingDate()!==todayYmd())return;
 const data=snapshot();
 if(String(WorkStatus.deriveFromTracker(data).building||'').trim())WorkStatus.syncFromTracker(data);
}
function save(message){
 try{
  const data=snapshot();
  localStorage.setItem(storageKey,JSON.stringify(data));
  maybeSyncStatus();
  status.textContent=message||'Saved on this device only — not shared with your team.';
 }catch{storageOK=false;status.textContent='Saving is unavailable in this browser. Print a copy before leaving.'}
}
if(!storageOK)status.textContent='Saving is unavailable in this browser. Print a copy before leaving.';
function refreshDayList(){
 const sel=document.getElementById('filed-days');
 if(!sel)return;
 const todayKey=todayYmd();
 const current=parseDate(document.getElementById('sheet-date').value)||currentDay||todayKey;
 const days=Object.keys(archive).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort().reverse();
 sel.replaceChildren();
 sel.add(makeOption(todayKey,`${formatLong(todayKey)}${archive[todayKey]?' (today, filed)':' (today)'}`));
 days.forEach(ymd=>{if(ymd!==todayKey)sel.add(makeOption(ymd,formatLong(ymd)))});
 if(![...sel.options].some(o=>o.value===current))sel.add(makeOption(current,`${formatLong(current)} (open)`),sel.options[1]||null);
 sel.value=current;
}
function openFiledDay(ymd,stash=true){
 if(!ymd)return;
 if(stash){
  const from=parseDate(document.getElementById('sheet-date').value)||currentDay;
  const snap=timesheetSnapshot();
  if(from&&(timesheetHasContent(snap)||parseDate(snap['sheet-date']))){drafts[from]=snap;persist(draftsKey,drafts)}
 }
 currentDay=ymd;
 if(archive[ymd])applyTimesheet(archive[ymd]);
 else if(drafts[ymd])applyTimesheet(drafts[ymd]);
 else{clearTimesheetFields();document.getElementById('sheet-date').value=formatLong(ymd)}
 if(!document.getElementById('sheet-date').value)document.getElementById('sheet-date').value=formatLong(ymd);
 save();
 refreshDayList();
}
function fileSheet(){
 const ymd=filingDate();
 const dateEl=document.getElementById('sheet-date');
 if(!parseDate(dateEl.value))dateEl.value=formatLong(ymd);
 const data=timesheetSnapshot();
 archive[ymd]=data;
 drafts[ymd]=data;
 currentDay=ymd;
 if(!persist(archiveKey,archive)||!persist(draftsKey,drafts)){
  status.textContent='Saving is unavailable in this browser. Print a copy before leaving.';
  return;
 }
 if(ymd===todayYmd()&&window.WorkStatus)WorkStatus.syncFromTracker(snapshot());
 save(`Filed for ${formatLong(ymd)} on this device only — not shared with your team.`);
 refreshDayList();
}
const tabs=[...document.querySelectorAll('[data-sheet]')];
const pageStyle=document.createElement('style');document.head.append(pageStyle);
function syncCopy(){
 document.querySelector('.print-copy')?.remove();
 document.querySelectorAll('.print-copy').forEach(c=>c.remove());
 if(document.body.classList.contains('two-copies'))for(let n=0;n<3;n++){
  const original=document.getElementById('supply'),copy=original.cloneNode(true);copy.removeAttribute('id');copy.classList.add('print-copy');copy.setAttribute('aria-hidden','true');
  const originals=original.querySelectorAll('input,select');
  copy.querySelectorAll('input,select').forEach((el,i)=>{el.value=originals[i].value;el.removeAttribute('id');el.tabIndex=-1;if(el.tagName==='INPUT')el.readOnly=true;else el.disabled=true});
  document.querySelector('.supply-layout').append(copy);
 }
}
function applyPrintSize(){renderLines();const two=active==='supply'&&document.getElementById('two-up').checked;document.body.classList.toggle('two-copies',two);pageStyle.textContent=two?'@page{size:letter portrait;margin:.35in}':'@page{size:Letter portrait;margin:0}';syncCopy()}
fields.forEach(el=>{
 const changed=()=>{if(el===site)populateChoices(true);renderLines();save();syncCopy();if(el.id==='sheet-date')refreshDayList()};
 el.addEventListener('input',changed);
 // Some browsers dispatch only change for native select pickers.
 if(el.tagName==='SELECT')el.addEventListener('change',changed);
});
function select(sheet){active=sheet;tabs.forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.sheet===sheet));b.tabIndex=b.dataset.sheet===sheet?0:-1});document.getElementById('timesheet-panel').hidden=sheet!=='timesheet';document.getElementById('supply-panel').hidden=sheet!=='supply';document.querySelector('.two-up').hidden=sheet!=='supply';applyPrintSize()}
tabs.forEach((b,i)=>{b.onclick=()=>select(b.dataset.sheet);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;tabs[next].focus();select(tabs[next].dataset.sheet)}}});
document.getElementById('two-up').onchange=applyPrintSize;
document.getElementById('print').onclick=()=>{document.activeElement?.blur();applyPrintSize();window.print()};
document.getElementById('zoom').onclick=()=>{const zoomed=document.body.classList.toggle('paper-enlarged');const button=document.getElementById('zoom');button.setAttribute('aria-pressed',String(zoomed));button.textContent=zoomed?'Fit paper':'Enlarge paper'};
window.addEventListener('beforeprint',applyPrintSize);
document.getElementById('save').onclick=fileSheet;
document.getElementById('filed-days').addEventListener('change',e=>{const ymd=e.target.value||todayYmd();openFiledDay(ymd)});
document.getElementById('clear').onclick=()=>{if(confirm(`Clear this ${active==='timesheet'?'timesheet':'supply request'} on this device? This cannot be undone.`)){
  if(active==='timesheet'){
   const ymd=parseDate(document.getElementById('sheet-date').value)||currentDay||todayYmd();
   clearTimesheetFields();
   document.getElementById('sheet-date').value=formatLong(ymd);
   delete drafts[ymd];
   persist(draftsKey,drafts);
   const kept=archive[ymd]?`Timesheet cleared. The filed copy for ${formatLong(ymd)} is unchanged until you Save. Stored on this device only — not shared with your team.`:'Timesheet cleared. Saved on this device only — not shared with your team.';
   save(kept);
  }else{
   document.getElementById('supply').querySelectorAll('input,select').forEach(el=>el.value='');
   populateChoices(false);
   renderLines();
   save();
   syncCopy();
  }
}};
document.getElementById('lock').onclick=()=>{try{sessionStorage.removeItem('airron-tracker-unlocked-v1')}catch{}location.reload()};
renderLines();
refreshDayList();
save(status.textContent);
if(window.WorkStatus&&filingDate()===todayYmd())maybeSyncStatus();
})();
