import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5186';
const browser = await chromium.launch({channel: 'chrome'});

async function textContrast(locator) {
  return locator.evaluate(node => {
    const style = getComputedStyle(node);
    function luminance(color) {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    const foreground = luminance(style.color);
    const background = luminance(style.backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
}

async function mountComponent(page, component, props) {
  await page.evaluate(async ({component, props}) => {
    const moduleSource = await (await fetch('/src/App.svelte')).text();
    const runtimePath = moduleSource.match(/from "([^"]+\/svelte\.js[^\"]*)"/)[1];
    const {mount} = await import(runtimePath);
    const {default: Component} = await import(component);
    const host = document.createElement('div');
    host.id = 'face-test-host';
    if (component.includes('/bacarodex/')) host.className = 'arcade-shell';
    document.body.append(host);
    mount(Component, {target: host, props});
  }, {component, props});
  return page.locator('#face-test-host');
}
async function upload(page, host) {
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 300;
    const context = canvas.getContext('2d');
    context.fillStyle = '#e8ecdd'; context.fillRect(0,0,400,300);
    context.fillStyle = '#f5cf68'; context.beginPath(); context.ellipse(200,150,75,100,0,0,Math.PI*2); context.fill();
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await host.locator('input[type=file]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await host.getByRole('button',{name:'Mostra punti del volto'}).waitFor();
}
try {
 for (const mobile of [false,true]) {
  const page = await browser.newPage({viewport: mobile ? {width:390,height:844} : {width:1280,height:900}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let registered=false;
  let registrationBody;
  let scanBody;
  await page.route('**/src/lib/recognition.ts*',route=>route.fulfill({contentType:'application/javascript',body:`
    export async function analyzeFace(photo, status = () => {}) {
      status('Analisi sintetica di test');
      await new Promise(resolve => setTimeout(resolve, window.__faceDelay || 10));
      return {width:photo.width,height:photo.height,box:[125,50,150,200],landmarks:[[175,120],[225,120],[200,150],[200,190]],embedding:Array(256).fill(.1)};
    }
    export async function extract(photo,status) {return (await analyzeFace(photo,status)).embedding;}
  `}));
  await page.route('https://pokeapi.co/api/v2/pokemon**',route=>{
    const list=route.request().url().includes('?');
    return route.fulfill({json:list?{results:[{name:'pikachu',url:'https://pokeapi.co/api/v2/pokemon/25'}]}:{id:25,name:'pikachu',sprites:{front_default:null}}});
  });
  await page.route('**/api/bacarodex',route=>route.fulfill({json:{superadmin:false,members:registered?[{id:'test-member',name:'Test',pokemon:{id:25,name:'pikachu',sprite:null}}]:[],captures:[]}}));
  await page.route('**/api/bacarodex/members',route=>{registrationBody=route.request().postDataJSON();registered=true;return route.fulfill({json:{}});});
  await page.route('**/api/play',route=>route.fulfill({json:{available:true,count:2}}));
  await page.route('**/api/play/scan',route=>{scanBody=route.request().postDataJSON();return route.fulfill({json:{token:'test-token',options:[{id:25,name:'pikachu',sprite:null}]}});});
  let answerAttempts = 0;
  await page.route('**/api/play/answer', route => {
    answerAttempts++;
    return route.fulfill({json: answerAttempts === 1 ? {correct:false} : {correct:true,capture:{memberId:'synthetic-member',name:'Persona di test',pokemon:{id:25,name:'pikachu',sprite:null},capturedAt:Date.now()}}});
  });
  await page.goto(origin);
  let host=await mountComponent(page,'/src/App.svelte',{user:{uid:'test-member',name:'Test',email:'test@example.com'}});
  await host.getByLabel('Nome del Bacaro',{exact:true}).fill('Test');
  await host.getByRole('button',{name:'pikachu',exact:true}).click();
  await upload(page,host);
  await host.getByRole('button',{name:'Mostra punti del volto'}).click();
  await host.locator('svg.face-landmarks').waitFor();
  assert.equal(await host.locator('svg.face-landmarks circle').count(),4);
  await host.getByText('Vedi embedding del volto (256 valori)').click();
  assert.equal((await host.getByLabel('Descrittore numerico del volto').innerText()).split(' · ').length,256);
  await host.screenshot({path:`/tmp/bacaro-face-registration-${mobile?'mobile':'desktop'}.png`});
  await host.getByRole('checkbox').check();
  await host.getByRole('button',{name:/Registra il Bacaro/}).click();
  await host.getByText('Bacaro registrato per il gioco pubblico! La foto è stata scartata.').waitFor();
  assert.ok(registrationBody.embedding.length===256);
  assert.ok(!('landmarks' in registrationBody));
  assert.equal(await host.locator('svg.face-landmarks').count(),0);

  await page.goto(origin);
  host=await mountComponent(page,'/src/lib/games/bacarodex/Bacarodex.svelte',{configured:true});
  await upload(page,host);
  await host.getByRole('button',{name:'Mostra punti del volto'}).click();
  await host.locator('svg.face-landmarks').waitFor();
  await host.getByText('Vedi embedding del volto (256 valori)').click();
  const toggle = host.getByRole('button',{name:'Nascondi punti del volto'});
  await toggle.hover();
  assert.ok(await textContrast(toggle) >= 4.5, 'face toggle remains legible on hover');
  assert.ok(await textContrast(host.getByLabel('Descrittore numerico del volto')) >= 4.5, 'embedding values remain legible');
  await host.screenshot({path:`/tmp/bacaro-face-game-${mobile?'mobile':'desktop'}.png`});
  await host.getByRole('button',{name:'Nascondi punti del volto'}).click();
  assert.equal(await host.locator('svg.face-landmarks').count(),0);
  await page.evaluate(()=>{window.__faceDelay=200;});
  await host.getByRole('button',{name:'Mostra punti del volto'}).click();
  await host.getByRole('button',{name:'Rimuovi foto'}).click();
  await page.waitForTimeout(250);
  assert.equal(await host.locator('svg.face-landmarks').count(),0);
  await upload(page,host);
  await host.getByRole('checkbox').check();
  await host.getByRole('button',{name:'Riconosci il Bacaro'}).click();
  await host.getByRole('heading',{name:'Bacaro rilevato! Quale Pokémon ha scelto?'}).waitFor();
  assert.deepEqual(Object.keys(scanBody).sort(),['consent','embedding','model']);
  assert.equal(scanBody.embedding.length,256);
  await host.screenshot({path:`/tmp/redesign-dex-quiz-${mobile?'mobile':'desktop'}.png`});
  await host.locator('.quiz-choice').first().click();
  await host.getByText('Questo Pokémon si è imbucato al Bacaro. Riprova!').waitFor();
  await host.locator('.quiz-choice').first().click();
  await host.getByRole('heading',{name:'Bacaro catturato!'}).waitFor();
  await host.screenshot({path:`/tmp/redesign-dex-result-${mobile?'mobile':'desktop'}.png`});
  await host.getByRole('button',{name:/Il mio Bacarodex/}).click();
  await host.getByRole('heading',{name:'Persona di test'}).waitFor();
  page.once('dialog', dialog => dialog.dismiss());
  await host.getByRole('button',{name:'Azzera le mie catture'}).click();
  await host.getByRole('heading',{name:'Persona di test'}).waitFor();

  assert.deepEqual(errors,[]);
  console.log(`${mobile?'Mobile':'Desktop'}: registration and game previews, 256 values, hide/remove race, descriptor-only submissions PASS`);
  await page.close();
 }
} finally {
 await browser.close();
}
