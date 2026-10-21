import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  channel:'chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
});
try {
  for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
    const page = await browser.newPage({viewport,hasTouch:viewport.width<700});
    const errors = [];
    page.on('pageerror', error=>errors.push(error.message));
    await page.addInitScript(()=>{Math.random=()=>0.5;});
    await mockGameConfiguration(page,()=>({bugHunter:{
      questions:[{id:'finish',prompt:'Una domanda',answers:['A','B','C'],correctIndex:0,explanation:'A'}],
      run:{distanceGoal:100,bugGoal:1},
    }}));
    await openGame(page,origin,'/bug-hunter');
    await page.getByRole('button',{name:'Inizia',exact:true}).click();
    assert.match(await page.getByLabel('Obiettivo della corsa').innerText(),/1\/2/);
    await page.waitForFunction(()=>document.querySelector('.bh-objective')?.textContent.includes('2/2'),{},{timeout:30000});
    // Every seeded pickup is centered. Row five is airborne: use real jump input.
    await page.waitForFunction(()=>Number(document.querySelector('.bh-hud small')?.textContent.split(' ')[0])>=121);
    await page.keyboard.press('Space');
    await page.getByRole('heading',{name:'Corsa completata!',exact:true}).waitFor({timeout:10000});
    const review=page.getByRole('region',{name:'Review finale'});
    await review.waitFor();
    assert.match(await review.innerText(),/Obiettivi raggiunti/);
    await page.screenshot({path:`/tmp/bug-finish-${viewport.width}.png`});
    await page.getByRole('button',{name:'Riprova',exact:true}).click();
    await page.getByLabel('3 possibilità rimaste').waitFor();
    assert.equal(await page.getByTestId('bug-count').innerText(),'0');
    assert.match(await page.getByLabel('Obiettivo della corsa').innerText(),/1\/2/);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`Finite run ${viewport.width}: configured distance then additional bug goal, review, clean restart PASS`);
  }
} finally {await browser.close();}
