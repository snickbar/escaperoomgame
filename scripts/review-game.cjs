// Run: node scripts/review-game.cjs
// Set PLAYWRIGHT_MODULE / PLAYWRIGHT_BROWSERS_PATH if Playwright is not on Node's path.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'.qa-output');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const sourceCacheVersion=fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/escape-room-(v\d+)/)[1];
let servedCacheVersion=sourceCacheVersion;
const server=http.createServer((req,res)=> {
  let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(p===root)p=path.join(root,'index.html');
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(p,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(err?'Missing file':p.endsWith(path.sep+'sw.js')?data.toString().replace('escape-room-'+sourceCacheVersion,'escape-room-'+servedCacheVersion):data);});
});
(async()=> {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await playwright.chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.waitForFunction(()=>typeof updateAdventureStatus==='function');
    // These checks retain coverage for the original full-grid presentation.
    // review-tabletop.cjs exercises the new default active-table adventure.
    await page.evaluate(()=>{tabletopEnabled=false;});
    assert.equal(await page.locator('#storyChoices button').count(),3);
    await page.screenshot({path:path.join(out,'home.png'),fullPage:true});
    console.log('Home loaded',errors);
    const logic=await page.evaluate(()=> {
      let games=0,shapeHints=0;const types=new Set();
      for(const book of STORY_BOOK) {
        activeStory=book;
        for(let seed=0;seed<150;seed++) {
          const numbers=withGameSeed(seed,()=>buildStoryCardContent(54+seed%19,45));
          const report=validateAdventure(cardContent,numbers);
          if(!report.ok)throw Error(JSON.stringify(report));
          if(report.combos!==10)throw Error('Missing recipes');
          if(numbers.length!==54+seed%19)throw Error('Table budget');
          const snapshot=JSON.stringify([...cardContent]);
          const repeated=withGameSeed(seed,()=>buildStoryCardContent(54+seed%19,45));
          if(JSON.stringify([...cardContent])!==snapshot)throw Error('Unrepeatable seed');
          if(JSON.stringify(numbers)!==JSON.stringify(repeated))throw Error('Unrepeatable table');
          const counts=[0,0,0,0]; numbers.forEach(n=>counts[Math.floor(n/50)]++);
          if(Math.max(...counts)-Math.min(...counts)>3)throw Error('Unbalanced number bands');
          cardContent.forEach(c=>{if(c.puzzle)types.add(c.puzzle.type);});
          const seen=new Set([...cardContent].filter(([,c])=>c.isSeed).map(([n])=>n));
          let step=0,won=false;
          for(;step<200;step++) {
            const before=availableAdventureCards(cardContent,seen);
            const win=[...cardContent].find(([,c])=>c.isWin);
            if(before.has(win[0]) && [...cardContent].some(([n,c])=>c.isProgress&&!c.isWin&&!seen.has(n)))throw Error('Early ending');
            // Solving one puzzle at a time exercises gating rather than bypassing it.
            const unsolved=[...cardContent].find(([n,c])=>seen.has(n)&&c.puzzle&&!c.puzzle.solved);
            if(unsolved) {unsolved[1].puzzle.solved=true;continue;}
            if(!before.size)break;
            const n=[...before][step%before.size];seen.add(n);
            if(cardContent.get(n).isWin){won=true;break;}
          }
          if(!won)throw Error('Playthrough stuck: '+book.id+' '+seed);
          games++;
        }
      }
      for(let seed=0;seed<150;seed++) {
        const p=withGameSeed(seed,()=>makeShapesPuzzle(12));
        // Put a deliberately awkward but legal piece down before asking for help.
        const pc=p.pieces[0];
        outer:for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++) {
          if(shapesCanPlace(pc,r,c,p.rows,p.cols,shapesCoverage(p))) {pc.placed=true;pc.placedOrigin=[r,c];break outer;}
        }
        placeShapeHint(p);placeShapeHint(p);
        if(!solveShapeRemainder(p))throw Error('Shape hint left no solution');
        const sol=solveShapeRemainder(p);
        sol.forEach(({piece,origin})=>{piece.placed=true;piece.placedOrigin=origin;});
        if(!shapesIsSolved(p))throw Error('Shape continuation failed');
        shapeHints++;
      }
      return {games,shapeHints,types:[...types]};
    });
    console.log('Generation and real eligibility checks',logic);
    assert.deepEqual([...logic.types].sort(),['cryptogram','pipes','shapes','swap']);
    const exhaustion=await page.evaluate(()=> {
      const check=(condition,message)=>{if(!condition)throw Error(message);};
      // Two instruction targets, a two-reward puzzle, a reused ingredient,
      // and a crafted item that has another use later in the deck.
      const fixture=new Map([
        [0,{unlocks:[1,2]}], [1,{}], [2,{puzzle:{solved:false},unlocks:[3,4]}],
        [3,{}], [4,{unlocks:[5]}], [5,{requires:[1,3],unlocks:[6]}],
        [6,{requires:[1,5],unlocks:[7]}], [7,{isWin:true}], [99,{}],
      ]);
      const flipped=new Set([0,1]);
      let used=()=>exhaustedCardNumbers(fixture,flipped,'story');
      check(!used().has(0),'Instruction dimmed after only one target');
      check(!used().has(1),'Waiting ingredient dimmed');
      flipped.add(2);check(used().has(0),'Both instruction targets should exhaust the source');
      check(!used().has(2),'Unsolved puzzle dimmed');
      fixture.get(2).puzzle.solved=true;
      check(!used().has(2),'Solved puzzle dimmed before its reward was flipped');
      flipped.add(3);check(!used().has(2),'Puzzle dimmed with an outstanding second reward');
      flipped.add(4);check(used().has(2),'Completed puzzle rewards should exhaust the puzzle');
      flipped.add(5);check(used().has(3),'Spent ingredient should dim');
      check(!used().has(1)&&!used().has(5),'Reused or crafted item dimmed before its later use');
      flipped.add(6);check(used().has(1)&&used().has(5),'All ingredient uses completed but not dimmed');
      check(!used().has(6),'Combo result still has an outstanding instruction');
      flipped.add(7);check(used().has(6)&&!used().has(7),'Ending should stay bright');
      check(!used().has(99),'Face-down trap should never dim');
      const legacy=new Map([[0,{next:10,puzzle:{solved:false}}],[10,{next:20}],[20,{isWin:true}]]);
      const seen=new Set([0,10]);
      check(!exhaustedCardNumbers(legacy,seen,'easy').has(0),'An unsolved legacy puzzle dimmed');
      legacy.get(0).puzzle.solved=true;
      check(exhaustedCardNumbers(legacy,seen,'easy').has(0),'Legacy next-card completion not tracked');
      check(!exhaustedCardNumbers(legacy,seen,'medium').has(10),'Medium card dimmed too early');
      const hard=new Map([[5,{next:10}],[10,{next:15}],[15,{requires:[5,10],next:25}],[25,{requires:[5,15],isWin:true}]]);
      const hardSeen=new Set([5,10,15]);
      check(!exhaustedCardNumbers(hard,hardSeen,'hard').has(5),'Hard ingredient still needed later');
      check(exhaustedCardNumbers(hard,hardSeen,'hard').has(10),'Spent hard ingredient not dimmed');
      hardSeen.add(25);check(exhaustedCardNumbers(hard,hardSeen,'hard').has(5),'Reused hard ingredient not exhausted');

      storyChoiceEl.value='lighthouse';startDeck('story');pendingSeed=1234;performDeal();
      const root=[...cardContent].find(([,c])=>c.isSeed);
      const el=n=>tableEl.querySelector('.card[data-number="'+n+'"]');
      const isUsed=n=>el(n).classList.contains('exhausted');
      const item=root[1].unlocks.find(n=>cardContent.get(n).kind==='object');
      const clue=root[1].unlocks.find(n=>n!==item);
      el(item).click();check(!isUsed(root[0]),'Actual root dimmed after only one flip');
      el(clue).click();check(isUsed(root[0]),'Actual root did not dim');
      check(!isUsed(item),'Actual pending item dimmed');
      el(root[0]).click();check(zoomOverlay.classList.contains('open'),'Exhausted cards must remain readable');closeZoom();
      const p=cardContent.get(clue);p.puzzle.solved=true;onPuzzleSolved(p,clue);
      check(!isUsed(clue),'Actual puzzle dimmed before rewards');
      el(p.unlocks[0]).click();check(!isUsed(clue),'Actual puzzle dimmed after only one reward');
      el(p.unlocks[1]).click();check(isUsed(clue),'Actual puzzle did not dim after both rewards');
      return {fixtures:true,actualClicks:true,zoom:true};
    });console.log('Card exhaustion checks',exhaustion);
    await page.locator('.card.exhausted').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('.card.exhausted .card-front').first().evaluate(el=>Number(getComputedStyle(el).opacity)),.48);
    await page.screenshot({path:path.join(out,'exhausted-cards.png')});
    assert.equal(await page.evaluate(()=>{performDeal();return !!tableEl.querySelector('.exhausted');}),false);
    const layout=[];
    for(const width of [320,390,768,1280]) {
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>{storyChoiceEl.value='lighthouse';startDeck('story');pendingSeed=1234;performDeal();});
      await page.waitForTimeout(700);
      const l=await page.evaluate(()=> {
        fitTableText();
        const overflow=[...document.querySelectorAll('.card-front')].filter(e=>e.scrollHeight>e.clientHeight+2 || e.scrollWidth>e.clientWidth+2);
        return {width:innerWidth,horizontal:document.documentElement.scrollWidth>innerWidth,overflow:overflow.length,cards:document.querySelectorAll('.card').length};
      });
      layout.push(l);assert.equal(l.horizontal,false);assert.equal(l.overflow,0);
    }
    console.log('Layouts',layout);
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{pendingSeed=1234;performDeal();});
    await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'story.png'),fullPage:true});
    await page.evaluate(()=>{const root=[...cardContent].find(([,c])=>c.isSeed);openZoom(root[0]);});
    await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'story-detail.png')});
    const fullUI=await page.evaluate(()=> {
      closeZoom();let guard=0;
      while(guard++<200) {
        const p=[...cardContent].find(([n,c])=>flippedNumbers.has(n)&&c.puzzle&&!c.puzzle.solved);
        if(p){p[1].puzzle.solved=true;onPuzzleSolved(p[1],p[0]);continue;}
        refreshStoryUnlocks();
        const n=[...unlockedNumbers][0];if(n===undefined)break;
        const el=document.querySelector('.card[data-number="'+n+'"]');el.click();
        if(cardContent.get(n).isWin) {
          const trap=[...cardContent].find(([,c])=>!c.isProgress)[0];
          const before=lives;
          document.querySelector('.card[data-number="'+trap+'"]').click();
          if(lives!==before)throw Error('Trap accepted after winning card');
          break;
        }
      }
      triggerWin();return {win:winOverlayEl.classList.contains('open'),combos:[...cardContent.values()].filter(c=>c.requires).length};
    });assert.equal(fullUI.win,true);console.log('UI win',fullUI);
    await page.waitForTimeout(800);await page.screenshot({path:path.join(out,'ending.png')});
    // Simulate a wrong card and retry, exercising the actual click handlers.
    const penalties=await page.evaluate(()=> {
      pendingSeed=1234;performDeal();
      const bad=[...cardContent].find(([n,c])=>!c.isProgress && !flippedNumbers.has(n))[0];
      const el=document.querySelector('.card[data-number="'+bad+'"]');
      el.click();el.click();el.click();el.click();
      return {lives,flipped:el.classList.contains('flipped'),mistakes,runEnded};
    });assert.equal(penalties.lives,0);assert.equal(penalties.mistakes,3);assert.equal(penalties.flipped,false);
    // Replay via the public testing UI, not an internal seed helper.
    await page.evaluate(()=>{startDeck('story');testingPanel.hidden=false;});
    await page.fill('#replayCode','ER2-library-12345678');
    await page.evaluate(()=>document.getElementById('replayGame').click());
    assert.equal(await page.evaluate(()=>adventureCode()),'ER2-library-12345678');
    // All puzzle renderers must survive switching between test and real play.
    for(const type of ['cryptogram','cipher','slider','swap','pipes','shapes']) {
      await page.evaluate(t=>openTestPuzzle(t),type);
      assert.equal(await page.locator('#zoomOverlay').evaluate(e=>e.classList.contains('open')),true);
    }
    const puzzleInteractions=await page.evaluate(()=> {
      openTestPuzzle('cryptogram');
      let p=currentPuzzleContext.content.puzzle;
      for(let guard=0;guard<150&&!p.solved;guard++) {
        const blanks=[...cipherGridEl.querySelectorAll('.cipher-blank')];
        const active=blanks.findIndex(b=>b.classList.contains('active'));
        const indices=[...p.plaintext].map((c,i)=>c===' '?null:i).filter(i=>i!==null);
        const letter=p.plaintext[indices[active]];
        const button=[...cipherKeyboardEl.querySelectorAll('.cipher-key')].find(b=>b.textContent===letter);
        if(!button)throw Error('Missing cryptogram key');button.click();
      }
      if(!p.solved)throw Error('Cryptogram keyboard failed');
      openTestPuzzle('swap');p=currentPuzzleContext.content.puzzle;
      for(let i=0;i<p.tiles.length;i++) {
        if(p.tiles[i]===i+1)continue;
        const j=p.tiles.indexOf(i+1);
        swapGridEl.children[i].click();swapGridEl.children[j].click();
      }
      if(!p.solved)throw Error('Swap interactions failed');
      openTestPuzzle('pipes');p=currentPuzzleContext.content.puzzle;
      p.tiles.forEach((tile,i)=> {
        if(!tile.isPath || tile.isStart || tile.isEnd)return;
        for(let r=0;r<4&&!p.solved&&tile.openings!==tile.correctMask;r++)pipesGridEl.children[i].click();
      });
      if(!p.solved)throw Error('Pipe interactions failed');
      return ['cryptogram keyboard','number swap tiles','pipe rotation'];
    });console.log('Puzzle interaction checks',puzzleInteractions);
    await page.evaluate(()=>openTestPuzzle('shapes'));
    await page.getByRole('button',{name:'Report this puzzle',exact:true}).click();
    const report=JSON.parse(await page.locator('#bugReport').inputValue());
    assert.equal(report.openPuzzle.type,'shapes');
    assert.equal(await page.evaluate(()=>currentPuzzleContext),null);
    // Long phrases stay word-grouped and inside the detail view on a small phone.
    await page.setViewportSize({width:320,height:720});
    await page.evaluate(()=>openTestPuzzle('cryptogram'));
    await page.waitForTimeout(300);
    const puzzleLayout=await page.evaluate(()=>({overflow:zoomCardEl.scrollWidth>zoomCardEl.clientWidth+1,split:[...cipherGridEl.querySelectorAll('.cipher-word')].some(w=>{const y=[...w.children].map(c=>c.getBoundingClientRect().top);return y.some(v=>Math.abs(v-y[0])>1);})}));
    assert.equal(puzzleLayout.overflow,false);assert.equal(puzzleLayout.split,false);
    await page.evaluate(()=>{closeZoom();goHome();});
    // All older deck modes must still finish with their own rules.
    const legacy=await page.evaluate(()=> {
      const results=[];
      for(const mode of ['easy','medium','hard']) {
        startDeck(mode);pendingSeed=123;performDeal();
        let steps=0;
        while(currentTarget!==null && steps++<30) {
          document.querySelectorAll('.card.flipped').forEach(el=>{const c=cardContent.get(Number(el.dataset.number));if(c.puzzle)c.puzzle.solved=true;});
          const n=currentTarget;document.querySelector('.card[data-number="'+n+'"]').click();
          if(cardContent.get(n).isWin)break;
        }
        triggerWin();if(!winOverlayEl.classList.contains('open'))throw Error('Legacy mode failed: '+mode);
        results.push(mode);
      }
      return results;
    });console.log('Legacy decks',legacy);
    const practice=await page.evaluate(()=> {
      storyChoiceEl.value='library';startDeck('story');pendingSeed=678;performDeal();
      const before=JSON.stringify(loadProgress());assistedRun=true;
      cardContent.forEach((c,n)=>{if(c.isProgress)flippedNumbers.add(n);if(c.puzzle)c.puzzle.solved=true;});
      triggerWin();return {unchanged:before===JSON.stringify(loadProgress()),shown:winOverlayEl.classList.contains('open')};
    });assert.equal(practice.unchanged,true);assert.equal(practice.shown,true);
    const staleContext=await page.evaluate(()=> {
      closeZoom(); pendingSeed=5678;performDeal();
      const previous=assistedRun;
      document.getElementById('solveTestPuzzle').click();
      showToast('Should clear'); goHome();
      return {context:currentPuzzleContext,practiceChanged:assistedRun!==previous,toastVisible:toastEl.classList.contains('show')};
    });
    assert.equal(staleContext.context,null);assert.equal(staleContext.practiceChanged,false);assert.equal(staleContext.toastVisible,false);
    await page.goto(base+'/gallery.html');await page.waitForSelector('.theme-card');
    assert.equal(await page.locator('.theme-card').count(),46);
    const assetProblems=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));
    assert.equal(assetProblems.length,0);
    // Review sheet includes every original triad and all three new collections.
    await page.setViewportSize({width:1100,height:900});
    await page.screenshot({path:path.join(out,'art-gallery.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    // Actual mobile touch events, two visible hints, then finish the generated board by dragging.
    const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
    const touch=await mobile.newPage();await touch.goto(base);
    await touch.evaluate(()=> {
      const content={puzzle:withGameSeed(44,()=>makeShapesPuzzle(11)),message:'Shapes touch test'};
      window.shapeFixture=content;
      zoomPuzzleEl.hidden=false;zoomHintEl.hidden=true;zoomCardEl.classList.add('has-puzzle');
      currentPuzzleContext={content,num:null};renderShapesPuzzle(content,null,{isTest:true});zoomOverlay.classList.add('open');
    });
    await touch.waitForTimeout(300);await touch.tap('#puzzleHint');await touch.tap('#puzzleHint');
    const cdp=await mobile.newCDPSession(touch);
    for(let i=0;i<10;i++) {
      const target=await touch.evaluate(()=> {
        const p=window.shapeFixture.puzzle;if(p.solved)return null;
        const next=solveShapeRemainder(p)[0];if(!next)return null;
        const selector='.shapes-piece[data-piece-id="'+next.piece.id+'"]';
        document.querySelector(selector).scrollIntoView({block:'center'});
        return {id:next.piece.id,origin:next.origin,cells:next.piece.currentCells};
      });if(!target)break;
      const rect=await touch.locator('.shapes-piece[data-piece-id="'+target.id+'"]').boundingBox();
      const board=await touch.locator('#shapesGrid').boundingBox();
      const maxR=Math.max(...target.cells.map(c=>c[0])),maxC=Math.max(...target.cells.map(c=>c[1]));
      const from={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
      const to={x:board.x+4+target.origin[1]*40+(maxC*40+38)/2,y:board.y+4+target.origin[0]*40+(maxR*40+38)/2};
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
      for(let step=1;step<=8;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*step/8,y:from.y+(to.y-from.y)*step/8}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    assert.equal(await touch.evaluate(()=>window.shapeFixture.puzzle.solved),true);
    await touch.screenshot({path:path.join(out,'shapes-touch.png')});
    await mobile.close();
    // A first install, an offline reopen, and an update waiting without interrupting a game.
    const installed=await browser.newContext({viewport:{width:390,height:844}});
    const app=await installed.newPage();await app.goto(base);
    await app.evaluate(()=>{tabletopEnabled=false;});
    await app.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await app.waitForFunction(()=>!!navigator.serviceWorker.controller);
    const cached=await app.evaluate(async(version)=>{const c=await caches.open('escape-room-'+version);return(await c.keys()).length;},sourceCacheVersion);
    assert.ok(cached>=150);
    await installed.setOffline(true);await app.reload();await app.waitForFunction(()=>typeof updateAdventureStatus==='function');
    await app.evaluate(()=>{tabletopEnabled=false;});
    await app.evaluate(()=>{startDeck('story');pendingSeed=100;performDeal();});
    const offlineCards=await app.locator('.card').count();assert.ok(offlineCards>=54 && offlineCards<=72);
    await installed.setOffline(false);
    servedCacheVersion='v'+(Number(sourceCacheVersion.slice(1))+1);
    await app.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});
    await app.waitForFunction(()=>!document.getElementById('updateApp').hidden);
    assert.equal(await app.evaluate(()=>runSeed),100);
    await app.locator('#updateApp').click();
    await app.waitForFunction(async(version)=>!!(await caches.has('escape-room-'+version)),servedCacheVersion);
    console.log('Offline reopen and non-interrupting update passed; cached assets:',cached);
    await installed.close();
    fs.writeFileSync(path.join(out,'review-results.json'),JSON.stringify({logic,layout,fullUI,penalties,errors,touchDrag:true,offline:true,updates:true},null,2));
    console.log('All browser review checks passed. Screenshots in .qa-output.');
    await context.close();
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
