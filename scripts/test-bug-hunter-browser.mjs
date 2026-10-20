const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{Math.random=()=>.1;window.__bhContexts=[];const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const context=original.call(this,type,...args);if(type==='webgl2'&&context)window.__bhContexts.push(context);return context;};const request=window.requestAnimationFrame,cancel=window.cancelAnimationFrame;window.__bhFrames=new Set();window.requestAnimationFrame=fn=>{const id=request(t=>{window.__bhFrames.delete(id);fn(t)});window.__bhFrames.add(id);return id};window.cancelAnimationFrame=id=>{window.__bhFrames.delete(id);cancel(id)};});
await page.goto(`${origin}/#/bug-hunter`);await page.getByRole('button',{name:'VAI A CACCIA',exact:true}).click();
await page.waitForFunction(()=>Number(document.querySelector('[data-testid="bug-count"]')?.textContent)>=1);console.log(mobile,'capture PASS');
await page.getByRole('button',{name:'Pausa',exact:true}).click();const before=await page.locator('.bh-hud').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('.bh-hud').innerText(),before);await page.getByRole('button',{name:'RIPRENDI',exact:true}).click();
if(mobile){await page.getByRole('button',{name:'Spostati a destra'}).click();await page.getByRole('button',{name:'Salta',exact:true}).click();await page.getByRole('button',{name:'Spostati a sinistra'}).click();}else{await page.keyboard.press('d');await page.keyboard.press('Space');await page.keyboard.press('a');}
await page.screenshot({path:`/tmp/bug-${mobile?'mobile':'desktop'}-running.png`});
// Deterministic browser random makes center unsafe on alternate later rows; no gameplay hooks.
await page.getByRole('button',{name:'RIPROVA',exact:true}).waitFor({timeout:90000});assert.ok((await page.locator('.bh-collection').innerText()).includes('Heisenbug × 1'));await page.screenshot({path:`/tmp/bug-${mobile?'mobile':'desktop'}-over.png`});
await page.getByRole('button',{name:'RIPROVA',exact:true}).click();assert.equal(await page.getByTestId('bug-count').innerText(),'0');
await page.getByRole('button',{name:'Pausa',exact:true}).click();await page.getByRole('link',{name:'Torna al Game Center',exact:true}).click();await page.waitForTimeout(200);assert.equal(await page.locator('canvas').count(),0);
for(let i=0;i<3;i++){await page.goto(`${origin}/#/bug-hunter`);await page.getByRole('button',{name:'VAI A CACCIA',exact:true}).waitFor();await page.locator('.center-return a').click();await page.waitForTimeout(100);}
assert.ok(await page.evaluate(()=>window.__bhContexts.every(c=>c.isContextLost())));assert.equal(await page.evaluate(()=>window.__bhFrames.size),0);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log(`${mobile?'mobile':'desktop'}: intro/capture/controls/pause/3 hits/game-over/restart/4 unmounts PASS`);await page.close();
}}finally{await browser.close();}
