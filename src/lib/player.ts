import type { Pokemon } from './types';
export interface GuestCapture { memberId: string; name: string; pokemon: Pokemon; capturedAt: number }
const key='bacarodex-guest-captures-v1';
export function loadCaptures(): GuestCapture[] {
  const data=JSON.parse(localStorage.getItem(key)??'[]');
  if(!Array.isArray(data))throw new Error('Collezione locale non leggibile.');
  return data.filter(c=>typeof c.memberId==='string'&&typeof c.name==='string'&&typeof c.capturedAt==='number'&&Number.isInteger(c.pokemon?.id));
}
export function saveCapture(capture: GuestCapture) {
  const current=loadCaptures();
  if(!current.some(c=>c.memberId===capture.memberId))current.push(capture);
  localStorage.setItem(key,JSON.stringify(current));return current;
}
export function resetCaptures(){localStorage.removeItem(key);}
export async function playRequest<T>(path:string, data?:unknown, signal?:AbortSignal):Promise<T>{
  const r=await fetch('/api/play'+path,{signal,method:data?'POST':'GET',cache:'no-store',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});
  const result=await r.json();if(!r.ok)throw new Error(result.message||'Gioco non disponibile. Riprova.');return result;
}
