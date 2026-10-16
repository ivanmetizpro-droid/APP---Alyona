import {validateState} from './validation.js';
const MAX=20*1024*1024;
export function backup(state){return JSON.stringify({format:'elektrosmeta-backup',schemaVersion:1,createdAt:new Date().toISOString(),data:state},null,2);}
export function validateBackup(text){
 if(new TextEncoder().encode(text).length>MAX)throw Error('Файл больше 20 МБ');let b;
 try{b=JSON.parse(text);}catch{throw Error('Файл не является JSON');}
 if(b.format!=='elektrosmeta-backup'||b.schemaVersion!==1||b.data?.schemaVersion!==1)throw Error('Неизвестный формат или более новая версия копии');
 function scan(x,depth=0){if(depth>40)throw Error('Слишком сложная структура');if(x&&typeof x==='object')for(const [k,v]of Object.entries(x)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Недопустимое поле');scan(v,depth+1);}}
 scan(b.data);return validateState(b.data);
}
let nativeBusy=false;
export async function deliver(blob,name,action='save'){
 if(window.Android){
  if(nativeBusy)throw Error('Завершите предыдущее сохранение');
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  nativeBusy=true;
  return new Promise((resolve,reject)=>{
   const handle=event=>{const result=event.detail;window.removeEventListener('native-file-result',handle);nativeBusy=false;if(result.status==='error')reject(Error(result.message));else resolve(result);};
   window.addEventListener('native-file-result',handle);
   try{window.Android.exportFile(name,blob.type,btoa(binary),action);}catch(error){window.removeEventListener('native-file-result',handle);nativeBusy=false;reject(error);}
  });
 }
 if(action==='share'){const f=new File([blob],name,{type:blob.type});if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f]});return {status:'shared'};}catch(e){if(e.name==='AbortError')return {status:'cancel'};throw e;}}}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return {status:'download'};
}
