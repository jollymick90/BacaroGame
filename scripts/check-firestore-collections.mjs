import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GAME_COLLECTIONS,RESERVED_COLLECTIONS,approvedCollectionName} from '../src/lib/firebase/collections.ts';
const gateway='src/lib/firebase/game-collections.server.ts';
const admin='src/lib/firebase/firebase-admin.server.ts';

// A regression check for accidental bypasses, not an IAM/security sandbox.
export function inspectSource(source,path){
 const errors=[];
 const file=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);
 function visit(node){
  if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
   const from=node.moduleSpecifier.text;
   if(from==='firebase/firestore'||from==='firebase/compat/firestore')errors.push(`${path}: accesso Firestore client non consentito`);
   if(from==='firebase-admin/firestore'&&path!==admin&&node.importClause?.getText(file).includes('getFirestore'))errors.push(`${path}: inizializzazione Firestore fuori dal modulo Admin`);
  }
  if((ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node))&&ts.isCallExpression(node.parent)&&node.parent.expression===node){
   const name=ts.isPropertyAccessExpression(node)?node.name.text:ts.isStringLiteral(node.argumentExpression)?node.argumentExpression.text:'';
   if(['collection','collectionGroup'].includes(name)&&path!==gateway)errors.push(`${path}: usare gameCollection e il registro, non ${name} direttamente`);
   if(name==='doc'){
    const receiver=node.expression;
    if(path!==gateway&&!(ts.isCallExpression(receiver)&&ts.isIdentifier(receiver.expression)&&receiver.expression.text==='membersCollection'))errors.push(`${path}: riferimento documento fuori dalla collezione membri autorizzata`);
   }
  }
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='getFirestore'&&path!==admin)errors.push(`${path}: getFirestore fuori dal modulo Admin`);
  ts.forEachChild(node,visit);
 }
 visit(file);return errors;
}
async function check(){
 const root=fileURLToPath(new URL('../',import.meta.url));const errors=[];
 const names=Object.values(GAME_COLLECTIONS);
 if(new Set(names).size!==names.length)errors.push('Nomi collezione duplicati nel registro');
 for(const name of names){try{approvedCollectionName(name);}catch(e){errors.push(e.message);}}
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=resolve(dir,entry.name),rel=relative(root,path).replaceAll('\\','/');
  if(entry.isDirectory())await walk(path);
  else if(/\.(ts|js|mjs|svelte)$/.test(path)&&!path.includes('.test.')&&rel!=='scripts/check-firestore-collections.mjs'){
   let source=await readFile(path,'utf8');
   if(path.endsWith('.svelte'))source=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
   errors.push(...inspectSource(source,rel));
  }
 }}
 await walk(resolve(root,'src'));await walk(resolve(root,'scripts'));
 const rules=await readFile(resolve(root,'firestore.rules'),'utf8');
 for(const name of names)if(!rules.includes(`match /${name}/{document=**}`))errors.push(`Regole locali mancanti per ${name}`);
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
 else console.log(`Firestore: ${names.join(', ')} consentita; ${RESERVED_COLLECTIONS.length} nomi riservati; accessi sorgente verificati.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await check();
