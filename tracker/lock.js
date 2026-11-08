(() => {
'use strict';
const LOCKS={
 tracker:{key:'airron-tracker-unlocked-v1',hash:'92050f605d973135e2ece407e1fc70f01300880e406afa1e85ea2b337e958086',guard:()=>!!document.body.dataset.tracker,
  html:`<div class="orbit-symbol" aria-hidden="true">♄</div><h2 id="lock-title">Team Task Tracker Planet</h2><p>Your crew’s private orbit.<br>Enter the access code to continue.</p>`,cls:'orbit-lock',err:'That code did not unlock this orbit. Try again.'},
 christmas:{key:'airron-christmas-unlocked-v1',hash:'9e83e2a28e7c3a87c9eb94e840e682ae118b827ff6d579874b1edb23359527cd',guard:()=>!!document.body.dataset.christmas,
  html:`<div class="orbit-symbol" aria-hidden="true">🎄</div><h2 id="lock-title">Christmas Planet</h2><p>Family gifts live here.<br>Enter the password to land.</p>`,cls:'orbit-lock xmas-lock',err:'Not quite. Check the password and try again.'}
,
 stats:{key:'airron-stats-unlocked-v1',hash:'6160de6cdc9e54417c48904e9a2f65cdcb5122be6d59d089f2764b038af4f7c5',guard:()=>!!document.body.dataset.stats,
  html:`<div class="orbit-symbol" aria-hidden="true">✦</div><h2 id="lock-title">Stats Planet</h2><p>Mission control for visitors.<br>Enter the password to land.</p>`,cls:'orbit-lock',err:'That code did not unlock this orbit. Try again.'}
};
// SHA-256 fallback for HTTP, where Web Crypto is unavailable. UTF-8 bytes in, digest bytes out.
function sha256(bytes){
 const k=new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
 const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
 const padded=new Uint8Array(Math.ceil((bytes.length+9)/64)*64);
 padded.set(bytes);padded[bytes.length]=0x80;
 const view=new DataView(padded.buffer),w=new Uint32Array(64);
 view.setUint32(padded.length-8,Math.floor(bytes.length/0x20000000));
 view.setUint32(padded.length-4,(bytes.length*8)>>>0);
 const r=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<padded.length;offset+=64){
  for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
  for(let i=16;i<64;i++){
   const x=w[i-15],y=w[i-2];
   w[i]=(w[i-16]+(r(x,7)^r(x,18)^(x>>>3))+w[i-7]+(r(y,17)^r(y,19)^(y>>>10)))>>>0;
  }
  let [a,b,c,d,e,f,g,z]=h;
  for(let i=0;i<64;i++){
   const t1=(z+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0;
   const t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
   z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
  }
  [a,b,c,d,e,f,g,z].forEach((v,i)=>h[i]=(h[i]+v)>>>0);
 }
 const result=new Uint8Array(32),out=new DataView(result.buffer);
 h.forEach((v,i)=>out.setUint32(i*4,v));return result;
}
async function digestCode(value){
 const bytes=new TextEncoder().encode(value);
 if(window.crypto?.subtle){
  try{return new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))}catch{}
 }
 return sha256(bytes);
}
function isUnlocked(L){try{return sessionStorage.getItem(L.key)==='yes'}catch{return false}}
function remember(L){try{sessionStorage.setItem(L.key,'yes')}catch{}}
window.TrackerLock={open:(cb)=>open(cb,'tracker'),openLock:open};
const dialogs={};
function open(onSuccess,name='tracker'){
 const L=LOCKS[name];let dialog=dialogs[name];
 if(isUnlocked(L)){onSuccess();return;}
 if(!dialog){
 dialog=dialogs[name]=document.createElement('dialog');dialog.className=L.cls;
 dialog.setAttribute('aria-labelledby','lock-title');
 dialog.innerHTML=L.html+`<form><label for="orbit-code">ACCESS CODE</label><input id="orbit-code" type="password" autocomplete="off" required><button class="lock-submit" type="submit">Unlock orbit →</button><p class="lock-error" role="status" aria-live="polite"></p></form><button class="lock-cancel" type="button">← Back to orbit</button><small>Casual access lock only. Do not enter sensitive information.</small>`;
 document.body.append(dialog);
 dialog.querySelector('.lock-cancel').onclick=()=>{if(L.guard()){location.href='/'}else{dialog.close()}};
 }
 const form=dialog.querySelector('form'),input=dialog.querySelector('input'),error=dialog.querySelector('.lock-error');
 input.value='';error.textContent='';
 form.onsubmit=async(e)=>{e.preventDefault();error.textContent='';
 try{
 const digest=await digestCode(input.value);
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual===L.hash){remember(L);input.value='';dialog.close();onSuccess()}
 else{error.textContent=L.err;input.select()}
 }catch{error.textContent='The access check could not finish. Please try again.'}
 };
 if(L.guard())dialog.addEventListener('cancel',e=>{e.preventDefault();location.href='/'},{once:true});
 dialog.showModal();input.focus();
}
document.addEventListener('click',e=>{const a=e.target.closest('a[data-testid="link-planet-verdigris"]');if(a){e.preventDefault();open(()=>{location.href=a.href},'tracker')}
 const x=e.target.closest('a[data-testid="link-planet-cinder"]');if(x){e.preventDefault();open(()=>{location.href=x.href},'christmas')}
 const st=e.target.closest('a[data-testid="link-planet-umbra"]');if(st){e.preventDefault();open(()=>{location.href=st.href},'stats')}});
if(document.body.dataset.stats)open(()=>{document.body.classList.add('unlocked');window.dispatchEvent(new Event('stats-unlocked'))},'stats');
if(document.body.dataset.christmas)open(()=>{document.body.classList.add('unlocked')},'christmas');
if(document.body.dataset.tracker)open(()=>{document.getElementById('tracker-app').hidden=false;document.body.classList.add('unlocked');window.dispatchEvent(new Event('tracker-unlocked'))},'tracker');
})();
