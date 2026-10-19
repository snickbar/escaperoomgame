// Active-table adventures. Discovery state is separate from DOM and discard state:
// a card in the journal still counts toward recipes, progression, and the ending.
let tabletopEnabled = true;
let tabletopState = null;
let tabletopDragCleanup = null;
let tabletopSuppressClickUntil = 0;
function tabletopActive() { return tabletopEnabled && currentMode === 'story'; }
function sceneImage(id) { return 'art/scenes/' + id + '.png'; }

document.body.insertAdjacentHTML('beforeend', `
  <dialog class="paper-dialog" id="codeDialog" aria-labelledby="codeTitle">
    <form id="codeForm">
      <button class="dialog-close" type="button" aria-label="Close code entry">×</button>
      <span class="eyebrow">A new discovery</span><h2 id="codeTitle">What did you find?</h2>
      <p>Enter a card number from a clue or a solved puzzle to draw it from the deck.</p>
      <label for="discoveryCode">Card code</label>
      <input id="discoveryCode" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="0–199" aria-describedby="codeFeedback">
      <p id="codeFeedback" role="status">An incorrect code costs one life.</p>
      <button class="primary-action" type="submit">Draw card <span aria-hidden="true">↗</span></button>
    </form>
  </dialog>
  <dialog class="paper-dialog" id="discardDialog" aria-labelledby="discardTitle">
    <button class="dialog-close" type="button" aria-label="Close discard pile">×</button>
    <span class="eyebrow">Nothing gets lost</span><h2 id="discardTitle">Your discoveries</h2>
    <p>Finished cards leave the table. You can always read them again here.</p>
    <div id="discardList"></div>
  </dialog>
  <dialog class="paper-dialog" id="combineDialog" aria-labelledby="combineTitle">
    <button class="dialog-close" type="button" aria-label="Close item picker">×</button>
    <span class="eyebrow">Make a connection</span><h2 id="combineTitle">Use this with…</h2>
    <p id="combineDescription"></p><div id="combineOptions"></div>
  </dialog>
  <dialog class="paper-dialog success-dialog" id="successDialog" aria-labelledby="successTitle">
    <button class="dialog-close" type="button" aria-label="Close and take your cards">×</button>
    <div class="success-badge" aria-hidden="true">✓</div>
    <span class="eyebrow" id="successEyebrow">Puzzle solved</span><h2 id="successTitle"></h2>
    <p id="successHow"></p><p class="success-story" id="successStory"></p>
    <button class="primary-action" type="button" id="successTake">Take cards</button>
  </dialog>
  <dialog class="paper-dialog settings-dialog" id="settingsDialog" aria-labelledby="settingsTitle">
    <button class="dialog-close" type="button" aria-label="Close settings">×</button>
    <span class="eyebrow">Settings</span><h2 id="settingsTitle">Your adventure</h2>
    <div id="settingsStatus"></div>
    <div class="settings-actions">
      <button class="settings-row" type="button" id="settingsSound"></button>
      <button class="settings-row" type="button" id="settingsTesting">Testing tools</button>
    </div>
    <p class="settings-version" id="settingsVersion"></p>
  </dialog>`);
