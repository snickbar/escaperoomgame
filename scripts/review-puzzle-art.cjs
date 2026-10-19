const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.qa-output');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,d)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(e?'Missing':d);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof configurePuzzleArt==='function');
  assert.equal(await page.locator('select').count(),0);
  for(const id of ['library','lucy','lighthouse']){await page.locator('[data-story="'+id+'"]').click();assert.equal(await page.locator('[data-story="'+id+'"]').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>storyChoiceEl.value),id);}
  await page.screenshot({path:path.join(out,'art-story-choices.png'),fullPage:true});
  await page.evaluate(()=>openTestPuzzle('pipes'));
  const initial=await page.evaluate(()=>({filled:pipesGridEl.querySelectorAll('.has-flow').length,connected:pipesConnectedSet(currentPuzzleContext.content.puzzle.tiles).size,disabled:[...pipesGridEl.querySelectorAll('.pipe-tile.start,.pipe-tile.end')].every(e=>e.disabled)}));
  assert.equal(initial.filled,initial.connected);assert.equal(initial.disabled,true);
  await page.waitForTimeout(600);await page.screenshot({path:path.join(out,'art-water-empty.png')});
  // Actual rotations solve the same topology in both appearances.
  const rotateToSolution=()=>{
   const p=currentPuzzleContext.content.puzzle;
   p.tiles.forEach((t,i)=>{for(let n=0;n<4&&!p.solved&&t.openings!==t.correctMask;n++)pipesGridEl.children[i].click();});
   return {solved:p.solved,flow:pipesGridEl.querySelectorAll('.has-flow').length,path:p.tiles.filter(t=>t.isPath).length,
    delays:[...pipesGridEl.querySelectorAll('.has-flow')].map(e=>parseFloat(e.style.getPropertyValue('--fill-delay')))};
  };
  const water=await page.evaluate(rotateToSolution);assert.equal(water.solved,true);assert.equal(water.flow,water.path);assert.ok(Math.max(...water.delays)>300,'The flow must travel in sequence');
  await page.waitForTimeout(Math.max(...water.delays)+450);await page.screenshot({path:path.join(out,'art-water-filled.png')});
  const animations=await page.locator('.has-flow .tube-motion').first().evaluate(e=>e.getAnimations().map(a=>a.playState));assert.ok(animations.includes('running'));
  await page.getByRole('button',{name:'Electric switchboard',exact:true}).click();assert.equal(await page.locator('#pipesGrid').getAttribute('data-style'),'electric');
  assert.equal(await page.evaluate(()=>currentPuzzleContext.content.puzzle.solved),true);
  await page.waitForTimeout(3300);await page.screenshot({path:path.join(out,'art-electric-filled.png')});
  await page.evaluate(()=>openTestPuzzle('electric'));assert.equal(await page.locator('#pipesGrid').getAttribute('data-style'),'electric');
  assert.equal((await page.evaluate(rotateToSolution)).solved,true);
  await page.evaluate(()=>openTestPuzzle('swap'));
  assert.equal(await page.locator('.swap-tile').first().textContent(),'');
  await page.getByRole('button',{name:'View reference',exact:true}).click();await page.locator('#puzzleReference').evaluate(e=>e.decode());
  await page.screenshot({path:path.join(out,'art-picture-reference.png')});
  await page.getByRole('button',{name:'Hide reference',exact:true}).click();
  assert.equal(await page.evaluate(()=>{const p=currentPuzzleContext.content.puzzle;for(let i=0;i<16;i++){const j=p.tiles.indexOf(i+1);if(i!==j){swapGridEl.children[i].click();swapGridEl.children[j].click();}}return p.solved;}),true);
  await page.screenshot({path:path.join(out,'art-picture-solved.png')});
  await page.evaluate(()=>openTestPuzzle('cryptogram'));
  await page.evaluate(()=>{const p=currentPuzzleContext.content.puzzle;[...cipherKeyboardEl.children].find(e=>e.textContent===p.plaintext[0]).click();});
  assert.ok(await page.locator('.pencil-mark').count()>0);
  await page.screenshot({path:path.join(out,'art-pencil-cryptogram.png')});
  await page.evaluate(()=>openTestPuzzle('shapes'));await page.getByRole('button',{name:/Hint \(/}).click();await page.getByRole('button',{name:/Hint \(/}).click();
  await page.screenshot({path:path.join(out,'art-torn-document.png')});
  const restore=await page.evaluate(()=>{
   const p=currentPuzzleContext.content.puzzle,coverage=shapesCoverage(p);
   const piece=p.pieces.find(pc=>!pc.placed),[r,c]=piece.solvedOrigin;
   if(shapesCanPlace(piece,r+1,c,p.rows,p.cols,coverage))throw Error('Wrong image position accepted');
   const solution=solveShapeRemainder(p);if(!solution||solution.some(x=>x.origin.some((v,i)=>v!==x.piece.solvedOrigin[i])))throw Error('Hint picture does not match');
   solution.forEach(({piece,origin})=>{piece.placed=true;piece.placedOrigin=origin;});
   renderPuzzle(currentPuzzleContext.content,null,{isTest:true});
   return {solved:shapesIsSolved(p),painted:shapesGridEl.querySelectorAll('.document-fragment').length,cells:p.rows*p.cols};
  });assert.equal(restore.solved,true);assert.equal(restore.painted,restore.cells);
  await page.screenshot({path:path.join(out,'art-document-restored.png')});
  const layouts=[];
  for(const width of [320,390,768,1280])for(const type of ['pipes','electric','swap','cryptogram','shapes']){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>openTestPuzzle(t),type);
   const clipped=await page.evaluate(()=>zoomCardEl.scrollWidth>zoomCardEl.clientWidth+1);assert.equal(clipped,false,`${type} overflow at ${width}`);layouts.push({width,type});
  }
  // Story generation always includes each network appearance, across themes/seeds.
  await page.evaluate(()=>{for(const b of STORY_BOOK)for(let seed=0;seed<20;seed++){storyChoiceEl.value=b.id;startDeck('story');pendingSeed=seed;performDeal();const styles=[...cardContent.values()].filter(c=>c.puzzle?.type==='pipes').map(c=>c.puzzle.pipeStyle).sort();if(styles.join(',')!=='electric,water')throw Error('Missing pipe variant '+b.id);}});
  assert.deepEqual(errors,[]);await context.close();
  const offline=await browser.newContext(),app=await offline.newPage();await app.goto('http://127.0.0.1:'+server.address().port);await app.evaluate(()=>navigator.serviceWorker.ready);await app.waitForFunction(()=>!!navigator.serviceWorker.controller);await offline.setOffline(true);await app.reload();
  const missing=await app.evaluate(async()=>{const assets=['puzzle-art.js','puzzle-art.css',...['library','lucy','lighthouse'].map(t=>'art/scenes/'+t+'-document.svg')];return (await Promise.all(assets.map(async url=>({url,ok:(await fetch(url)).ok})))).filter(a=>!a.ok);});assert.deepEqual(missing,[]);await offline.close();
  console.log('Puzzle art passed: sequential animated flow, both variants, picture swap, pencil marks, exact document restoration, 20 responsive views, all story variants, offline assets.');
  fs.writeFileSync(path.join(out,'puzzle-art-results.json'),JSON.stringify({water,restore,layouts,errors,offline:true},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
