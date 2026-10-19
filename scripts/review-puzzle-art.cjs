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
  assert.equal(await page.locator('.swap-tile').count(),16);
  assert.equal(await page.locator('.tube-collar').count(),0);
  await page.getByRole('button',{name:'View reference',exact:true}).click();await page.locator('#puzzleReference').evaluate(e=>e.decode());
  await page.screenshot({path:path.join(out,'art-picture-reference.png')});
  await page.getByRole('button',{name:'Hide reference',exact:true}).click();
  assert.equal(await page.evaluate(()=>{const p=currentPuzzleContext.content.puzzle;for(let i=0;i<p.tiles.length;i++){const j=p.tiles.indexOf(i+1);if(i!==j){swapGridEl.children[i].click();swapGridEl.children[j].click();}}return p.solved;}),true);
  await page.screenshot({path:path.join(out,'art-picture-solved.png')});
  await page.evaluate(()=>openTestPuzzle('cryptogram'));
  await page.evaluate(()=>{const p=currentPuzzleContext.content.puzzle;[...cipherKeyboardEl.children].find(e=>e.textContent===p.plaintext[0]).click();});
  assert.ok(await page.locator('.pencil-mark').count()>0);
  assert.equal(await page.locator('.cipher-blank').first().evaluate(e=>getComputedStyle(e).fontStyle),'normal');
  assert.ok(await page.locator('.cipher-blank').first().evaluate(e=>!getComputedStyle(e).fontFamily.includes('cursive')));
  const protectedLetters=await page.evaluate(()=>{
    const p=currentPuzzleContext.content.puzzle;
    const locked=p.guesses.map((g,i)=>g&&g===p.plaintext[i]?i:null).filter(i=>i!==null);
    const before=locked.map(i=>p.guesses[i]);
    const units=[...cipherGridEl.querySelectorAll('.cipher-blank')];
    const indices=[...p.ciphertext].map((ch,i)=>ch===' '?null:i).filter(i=>i!==null);
    units[indices.indexOf(locked[0])].click();cipherKeyboardEl.querySelector('.cipher-key-back').click();
    if(locked.some((i,j)=>p.guesses[i]!==before[j]))throw Error('Correct letter erased');
    const index=p.guesses.findIndex((g,i)=>!g&&p.ciphertext[i]!==' ');
    cipherGridEl.querySelectorAll('.cipher-blank')[indices.indexOf(index)].click();
    const wrong=[...cipherKeyboardEl.querySelectorAll('.cipher-key')].find(b=>!b.disabled&&/^[A-Z]$/.test(b.textContent)&&b.textContent!==p.plaintext[index]);
    wrong.click();cipherGridEl.querySelectorAll('.cipher-blank')[indices.indexOf(index)].click();cipherKeyboardEl.querySelector('.cipher-key-back').click();
    if(p.guesses[index])throw Error('Incorrect letter could not be erased');
    if(locked.some((i,j)=>p.guesses[i]!==before[j]))throw Error('Backspace reached a locked letter');
    return locked.length;
  });assert.ok(protectedLetters>0);
  await page.screenshot({path:path.join(out,'art-pencil-cryptogram.png')});
  await page.evaluate(()=>openTestPuzzle('shapes'));await page.getByRole('button',{name:/Hint \(/}).click();await page.getByRole('button',{name:/Hint \(/}).click();
  await page.screenshot({path:path.join(out,'art-torn-document.png')});
  const restore=await page.evaluate(()=>{
   const p=currentPuzzleContext.content.puzzle,coverage=shapesCoverage(p);
   const piece=p.pieces.find(pc=>!pc.placed),[r,c]=piece.solvedOrigin;

   const solution=solveShapeRemainder(p);if(!solution||solution.some(x=>x.origin.some((v,i)=>v!==x.piece.solvedOrigin[i])))throw Error('Hint picture does not match');
   solution.forEach(({piece,origin})=>{piece.placed=true;piece.placedOrigin=origin;});
   renderPuzzle(currentPuzzleContext.content,null,{isTest:true});
   return {solved:shapesIsSolved(p),painted:shapesGridEl.querySelectorAll('.document-fragment').length,cells:p.rows*p.cols};
  });assert.equal(restore.solved,true);assert.equal(restore.painted,restore.cells);
  await page.screenshot({path:path.join(out,'art-document-restored.png')});
  const variety=await page.evaluate(()=>{
    const sizes=new Set(),counts=new Set(),boards=new Set();let freePlacements=0;
    for(let seed=0;seed<2000;seed++){
      const p=withGameSeed(seed,()=>makeShapesPuzzle(7)),duplicates=new Map(),coverage=new Set();
      boards.add(p.rows*p.cols);counts.add(p.pieces.length);
      p.pieces.forEach(pc=>{
        sizes.add(pc.currentCells.length);const key=shapeSilhouette(pc.currentCells);duplicates.set(key,(duplicates.get(key)||0)+1);
        if(!shapeCellsConnected(pc.currentCells))throw Error('Disconnected fragment');
        pc.currentCells.forEach(([r,c])=>coverage.add((r+pc.solvedOrigin[0])+','+(c+pc.solvedOrigin[1])));
        if(!seed)for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++)if((r!==pc.solvedOrigin[0]||c!==pc.solvedOrigin[1])&&shapesCanPlace(pc,r,c,p.rows,p.cols,shapesCoverage(p)))freePlacements++;
      });
      if(Math.max(...duplicates.values())>2)throw Error('More than two matching shapes');
      if(coverage.size!==p.rows*p.cols)throw Error('Incomplete generated document');
    }
    return {sizes:[...sizes],counts:[...counts],boards:[...boards],freePlacements};
  });assert.ok(variety.sizes.length>=4);assert.ok(variety.counts.length>=3);assert.ok(variety.freePlacements>0);
  await page.evaluate(()=>openTestPuzzle('shapes'));
  const trial=await page.evaluate(()=>{
    const p=currentPuzzleContext.content.puzzle;
    for(const piece of p.pieces)for(let r=p.rows-1;r>=0;r--)for(let c=p.cols-1;c>=0;c--){
      if((r!==piece.solvedOrigin[0]||c!==piece.solvedOrigin[1])&&shapesCanPlace(piece,r,c,p.rows,p.cols,shapesCoverage(p)))return {id:piece.id,origin:[r,c],cells:piece.currentCells,cell:parseFloat(shapesGridEl.firstElementChild.style.width),border:shapesGridEl.clientLeft};
    }
    throw Error('No trial placement found');
  });
  const fragment=page.locator('.shapes-piece[data-piece-id="'+trial.id+'"]');await fragment.scrollIntoViewIfNeeded();
  const from=await fragment.boundingBox(),board=await page.locator('#shapesGrid').boundingBox();
  const target={x:board.x+trial.border+4+trial.origin[1]*(trial.cell+2)+(Math.max(...trial.cells.map(c=>c[1]))*(trial.cell+2)+trial.cell)/2,y:board.y+trial.border+4+trial.origin[0]*(trial.cell+2)+(Math.max(...trial.cells.map(c=>c[0]))*(trial.cell+2)+trial.cell)/2};
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:15});await page.mouse.up();
  assert.deepEqual(await page.evaluate(id=>currentPuzzleContext.content.puzzle.pieces.find(pc=>pc.id===id).placedOrigin,trial.id),trial.origin);
  await page.getByRole('button',{name:/Hint \(/}).click();
  assert.equal(await page.evaluate(()=>!!solveShapeRemainder(currentPuzzleContext.content.puzzle)),true);
  const layouts=[];
  for(const width of [320,390,768,1280])for(const type of ['pipes','electric','swap','cryptogram','shapes']){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>openTestPuzzle(t),type);
   const clipped=await page.evaluate(()=>zoomCardEl.scrollWidth>zoomCardEl.clientWidth+1);assert.equal(clipped,false,`${type} overflow at ${width}`);layouts.push({width,type});
  }
  await page.evaluate(()=>openTestPuzzle('pipes'));
  const beforeResize=await page.evaluate(()=>currentPuzzleContext.content.puzzle.tiles.map(t=>t.openings));
  await page.setViewportSize({width:320,height:720});await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>currentPuzzleContext.content.puzzle.tiles.map(t=>t.openings)),beforeResize);
  assert.equal(await page.evaluate(()=>pipesGridEl.getBoundingClientRect().width<=zoomCardEl.clientWidth),true);
  // Story generation always includes each network appearance, across themes/seeds.
  await page.evaluate(()=>{for(const b of STORY_BOOK)for(let seed=0;seed<20;seed++){storyChoiceEl.value=b.id;startDeck('story');pendingSeed=seed;performDeal();const styles=[...cardContent.values()].filter(c=>c.puzzle?.type==='pipes').map(c=>c.puzzle.pipeStyle).sort();if(styles.join(',')!=='electric,water')throw Error('Missing pipe variant '+b.id);}});
  assert.deepEqual(errors,[]);await context.close();
  const offline=await browser.newContext(),app=await offline.newPage();await app.goto('http://127.0.0.1:'+server.address().port);await app.evaluate(()=>navigator.serviceWorker.ready);await app.waitForFunction(()=>!!navigator.serviceWorker.controller);await offline.setOffline(true);await app.reload();
  const missing=await app.evaluate(async()=>{const assets=['puzzle-art.js','puzzle-art.css',...['library','lucy','lighthouse'].map(t=>'art/scenes/'+t+'-document.svg')];return (await Promise.all(assets.map(async url=>({url,ok:(await fetch(url)).ok})))).filter(a=>!a.ok);});assert.deepEqual(missing,[]);await offline.close();
  console.log('Puzzle art passed: sequential animated flow, both variants, picture swap, pencil marks, exact document restoration, 20 responsive views, all story variants, offline assets.');
  fs.writeFileSync(path.join(out,'puzzle-art-results.json'),JSON.stringify({water,restore,variety,protectedLetters,layouts,errors,offline:true,freePlacementDrag:true},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