const codeDialog = document.getElementById('codeDialog');
const discardDialog = document.getElementById('discardDialog');
const combineDialog = document.getElementById('combineDialog');
const successDialog = document.getElementById('successDialog');
const settingsDialog = document.getElementById('settingsDialog');
const codeFeedback = document.getElementById('codeFeedback');
const tabletopZoomCode=document.createElement('button');
tabletopZoomCode.className='primary-action';tabletopZoomCode.type='button';tabletopZoomCode.textContent='Take cards';tabletopZoomCode.hidden=true;
tabletopZoomCode.onclick=()=>{if(currentPuzzleContext?.content.visualClue)openCodeEntry('picture');else closeZoom();};zoomCardEl.appendChild(tabletopZoomCode);
function tabletopRewardNumbers(context) {
  if(!tabletopActive()||!tabletopState||runEnded||winPending||!context||context.num===null||
    cardContent.get(context.num)!==context.content||!flippedNumbers.has(context.num)||context.content.visualClue||
    (context.content.puzzle&&!context.content.puzzle.solved))return [];
  return (context.content.unlocks||[]).filter(n=>!flippedNumbers.has(n)&&unlockedNumbers.has(n));
}
function collectTabletopRewards(context) {
  const rewards=tabletopRewardNumbers(context);
  rewards.forEach(n=>drawTabletopCard(n,'reward',context));
  if(rewards.length)showToast('New cards added to your table.');
}
function configureTabletopZoom() {
  const context=currentPuzzleContext;
  const picture=tabletopActive()&&tabletopState&&context?.content.visualClue;
  zoomCardEl.classList.toggle('has-picture-clue',!!picture);
  if(picture){
    tabletopState.inspected.add(context.num);
    zoomItemArtEl.hidden=false;zoomItemArtEl.innerHTML=hiddenPictureArtwork(picture);
    zoomHintEl.hidden=false;zoomHintEl.textContent='Find the one number hidden in this picture. Use it to draw the next card.';
    tabletopZoomCode.hidden=!context.content.unlocks.some(n=>!flippedNumbers.has(n));
    tabletopZoomCode.textContent='I found a number';return;
  }
  tabletopZoomCode.hidden=!tabletopActive()||!tabletopState||!context||context.num===null||
    !!(context.content.puzzle&&!context.content.puzzle.solved)||
    !(context.content.unlocks||[]).some(n=>!flippedNumbers.has(n));
  const rewards=tabletopRewardNumbers(context);
  tabletopZoomCode.textContent=rewards.length
    ? 'Take '+(rewards.length===1?'card ':'cards ')+rewards.join(' and ')
    : 'Take cards';
  if(tabletopActive()&&tabletopState&&context){
    tabletopZoomCode.hidden=!rewards.length;
    if(rewards.length)zoomHintEl.textContent='Take these cards to follow your next lead.';
    else if(!context.content.puzzle&&context.content.unlocks?.some(n=>!flippedNumbers.has(n)))zoomHintEl.textContent='Keep this discovery. Finish the remaining leads, then return here for the ending.';
  }
}
// A solved puzzle closes into its own celebration. Its rewards are taken by
// the button or by dismissing the pop-up, just as closing a card collects them.
const SUCCESS_LINES={
  cryptogram:['Message decoded!','Every letter is in place, and the hidden message reads clearly.'],
  cipher:['Message decoded!','Every letter is in place, and the hidden message reads clearly.'],
  swap:['Picture restored!','Every fragment is back where it belongs.'],
  slider:['Picture restored!','Every tile is back where it belongs.'],
  water:['The water flows!','You connected the pipes all the way from the tap to the tank.'],
  electric:['Power restored!','Current runs through every glass tube to the lamp.'],
  shapes:['Document restored!','You fitted every torn fragment back into place.'],
  deduction:['Well reasoned!',''],
};
const SUCCESS_STORY={
  lucy:['Lucy grins. “Hold on, Pip, we’re coming!”','Somewhere nearby, a small bark answers.','Lucy tucks the clue into her pocket and points the way.','Fresh pawprints lead on toward the next clue.'],
  lighthouse:['Out past the reef, Mara’s boat is still holding its course.','The wind rattles the tower windows. There is still time.','You note it in the keeper’s ledger and press on.','Far below, the waves crash against the rocks.'],
  library:['Somewhere in the stacks, the archive clock ticks on.','Ada’s trail is growing clearer.','You slip the evidence into your notebook.','Midnight is getting closer.'],
};
let successOnClose=null;
function successStoryLine(num) {
  const lines=SUCCESS_STORY[activeStory.id]||SUCCESS_STORY.lighthouse;
  return lines[num%lines.length];
}
function openSuccess({eyebrow,title,how,story,action,onClose}) {
  [codeDialog,discardDialog,combineDialog].forEach(d=>{if(d.open)d.close();});
  document.getElementById('successEyebrow').textContent=eyebrow;
  document.getElementById('successTitle').textContent=title;
  document.getElementById('successHow').textContent=how;
  document.getElementById('successStory').textContent=story;
  document.getElementById('successTake').textContent=action;
  successOnClose=onClose;
  successDialog.showModal();document.getElementById('successTake').focus();
}
function finishSuccess() {const done=successOnClose;successOnClose=null;done?.();}
// The close event arrives a moment later; the button hands over cards at once.
successDialog.addEventListener('close',finishSuccess);
document.getElementById('successTake').onclick=()=>{finishSuccess();successDialog.close();};
function showPuzzleSuccess(content,num) {
  const context={content,num};
  if(currentPuzzleContext?.content!==content)return;
  const rewards=tabletopRewardNumbers(context);
  if(!rewards.length)return;
  const p=content.puzzle;
  const [title,how]=SUCCESS_LINES[p.type==='pipes'?(p.pipeStyle==='electric'?'electric':'water'):p.type]||['Puzzle solved!','You worked it out.'];
  // Leave the puzzle without collecting: the pop-up hands over the cards.
  tabletopZoomCode.hidden=true;currentPuzzleContext=null;
  if(puzzleCleanup){puzzleCleanup();puzzleCleanup=null;}
  zoomOverlay.classList.remove('open');
  openSuccess({eyebrow:'Puzzle solved',title,
    how:p.type==='deduction'?'Every note fits: the '+p.items[p.sought]+' is '+(p.prep||'in')+' '+p.places[p.solutionIndex]+'.':how,
    story:successStoryLine(num),
    action:'Take '+(rewards.length===1?'card ':'cards ')+rewards.join(' and '),
    onClose:()=>collectTabletopRewards(context)});
}

