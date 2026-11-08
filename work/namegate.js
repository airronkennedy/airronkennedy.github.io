(() => {
'use strict';
const KEY='airron-work-visitor-name';
function stored(){try{return localStorage.getItem(KEY)}catch{return null}}
function logName(name){
 const clean=name.trim().slice(0,60);
 const payload={path:'work-visitor/'+encodeURIComponent(clean),title:'Work visitor: '+clean,event:true};
 let tries=0;
 (function send(){
  if(window.goatcounter&&typeof window.goatcounter.count==='function'){try{window.goatcounter.count(payload)}catch{}return}
  if(++tries<40)setTimeout(send,500);
 })();
}
function isRecruiterLink(){
 try{return new URLSearchParams(location.search).get('r')==='recruiter'}catch{return false}
}
function gate(){
 if(isRecruiterLink()){
  const first=!stored();
  try{localStorage.setItem(KEY,'Recruiter')}catch{}
  if(first)logName('Recruiter');
  return;
 }
 if(stored())return;
 document.documentElement.classList.add('name-gated');
 const d=document.createElement('dialog');d.className='orbit-lock name-gate';d.setAttribute('aria-labelledby','gate-title');
 d.innerHTML=`<div class="orbit-symbol" aria-hidden="true">🪐</div><h2 id="gate-title">Work Planet</h2><p>Welcome aboard.<br>Enter your name to continue.</p><form><label for="visitor-name">YOUR NAME</label><input id="visitor-name" type="text" autocomplete="name" maxlength="60" required><button class="lock-submit" type="submit">Enter orbit →</button></form><button class="lock-cancel" type="button">← Back to orbit</button><small>Your name is shared with Airron so he knows who visited.</small>`;
 document.body.append(d);
 const input=d.querySelector('input');
 d.querySelector('.lock-cancel').onclick=()=>{location.href='/'};
 d.addEventListener('cancel',e=>e.preventDefault());
 d.querySelector('form').onsubmit=e=>{e.preventDefault();const n=input.value.trim();if(!n){input.focus();return}
  try{localStorage.setItem(KEY,n.slice(0,60))}catch{}
  logName(n);d.close();d.remove();document.documentElement.classList.remove('name-gated')};
 d.showModal();input.focus();
}
if(document.body)gate();else document.addEventListener('DOMContentLoaded',gate);
})();
