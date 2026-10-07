import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {WORLD_ICONS,worldIcon} from '../dist/world-icons.js';

const worlds=Object.keys(WORLD_ICONS).filter(id=>WORLD_ICONS[id].art),dir=resolve('dist');
const server=createServer((req,res)=>{
  try{const file=resolve(dir,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(dir+'/'))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
mkdirSync('test-results/icons',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
const normalized=html=>html.replace(/world-icon-(rain|fireplace|forest|ocean|snow|cat)-\d+/g,'world-icon-$1-INSTANCE');
const paint=locator=>locator.locator('[data-icon-art] path, [data-icon-art] ellipse, [data-icon-art] circle').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node);return {fill:s.fill,stroke:s.stroke,strokeWidth:s.stroke==='none'?null:s.strokeWidth,opacity:s.opacity};}));
try{
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
    const page=await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:2});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{requestAnimationFrame=()=>1;cancelAnimationFrame=()=>{};});
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
    for(const id of worlds){
      await page.locator('#scene-trigger').click();
      await page.locator(`[data-world="${id}"]`).click();
      const header=page.locator('#scene-mark svg');
      assert.equal(await header.getAttribute('data-world-icon'),id);
      const box=await header.boundingBox();
      assert.equal(box.width,36);assert.equal(box.height,32);
      const title=await page.locator('#scene-name').boundingBox();
      assert.ok(box.y>=0&&box.y+box.height<title.y,'larger emblem remains clear of title and screen edge');
      assert.equal(await header.getAttribute('data-icon-variant'),'header');
      assert.equal(await header.locator('clipPath').count(),0,'no picker background in header');
      assert.ok(await header.locator('[data-icon-art] path, [data-icon-art] ellipse, [data-icon-art] circle').count()<=3,'one simple emblem, not a miniature illustration');
      const slider=await page.locator('#intensity-slider').inputValue();
      if(viewport.width===390)await page.screenshot({path:`test-results/icons/${id}-header.png`});
      await page.locator('#scene-trigger').click();
      const picker=page.locator(`[data-world="${id}"] svg`);
      assert.notEqual(normalized(await header.evaluate(e=>e.outerHTML)),normalized(await picker.evaluate(e=>e.outerHTML)),`${id}: distinct role-specific artwork`);
      assert.equal(await header.getAttribute('data-family-color'),await picker.getAttribute('data-family-color'),'shared family palette');
      const hp=await paint(header),pp=await paint(picker);
      assert.ok(hp.some(h=>h.stroke!=='none'&&pp.some(p=>p.stroke===h.stroke)),`${id}: shared pencil ink`);
      assert.equal(await page.locator('.scene-option').count(),5);
      assert.equal(await page.locator(`[data-world="${id}"]`).getAttribute('aria-current'),'true');
      const ids=await page.locator('[data-world-icon] [id]').evaluateAll(nodes=>nodes.map(n=>n.id));
      assert.equal(new Set(ids).size,ids.length,'unique IDs even with header and picker mounted together');
      assert.equal(await page.locator('#scene-sheet [data-wave]').count(),3,'Ocean keeps multiple curls');
      assert.ok(await page.locator('#scene-sheet .sheet-panel').evaluate(e=>e.scrollWidth<=e.clientWidth));
      if(viewport.width===390)await page.screenshot({path:`test-results/icons/${id}-picker.png`});
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#intensity-slider').inputValue(),slider,'navigation inspection does not alter intensity');
      results.push({viewport,world:id,headerSize:box.width+'x'+box.height,distinctArtwork:true,sameFamily:true,uniqueIDs:true});
    }
    assert.deepEqual(errors,[]);await page.close();
  }
  // The reserved Cat mark is shown for review, not added to the world picker.
  const review=await browser.newPage({viewport:{width:1000,height:290},deviceScaleFactor:2});
  await review.setContent(`<style>body{margin:0;padding:20px;display:flex;gap:20px;background:#fbfbfc;color:#65717b;font:13px system-ui}figure{margin:0;text-align:center;width:140px}.picker{height:98px;display:grid;place-items:center}.picker svg{width:124px;height:98px}.header{height:48px;display:grid;place-items:center}.header svg{width:36px;height:32px}figcaption{margin:14px 0 10px}small{font-size:11px;color:#7a8590}</style>`+Object.keys(WORLD_ICONS).map(id=>`<figure><div class="picker">${WORLD_ICONS[id].art?worldIcon(id):'<small>Future world</small>'}</div><figcaption>${id}</figcaption><div class="header">${worldIcon(id,'header')}</div><small>fuller picker · simple mark</small></figure>`).join(''));
  assert.equal(await review.locator('[data-icon-variant="header"]').count(),6);
  assert.equal(await review.locator('[data-world-icon="cat"] [data-icon-art] path, [data-world-icon="cat"] [data-icon-art] circle').count(),6);
  await review.screenshot({path:'test-results/icons/all-worlds-comparison.png'});await review.close();
  writeFileSync('test-results/icons/report.json',JSON.stringify(results,null,2));
  console.log('PASS five active icon families and reserved Cat mark: simple header emblems, fuller picker, shared ink, larger balanced marks, unchanged layout; 3 mobile viewports.');
}finally{await browser.close();await new Promise(done=>server.close(done));}