for (const dialog of [codeDialog, discardDialog, combineDialog, successDialog, settingsDialog]) {
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}

const tabletopToolbar = document.createElement('section');
tabletopToolbar.className = 'tabletop-toolbar'; tabletopToolbar.hidden = true;
tabletopToolbar.innerHTML = `
  <div class="draw-pile" aria-label="Draw pile"><span class="pile-mark" aria-hidden="true">✦</span><span><strong id="drawPileCount">0</strong><small>in the deck</small></span></div>
  <button class="primary-action" id="openCode">Enter code <span aria-hidden="true">↗</span></button>
  <button class="archive-action" id="openDiscards"><span aria-hidden="true">▤</span> Discards <strong id="discardCount">0</strong></button>`;
gameScreenEl.querySelector('.scene').before(tabletopToolbar);
const tableHeading = document.createElement('div'); tableHeading.className='table-heading'; tableHeading.hidden=true;
tableHeading.innerHTML='<div><span class="eyebrow">Follow your curiosity</span><h2>Your table</h2></div><p id="tableHelp">Tap to inspect · drag items together to combine</p>';
tableEl.before(tableHeading);
// One anchored bar: home, lives and hint on the left, settings on the right.
// Slots leave room for more buttons later.
const storyTopbar=document.createElement('header');
storyTopbar.className='story-topbar';storyTopbar.hidden=true;
storyTopbar.innerHTML=`<div class="topbar-row">
    <div class="topbar-slot" id="topbarHome"></div><div class="topbar-slot" id="topbarLives"></div><div class="topbar-slot" id="topbarHint"></div>
    <span class="topbar-spacer"></span>
    <button class="topbar-button" type="button" id="openSettings" aria-label="Settings" aria-haspopup="dialog"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  </div><div class="topbar-progress" aria-hidden="true"><span id="topbarProgress"></span></div>`;
