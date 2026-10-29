import type {Project, Capsule} from './model';
import {isValidProject} from './model';
const DB_NAME='vezkio-studio-v1';
const STORE='kv';
function db(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function put(key:string,value:unknown):Promise<void> {
  const d=await db();
  try {await new Promise<void>((resolve,reject)=>{
    const tx=d.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(value,key);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{d.close();}
}
async function get<T>(key:string):Promise<T|undefined> {
  const d=await db();
  try {return await new Promise<T|undefined>((resolve,reject)=>{
    const tx=d.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(key);
    req.onsuccess=()=>resolve(req.result as T|undefined);req.onerror=()=>reject(req.error);
  });}finally{d.close();}
}
export async function loadProject():Promise<Project|undefined>{const p=await get<unknown>('project');return isValidProject(p)?p:undefined;}
export const saveProject=(project:Project)=>put('project',project);
export async function loadCapsules():Promise<Capsule[]>{const c=await get<Capsule[]>('capsules');return Array.isArray(c)?c.slice(0,8):[];}
export const saveCapsules=(capsules:Capsule[])=>put('capsules',capsules.slice(0,8));

import type {ReplayFrame} from './creative';
export const saveReplay=(projectId:string,frames:ReplayFrame[])=>put('replay-'+projectId,frames.slice(-42));
export async function loadReplay(projectId:string):Promise<ReplayFrame[]>{const value=await get<unknown>('replay-'+projectId);return Array.isArray(value)?(value as ReplayFrame[]).slice(-42):[];}
