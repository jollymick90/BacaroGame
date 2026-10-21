import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const question = {
  id: 'tutorial-quiz', prompt: 'Il test del tutorial: quale risposta?',
  answers: ['Questa', 'Non questa', 'Neppure questa'], correctIndex: 0,
  explanation: 'Questa è la risposta corretta: il cuore torna al suo posto.',
};
const browser = await chromium.launch({
  channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  for (const viewport of [{width:1280,height:900},{width:390,height:844},{width:667,height:375}]) {
    const page = await browser.newPage({viewport, hasTouch:viewport.width<700});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockGameConfiguration(page, () => ({bugHunter:{questions:[question]}}));
    await openGame(page, origin, '/bug-hunter', {automaticTutorial:true});
    const guide = page.getByRole('region',{name:'Il tuo vero lavoro'});
    await guide.waitFor();
    assert.match(await guide.innerText(), /lo scopo della tua vita non è fare feature ma catturare bug/);
    await page.screenshot({path:`/tmp/bug-tutorial-welcome-${viewport.width}.png`});
    await page.getByRole('button',{name:'Fammi vedere',exact:true}).click();
    await page.keyboard.press('d'); // Inputs cannot derail a scripted demonstration.
    await page.getByText('Bug scappato: da 3 a 2 vite.',{exact:true}).waitFor();
    await page.getByLabel('2 possibilità rimaste').waitFor();
    await page.getByRole('button',{name:'Avanti',exact:true}).click();
    await page.getByText('Il caffè non era un checkpoint: da 2 a 1 vita.',{exact:true}).waitFor();
    await page.getByLabel('1 possibilità rimaste').waitFor();
    await page.screenshot({path:`/tmp/bug-tutorial-obstacle-${viewport.width}.png`});
    await page.getByRole('button',{name:'Avanti',exact:true}).click();
    await page.getByText('Potere sbloccato! Tre bug uguali, mondo rallentato.',{exact:true}).waitFor();
    assert.equal(await page.getByTestId('bug-count').innerText(),'3');
    await page.screenshot({path:`/tmp/bug-tutorial-power-${viewport.width}.png`});
    await page.getByRole('button',{name:'Avanti',exact:true}).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button',{name:'Questa',exact:true}).click();
    await dialog.waitFor({state:'detached',timeout:5000});
    await page.getByLabel('2 possibilità rimaste').waitFor();
    await page.getByRole('button',{name:'Gioca',exact:true}).click();
    await page.getByLabel('3 possibilità rimaste').waitFor();
    assert.equal(await page.getByTestId('bug-count').innerText(),'0');
    await page.getByRole('button',{name:'Pausa',exact:true}).click();
    await page.getByRole('button',{name:'Riprendi',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await openGame(page, origin, '/bug-hunter', {automaticTutorial:true});
    await page.getByRole('button',{name:'Salta e non mostrare più',exact:true}).click();
    await page.getByRole('button',{name:'Pausa',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('bug-hunter:skip-tutorial')), 'true');
    await openGame(page, origin, '/bug-hunter', {automaticTutorial:true});
    await page.getByRole('button',{name:'Inizia',exact:true}).waitFor();
    await page.getByRole('button',{name:'Come si gioca',exact:true}).click();
    await guide.waitFor();
    await page.getByRole('button',{name:'Esci dal tutorial',exact:true}).click();
    await page.getByRole('button',{name:'Inizia',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`Tutorial ${viewport.width}x${viewport.height}: miss, collision, power, heart and clean game start PASS`);
  }
} finally {await browser.close();}
