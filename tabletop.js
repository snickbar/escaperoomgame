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
  </dialog>`);
const codeDialog = document.getElementById('codeDialog');
const discardDialog = document.getElementById('discardDialog');
const combineDialog = document.getElementById('combineDialog');
const codeFeedback = document.getElementById('codeFeedback');
const tabletopZoomCode=document.createElement('button');
tabletopZoomCode.className='primary-action';tabletopZoomCode.type='button';tabletopZoomCode.textContent='Take cards';tabletopZoomCode.hidden=true;
tabletopZoomCode.onclick=closeZoom;zoomCardEl.appendChild(tabletopZoomCode);
function tabletopRewardNumbers(context) {
  if(!tabletopActive()||!tabletopState||runEnded||winPending||!context||context.num===null||
    cardContent.get(context.num)!==context.content||!flippedNumbers.has(context.num)||
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
  }
}
for (const dialog of [codeDialog, discardDialog, combineDialog]) {
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
document.getElementById('openCode').onclick = openCodeEntry;
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
    <div class="adventure-facts"><span>10 discoveries</span><span>A small, changing table</span>${p?.completed?'<span class="complete-badge">✓ Completed</span>':''}</div>
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
  [codeDialog,discardDialog,combineDialog].forEach(d=>{if(d.open)d.close();});
}

function dealTabletop() {
  tableEl.replaceChildren();
  winOverlayEl.classList.remove('open');gameOverOverlayEl.classList.remove('open');zoomOverlay.classList.remove('open');
  mistakes=0;lives=MAX_LIVES;renderLives();startTime=Date.now();
  buildStoryCardContent(randomInt(STORY_MODE_TABLE_SIZE_MIN,STORY_MODE_TABLE_SIZE_MAX));
  // Geometry clues belong to the old fixed grid. A changing table uses codes.
  cardContent.forEach(content=>{
    if(!content.isProgress)return;
    content.hint=content.unlocks.length ? describeUnlocks(content.unlocks)
      : content.backItem ? 'Drag this onto a related item to see what you can make.' : content.hint;
  });
  const root=[...cardContent].find(([,c])=>c.isSeed);
  root[1].unlocks.forEach(n=>flippedNumbers.add(n));
  root[1].hint='Your first two leads are on the table. Inspect the puzzle, and keep the item for when you find its partner.';
  tabletopState={active:new Set(flippedNumbers),discarded:new Set(),lastDraw:[],selected:null};
  deckEl.dataset.empty='true';deckWrapEl.style.display='none';
  document.body.classList.add('tabletop-story');tabletopToolbar.hidden=false;tableHeading.hidden=false;
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
  const type=item?(combinable?'Item':'Discovery'):content.puzzle?(content.puzzle.solved?'Solved clue':'Puzzle'):content.isWin?'The ending':'Story clue';
  const title=item?.name || (content.puzzle ? MINI_GAMES[content.puzzle.type].label : content.isWin ? 'Home safely' : 'A new lead');
  const card=document.createElement('article');card.className='card tabletop-card flipped'+(combinable?' tabletop-item':'');
  card.dataset.number=number;card.tabIndex=0;card.setAttribute('role','button');
  card.setAttribute('aria-label',`${item?.name||content.title}, card ${number}. Tap to inspect${combinable?', or drag onto another item to combine.':'.'}`);
  card.innerHTML=`<div class="card-inner"><div class="card-face card-front ${item?'has-art':''}">
    <div class="tabletop-card-top"><span class="card-kind">${type}</span><span class="front-number">${number}</span></div>
    ${item?'<div class="front-icon">'+itemVisual(item)+'</div>':'<div class="clue-illustration" aria-hidden="true">'+puzzleStamp(content.puzzle?.type)+'</div>'}
    <h3 class="message">${title}</h3>
    <p class="hint">${content.puzzle&&!content.puzzle.solved?'Tap to solve & discover what comes next.':combinable?'Drag onto another item':'Tap to read your discovery.'}</p>
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
    if(!flippedNumbers.has(n)||c.puzzle&&!c.puzzle.solved)return;
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
  if(via==='combine'&&(!c.requires||!c.requires.every(n=>tabletopState.active.has(n))))return false;
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

function openCodeEntry() {
  if(!tabletopState||runEnded||winPending)return;
  closeZoom();
  if(runEnded||winPending)return;
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
  if(drawTabletopCard(number,'code')){codeDialog.close();showToast('A new card joins your table.');}
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
  const serial=runSerial,origin={x:event.clientX,y:event.clientY};let ghost=null,target=null,moved=false;
  const bounds=card.getBoundingClientRect();
  card.setPointerCapture(event.pointerId);
  function clearTarget(){target?.classList.remove('drop-target');target=null;}
  function cleanup(){
    clearTarget();ghost?.remove();card.classList.remove('being-dragged');
    card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',end);card.removeEventListener('pointercancel',cancel);
    if(card.hasPointerCapture(event.pointerId))card.releasePointerCapture(event.pointerId);
    tabletopDragCleanup=null;
  }
  function move(e){
    if(serial!==runSerial){cleanup();return;}
    if(!moved&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<8)return;
    if(!moved){moved=true;ghost=card.cloneNode(true);ghost.className='card tabletop-card flipped card-drag-ghost';ghost.removeAttribute('role');ghost.setAttribute('aria-hidden','true');ghost.style.width=bounds.width+'px';ghost.style.height=bounds.height+'px';document.body.appendChild(ghost);card.classList.add('being-dragged');}
    e.preventDefault();ghost.style.left=(e.clientX-(origin.x-bounds.left))+'px';ghost.style.top=(e.clientY-(origin.y-bounds.top))+'px';
    clearTarget();const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.tabletop-item');
    if(hit&&hit!==card){target=hit;target.classList.add('drop-target');}
  }
  function end(){const second=target?Number(target.dataset.number):null;cleanup();if(moved){tabletopSuppressClickUntil=performance.now()+400;if(second!==null)combineTabletopCards(number,second);}}
  function cancel(){if(moved)tabletopSuppressClickUntil=performance.now()+400;cleanup();}
  card.addEventListener('pointermove',move);card.addEventListener('pointerup',end);card.addEventListener('pointercancel',cancel);tabletopDragCleanup=cancel;
}

renderTabletopHome();