gameScreenEl.prepend(storyTopbar);
const homeLinkHTML=homeLinkEl.innerHTML;
const adventureStatusEl=document.getElementById('adventureStatus');
function mountStoryTopbar() {
  document.getElementById('topbarHome').appendChild(homeLinkEl);
  document.getElementById('topbarLives').appendChild(livesDisplayEl);
  document.getElementById('topbarHint').appendChild(tableHintBtnEl);
  homeLinkEl.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3Z"/></svg><span>Home</span>';
  document.getElementById('settingsStatus').appendChild(adventureStatusEl);
  storyTopbar.hidden=false;
}
function unmountStoryTopbar() {
  storyTopbar.hidden=true;
  debugNextBtnEl.before(homeLinkEl,tableHintBtnEl);
  homeLinkEl.innerHTML=homeLinkHTML;
  gameTitleEl.after(adventureStatusEl);adventureStatusEl.after(livesDisplayEl);
}
function updateSettingsSound() {
  document.getElementById('settingsSound').textContent=(soundEnabled?'🔊 Sound: on':'🔇 Sound: off');
}
document.getElementById('openSettings').onclick=()=>{
  document.getElementById('settingsTitle').textContent=activeStory.title;
  document.getElementById('settingsVersion').textContent='Version '+GAME_VERSION;
  updateSettingsSound();settingsDialog.showModal();
};
document.getElementById('settingsSound').onclick=()=>{document.getElementById('soundToggle').click();updateSettingsSound();};
document.getElementById('settingsTesting').onclick=()=>{
  settingsDialog.close();
  const panel=document.getElementById('testingPanel');
  if(panel.hidden)document.getElementById('testingToggle').click();
  else panel.scrollIntoView({behavior:'smooth',block:'start'});
};

document.getElementById('openCode').onclick = ()=>openCodeEntry();
document.getElementById('openDiscards').onclick = openDiscardPile;
tableHintBtnEl.addEventListener('click', event=>{
  if(!tabletopActive())return;
  event.stopImmediatePropagation();
  if(!tabletopState||runEnded)return;
  const puzzle=[...tabletopState.active].find(n=>cardContent.get(n).puzzle&&!cardContent.get(n).puzzle.solved);
  showToast(puzzle!==undefined?'Open the puzzle card and solve it to receive your next cards.':validCodeTargets().size?'Open your clue and take the cards it reveals.':'Try dragging two related items together. Their pictures are your clue.',3500);
},{capture:true});

function renderTabletopHome() {
  let hero=document.getElementById('adventureHero');
  if (!hero) {
    hero=document.createElement('article'); hero.id='adventureHero'; hero.className='adventure-hero';
    document.querySelector('.story-picker').after(hero);
    const classics=document.createElement('details'); classics.className='classic-drawer';
    classics.innerHTML='<summary>Quick play & puzzle workshop <span aria-hidden="true">＋</span></summary>';
    deckGridEl.before(classics); classics.appendChild(deckGridEl);
  }
  const book=STORY_BOOK.find(b=>b.id===storyChoiceEl.value)||STORY_BOOK[0];
  const p=loadProgress()['story:'+book.id];
  hero.innerHTML=`<div class="hero-art"><img src="${sceneImage(book.id)}" alt="${book.title} adventure illustration"><span class="hero-stamp">A story to uncover</span></div>
    <div class="hero-copy"><div class="eyebrow">${book.id==='lighthouse'?'A race against the tide':book.id==='library'?'Secrets between the shelves':'A small dog. A big adventure.'}</div>
    <h2>${book.title}</h2><p>${book.intro.split('. ')[0]}.</p>
  <div class="adventure-facts"><span>10 discoveries</span><span>Several leads at once</span>${p?.completed?'<span class="complete-badge">✓ Completed</span>':''}</div>
    <button class="primary-action" id="beginAdventure">${p?.completed?'Play this story again':'Begin adventure'} <span aria-hidden="true">→</span></button></div>`;
  document.getElementById('beginAdventure').onclick=()=>{
    startDeck('story');performDeal();
    const root=[...cardContent].find(([,c])=>c.isSeed);
    if(root) openZoom(root[0]);
    window.scrollTo(0,0);
  };
  const storyTile=deckGridEl.querySelector('[data-deck="story"]'); if(storyTile)storyTile.hidden=true;
}

function resetTabletopUI() {
  if(tabletopDragCleanup) tabletopDragCleanup();
  tabletopSuppressClickUntil=0;
  tabletopState=null;
  document.body.classList.remove('tabletop-story');
  tabletopZoomCode.hidden=true;
  tabletopToolbar.hidden=true;tableHeading.hidden=true;
  successOnClose=null;
  [codeDialog,discardDialog,combineDialog,successDialog,settingsDialog].forEach(d=>{if(d.open)d.close();});
  unmountStoryTopbar();
}

