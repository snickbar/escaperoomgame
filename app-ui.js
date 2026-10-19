// Player controls and local developer tools. This is a local testing mode,
// not authentication or a security boundary in this static offline game.
const storyChoiceEl=document.getElementById('storyChoice');
storyChoiceEl.innerHTML=STORY_BOOK.map(b=>`<option value="${b.id}">${b.title}</option>`).join('');
storyChoiceEl.onchange=renderHome;
renderHome();
document.body.insertAdjacentHTML('beforeend', `
  <div class="utility-bar">
    <span id="buildLabel"></span>
    <button id="soundToggle" type="button">Sound on</button>
    <button id="updateApp" type="button" hidden>Update available</button>
    <button id="testingToggle" type="button" aria-expanded="false">Testing tools</button>
    <span id="updateStatus" role="status"></span>
  </div>
  <section class="dev-panel" id="testingPanel" hidden aria-label="Local testing tools">
    <h2>Testing tools</h2>
    <p>Local tools for checking a game. Revealing or solving answers marks the current run as practice, so it cannot set a record.</p>
    <label><input id="developerMode" type="checkbox" style="width:auto"> Show developer answers and controls</label>
    <label for="replayCode">Replay a Story Mode game</label>
    <input id="replayCode" placeholder="ER2-lighthouse-12345678" autocomplete="off" spellcheck="false">
    <button id="replayGame" type="button">Load game code</button>
    <button id="copyGameCode" type="button">Copy current code</button>
    <button id="solveTestPuzzle" type="button" data-dev hidden>Solve open puzzle</button>
    <button id="validateGame" type="button">Check this game</button>
    <button id="makeBugReport" type="button">Create bug report</button>
    <label for="bugReport">Game report (copy this when reporting a problem)</label>
    <textarea id="bugReport" readonly></textarea>
    <p id="testingStatus" role="status"></p>
  </section>`);
document.getElementById('buildLabel').textContent='Version '+GAME_VERSION;
let soundEnabled=true;
try { soundEnabled=localStorage.getItem('escapeRoomSound')!=='off'; } catch {}
const soundToggle=document.getElementById('soundToggle');
function updateSound() { soundToggle.textContent=soundEnabled?'Sound on':'Sound off'; soundToggle.setAttribute('aria-pressed',String(soundEnabled)); }
updateSound();
soundToggle.onclick=()=> { soundEnabled=!soundEnabled; updateSound(); try {localStorage.setItem('escapeRoomSound',soundEnabled?'on':'off');}catch{} };

function updateAdventureStatus() {
  if (typeof tabletopActive === 'function' && tabletopActive()) { renderTabletopStatus(); return; }
  const el=document.getElementById('adventureStatus');
  if(currentMode!=='story' || !cardContent.size || deckEl.dataset.empty!=='true') {el.replaceChildren();return;}
  gameTitleEl.textContent=activeStory.title;
  const combos=[...cardContent].filter(([,c])=>c.requires);
  const completed=combos.filter(([n])=>flippedNumbers.has(n)).length;
  const win=[...cardContent].find(([,c])=>c.isWin);
  el.innerHTML=`<img src="art/story/${activeStory.id}-cover.svg" alt=""><strong>${activeStory.title}</strong><br>${completed} of ${combos.length} discoveries<br><span>Tap a revealed card to read its full story and instructions.</span>`;
  if(win && unlockedNumbers.has(win[0])) {
    const notice=document.createElement('p'); notice.textContent='Every discovery is complete. Open '+win[0]+' for the ending!'; el.appendChild(notice);
  }
  const journal=document.createElement('details');
  const summary=document.createElement('summary'); summary.textContent='Adventure journal'; journal.appendChild(summary);
  const entries=document.createElement('ol');
  [...cardContent].filter(([n,c])=>flippedNumbers.has(n) && (c.requires || c.isSeed)).sort((a,b)=>a[1].chapter-b[1].chapter).forEach(([,c])=> {
    const li=document.createElement('li'); li.textContent=c.message; entries.appendChild(li);
  });
  journal.appendChild(entries); el.appendChild(journal);
}

let fitting=false;
function fitTableText() {
  if (typeof tabletopActive === 'function' && tabletopActive()) return;
  if(fitting || gameScreenEl.hidden) return;
  fitting=true;
  tableEl.querySelectorAll('.card-front').forEach(face=> {
    const text=[...face.querySelectorAll('.message,.hint')];
    text.forEach(t=>t.style.fontSize='');
    for(let pass=0;pass<8 && face.scrollHeight>face.clientHeight+1;pass++) {
      text.forEach(t=>t.style.fontSize=Math.max(6,parseFloat(getComputedStyle(t).fontSize)-.5)+'px');
    }
  });
  fitting=false;
}
new ResizeObserver(()=>requestAnimationFrame(fitTableText)).observe(tableEl);

