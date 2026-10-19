// Default adventure: active table, code discoveries, real mouse/touch combining,
// permanent recipe state, discards, life loss, responsive layout and offline assets.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.qa-output');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file===root)file=path.join(root,'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'Missing':data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',hasTouch:true});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.waitForFunction(()=>typeof dealTabletop==='function');
    await page.locator('#adventureHero img').evaluate(image=>image.decode());
    await page.screenshot({path:path.join(out,'tabletop-home.png'),fullPage:true});
    for(const theme of ['library','lucy','lighthouse']){
      await page.locator('[data-story="'+theme+'"]').click();await page.locator('#adventureHero img').evaluate(image=>image.decode());
    }
    await page.locator('#beginAdventure').click();
    assert.equal(await page.locator('#zoomOverlay').evaluate(e=>e.classList.contains('open')),true);
    await page.locator('#zoomClose').click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#table .card').count(),2);
    assert.equal(await page.evaluate(()=>tabletopState.discarded.size),1);
    await page.locator('#table img').first().evaluate(image=>image.decode());
    await page.screenshot({path:path.join(out,'tabletop-start.png'),fullPage:true});
    const puzzle=await page.evaluate(()=>[...tabletopState.active].find(n=>cardContent.get(n).puzzle));
    const rewards=await page.evaluate(n=>cardContent.get(n).unlocks,puzzle);
    await page.evaluate(n=>openZoom(n),puzzle);await page.locator('#zoomClose').click();
    assert.equal(await page.evaluate(ids=>ids.some(n=>flippedNumbers.has(n)),rewards),false);
    // A correct-looking reward code is still premature until its puzzle is solved.
    await page.locator('#openCode').click();await page.fill('#discoveryCode',String(rewards[0]));
    await page.locator('#codeForm button[type="submit"]').click();
    assert.equal(await page.evaluate(()=>lives),2);assert.match(await page.locator('#codeFeedback').textContent(),/Incorrect/);
    await page.locator('#codeDialog .dialog-close').click();
    await page.evaluate(n=>{const c=cardContent.get(n);c.puzzle.solved=true;onPuzzleSolved(c,n);},puzzle);
    const enter=async number=>{
      await page.locator('#openCode').click();await page.fill('#discoveryCode',String(number));await page.locator('#codeForm button[type="submit"]').click();
    };
    await page.evaluate(n=>openZoom(n),puzzle);
    await page.getByRole('button',{name:'Take cards '+rewards.join(' and '),exact:true}).click();
    assert.equal(await page.evaluate(ids=>ids.every(n=>flippedNumbers.has(n)),rewards),true);
    assert.equal(await page.evaluate(n=>tabletopState.discarded.has(n),puzzle),true);
    assert.equal(await page.locator('#codeDialog').evaluate(e=>e.open),false);
    // Find the second ingredient by solving the next puzzle, then drag a real pair.
    const pair=await page.evaluate(()=>{
      const p=[...tabletopState.active].find(n=>cardContent.get(n).puzzle&&!cardContent.get(n).puzzle.solved);
      const c=cardContent.get(p);c.puzzle.solved=true;onPuzzleSolved(c,p);
      c.unlocks.forEach(n=>drawTabletopCard(n,'code'));
      return [...cardContent].find(([n,c])=>!flippedNumbers.has(n)&&c.requires?.every(id=>tabletopState.active.has(id)));
    });
    const [result,recipe]=pair;
    // Codes cannot bypass the actual combine action even when both items are present.
    assert.equal(await page.evaluate(n=>drawTabletopCard(n,'code'),result),false);
    const source=page.locator('.tabletop-card[data-number="'+recipe.requires[0]+'"]');
    const target=page.locator('.tabletop-card[data-number="'+recipe.requires[1]+'"]');
    await page.locator('#table').scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'tabletop-before-combine.png'),fullPage:true});
    const from=await source.boundingBox(),to=await target.boundingBox();
    await page.mouse.move(from.x+from.width/2,from.y+65);await page.mouse.down();
    await page.mouse.move(to.x+to.width/2,to.y+65,{steps:12});
    assert.equal(await page.locator('.drop-target').count(),1);
    await page.mouse.up();assert.equal(await page.evaluate(n=>flippedNumbers.has(n),result),true);
    assert.equal(await page.locator('.card-drag-ghost').count(),0);
    assert.equal(await page.evaluate(ids=>ids.every(n=>tabletopState.discarded.has(n)),recipe.requires),true);
    await page.waitForFunction(()=>getComputedStyle(zoomOverlay).opacity==='1');await page.screenshot({path:path.join(out,'tabletop-made-item.png'),fullPage:true});
    const directRewards=recipe.unlocks;
    const livesBeforeReward=await page.evaluate(()=>lives);
    assert.equal(await page.locator('.tabletop-card[data-number="'+result+'"] .hint').textContent(),'Tap to read your discovery.');
    await page.getByRole('button',{name:'Take '+(directRewards.length===1?'card ':'cards ')+directRewards.join(' and '),exact:true}).click();
    assert.equal(await page.locator('#codeDialog').evaluate(e=>e.open),false);
    assert.equal(await page.evaluate(ids=>ids.every(n=>flippedNumbers.has(n)),directRewards),true);
    assert.equal(await page.evaluate(()=>lives),livesBeforeReward);
    assert.equal(await page.evaluate(n=>tabletopState.discarded.has(n),result),true);
    // Re-reading and closing an exhausted card cannot give duplicate rewards.
    const afterReward=await page.evaluate(()=>flippedNumbers.size);
    await page.evaluate(n=>openZoom(n),result);await page.locator('#zoomClose').click();
    assert.equal(await page.evaluate(()=>flippedNumbers.size),afterReward);
    await page.locator('#openDiscards').click();assert.ok(await page.locator('#discardList button').count()>=3);
    await page.locator('#discardList button').first().click();assert.equal(await page.locator('#zoomOverlay').evaluate(e=>e.classList.contains('open')),true);
    await page.locator('#zoomClose').click();
    // A repeated code and a canceled drag never cost a life.
    const before=await page.evaluate(()=>lives);await enter(recipe.requires[0]);
    assert.match(await page.locator('#codeFeedback').textContent(),/already/);assert.equal(await page.evaluate(()=>lives),before);
    await page.locator('#codeDialog .dialog-close').click();
    // Branch order varies: take reward codes forward and backward across seeds.
    for(const dismissal of ['close','escape','backdrop']){
      const claim=await page.evaluate(()=>{
        startDeck('story');pendingSeed=345;performDeal();
        for(let step=0;step<20;step++){
          const pair=[...cardContent].find(([n,c])=>!flippedNumbers.has(n)&&c.requires?.every(id=>tabletopState.active.has(id)));
          if(pair){combineTabletopCards(...pair[1].requires);return {num:pair[0],rewards:pair[1].unlocks,size:flippedNumbers.size};}
          const p=[...tabletopState.active].find(n=>cardContent.get(n).puzzle&&!cardContent.get(n).puzzle.solved);
          if(p!==undefined){const c=cardContent.get(p);c.puzzle.solved=true;onPuzzleSolved(c,p);}
          const code=[...validCodeTargets()][0];if(code!==undefined)drawTabletopCard(code,'code');
        }
        throw Error('No reward source');
      });
      if(dismissal==='close')await page.locator('#zoomClose').click();
      else if(dismissal==='escape')await page.keyboard.press('Escape');
      else await page.locator('#zoomOverlay').click({position:{x:5,y:5}});
      assert.equal(await page.evaluate(ids=>ids.every(n=>flippedNumbers.has(n)),claim.rewards),true);
      assert.equal(await page.evaluate(()=>lives),3);
      assert.equal(await page.evaluate(()=>flippedNumbers.size),claim.size+claim.rewards.length);
      await page.evaluate(()=>closeZoom());
      assert.equal(await page.evaluate(()=>flippedNumbers.size),claim.size+claim.rewards.length);
    }
    assert.equal(await page.evaluate(()=>{
      const stale={num:[...flippedNumbers][0],content:cardContent.get([...flippedNumbers][0])};
      startDeck('story');performDeal();const before=flippedNumbers.size;
      collectTabletopRewards(stale);return before===flippedNumbers.size;
    }),true);
    const results=await page.evaluate(()=>{
      let games=0,maxActive=0;const puzzleTypes=new Set();
      for(const book of STORY_BOOK)for(let seed=0;seed<20;seed++){
        storyChoiceEl.value=book.id;startDeck('story');pendingSeed=seed;performDeal();assistedRun=true;
        for(let step=0;step<100&&!winPending;step++){
          maxActive=Math.max(maxActive,tabletopState.active.size);
          if(tabletopState.active.size>4)throw Error('Overwhelming table');
          const puzzles=[...tabletopState.active].filter(n=>cardContent.get(n).puzzle&&!cardContent.get(n).puzzle.solved);
          if(puzzles.length){const n=puzzles[0],c=cardContent.get(n);puzzleTypes.add(c.puzzle.type);openZoom(n);c.puzzle.solved=true;onPuzzleSolved(c,n);closeZoom();continue;}
          const clues=[...tabletopState.active].filter(n=>cardContent.get(n).unlocks?.some(id=>!flippedNumbers.has(id)));
          if(clues.length){openZoom(seed%2?clues[0]:clues.at(-1));closeZoom();continue;}
          const pair=[...cardContent].find(([n,c])=>!flippedNumbers.has(n)&&c.requires?.every(id=>tabletopState.active.has(id)));
          if(pair){combineTabletopCards(...pair[1].requires);closeZoom();continue;}
          throw Error('Adventure stuck: '+book.id+' seed '+seed);
        }
        if(!winPending)throw Error('Ending not reached');
        if([...cardContent].some(([n,c])=>c.isProgress&&!flippedNumbers.has(n)))throw Error('Early ending');
        if(tabletopState.discarded.size!==41)throw Error('Unfinished discard tracking');
        games++;
      }
      return {games,maxActive,puzzleTypes:[...puzzleTypes].sort()};
    });assert.equal(results.games,60);assert.deepEqual(results.puzzleTypes,['cryptogram','pipes','shapes','swap']);console.log('Active-table adventure playthroughs',results);
    // Invalid item pairs lose exactly one life; the third error ends the run.
    const penalties=await page.evaluate(()=>{
      startDeck('story');pendingSeed=12;performDeal();
      const p=[...tabletopState.active].find(n=>cardContent.get(n).puzzle);const c=cardContent.get(p);c.puzzle.solved=true;onPuzzleSolved(c,p);
      c.unlocks.forEach(n=>drawTabletopCard(n,'code'));
      const items=[...tabletopState.active].filter(n=>cardContent.get(n).backItem);const size=tabletopState.active.size;
      for(let i=0;i<4;i++)combineTabletopCards(items[0],items[1]);
      return {lives,mistakes,size,after:tabletopState.active.size,ended:runEnded};
    });assert.equal(penalties.lives,0);assert.equal(penalties.mistakes,3);assert.equal(penalties.size,penalties.after);assert.equal(penalties.ended,true);
    await page.waitForTimeout(600);assert.equal(await page.locator('#gameOverOverlay').evaluate(e=>e.classList.contains('open')),true);
    await page.locator('#gameOverRestart').click();assert.equal(await page.locator('#table .card').count(),2);assert.equal(await page.evaluate(()=>lives),3);
    const layouts=[];
    for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>{startDeck('story');pendingSeed=1234;performDeal();});
      const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...tableEl.querySelectorAll('.card-front')].filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).length}));
      assert.equal(layout.overflow,false);assert.equal(layout.clipped,0);layouts.push(layout);
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#openCode').click();await page.screenshot({path:path.join(out,'tabletop-code.png')});
    await page.keyboard.press('Escape');assert.equal(await page.locator('#codeDialog').evaluate(e=>e.open),false);
    // Real touch pointer events, including cancellation and a correct combine.
    const touchPair=await page.evaluate(()=>{
      for(let i=0;i<2;i++){
        const n=[...tabletopState.active].find(n=>cardContent.get(n).puzzle&&!cardContent.get(n).puzzle.solved);
        const c=cardContent.get(n);c.puzzle.solved=true;onPuzzleSolved(c,n);c.unlocks.forEach(id=>drawTabletopCard(id,'code'));
      }
      return [...cardContent].find(([n,c])=>!flippedNumbers.has(n)&&c.requires?.every(id=>tabletopState.active.has(id)));
    });
    const cdp=await context.newCDPSession(page);
    const first=page.locator('.tabletop-card[data-number="'+touchPair[1].requires[0]+'"]');
    const second=page.locator('.tabletop-card[data-number="'+touchPair[1].requires[1]+'"]');
    await page.locator('#table').scrollIntoViewIfNeeded();await page.waitForTimeout(500);const a=await first.boundingBox(),b=await second.boundingBox();
    const p1={x:a.x+a.width/2,y:a.y+70},p2={x:b.x+b.width/2,y:b.y+70};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p1.x+20,y:p1.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    assert.equal(await page.locator('.card-drag-ghost').count(),0);assert.equal(await page.evaluate(()=>lives),3);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
    for(let step=1;step<=10;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p1.x+(p2.x-p1.x)*step/10,y:p1.y+(p2.y-p1.y)*step/10}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.evaluate(n=>flippedNumbers.has(n),touchPair[0]),true);
    assert.deepEqual(errors,[]);console.log('Code entry, actual mouse/touch combines, cancellation, discards and layouts passed',layouts);
    await context.close();
    const installed=await browser.newContext({viewport:{width:390,height:844}});const app=await installed.newPage();
    await app.goto(base);await app.evaluate(async()=>await navigator.serviceWorker.ready);await app.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await installed.setOffline(true);await app.reload();await app.locator('#beginAdventure').click();await app.locator('#zoomClose').click();
    assert.equal(await app.locator('#table .card').count(),2);
    const missing=await app.evaluate(async()=>{
      const paths=['tabletop.css','tabletop.js','art/scenes/lighthouse.png','art/scenes/library.png','art/scenes/lucy.png','art/scenes/lantern-empty.png','art/scenes/oil-flask.png','art/scenes/lantern-lit.png'];
      return (await Promise.all(paths.map(async p=>[p,(await fetch(p)).ok]))).filter(([,ok])=>!ok);
    });assert.deepEqual(missing,[]);await installed.close();
    fs.writeFileSync(path.join(out,'tabletop-results.json'),JSON.stringify({results,layouts,penalties,errors,offline:true,mouse:true,touch:true},null,2));
    console.log('New active-table adventure and all six new artwork assets work offline.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