function dealTabletop() {
  tableEl.replaceChildren();
  winOverlayEl.classList.remove('open');gameOverOverlayEl.classList.remove('open');zoomOverlay.classList.remove('open');
  mistakes=0;lives=MAX_LIVES;renderLives();startTime=Date.now();
  buildStoryCardContent(randomInt(STORY_MODE_TABLE_SIZE_MIN,STORY_MODE_TABLE_SIZE_MAX));
  // Geometry clues belong to the old fixed grid. A changing table uses codes.
  const finaleParts=new Set([...cardContent.values()].filter(c=>c.isFinale).flatMap(c=>c.requires));
  cardContent.forEach((content,number)=>{
    if(!content.isProgress)return;
    content.hint=content.unlocks.length ? describeUnlocks(content.unlocks)
      : finaleParts.has(number) ? 'Keep this for the finale. It completes the story once every other lead is finished.'
      : content.kind==='object' ? 'Drag this onto a related item to see what you can make.' : content.hint;
  });
  const root=[...cardContent].find(([,c])=>c.isSeed);
  root[1].unlocks.forEach(n=>flippedNumbers.add(n));
  root[1].hint='Your first six leads are on the table. Investigate in any order, compare the evidence, and keep items for partners you may find later.';
  tabletopState={active:new Set(flippedNumbers),discarded:new Set(),inspected:new Set(),lastDraw:[],selected:null};
  deckEl.dataset.empty='true';deckWrapEl.style.display='none';
  document.body.classList.add('tabletop-story');tabletopToolbar.hidden=false;tableHeading.hidden=false;
  mountStoryTopbar();
  refreshStoryUnlocks();syncTabletop();
}

function renderTabletopStatus() {
  const status=document.getElementById('adventureStatus');
  if(!tabletopState){status.replaceChildren();return;}
  const journalOpen=status.querySelector('details')?.open;
  const combos=[...cardContent].filter(([,c])=>c.requires);
  const complete=combos.filter(([n])=>flippedNumbers.has(n)).length;
  gameTitleEl.textContent=activeStory.title;
  status.innerHTML=`<div class="chapter-progress"><span>Chapter ${Math.min(complete+1,10)} of 10</span><span>${complete} discoveries made</span><progress value="${complete}" max="10" aria-label="Adventure progress"></progress></div>
    <details class="adventure-journal"><summary>Read your story so far</summary><ol></ol></details>`;
  status.querySelector('details').open=!!journalOpen;
  document.getElementById('topbarProgress').style.width=(complete*10)+'%';
  const entries=status.querySelector('ol');
  [...cardContent].filter(([n,c])=>flippedNumbers.has(n)&&(c.isSeed||c.requires)).sort((a,b)=>a[1].chapter-b[1].chapter).forEach(([,c])=>{
    const li=document.createElement('li');li.textContent=c.message;entries.appendChild(li);
  });
}

function syncTabletop() {
  if(!tabletopState||!tabletopActive())return;
  if(tabletopDragCleanup)tabletopDragCleanup();
  const used=exhaustedCardNumbers(cardContent,flippedNumbers,'story');
  flippedNumbers.forEach(n=>{
    if(used.has(n)){tabletopState.active.delete(n);tabletopState.discarded.add(n);}
    else if(!tabletopState.discarded.has(n))tabletopState.active.add(n);
  });
  tableEl.replaceChildren();
  [...tabletopState.active].sort((a,b)=>a-b).forEach(n=>tableEl.appendChild(makeTabletopCard(n)));
  document.getElementById('drawPileCount').textContent=[...cardContent].filter(([n,c])=>c.isProgress&&!flippedNumbers.has(n)).length;
  document.getElementById('discardCount').textContent=tabletopState.discarded.size;
  renderTabletopStatus();
}

function isCombinableItem(number) {
  return !!cardContent.get(number)?.backItem && [...cardContent].some(([n,c])=>!flippedNumbers.has(n)&&c.requires?.includes(number));
}

