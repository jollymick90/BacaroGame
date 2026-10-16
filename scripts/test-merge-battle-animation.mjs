const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://localhost:5173/#/merge-battle');
 await page.getByRole('button',{name:/1 VS 1/}).click();await page.locator('.mb-character').first().click();await page.locator('.mb-character:not(:disabled)').first().click();
 await page.getByRole('button',{name:'Scegliamo le mosse →'}).click();await page.locator('.mb-card').first().click();await page.getByRole('button',{name:'Sono Player 2. Tocca a me →'}).click();await page.locator('.mb-card').first().click();
 await page.locator('.mb-action').waitFor();assert.equal(await page.locator('.mb-prop').count(),2);
 const animation=await page.locator('.arena-branches').evaluate(node=>getComputedStyle(node).animationName);assert.ok(animation.includes('branch-flow'));
 await page.getByRole('button',{name:'Scopri esito e merge →'}).click();await page.locator('.mb-merge').waitFor();console.log('Gitgraph animation, card launch and merge PASS');
}finally{await browser.close();}
