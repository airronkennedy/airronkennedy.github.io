(() => {
'use strict';
const key='airron-tracker-unlocked-v1';
function isUnlocked(){try{return sessionStorage.getItem(key)==='yes'}catch{return false}}
function remember(){try{sessionStorage.setItem(key,'yes')}catch{}}
window.TrackerLock={open};
let dialog;
function open(onSuccess){
 if(isUnlocked()){onSuccess();return;}
 if(!dialog){
 dialog=document.createElement('dialog');dialog.className='orbit-lock';
 dialog.setAttribute('aria-labelledby','lock-title');
 dialog.innerHTML=`<div class="orbit-symbol" aria-hidden="true">♄</div><h2 id="lock-title">Team Task Tracker</h2><p>Your crew’s private orbit.<br>Enter the access code to continue.</p><form><label for="orbit-code">ACCESS CODE</label><input id="orbit-code" type="password" autocomplete="off" required><button class="lock-submit" type="submit">Unlock orbit →</button><p class="lock-error" role="status" aria-live="polite"></p></form><button class="lock-cancel" type="button">← Back to orbit</button><small>Casual access lock only. Do not enter sensitive information.</small>`;
 document.body.append(dialog);
 dialog.querySelector('.lock-cancel').onclick=()=>{if(document.body.dataset.tracker){location.href='/'}else{dialog.close()}};
 }
 const form=dialog.querySelector('form'),input=dialog.querySelector('input'),error=dialog.querySelector('.lock-error');
 input.value='';error.textContent='';
 form.onsubmit=async(e)=>{e.preventDefault();error.textContent='';
 try{
 if(!window.crypto?.subtle)throw new Error('secure');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.value));
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual==='92050f605d973135e2ece407e1fc70f01300880e406afa1e85ea2b337e958086'){remember();input.value='';dialog.close();onSuccess()}
 else{error.textContent='That code did not unlock this orbit. Try again.';input.select()}
 }catch{error.textContent='A secure HTTPS connection is required to unlock. Please open https://airronkennedy.com and try again.'}
 };
 if(document.body.dataset.tracker)dialog.addEventListener('cancel',e=>{e.preventDefault();location.href='/'},{once:true});
 dialog.showModal();input.focus();
}
document.addEventListener('click',e=>{const a=e.target.closest('a[data-testid="link-planet-verdigris"]');if(a){e.preventDefault();open(()=>{location.href=a.href})}});
if(document.body.dataset.tracker)open(()=>{document.getElementById('tracker-app').hidden=false;document.body.classList.add('unlocked');window.dispatchEvent(new Event('tracker-unlocked'))});
})();