function puzzleStamp(type) {
  const drawings={
    pipes:'<path d="M22 22v29h29v27m0-56h27v56"/><circle cx="22" cy="22" r="7" fill="#b6cbaa"/><circle cx="51" cy="78" r="7" fill="#d3b26b"/>',
    shapes:'<path fill="#d3b26b" d="M15 15h22v22H15Zm24 0h22v22H39Zm-24 24h22v22H15Z"/><path fill="#719a81" d="M39 39h22v22H39Zm24 0h22v22H63Zm0 24h22v22H63Z"/>',
    swap:'<rect x="14" y="14" width="30" height="30" rx="5"/><rect x="54" y="14" width="30" height="30" rx="5"/><rect x="14" y="54" width="30" height="30" rx="5"/><path d="m61 65 12-8 12 8m-12-8v26"/>',
    cryptogram:'<path d="m15 74 17-48 17 48M22 57h20m21-31h21M63 74h21M74 26v48"/>',
  };
  return '<svg viewBox="0 0 100 100" fill="none" stroke="#57796a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(drawings[type]||'<path d="M28 24h45v55H28Zm12 19h21m-21 14h21"/>')+'</svg>';
}

function makeTabletopCard(number) {
  const content=cardContent.get(number);
  const item=content.backItem;
  const combinable=isCombinableItem(number);
  const type=item?(combinable?'Item':'Discovery'):content.visualClue?'Picture clue':content.puzzle?(content.puzzle.solved?'Solved clue':'Puzzle'):content.isWin?'The ending':'Story clue';
  const title=item?.name || (content.visualClue?'A closer look':content.puzzle ? MINI_GAMES[content.puzzle.type].label : content.isWin ? 'Home safely' : 'A new lead');
  const card=document.createElement('article');card.className='card tabletop-card flipped'+(combinable?' tabletop-item':'');
  card.dataset.number=number;card.tabIndex=0;card.setAttribute('role','button');
  card.setAttribute('aria-label',`${item?.name||content.title}, card ${number}. Tap to inspect${combinable?', or drag onto another item to combine.':'.'}`);
  card.innerHTML=`<div class="card-inner"><div class="card-face card-front ${item?'has-art':''}">
    <div class="tabletop-card-top"><span class="card-kind">${type}</span><span class="front-number">${number}</span></div>
    ${item?'<div class="front-icon">'+itemVisual(item)+'</div>':'<div class="clue-illustration" aria-hidden="true">'+puzzleStamp(content.puzzle?.type)+'</div>'}
    <h3 class="message">${title}</h3>
    <p class="hint">${content.visualClue?'Inspect the picture for a hidden number.':content.puzzle&&!content.puzzle.solved?'Tap to solve & discover what comes next.':combinable?'Drag onto another item':'Tap to read your discovery.'}</p>
    ${combinable?'<button class="combine-choice" type="button" aria-label="Choose an item to combine with '+item.name+'">Combine…</button>':''}
    </div></div>`;
  card.onclick=()=>{if(performance.now()<tabletopSuppressClickUntil||runEnded||winPending)return;openZoom(number);};
  card.onkeydown=event=>{if(event.target!==card)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click();}};
  if(combinable){
    card.querySelectorAll('img').forEach(image=>{image.draggable=false;});
    card.addEventListener('dragstart',event=>event.preventDefault());
    card.querySelector('.combine-choice').onclick=event=>{event.stopPropagation();openCombinationPicker(number);};
    card.addEventListener('pointerdown',event=>startTabletopDrag(event,number,card));
  }
  return card;
}

function validCodeTargets() {
  const targets=new Set();
  if(!tabletopState)return targets;
  cardContent.forEach((c,n)=>{
    if(!flippedNumbers.has(n)||c.puzzle&&!c.puzzle.solved||c.visualClue&&!tabletopState.inspected.has(n))return;
    (c.unlocks||[]).forEach(target=>{if(!flippedNumbers.has(target))targets.add(target);});
  });
  // The final card also requires every discovery, as in the main progression rule.
  return new Set([...targets].filter(n=>unlockedNumbers.has(n)));
}