const testingPanel=document.getElementById('testingPanel');
const developerModeEl=document.getElementById('developerMode');
// A control outside the modal cannot be tapped while a puzzle is open.
// Keep puzzle-specific tools inside the same detail panel as the puzzle.
zoomPuzzleEl.appendChild(document.getElementById('solveTestPuzzle'));
const reportPuzzleButton=document.createElement('button');
reportPuzzleButton.type='button';reportPuzzleButton.className='puzzle-again';
reportPuzzleButton.textContent='Report this puzzle';
reportPuzzleButton.onclick=()=> {
  document.getElementById('makeBugReport').click();
  closeZoom();testingPanel.hidden=false;
  document.getElementById('testingToggle').setAttribute('aria-expanded','true');
  testingPanel.scrollIntoView({behavior:'smooth',block:'start'});
};
zoomPuzzleEl.appendChild(reportPuzzleButton);
document.getElementById('testingToggle').onclick=()=> {
  testingPanel.hidden=!testingPanel.hidden;
  document.getElementById('testingToggle').setAttribute('aria-expanded',String(!testingPanel.hidden));
  if(!testingPanel.hidden) testingPanel.scrollIntoView({behavior:'smooth',block:'start'});
};
function updateDeveloperVisibility() {
  [debugNextBtnEl,puzzleRevealToggleEl,document.getElementById('solveTestPuzzle')].forEach(el=>el.hidden=!developerModeEl.checked);
}
developerModeEl.onchange=updateDeveloperVisibility;
updateDeveloperVisibility();
new MutationObserver(updateDeveloperVisibility).observe(zoomOverlay,{attributes:true,attributeFilter:['class']});
debugNextBtnEl.addEventListener('click',()=>assistedRun=true);
puzzleRevealToggleEl.addEventListener('click',()=>assistedRun=true);
const testStatus=document.getElementById('testingStatus');
document.getElementById('replayGame').onclick=()=> {
  const raw=document.getElementById('replayCode').value.trim();
  const match=/^ER2-(lighthouse|library|lucy)-([a-f0-9]{8})$/i.exec(raw);
  if(!match) {testStatus.textContent='Enter a complete game code from this version, such as ER2-lighthouse-12345678.';return;}
  storyChoiceEl.value=match[1].toLowerCase();
  pendingSeed=parseInt(match[2],16);
  startDeck('story'); performDeal();
  testStatus.textContent='Loaded '+adventureCode()+'.';
  gameTitleEl.scrollIntoView({block:'start'});
};
document.getElementById('copyGameCode').onclick=async()=> {
  if(currentMode!=='story' || !cardContent.size) {testStatus.textContent='Deal a Story Mode game first.';return;}
  document.getElementById('replayCode').value=adventureCode();
  try {await navigator.clipboard.writeText(adventureCode()); testStatus.textContent='Game code copied.';}
  catch {testStatus.textContent='Your code is in the replay field above. Select it to copy.';}
};
document.getElementById('validateGame').onclick=()=> {
  if(currentMode!=='story' || !cardContent.size) {testStatus.textContent='Deal a Story Mode game first.';return;}
  const result=validateAdventure(cardContent,[...cardContent.keys()].sort((a,b)=>a-b));
  testStatus.textContent=result.ok ? 'Passed: unique numbers, correct sums, puzzle rewards and a reachable ending.' : result.errors.join('; ');
};
document.getElementById('makeBugReport').onclick=()=> {
  document.getElementById('bugReport').value=JSON.stringify({version:GAME_VERSION,code:currentMode==='story'?adventureCode():null,mode:currentMode,lives,mistakeLog,flipped:[...flippedNumbers],available:[...unlockedNumbers],viewport:{width:innerWidth,height:innerHeight},openPuzzle:currentPuzzleContext?{card:currentPuzzleContext.num,type:currentPuzzleContext.content.puzzle?.type,puzzle:currentPuzzleContext.content.puzzle}:null},null,2);
  testStatus.textContent='Report ready. Copy it and add what you saw.';
};
document.getElementById('solveTestPuzzle').onclick=()=> {
  const context=currentPuzzleContext;
  if(!zoomOverlay.classList.contains('open') || !context?.content.puzzle ||
    context.num!==null && cardContent.get(context.num)!==context.content) {testStatus.textContent='Open a puzzle first.';return;}
  const p=context.content.puzzle;
  assistedRun=true; p.solved=true;
  onPuzzleSolved(context.content,context.num);
  if(context.num!==null) {
    const hint=document.querySelector('.card[data-number="'+context.num+'"] .hint');
    if(hint) hint.textContent=puzzleResultText(p);
    openZoom(context.num);
  } else {
    puzzleFeedbackEl.textContent='Practice solve: '+puzzleResultText(p); puzzleAgainEl.hidden=false;
  }
  testStatus.textContent='Solved for testing. This run is marked as practice.';
};

// First installation never forces a reload; updates wait for a deliberate tap.
const isAndroidApp=location.origin==='https://appassets.androidplatform.net';
if(isAndroidApp) {
  document.getElementById('updateStatus').textContent='Android app · Ready to play offline';
} else if('serviceWorker' in navigator) {
  let registration, applying=false;
  const updateButton=document.getElementById('updateApp');
  function offerUpdate() {
    updateButton.hidden=!registration?.waiting;
    if(registration?.waiting) updateButton.textContent='Update app (restarts game)';
  }
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=> {
    registration=reg; offerUpdate();
    reg.addEventListener('updatefound',()=> {
      const worker=reg.installing;
      worker?.addEventListener('statechange',()=>{if(worker.state==='installed') offerUpdate();});
    });
    reg.update().catch(()=>{});
  }).catch(()=>{document.getElementById('updateStatus').textContent='Offline installation unavailable in this browser.';});
  updateButton.onclick=()=> {
    if(!registration?.waiting) return;
    applying=true;
    document.getElementById('updateStatus').textContent='Updating…';
    registration.waiting.postMessage({type:'APPLY_UPDATE'});
  };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying) location.reload();});
  let checked=Date.now();
  document.addEventListener('visibilitychange',()=> {
    if(!document.hidden && registration && Date.now()-checked>60000) {checked=Date.now();registration.update().catch(()=>{});}
  });
}
