import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const env=await readFile('.env','utf8');
if(!/^PUBLIC_FIREBASE_USE_EMULATORS=true$/m.test(env)||!/^PUBLIC_FIREBASE_PROJECT_ID=demo-/m.test(env))throw Error('Test consentito solo con emulatori demo locali.');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
const request=context.request,origin='http://localhost:5173';
let original,authToken;
async function save(config,revision){const r=await request.put(`${origin}/api/merge-battle/config`,{headers:{Origin:origin},data:{config,revision}});assert.equal(r.status(),200,await r.text());return r.json();}
try{
 assert.equal((await request.put(`${origin}/api/merge-battle/config`,{headers:{Origin:origin},data:{}})).status(),401);
 const signup=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{data:{email:`cards-${Date.now()}@example.test`,password:'local-test-password',returnSecureToken:true}});assert.equal(signup.status(),200);const auth=await signup.json();authToken=auth.idToken;
 const session=await request.post(`${origin}/api/session`,{headers:{Origin:origin},data:{idToken:auth.idToken}});assert.equal(session.status(),200,await session.text());
 original=await (await request.get(`${origin}/api/merge-battle/config`)).json();
 const config=structuredClone(original.config);config.characters=[0,1];config.judges=[0];
 let saved=await save(config,original.revision);
 assert.equal((await request.put(`${origin}/api/merge-battle/config`,{headers:{Origin:'http://invalid.example'},data:{config,revision:saved.revision}})).status(),403);
 assert.equal((await request.put(`${origin}/api/merge-battle/config`,{headers:{Origin:origin,'Content-Type':'application/json'},data:'x'.repeat(128001)})).status(),413);
 const large=structuredClone(config);large.cards.forEach(c=>c.description='x'.repeat(500));assert.ok(JSON.stringify(large).length>20000);saved=await save(large,saved.revision);
 saved=await save(config,saved.revision);
 const stale=await request.put(`${origin}/api/merge-battle/config`,{headers:{Origin:origin},data:{config,revision:original.revision}});assert.equal(stale.status(),409);
 const invalid=structuredClone(config);invalid.cards[0].stats=[6,6,6,6];assert.equal((await request.put(`${origin}/api/merge-battle/config`,{headers:{Origin:origin},data:{config:invalid,revision:saved.revision}})).status(),400);
 const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});page.on('requestfailed',r=>console.log('FAILED',r.url(),r.failure()?.errorText));
 await page.goto(`${origin}/admin`);
 for(let attempt=0;attempt<10;attempt++){if(await page.getByRole('button',{name:/Crea carta/}).count())break;await page.getByRole('button',{name:/Merge Battle/}).click();await page.getByRole('button',{name:/Crea carta/}).waitFor({timeout:1000}).catch(()=>{});}
 await page.getByRole('button',{name:/Crea carta/}).waitFor().catch(async e=>{console.log((await page.locator('body').innerText()).slice(0,8000));throw e;});await page.getByRole('button',{name:/Crea carta/}).click();await page.getByLabel('Nome',{exact:true}).fill('Carta creata dal backoffice');await page.getByLabel('Descrizione',{exact:true}).fill('Contenuto deciso dal gruppo.');
 const role=page.locator('details').filter({has:page.locator('summary',{hasText:/^Frontend Developer$/})});
 await role.locator('summary').click();
 await role.locator('select').first().selectOption({label:'Carta creata dal backoffice'});
 await page.getByRole('button',{name:'Salva configurazione pubblica'}).click();await page.getByRole('status').filter({hasText:'Configurazione salvata su Firebase'}).waitFor();
 saved=await (await request.get(`${origin}/api/merge-battle/config`)).json();assert.ok(saved.config.cards.some(c=>c.name==='Carta creata dal backoffice'));assert.equal(saved.config.assignments[0][0],saved.config.cards.find(c=>c.name==='Carta creata dal backoffice').id);
 for(const mobile of [false,true]){
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1280,height:1000});await page.goto(`${origin}/#/merge-battle`);await page.reload();await page.getByText('Come si gioca',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Gioca in due',exact:false}).click();assert.equal(await page.locator('.mb-character').count(),2);await page.getByRole('button',{name:/Frontend Developer/}).click();await page.getByRole('button',{name:/Backend Developer/}).click();await page.getByText('Criteri di review',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Scegliamo le mosse →'}).click();assert.equal(await page.locator('.mb-card').count(),3);assert.equal(await page.locator('.mb-card').first().locator('.card-values b').count(),4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`/tmp/merge-hand-${mobile?'mobile':'desktop'}.png`,fullPage:true});await page.getByRole('button',{name:/Carta creata dal backoffice/}).click();assert.ok(!(await page.locator('main.mb-shell').innerText()).includes('Carta creata dal backoffice'));await page.getByRole('button',{name:'Sono Player 2. Tocca a me →'}).click();await page.getByRole('button',{name:/Faccio rollback/}).click();await page.getByRole('button',{name:'Scopri esito e merge →'}).click();await page.getByRole('heading',{name:'Vince Player 2!'}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`/tmp/merge-cards-${mobile?'mobile':'desktop'}.png`,fullPage:true});
 await page.getByRole('button',{name:'Rivincita! Cambiamo maintainer →'}).click();await page.getByRole('button',{name:'Scegliamo le mosse →'}).click();await page.getByRole('button',{name:/Riproduco il problema/}).click();await page.getByRole('button',{name:'Sono Player 2. Tocca a me →'}).click();await page.getByRole('button',{name:/Traccio la richiesta/}).click();await page.getByRole('button',{name:'Scopri esito e merge →'}).click();await page.getByRole('heading',{name:'Pareggio!',exact:true}).waitFor();await page.locator('.mb-merge').waitFor();
 console.log(`${mobile?'mobile':'desktop'}: new saved card, restricted catalog, hidden handoff, weighted verdict, draw and merge PASS`);
 }
 assert.deepEqual(errors,[]);
 console.log('Firebase emulator: authenticated save/read, anonymous 401, cross-origin 403, invalid budget 400, revision 409, size limit 413, payload >20 KB PASS');
}finally{
 if(original){const current=await (await request.get(`${origin}/api/merge-battle/config`)).json();await save(original.config,current.revision);}
 if(authToken)await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:delete?key=demo-key',{data:{idToken:authToken}});
 await browser.close();
}