function drawTabletopCard(number,via,source) {
  if(via!=='code'&&via!=='combine'&&via!=='reward')return false;
  if(!tabletopState||runEnded||winPending||flippedNumbers.has(number))return false;
  const c=cardContent.get(number);if(!c)return false;
  if(via==='code'&&!validCodeTargets().has(number))return false;
  if(via==='reward'&&!tabletopRewardNumbers(source).includes(number))return false;
  if(via==='combine'&&(!c.requires||!c.requires.every(n=>tabletopState.active.has(n))||c.isFinale&&!unlockedNumbers.has(number)))return false;
  flippedNumbers.add(number);tabletopState.lastDraw=[number];
  refreshStoryUnlocks();syncTabletop();playCorrectSound();
  const drawn=tableEl.querySelector('[data-number="'+number+'"]');if(drawn)drawn.classList.add('just-drawn');
  if(c.isWin){winPending=true;scheduleGame(triggerWin,700);}
  return true;
}

function recordTabletopError(card,reason) {
  if(runEnded||winPending||lives<=0)return;
  mistakeLog.push({card,elapsedMs:Date.now()-startTime,reason});
  loseLife();
}

let codeEntrySource=null;
function openCodeEntry(source) {
  if(!tabletopState||runEnded||winPending)return;
  const picture=source==='picture'?currentPuzzleContext:null;
  closeZoom();
  if(runEnded||winPending)return;
  codeEntrySource=picture;
  codeDialog.querySelector('.eyebrow').textContent=picture?'Sharp eyes':'A new discovery';
  document.getElementById('codeTitle').textContent=picture?'What number did you find?':'What did you find?';
  codeDialog.querySelector('form>p').textContent=picture?'Type the number hidden in the picture to draw the card it points to.':'Enter a card number from a clue or a solved puzzle to draw it from the deck.';
  document.getElementById('discoveryCode').value='';
  codeFeedback.textContent='An incorrect code costs one life.';codeFeedback.className='';
  codeDialog.showModal();document.getElementById('discoveryCode').focus();
}
document.getElementById('codeForm').onsubmit=event=>{
  event.preventDefault();if(!tabletopState||runEnded||winPending)return;
  const input=document.getElementById('discoveryCode');const text=input.value.trim();
  if(!/^\d{1,3}$/.test(text)){codeFeedback.textContent='Enter a number from 0 to 199.';return;}
  const number=Number(text);
  if(flippedNumbers.has(number)){codeFeedback.textContent='You already found this card. Check your table or discards.';return;}
  if(drawTabletopCard(number,'code')){
    const source=codeEntrySource;codeDialog.close();
    if(source?.content.visualClue?.answer===number)openSuccess({eyebrow:'Hidden number found',title:'You found it!',
      how:'Card '+number+' was hidden in the picture. It is now on your table.',story:successStoryLine(number),action:'Continue',onClose:null});
    else showToast('A new card joins your table.');
  }
  else {
    if(lives===1)codeDialog.close();
    recordTabletopError(number,'Incorrect or premature code');
    codeFeedback.textContent=lives?'Incorrect code. Try again. One life lost.':'Sorry, game over. Please try again.';
    codeFeedback.className='entry-error';input.select();
  }
};

function combineTabletopCards(first,second) {
  if(!tabletopState||runEnded||winPending||first===second)return false;
  if(![first,second].every(n=>tabletopState.active.has(n)&&isCombinableItem(n)))return false;
  const result=[...cardContent].find(([n,c])=>!flippedNumbers.has(n)&&c.requires?.length===2&&c.requires.includes(first)&&c.requires.includes(second));
  if(!result){recordTabletopError(first+' + '+second,'Items do not combine');return false;}
  // The right pair, but too early: no penalty, just a nudge.
  if(result[1].isFinale&&!unlockedNumbers.has(result[0])){showToast('These belong together, but save them for the finale. Finish your other leads first.',4000);return false;}
  if(!drawTabletopCard(result[0],'combine'))return false;
  showToast('You made '+result[1].backItem.name+'!');
  openZoom(result[0]);return true;
}

