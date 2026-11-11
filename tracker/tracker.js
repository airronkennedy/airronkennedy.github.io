(() => {
'use strict';
const storageKey='airron-team-tracker-v1',app=document.getElementById('tracker-app'),status=document.getElementById('save-status');
const inventory=window.TRACKER_SUPPLIES||{},buildings=Object.keys(inventory);
let active='timesheet',storageOK=true,saved={};
try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!saved||typeof saved!=='object')saved={}}catch{storageOK=false}
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
// Auto-fill: add more fields here as {id: () => value}. A field is refilled on open
// when empty or still holding the value we filled last time (user edits are kept).
const tz='America/Los_Angeles';
const AUTOFILL={
 'sheet-date':()=>new Date().toLocaleDateString('en-US',{timeZone:tz,weekday:'long',month:'long',day:'numeric',year:'numeric'}),
};
const autoKey='airron-team-tracker-autofill-v1';
let autoPrev={};try{autoPrev=JSON.parse(localStorage.getItem(autoKey)||'{}')||{}}catch{}
Object.entries(AUTOFILL).forEach(([id,fn])=>{const el=document.getElementById(id);if(!el)return;if(!el.value||el.value===autoPrev[id]){el.value=fn();autoPrev[id]=el.value}});
try{localStorage.setItem(autoKey,JSON.stringify(autoPrev))}catch{}
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
function save(){try{const data=snapshot();localStorage.setItem(storageKey,JSON.stringify(data));if(window.WorkStatus)WorkStatus.syncFromTracker(data);status.textContent='Saved on this device only — not shared with your team.'}catch{storageOK=false;status.textContent='Saving is unavailable in this browser. Print a copy before leaving.'}}
if(!storageOK)status.textContent='Saving is unavailable in this browser. Print a copy before leaving.';
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
 const changed=()=>{if(el===site)populateChoices(true);renderLines();save();syncCopy()};
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
document.getElementById('clear').onclick=()=>{if(confirm(`Clear this ${active==='timesheet'?'timesheet':'supply request'} on this device? This cannot be undone.`)){document.getElementById(active).querySelectorAll('input,select').forEach(el=>el.value='');if(active==='supply')populateChoices(false);renderLines();save();syncCopy()}};
document.getElementById('lock').onclick=()=>{try{sessionStorage.removeItem('airron-tracker-unlocked-v1')}catch{}location.reload()};
renderLines();
if(window.WorkStatus)WorkStatus.syncFromTracker(snapshot());
})();
