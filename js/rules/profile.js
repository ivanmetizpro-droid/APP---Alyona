/** Verified against the actual scan, printed pp. 28–31, on 2026-10-16. */
export const PROFILE=Object.freeze({
 id:'cu-pvc70-single-b2-c-2026',version:1,category:'normativeConditional',status:'verified',verifiedAt:'2026-10-16',
 document:'ГОСТ Р 50571.5.52-2011 / МЭК 60364-5-52:2009',
 source:'https://files.stroyinf.ru/Data/524/52467.pdf',
 sourceSHA256:'fb58d8a65c9a2890199ffec1ba14c3efffc321ad631e4a7a2fb92599ed785abc',
 statusURL:'https://protect.gost.ru/gost/details/9ad936e3-1370-4745-a211-ad1c7737bb68',
 corrections:'ИУС 8-2018 (B.52.20), ИУС 8-2025 (B.52.12, графа 3, 50 мм²: 102 → 192); выбранные строки не затронуты',
 sections:[1.5,2.5,4,6,10,16],
 tables:{'B2:2':[16.5,23,30,38,52,69],'B2:3':[15,20,27,34,46,62],'C:2':[19.5,27,36,46,63,85],'C:3':[17.5,24,32,41,57,76]},
 limits:'Только тепловой кандидат. Не проверены КЗ, отключение, селективность, дифзащита, падение напряжения, минимум сечения по назначению, прочность, PE и нейтраль.'
});
export function suggestProtection(line,conditions){const c=conditions||{},missing=[];
 if(line.unknown?.length)missing.push(...line.unknown);
 if(!Number.isFinite(line.current)||line.current<=0)missing.push('Ток должен быть известен и больше 0');
 const equal={conductor:'Cu',insulation:'PVC70',shape:'round',temperature:30,circuitsTogether:1,inInsulation:false,harmonics:false,hasPE:true,uniformRoute:true,termination70:true,indoor:true};
 for(const [k,v]of Object.entries(equal))if(c[k]!==v)missing.push('Вне профиля или неизвестно: '+k);
 if(!['B2','C'].includes(c.method))missing.push('Метод должен быть B2 или C');
 if(c.loadedConductors!==(line.supply===3?3:2))missing.push('Нужно 2 нагруженных проводника для 1ф либо 3 для симметричной 3ф');
 if(line.supply===3&&c.symmetric!==true)missing.push('Не подтверждена симметрия трёхфазной нагрузки');
 if(!Number.isFinite(c.i2Ratio)||c.i2Ratio<1||!c.deviceSource)missing.push('Нужны паспортные I₂/In и источник аппарата');
 if(!Array.isArray(c.nominals)||!c.nominals.length||c.nominals.some(n=>!Number.isFinite(n)||n<=0||n>125))missing.push('Нужен список паспортных номиналов');
 if(missing.length)return {status:'insufficient',reasons:missing,candidates:[],profile:PROFILE};
 const values=PROFILE.tables[c.method+':'+c.loadedConductors],nominals=[...new Set(c.nominals)].sort((a,b)=>a-b),candidates=[];
 for(let i=0;i<PROFILE.sections.length;i++){const iz=values[i];const nominal=nominals.find(n=>line.current<=n&&n<=iz&&c.i2Ratio*n<=1.45*iz);if(nominal!==undefined)candidates.push({section:PROFILE.sections[i],iz,nominal,i2:nominal*c.i2Ratio,loadedConductors:c.loadedConductors,table:c.loadedConductors===2?'B.52.2':'B.52.4',column:c.method==='B2'?5:6,row:PROFILE.sections[i]+' мм², медь',method:c.method});}
 return {status:candidates.length?'conditional':'overload',reasons:candidates.length?[PROFILE.limits]:['Нет кандидата в диапазоне 1,5–16 мм² и заданных паспортных номиналов'],candidates,profile:PROFILE};
}
