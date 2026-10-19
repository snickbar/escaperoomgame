// Story discoveries: deduction from evidence, and one-number picture clues.
const DEDUCTION_THEMES={
 lighthouse:{places:['Left locker','Middle locker','Right locker'],items:['compass','brass key','signal flag'],scene:'The keeper stored three supplies in three lockers. Each locker holds one item. His maintenance notes are the only guide to what is inside.'},
 library:{places:['Left drawer','Middle drawer','Right drawer'],items:['wax seal','brass key','borrower’s note'],scene:'Ada moved three pieces of evidence into separate desk drawers before the doors locked. Each drawer holds one item. Compare her notes to decide where to search.'},
 lucy:{places:['Left basket','Middle basket','Right basket'],items:['dog whistle','garden key','blue ribbon'],scene:'The gardener put three things in separate baskets. Each basket holds one item. Lucy remembers these details about where they went.'}
};
const THREE_ORDERS=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
function investigationStoryBeat(theme,chapter){
 const beats={
  lighthouse:['The keeper’s maintenance board lists faults in several rooms, but the work order is missing. The lantern, lift and storage spaces offer separate leads. Keep useful parts: their partners may be somewhere else in the tower.','Over the telephone, Mara says the fog is thickening. The keeper’s last notes mention a supply shelf and a signal panel. You can follow either lead while the other repairs wait.'],
  library:['Ada has left more than one trail: the catalogue, a torn map and an old work note. The clues need not be followed in order. Keep anything that might complete a discovery somewhere else in the archive.','The archive clock strikes again. The forged paperwork and the original records are beginning to tell different stories. Ada’s next note points toward the reading desk, while the unfinished repairs may still reveal evidence.'],
  lucy:['Pip’s tracks split around the garden beds. Lucy spots clues by the gate, the shed and the porch; none tells the whole story yet. Keep the things you find, even when their uses are not clear.','A familiar bark carries over the orchard wall. Lucy knows Pip is nearby, but the garden still holds several unfinished trails. An overlooked item or a small marking may connect them.']
 };
 return (beats[theme]||beats.lighthouse)[chapter===0?0:1];
}
function deductionMatches(order,clue){
 const a=order.indexOf(clue.a),b=order.indexOf(clue.b);
 return clue.kind==='not'?a!==clue.place:clue.kind==='left'?a+1===b:Math.abs(a-b)===1;
}
function makeDeductionPuzzle(target,theme=activeStory.id){
 const setting=DEDUCTION_THEMES[theme]||DEDUCTION_THEMES.lighthouse;
 const order=pickRandom(THREE_ORDERS).slice(),pool=[];
 for(let a=0;a<3;a++){
  for(let place=0;place<3;place++)if(order[place]!==a)pool.push({kind:'not',a,place,text:'The '+setting.items[a]+' is not in the '+setting.places[place].toLowerCase()+'.'});
  for(let b=0;b<3;b++)if(a!==b){
   if(order.indexOf(a)+1===order.indexOf(b))pool.push({kind:'left',a,b,text:'The '+setting.items[a]+' is immediately to the left of the '+setting.items[b]+'.'});
   if(a<b&&Math.abs(order.indexOf(a)-order.indexOf(b))===1)pool.push({kind:'beside',a,b,text:'The '+setting.items[a]+' is next to the '+setting.items[b]+'.'});
  }
 }
 let candidates=THREE_ORDERS.slice();const clues=[];
 // Prefer one relational clue, then keep only notes that eliminate ambiguity.
 const relational=pickRandom(pool.filter(c=>c.kind!=='not'));clues.push(relational);candidates=candidates.filter(o=>deductionMatches(o,relational));
 while(candidates.length>1){
  const useful=pool.filter(c=>!clues.includes(c)&&candidates.some(o=>!deductionMatches(o,c)));
  const best=Math.min(...useful.map(c=>candidates.filter(o=>deductionMatches(o,c)).length));
  const clue=pickRandom(useful.filter(c=>candidates.filter(o=>deductionMatches(o,c)).length===best));
  clues.push(clue);candidates=candidates.filter(o=>deductionMatches(o,clue));
 }
 const sought=randomInt(0,2);
 return {type:'deduction',scene:setting.scene,places:setting.places.slice(),items:setting.items.slice(),clues:shuffle(clues),sought,solutionIndex:order.indexOf(sought),order,answer:target,solved:false,hintsRemaining:PUZZLE_HINT_COUNT,eliminated:[],reveal:setting.places.map((place,i)=>place+': '+setting.items[order[i]]).join('; ')};
}
function renderDeductionPuzzle(content,num,opts={}){
 const p=content.puzzle,isTest=!!opts.isTest;
 [cipherGridEl,cipherKeyboardEl,sliderGridEl,swapGridEl,pipesGridEl,shapesAreaEl].forEach(e=>e.hidden=true);
 puzzleInstructionsEl.textContent=p.scene;puzzleFeedbackEl.textContent='';puzzleFeedbackEl.className='puzzle-feedback';puzzleAgainEl.hidden=true;puzzleRevealEl.hidden=true;
 const area=document.createElement('section');area.id='deductionArea';area.className='deduction-area';puzzleInstructionsEl.after(area);
 const heading=document.createElement('h3');heading.textContent='Where is the '+p.items[p.sought]+'?';area.appendChild(heading);
 const evidence=document.createElement('ol');evidence.className='deduction-evidence';p.clues.forEach(c=>{const li=document.createElement('li');li.textContent=c.text;evidence.appendChild(li);});area.appendChild(evidence);
 const direction=document.createElement('p');direction.textContent='Left and right are as you face the three places. Use every note: only one arrangement fits.';area.appendChild(direction);
 const choices=document.createElement('div');choices.className='deduction-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose a place to search');area.appendChild(choices);
 const check=document.createElement('button');check.type='button';check.className='primary-action';check.textContent='Check deduction';area.appendChild(check);
 if(!isTest){const penalty=document.createElement('small');penalty.textContent='Checking an incorrect deduction costs one life.';area.appendChild(penalty);}
 let selected=null;
 function draw(){
  choices.replaceChildren();p.places.forEach((place,i)=>{const button=document.createElement('button');button.type='button';button.textContent=place;button.disabled=p.solved||p.eliminated.includes(i);button.setAttribute('aria-pressed',String(selected===i));button.onclick=()=>{selected=i;draw();};choices.appendChild(button);});
  check.disabled=selected===null||p.solved;check.hidden=p.solved;
  puzzleHintEl.hidden=false;puzzleHintEl.textContent='💡 Hint ('+p.hintsRemaining+')';puzzleHintEl.disabled=p.solved||p.hintsRemaining<=0;
 }
 check.onclick=()=>{
  if(p.solved||selected===null||runEnded&&!isTest)return;
  if(selected!==p.solutionIndex){
   p.eliminated.push(selected);selected=null;
   if(!isTest)recordTabletopError(num,'Incorrect logic deduction');
   puzzleFeedbackEl.textContent='That arrangement conflicts with the notes. Read them together and try another place.';puzzleFeedbackEl.className='puzzle-feedback wrong';draw();return;
  }
  p.solved=true;onPuzzleSolved(content,num);draw();puzzleFeedbackEl.className='puzzle-feedback correct';
  puzzleFeedbackEl.textContent=isTest?'✓ Correct. '+p.reveal:'✓ Correct. '+puzzleResultText(p);
  if(!isTest){zoomHintEl.hidden=false;zoomHintEl.textContent=puzzleResultText(p);}puzzleAgainEl.hidden=!isTest;
 };
 puzzleHintEl.onclick=()=>{if(p.solved||p.hintsRemaining<=0)return;const wrong=[0,1,2].find(i=>i!==p.solutionIndex&&!p.eliminated.includes(i));if(wrong===undefined)return;p.eliminated.push(wrong);p.hintsRemaining--;if(selected===wrong)selected=null;draw();puzzleFeedbackEl.className='puzzle-feedback hint';puzzleFeedbackEl.textContent='You can rule out the '+p.places[wrong].toLowerCase()+'. Compare the remaining places with every note.';};
 puzzleRevealToggleEl.textContent='🔎 Show Answer (dev)';puzzleRevealToggleEl.onclick=()=>{puzzleRevealEl.hidden=!puzzleRevealEl.hidden;puzzleRevealEl.textContent=p.reveal;};puzzleAgainEl.onclick=()=>opts.onRetry?.();draw();
}
function pictureClueStory(theme,chapter){
 const lines={lighthouse:['Salt and old paint cover a keeper’s supply chest. A weathered marking might tell you where he hid the chart fragment.','The keeper scratched a reference into a signal panel. Look closely before searching the last storage space.'],library:['Ada left a sketch of a forgotten reading desk. One worn detail points to the missing shelf-map fragment.','A sketch tucked inside the ledger shows a marked cabinet. Ada hid its reference in the drawing.'],lucy:['Lucy finds an old drawing of the garden gate. A worn marking could lead to the missing map corner.','A sketch of the gardener’s store catches Lucy’s eye. A small detail may point to Pip’s next trail.']};
 return (lines[theme]||lines.lighthouse)[chapter===2?0:1];
}
function pictureNumberStrokes(number){
 const segments={a:[2,2,14,2],b:[14,2,14,13],c:[14,13,14,24],d:[2,24,14,24],e:[2,13,2,24],f:[2,2,2,13],g:[2,13,14,13]};
 const digits=['ab cdef'.replaceAll(' ',''),'bc','abged','abgcd','fgbc','afgcd','afgecd','abc','abcdefg','abfgcd'];
 return String(number).split('').map((digit,i)=>'<g transform="translate('+(i*21)+' 0)">'+[...digits[Number(digit)]].map(key=>{const [x1,y1,x2,y2]=segments[key];return '<path d="M'+x1+' '+y1+' '+x2+' '+y2+'"/>';}).join('')+'</g>').join('');
}
function hiddenPictureArtwork(clue){
 const palette=clue.theme==='library'?['#d2bd92','#71563c','#4f6858']:clue.theme==='lucy'?['#c5d7ad','#6b7651','#74604b']:['#c1d2cd','#526a70','#88623f'];
 const isDesk=clue.theme==='library';
 return `<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A weathered scene with a number worked into the drawing. Look closely at the woodwork.">
 <defs><linearGradient id="scene-paper" x2="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="#eee0bc"/></linearGradient><pattern id="wood-grain" width="31" height="29" patternUnits="userSpaceOnUse"><path d="M0 9q14-8 31 1M2 19q17-6 27 1" fill="none" stroke="#5f4633" opacity=".19"/></pattern></defs>
 <rect width="480" height="340" rx="10" fill="url(#scene-paper)"/>
 <path d="M0 235Q80 186 157 223T328 206T480 209V340H0" fill="${palette[2]}" opacity=".2"/>
 ${isDesk?'<path d="M47 245h385v15H47Zm19 15v65m344-65v65" fill="none" stroke="#71563c" stroke-width="10"/><path d="M65 130h42v108H65Zm46-18h30v126h-30Zm36 16h39v110h-39Z" fill="#6b7866" stroke="#655640" stroke-width="3"/><path d="m359 147-13-45h49l-12 45m-16 0v89m-22 3h50" fill="#c6a66b" stroke="#655640" stroke-width="4"/>':'<path d="M25 258h430M44 260V119m45 141V95m44 165V112m267 148V90m39 170V125" stroke="'+palette[1]+'" stroke-width="8"/><path d="M0 176h139m253 0h88M0 221h141m252 0h88" stroke="'+palette[1]+'" stroke-width="5"/><path d="M35 119q-33-58 19-57m346 38q3-65 49-45M23 291q51-66 88-30m280 15q33-50 69-21" fill="none" stroke="#5f794e" stroke-width="5"/>'}
 <g transform="translate(${clue.variant?174:164} ${isDesk?118:128}) rotate(${clue.variant?-5:4})">
 <rect x="-20" y="-21" width="165" height="123" rx="5" fill="${palette[2]}" stroke="#64513b" stroke-width="5"/><rect x="-18" y="-19" width="161" height="119" fill="url(#wood-grain)"/>
 <path d="M-17 14h159M-17 57h159M-17 91h159" stroke="#3c382e" opacity=".4" stroke-width="3"/>
 <path d="M-1-10v101m129-101v101" stroke="#a58c61" stroke-width="6"/>
 <g transform="translate(${clue.variant?39:27} ${clue.variant?25:20}) rotate(${clue.variant?3:-7})" fill="none" stroke="#e4d4ac" stroke-width="2.4" stroke-linecap="round" opacity=".82">${pictureNumberStrokes(clue.answer)}</g>
 <path d="m19 40 12-9m48 35 7-10m-54 20 10 7m58-67 14 5" stroke="#352f25" stroke-width="1.3" opacity=".45"/>
 </g>
 <path d="M23 320q31-15 68-4m279-10q45-14 84 4" fill="none" stroke="#766a4e" stroke-width="2"/>
 </svg>`;
}
