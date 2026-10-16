export const uid = () => crypto.randomUUID();
export const clone = x => structuredClone(x);
export const WORKS = [
 ['demolition','Демонтаж','шт.'],['chase','Штробление','м'],['box','Отверстие и монтаж подрозетника','шт.'],['cable','Прокладка кабеля','м'],['mechanism','Монтаж розетки / выключателя','шт.'],['light','Монтаж точки освещения','шт.'],['panel','Сборка и монтаж щита','шт.'],['circuit','Подключение линии в щите','линия'],['testing','Проверка и запуск','объект'],['fill','Заделка штроб','м']
];
export const POINT_TYPES = {socket:'Розетка',switch:'Выключатель',light:'Светильник',power:'Силовой вывод',data:'Интернет / ТВ',panel:'Щит',junction:'Распределительный узел'};
export function defaults() {
 return {schemaVersion:1,revision:0,projects:[],catalogs:{appliances:[],materials:[
 {id:'cable',name:'Кабель — уточнить марку',category:'cable',unit:'м',price:null},
 {id:'conduit',name:'Гофра — уточнить тип',category:'conduit',unit:'м',price:null},
 {id:'box',name:'Подрозетник',category:'box',unit:'шт.',price:null},
 {id:'mechanism',name:'Механизм розетки / выключателя',category:'mechanism',unit:'шт.',price:null},
 {id:'mount',name:'Крепление',category:'mount',unit:'шт.',price:null},
 {id:'hardware',name:'Метиз',category:'hardware',unit:'шт.',price:null},
 {id:'primer',name:'Грунтовка',category:'primer',unit:'л',price:null,rate:null,layers:1},
 {id:'filler',name:'Смесь для заделки',category:'filler',unit:'кг',price:null,rate:null,packageSize:null}
 ]},prices:WORKS.map(([id,name,unit])=>({id,name,unit,price:null})),settings:{executor:'',phone:'',logo:null,lastBackupAt:null}};
}
export function newProject(state,mode='quick') {
 return {id:uid(),schemaVersion:1,title:'Новый объект',mode,status:'Замер',client:'',phone:'',address:'',area:null,note:'',date:new Date().toISOString().slice(0,10),height:2700,supply:1,uLN:220,uLL:380,inputA:null,complexity:1,markup:0,discount:0,includeMaterials:true,mainLevel:'floor',reserve:5,revision:0,prices:clone(state.prices),materials:clone(state.catalogs.materials),executor:clone(state.settings),quick:{},overrides:{},extra:[],walls:[],rooms:[],openings:[],points:[],loads:[],circuits:[],routes:[],cables:[],conduits:[],mounts:[],chases:[],devices:[],panel:{rows:[12,12],reservePct:20},versions:[],createdAt:new Date().toISOString()};
}
export function duplicateProject(p){
 const result=clone(p), map=new Map([[p.id,uid()]]);
 // Work codes and catalog SKUs are stable shared identities. Only project-owned
 // entities get new IDs; quick/override keys continue to refer to work codes.
 for(const key of ['walls','rooms','openings','points','loads','circuits','routes','cables','conduits','mounts','chases','devices'])
  for(const entity of result[key]) map.set(entity.id,uid());
 function remap(x){if(typeof x==='string')return map.get(x)||x;if(Array.isArray(x))return x.map(remap);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,remap(v)]));return x;}

 const copy=remap(result);copy.versions=[];copy.title+=' (копия)';copy.archived=false;copy.revision=0;return copy;
}
export function demo(state){
 const p=newProject(state,'plan');p.title='Демо · квартира 36 м²';p.client='Пример для проверки';p.address='Учебный объект — цены условные';
 p.prices.forEach((w,i)=>w.price=[10000,30000,45000,8000,25000,40000,500000,35000,150000,12000][i]);
 p.materials.forEach((m,i)=>m.price=[7000,2000,5000,15000,1000,300,12000,4000][i]);p.materials.find(m=>m.id==='primer').rate=.2;p.materials.find(m=>m.id==='filler').rate=1000;
 p.walls=[[0,0,6000,0],[6000,0,6000,6000],[6000,6000,0,6000],[0,6000,0,0]].map(v=>({id:uid(),x1:v[0],y1:v[1],x2:v[2],y2:v[3],thickness:150,height:2700,material:'Кирпич',structuralRole:'unknown'}));
 p.rooms=[{id:uid(),name:'Комната',polygon:[[0,0],[6000,0],[6000,6000],[0,6000]],height:2700}];
 const circuit={id:uid(),name:'Розеточная группа',phase:'L1',supply:1,demand:1,locked:false};p.circuits.push(circuit);
 const pt={id:uid(),type:'socket',label:'Рабочее место',x:1500,y:0,height:300,reference:'floor',count:3,circuitId:circuit.id};p.points.push(pt);p.loads.push({id:uid(),pointId:pt.id,name:'Нагреватель (демо)',power:2000,quantity:1,supply:1,cos:1,basis:'electrical',efficiency:null});
 const r={id:uid(),name:'Открытая трасса',vertices:[[0,0,300],[1500,0,300]],installation:'open',role:'main'};p.routes.push(r);p.cables.push({id:uid(),circuitId:circuit.id,routeIds:[r.id],materialId:'cable',reserve:5,slackStart:0,slackEnd:0});p.mounts.push({id:uid(),routeIds:[r.id],materialId:'mount',hardwareId:'hardware',norm:2});
 p.devices.push({id:uid(),name:'Автомат (ручной пример)',kind:'Автомат',rated:16,modules:1,price:50000,circuitIds:[circuit.id],iz:null,i2:null,upstreamId:null});return p;
}
