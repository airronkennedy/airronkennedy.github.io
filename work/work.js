(function(){var c=document.getElementById("stars"),x=c.getContext("2d"),S=[];function seed(){var d=Math.min(devicePixelRatio||1,2);c.width=innerWidth*d;c.height=innerHeight*d;x.setTransform(d,0,0,d,0,0);S=[];for(var i=0;i<innerWidth*innerHeight/5200;i++)S.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*.9+.2,a:Math.random()*.6+.2,s:Math.random()*.0015+.0004,o:Math.random()*6.28})}function f(t){x.clearRect(0,0,innerWidth,innerHeight);S.forEach(function(p){x.globalAlpha=p.a*(.6+.4*Math.sin(t*p.s+p.o));x.fillStyle="#fff";x.beginPath();x.arc(p.x,p.y,p.r,0,6.28);x.fill()});if(!matchMedia("(prefers-reduced-motion:reduce)").matches)requestAnimationFrame(f)}seed();addEventListener("resize",seed);requestAnimationFrame(f)})();
(() => {
 const controls=document.querySelector('[data-filters]'); if(!controls)return;
 const search=document.getElementById('project-search');const cards=[...document.querySelectorAll('[data-project]')];
 let category='all';
 function update(){const q=search.value.trim().toLowerCase();let count=0;
 cards.forEach(card=>{const show=(category==='all'||card.dataset.category===category)&&card.textContent.toLowerCase().includes(q);card.hidden=!show;if(show)count++;});
 document.querySelectorAll('[data-section]').forEach(s=>s.hidden=![...s.querySelectorAll('[data-project]')].some(c=>!c.hidden));
 document.getElementById('result-count').textContent=`${count} of ${cards.length} projects & artifacts`;
 document.getElementById('no-results').hidden=count>0;
 }
 controls.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;category=b.dataset.filter;
 controls.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();});
 search.addEventListener('input',update);document.getElementById('clear-search').addEventListener('click',()=>{search.value='';category='all';controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));update();search.focus();});
 document.getElementById('filter-panel').hidden=false;update();
})();
