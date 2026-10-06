import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist');
const server=createServer((req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');res.end(readFileSync(path));}catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
mkdirSync('test-results/settings',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const results=[];
try{
  for(const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932}]){
    const page=await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/app.js*',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('dist/app.js','utf8')+`
      window.__settingsQA={calls:0};
      for(const method of ['play','pause','update']){const original=mixer[method].bind(mixer);mixer[method]=(...args)=>{window.__settingsQA.calls++;return original(...args);};}
    `}));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(()=>window.__settingsQA);
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
    await page.locator('#settings-trigger').click();
    assert.equal(await page.locator('#settings-sheet a').count(),0,'no source/license links in primary settings');
    assert.equal(await page.locator('#settings-sheet .sound-credit').count(),0,'no attribution paragraphs in primary settings');
    assert.equal(await page.locator('#settings-sheet button').count(),3,'scrim, Timer and one credits entry only');
    assert.equal(await page.locator('#settings-sheet input').count(),2,'actual preferences remain');
    await page.locator('#motion-toggle').check();
    await page.locator('#keep-awake-toggle').check();
    const height=(await page.locator('.settings-panel').boundingBox()).height;
    assert.ok(height<410&&height<=viewport.height*.85,'compact primary settings');
    const initialIntensity=await page.locator('#intensity-slider').inputValue();
    await page.screenshot({path:`test-results/settings/${viewport.width}-settings.png`});
    await page.locator('#credits-trigger').click();
    assert.equal(await page.locator('.sheet:not([hidden])').count(),1);
    assert.ok(await page.locator('#settings-sheet').isHidden());
    assert.equal(await page.locator('#credits-back').evaluate(e=>e===document.activeElement),true);
    assert.deepEqual(await page.locator('.credit-world h3').allTextContents(),['Rain','Fireplace','Forest','Ocean','Snow','Cat']);
    assert.ok(await page.locator('#fireplace-credit').isVisible(),'all world credits available even while listening to Rain');
    for(const href of ['401277/','401275/','www.jshaw.co.uk/','licenses/by/4.0/','501417/','publicdomain/zero/1.0/'])assert.equal(await page.locator(`#credits-sheet a[href*="${href}"]`).count(),1);
    assert.equal(await page.locator('#credits-sheet a:not([rel="noopener noreferrer"])').count(),0);
    assert.ok(await page.locator('#credits-sheet').evaluate(e=>e.scrollWidth<=innerWidth));
    await page.screenshot({path:`test-results/settings/${viewport.width}-credits.png`});
    await page.locator('#credit-cat-title').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('#credit-cat-title').isVisible());
    assert.ok(await page.locator('#credits-back').isVisible(),'back remains reachable while credits scroll');
    await page.screenshot({path:`test-results/settings/${viewport.width}-credits-bottom.png`});
    // Focus remains inside the active sheet, including attribution links.
    await page.locator('#credits-sheet a').last().focus();await page.keyboard.press('Tab');
    assert.ok(await page.locator('#credits-sheet .scrim').evaluate(e=>e===document.activeElement));
    await page.keyboard.press('Shift+Tab');
    assert.ok(await page.locator('#credits-sheet a').last().evaluate(e=>e===document.activeElement));
    await page.locator('#credits-back').click();
    assert.ok(await page.locator('#credits-trigger').evaluate(e=>e===document.activeElement));
    assert.ok(await page.locator('#motion-toggle').isChecked());assert.ok(await page.locator('#keep-awake-toggle').isChecked());
    assert.equal((await page.locator('.settings-panel').boundingBox()).height,height);
    await page.locator('#credits-trigger').click();await page.keyboard.press('Escape');
    assert.ok(await page.locator('#settings-sheet').isVisible());
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#settings-trigger').evaluate(e=>e===document.activeElement));
    assert.equal(await page.locator('#intensity-slider').inputValue(),initialIntensity);
    assert.equal(await page.evaluate(()=>window.__settingsQA.calls),0,'settings and credits never touch playback or intensity');
    // Dismissal closes the secondary surface and returns to the visible root opener.
    await page.locator('#settings-trigger').click();await page.locator('#credits-trigger').click();
    await page.locator('#credits-sheet .scrim').click({position:{x:8,y:8}});
    assert.equal(await page.locator('.sheet:not([hidden])').count(),0);
    assert.ok(await page.locator('#settings-trigger').evaluate(e=>e===document.activeElement));
    await page.locator('#settings-trigger').click();await page.locator('#settings-timer-trigger').click();
    await page.locator('[data-minutes="10"]').click();
    assert.equal(await page.locator('#timer-label').textContent(),'10 min');
    await page.locator('#timer-trigger').click();await page.locator('#custom-minutes').fill('7');
    await page.locator('#custom-timer-form button').click();assert.equal(await page.locator('#timer-label').textContent(),'7 min');
    await page.locator('#scene-trigger').click();await page.locator('[data-world="fireplace"]').click();
    await page.locator('#settings-trigger').click();
    assert.equal((await page.locator('.settings-panel').boundingBox()).height,height,'same compact panel in every world');
    await page.locator('#credits-trigger').click();assert.ok(await page.locator('#fireplace-credit').isVisible());
    assert.deepEqual(errors,[]);
    results.push({viewport,settingsHeight:height,creditsWorlds:6,linksPreserved:true,focusAndNavigationPassed:true,noAudioSideEffects:true});
    await page.close();
  }
  writeFileSync('test-results/settings/report.json',JSON.stringify(results,null,2));
  console.log('PASS compact settings, centralized credits, scrolling, back/dismiss/focus, timer and unchanged playback:',JSON.stringify(results));
}finally{await browser.close();await new Promise(done=>server.close(done));}
