(() => {
'use strict';
const STATUS_KEY='airron-work-status-v1',TRACKER_KEY='airron-team-tracker-v1',ARCHIVE_KEY='airron-team-tracker-archive-v1';
const tz='America/Los_Angeles';
const trim=v=>typeof v==='string'?v.trim():'';
function todayYmd(){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=t=>parts.find(p=>p.type===t).value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
function todayLong(){
 return new Date().toLocaleDateString('en-US',{timeZone:tz,weekday:'long',month:'long',day:'numeric',year:'numeric'});
}
function isTodayDate(s){
 const v=trim(s);
 return !!v&&(v===todayLong()||v===todayYmd());
}
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
function readJSON(key){
 try{
  const value=JSON.parse(localStorage.getItem(key)||'null');
  if(value&&typeof value==='object'&&!Array.isArray(value))return value;
 }catch{}
 return null;
}
function readStatus(){
 const working=readJSON(TRACKER_KEY);
 if(working&&isTodayDate(working['sheet-date'])){
  const derived=deriveFromTracker(working);
  if(trim(derived.building))return derived;
 }
 const archive=readJSON(ARCHIVE_KEY)||{};
 const days=Object.keys(archive).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort().reverse();
 for(const day of days){
  const derived=deriveFromTracker(archive[day]);
  if(trim(derived.building))return derived;
 }
 if(working){
  const derived=deriveFromTracker(working);
  if(trim(derived.building))return derived;
 }
 const status=readJSON(STATUS_KEY);
 if(status&&(trim(status.building)||trim(status.date)||status.updated))return status;
 return {building:'',date:'',updated:'',source:'timesheet'};
}
function syncFromTracker(saved){const status=deriveFromTracker(saved);writeStatus(status);return status}
window.WorkStatus={KEY:STATUS_KEY,TRACKER_KEY,ARCHIVE_KEY,deriveFromTracker,read:readStatus,syncFromTracker};
})();