function openCombinationPicker(number) {
  if(!tabletopState||runEnded||winPending)return;
  const options=document.getElementById('combineOptions');options.replaceChildren();
  document.getElementById('combineDescription').textContent='Choose another item to use with '+cardContent.get(number).backItem.name+'. An incorrect pairing costs one life.';
  [...tabletopState.active].filter(n=>n!==number&&isCombinableItem(n)).forEach(n=>{
    const button=document.createElement('button');button.className='discovery-row';button.type='button';
    button.innerHTML=itemVisual(cardContent.get(n).backItem)+'<span>'+cardContent.get(n).backItem.name+'</span>';
    button.onclick=()=>{combineDialog.close();combineTabletopCards(number,n);};options.appendChild(button);
  });
  if(!options.children.length)options.textContent='No other items yet. Keep following your clues.';
  combineDialog.showModal();
}

function openDiscardPile() {
  if(!tabletopState)return;
  const list=document.getElementById('discardList');list.replaceChildren();
  [...tabletopState.discarded].forEach(n=>{
    const c=cardContent.get(n),button=document.createElement('button');button.type='button';button.className='discovery-row';
    const label=document.createElement('span');label.textContent=c.backItem?.name||c.title;
    const badge=document.createElement('small');badge.textContent='#'+n;
    button.append(badge,label);button.onclick=()=>{discardDialog.close();openZoom(n);};list.appendChild(button);
  });
  if(!list.children.length)list.textContent='Finished cards will appear here.';
  discardDialog.showModal();
}

function startTabletopDrag(event,number,card) {
  if(event.button!==0||event.target.closest('button')||runEnded||winPending)return;
  event.preventDefault();
  const serial=runSerial,origin={x:event.clientX,y:event.clientY};let ghost=null,target=null,moved=false,scrollFrame=null,lastPoint=null;
  const bounds=card.getBoundingClientRect();
  card.setPointerCapture(event.pointerId);
  function clearTarget(){target?.classList.remove('drop-target');target=null;}
  function cleanup(){
    cancelAnimationFrame(scrollFrame);
    clearTarget();ghost?.remove();card.classList.remove('being-dragged');
    card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',end);card.removeEventListener('pointercancel',cancel);
    if(card.hasPointerCapture(event.pointerId))card.releasePointerCapture(event.pointerId);
    tabletopDragCleanup=null;
  }
  function autoScroll(){
    if(!moved||!lastPoint||serial!==runSerial)return;
    const y=lastPoint.y,delta=y<70?(y-70)*.25:y>innerHeight-110?(y-innerHeight+110)*.25:0;
    if(delta){window.scrollBy(0,delta);clearTarget();const hit=document.elementFromPoint(lastPoint.x,y)?.closest('.tabletop-item');if(hit&&hit!==card){target=hit;target.classList.add('drop-target');}}
    scrollFrame=requestAnimationFrame(autoScroll);
  }
  function move(e){
    if(serial!==runSerial){cleanup();return;}
    if(!moved&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<8)return;
    if(!moved){moved=true;ghost=card.cloneNode(true);ghost.className='card tabletop-card flipped card-drag-ghost';ghost.removeAttribute('role');ghost.setAttribute('aria-hidden','true');ghost.style.width=bounds.width+'px';ghost.style.height=bounds.height+'px';document.body.appendChild(ghost);card.classList.add('being-dragged');}
    lastPoint={x:e.clientX,y:e.clientY};if(scrollFrame===null)scrollFrame=requestAnimationFrame(autoScroll);
    e.preventDefault();ghost.style.left=(e.clientX-(origin.x-bounds.left))+'px';ghost.style.top=(e.clientY-(origin.y-bounds.top))+'px';
    clearTarget();const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.tabletop-item');
    if(hit&&hit!==card){target=hit;target.classList.add('drop-target');}
  }
  function end(){const second=target?Number(target.dataset.number):null;cleanup();if(moved){tabletopSuppressClickUntil=performance.now()+400;if(second!==null)combineTabletopCards(number,second);}}
  function cancel(){if(moved)tabletopSuppressClickUntil=performance.now()+400;cleanup();}
  card.addEventListener('pointermove',move);card.addEventListener('pointerup',end);card.addEventListener('pointercancel',cancel);tabletopDragCleanup=cancel;
}

renderTabletopHome();
