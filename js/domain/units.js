export function number(value,{min=0,max=1e12,integer=false}={}){if(value===null||value===undefined||String(value).trim()==='')return null;const s=String(value).replace(/\s/g,'').replace(',','.');if(!/^\d+(\.\d+)?$/.test(s))throw Error('Введите неотрицательное число');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(`Значение вне диапазона ${min}–${max}`);return n;}
export function money(value){
 if(value===null||value===undefined||String(value).trim()==='')return null;
 const input=String(value).replace(/\s/g,'').replace(',','.');
 if(!/^\d+(\.\d+)?$/.test(input))throw Error('Введите неотрицательную цену');
 const [whole,fraction='']=input.split('.');
 const cents=BigInt(whole)*100n+BigInt((fraction+'00').slice(0,2))+(Number(fraction[2]||0)>=5?1n:0n);
 if(cents>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Цена слишком велика');
 return Number(cents);
}
export const rub = k => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'}).format((k||0)/100);
export const qty = n => n===null?'Неизвестно':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(n);
export const ceilTo=(n,step)=>Number((Math.ceil((n-1e-9)/step)*step).toFixed(6));
export const round2=n=>Math.round((n+Number.EPSILON)*100)/100;
// Rational HALF_UP multiplication. All commercial inputs have at most 6 decimal places.
export function multiply(amount,factor){if(!Number.isSafeInteger(amount)||amount<0||!Number.isFinite(factor)||factor<0)throw Error('Недопустимая сумма');const scale=1000000n;const f=BigInt(Math.round(factor*Number(scale)));const n=(BigInt(amount)*f+scale/2n)/scale;if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Сумма слишком велика');return Number(n);}
