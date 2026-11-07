(() => {
'use strict';
const storageKey='airron-team-tracker-v1',app=document.getElementById('tracker-app'),status=document.getElementById('save-status');
let active='timesheet',storageOK=true;
const fields=[...app.querySelectorAll('.paper input')];
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');fields.forEach(el=>{if(typeof saved[el.id]==='string')el.value=saved[el.id]})}catch{storageOK=false}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(fields.map(el=>[el.id,el.value]))));status.textContent='Saved on this device only — not shared with your team.'}catch{storageOK=false;status.textContent='Saving is unavailable in this browser. Print a copy before leaving.'}}
if(!storageOK)status.textContent='Saving is unavailable in this browser. Print a copy before leaving.';
fields.forEach(el=>el.addEventListener('input',save));
const tabs=[...document.querySelectorAll('[data-sheet]')];
function select(sheet){active=sheet;tabs.forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.sheet===sheet));b.tabIndex=b.dataset.sheet===sheet?0:-1});document.getElementById('timesheet-panel').hidden=sheet!=='timesheet';document.getElementById('supply-panel').hidden=sheet!=='supply';document.querySelector('.two-up').hidden=sheet!=='supply';applyPrintSize()}
tabs.forEach((b,i)=>{b.onclick=()=>select(b.dataset.sheet);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;tabs[next].focus();select(tabs[next].dataset.sheet)}}});
const pageStyle=document.createElement('style');document.head.append(pageStyle);
function applyPrintSize(){const two=active==='supply'&&document.getElementById('two-up').checked;document.body.classList.toggle('two-copies',two);pageStyle.textContent=`@page{size:Letter ${two?'landscape':'portrait'};margin:0}`;syncCopy()}
function syncCopy(){document.querySelector('.print-copy')?.remove();if(document.body.classList.contains('two-copies')){const original=document.getElementById('supply'),copy=original.cloneNode(true);copy.removeAttribute('id');copy.classList.add('print-copy');copy.setAttribute('aria-hidden','true');copy.querySelectorAll('input').forEach((input,i)=>{input.value=original.querySelectorAll('input')[i].value;input.removeAttribute('id');input.tabIndex=-1;input.readOnly=true});document.querySelector('.supply-layout').append(copy)}}
document.getElementById('two-up').onchange=applyPrintSize;
document.getElementById('supply').addEventListener('input',syncCopy);
document.getElementById('print').onclick=()=>{document.activeElement?.blur();applyPrintSize();window.print()};
document.getElementById('zoom').onclick=()=>{const zoomed=document.body.classList.toggle('paper-enlarged');const button=document.getElementById('zoom');button.setAttribute('aria-pressed',String(zoomed));button.textContent=zoomed?'Fit paper':'Enlarge paper'};
window.addEventListener('beforeprint',applyPrintSize);
document.getElementById('clear').onclick=()=>{if(confirm(`Clear this ${active==='timesheet'?'timesheet':'supply request'} on this device? This cannot be undone.`)){document.getElementById(active).querySelectorAll('input').forEach(el=>el.value='');save();syncCopy()}};
document.getElementById('lock').onclick=()=>{try{sessionStorage.removeItem('airron-tracker-unlocked-v1')}catch{}location.reload()};
})();
