const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.qa-output');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,d)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(e?'Missing':d);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof makeDeductionPuzzle==='function');
  const logic=await page.evaluate(()=>{
   let count=0;const clueCounts=new Set();
   for(const theme of Object.keys(DEDUCTION_THEMES))for(let seed=0;seed<500;seed++){
    const p=withGameSeed(seed,()=>makeDeductionPuzzle(0,theme));
    const possible=THREE_ORDERS.filter(order=>p.clues.every(c=>deductionMatches(order,c)));
    if(possible.length!==1||possible[0].indexOf(p.sought)!==p.solutionIndex)throw Error('Ambiguous logic');
    if(p.clues.length<2||!p.clues.some(c=>c.kind!=='not'))throw Error('No real deduction needed');
    clueCounts.add(p.clues.length);count++;
   }
   return {count,clueCounts:[...clueCounts]};
  });assert.equal(logic.count,1500);
  await page.evaluate(()=>openTestPuzzle('deduction'));
  await page.waitForFunction(()=>getComputedStyle(zoomOverlay).opacity==='1');await page.screenshot({path:path.join(out,'discovery-logic.png')});
  const wrong=await page.evaluate(()=>[0,1,2].find(i=>i!==currentPuzzleContext.content.puzzle.solutionIndex));
  await page.locator('.deduction-choices button').nth(wrong).click();await page.getByRole('button',{name:'Check deduction',exact:true}).click();
  assert.equal(await page.evaluate(()=>currentPuzzleContext.content.puzzle.solved),false);
  const answer=await page.evaluate(()=>currentPuzzleContext.content.puzzle.solutionIndex);
  await page.locator('.deduction-choices button').nth(answer).click();await page.getByRole('button',{name:'Check deduction',exact:true}).click();
  assert.equal(await page.evaluate(()=>currentPuzzleContext.content.puzzle.solved),true);
  const beginning=await page.evaluate(()=>{closeZoom();startDeck('story');pendingSeed=127;performDeal();return {active:tabletopState.active.size,objects:[...tabletopState.active].filter(n=>isCombinableItem(n)).length,puzzles:[...tabletopState.active].filter(n=>cardContent.get(n).puzzle).length};});
  assert.deepEqual(beginning,{active:6,objects:3,puzzles:2});await page.waitForFunction(()=>getComputedStyle(zoomOverlay).opacity==='0');await page.screenshot({path:path.join(out,'discovery-six-leads.png'),fullPage:true});
  // Reach a picture through legitimate rewards and recipes, not by flipping it directly.
  const image=await page.evaluate(()=>{
   for(let step=0;step<100;step++){
    const visual=[...tabletopState.active].find(n=>cardContent.get(n).visualClue);
    if(visual!==undefined)return {num:visual,answer:cardContent.get(visual).visualClue.answer};
    const source=[...tabletopState.active].find(n=>cardContent.get(n).puzzle&&!cardContent.get(n).puzzle.solved);
    if(source!==undefined){const c=cardContent.get(source);openZoom(source);c.puzzle.solved=true;onPuzzleSolved(c,source);closeZoom();continue;}
    const reward=[...tabletopState.active].find(n=>tabletopRewardNumbers({num:n,content:cardContent.get(n)}).length);
    if(reward!==undefined){openZoom(reward);closeZoom();continue;}
    const recipe=[...cardContent].find(([n,c])=>!flippedNumbers.has(n)&&c.requires?.every(id=>tabletopState.active.has(id)));
    if(recipe){combineTabletopCards(...recipe[1].requires);closeZoom();continue;}
    throw Error('No path to picture');
   }
   throw Error('No picture found');
  });
  assert.equal(await page.evaluate(n=>drawTabletopCard(n,'code'),image.answer),false);
  await page.evaluate(n=>openZoom(n),image.num);
  assert.equal(await page.locator('#zoomHint').textContent(),'Find the one number hidden in this picture. Use it to draw the next card.');
  assert.equal(await page.locator('#zoomCard').getByRole('button',{name:/Take card/}).count(),0);
  assert.equal(await page.locator('#zoomItemArt svg path').count()>8,true);
  await page.waitForFunction(()=>getComputedStyle(zoomOverlay).opacity==='1');await page.screenshot({path:path.join(out,'discovery-hidden-number.png')});
  await page.locator('#zoomClose').click();
  assert.equal(await page.evaluate(n=>flippedNumbers.has(n),image.answer),false);
  await page.evaluate(n=>openZoom(n),image.num);await page.getByRole('button',{name:'I found a number',exact:true}).click();
  assert.equal(await page.locator('#codeDialog').evaluate(e=>e.open),true);
  const livesBefore=await page.evaluate(()=>lives);
  const bad=await page.evaluate(()=>Array.from({length:200},(_,i)=>i).find(n=>!flippedNumbers.has(n)&&!validCodeTargets().has(n)));
  await page.fill('#discoveryCode',String(bad));await page.locator('#codeForm button[type=submit]').click();assert.equal(await page.evaluate(()=>lives),livesBefore-1);
  await page.fill('#discoveryCode',String(image.answer));await page.locator('#codeForm button[type=submit]').click();
  assert.equal(await page.evaluate(n=>flippedNumbers.has(n),image.answer),true);assert.equal(await page.evaluate(n=>tabletopState.discarded.has(n),image.num),true);
  const storyLogic=await page.evaluate(()=>{
   startDeck('story');pendingSeed=99;performDeal();
   const story=[...tabletopState.active].find(n=>cardContent.get(n).kind==='story');openZoom(story);closeZoom();
   const n=[...tabletopState.active].find(n=>cardContent.get(n).puzzle?.type==='deduction');openZoom(n);
   const c=cardContent.get(n);return {num:n,answer:c.puzzle.solutionIndex,rewards:c.unlocks};
  });
  await page.locator('.deduction-choices button').nth((storyLogic.answer+1)%3).click();await page.getByRole('button',{name:'Check deduction',exact:true}).click();
  assert.equal(await page.evaluate(()=>lives),2);
  await page.locator('#zoomClose').click();assert.equal(await page.evaluate(ids=>ids.some(n=>flippedNumbers.has(n)),storyLogic.rewards),false);
  await page.evaluate(n=>openZoom(n),storyLogic.num);await page.locator('.deduction-choices button').nth(storyLogic.answer).click();await page.getByRole('button',{name:'Check deduction',exact:true}).click();
  await page.getByRole('button',{name:'Take cards '+storyLogic.rewards.join(' and '),exact:true}).click();
  assert.equal(await page.evaluate(ids=>ids.every(n=>flippedNumbers.has(n)),storyLogic.rewards),true);assert.equal(await page.evaluate(()=>lives),2);
  assert.equal(await page.evaluate(()=>{
   for(const theme of Object.keys(DEDUCTION_THEMES))for(let variant=0;variant<2;variant++)for(let answer=0;answer<200;answer++){
    const parsed=new DOMParser().parseFromString(hiddenPictureArtwork({theme,variant,answer}),'image/svg+xml');
    if(parsed.querySelector('parsererror'))return false;
   }
   return true;
  }),true);
  // Reverse and randomized choices must reach the same complete ending.
  const branches=await page.evaluate(()=>{
   let games=0,maxActive=0;const picCounts=new Set();
   for(const book of STORY_BOOK)for(let seed=0;seed<25;seed++){
    storyChoiceEl.value=book.id;startDeck('story');pendingSeed=seed;performDeal();assistedRun=true;
    const pictures=[...cardContent.values()].filter(c=>c.visualClue);if(pictures.length!==2)throw Error('Picture frequency');picCounts.add(pictures.length);
    if([...cardContent.values()].filter(c=>c.puzzle?.type==='deduction').length!==2)throw Error('Logic missing');
    for(let step=0;step<160&&!winPending;step++){
     maxActive=Math.max(maxActive,tabletopState.active.size);
     const actions=[];
     for(const n of tabletopState.active){const c=cardContent.get(n);if(c.visualClue)actions.push(()=>{openZoom(n);if(!drawTabletopCard(c.visualClue.answer,'code'))throw Error('Hidden number blocked');closeZoom();});else if(c.puzzle&&!c.puzzle.solved)actions.push(()=>{openZoom(n);c.puzzle.solved=true;onPuzzleSolved(c,n);closeZoom();});else if(tabletopRewardNumbers({num:n,content:c}).length)actions.push(()=>{openZoom(n);closeZoom();});}
     for(const [n,c] of cardContent)if(!flippedNumbers.has(n)&&c.requires?.every(id=>tabletopState.active.has(id)))actions.push(()=>{combineTabletopCards(...c.requires);closeZoom();});
     if(!actions.length)throw Error('Branch deadlock '+book.id+' '+seed);
     actions[(step*7+seed)%actions.length]();
    }
    if(!winPending||[...cardContent].some(([n,c])=>c.isProgress&&!flippedNumbers.has(n)))throw Error('Unfinished branch');games++;
   }
   return {games,maxActive,picCounts:[...picCounts]};
  });assert.equal(branches.games,75);assert.ok(branches.maxActive>=6);
  const layouts=[];
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:900});await page.evaluate(()=>openTestPuzzle('deduction'));
   assert.equal(await page.evaluate(()=>zoomCardEl.scrollWidth>zoomCardEl.clientWidth+1),false);layouts.push(width);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'discovery-results.json'),JSON.stringify({logic,beginning,branches,layouts,errors},null,2));
  console.log('Story discovery checks passed', {logic,beginning,branches});await context.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
