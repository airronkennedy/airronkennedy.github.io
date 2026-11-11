(() => {
'use strict';
const STATUS_KEY='airron-work-status-v1',TRACKER_KEY='airron-team-tracker-v1';
const trim=v=>typeof v==='string'?v.trim():'';
function deriveFromTracker(saved){
 if(!saved||typeof saved!=='object')return {building:'',date:'',updated:'',source:'timesheet'};
 let lastFilled='',current='';
 for(let i=0;i<9;i++){
  const site=trim(saved['site-'+i]);
  if(!site)continue;
  lastFilled=site;
  if(trim(saved['in-'+i])&&!trim(saved['out-'+i]))current=site;
 }
 return {building:current||lastFilled,date:trim(saved['sheet-date']),updated:new Date().toISOString(),source:'timesheet'};
}
function writeStatus(status){try{localStorage.setItem(STATUS_KEY,JSON.stringify(status))}catch{}}
function readStatus(){
 let status=null;
 try{status=JSON.parse(localStorage.getItem(STATUS_KEY)||'null')}catch{}
 if(status&&typeof status==='object'&&(trim(status.building)||trim(status.date)||status.updated))return status;
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem(TRACKER_KEY)||'null')}catch{}
 if(saved&&typeof saved==='object')return deriveFromTracker(saved);
 return {building:'',date:'',updated:'',source:'timesheet'};
}
function syncFromTracker(saved){const status=deriveFromTracker(saved);writeStatus(status);return status}
window.WorkStatus={KEY:STATUS_KEY,TRACKER_KEY,deriveFromTracker,read:readStatus,syncFromTracker};
})();
