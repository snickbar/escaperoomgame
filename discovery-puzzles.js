// Story discoveries: deduction from evidence, and one-number picture clues.
// Each story has several settings; the two logic cards in one run never share one.
const DEDUCTION_THEMES={
 lighthouse:[
  {noun:'locker',prep:'in',items:['compass','brass key','signal flag','tide table'],scene:'Four lockers stand in a row in the keeper’s store, numbered 1 to 4 from left to right. Each holds one item. His maintenance notes are the only guide to what is inside.'},
  {noun:'crate',prep:'in',items:['spare wick','oil can','fuse','logbook'],scene:'Four crates wait on the stair landing, numbered 1 to 4 from left to right. Each holds a single supply. The delivery slip describes how they were packed.'},
  {noun:'peg',prep:'on',items:['oilskin coat','coil of rope','brass whistle','storm lantern'],scene:'Four pegs run along the boathouse wall, numbered 1 to 4 from left to right. Each holds one piece of gear. The keeper’s checklist remembers where everything hangs.'}
 ],
 library:[
  {noun:'drawer',prep:'in',items:['wax seal','brass key','borrower’s note','ribbon bookmark'],scene:'Ada moved four pieces of evidence into the desk drawers, numbered 1 to 4 from left to right. Each drawer holds one item. Compare her notes to decide where to search.'},
  {noun:'box',prep:'in',items:['quill','ink bottle','magnifying glass','pressed leaf'],scene:'Four archive boxes sit on the reading table, numbered 1 to 4 from left to right. Each holds one object. The night watchman jotted down how they were stored.'},
  {noun:'pigeonhole',prep:'in',items:['sealed letter','street map','postage stamp','silver pencil'],scene:'Four pigeonholes above the returns desk are numbered 1 to 4 from left to right. Each holds one thing. A slip in Ada’s handwriting describes them.'}
 ],
 lucy:[
  {noun:'basket',prep:'in',items:['dog whistle','garden key','blue ribbon','tennis ball'],scene:'The gardener left four baskets in a row on the potting bench, numbered 1 to 4 from left to right. Each basket holds one thing. Lucy remembers a few details about where they went.'},
  {noun:'flowerpot',prep:'under',items:['trowel','seed packet','collar tag','ball of twine'],scene:'Four upturned flowerpots stand along the porch step, numbered 1 to 4 from left to right. Something is tucked under each one. Lucy’s mum left a note about them.'},
  {noun:'hook',prep:'on',items:['rain hat','lantern','leash','pair of gloves'],scene:'Four hooks line the gatehouse wall, numbered 1 to 4 from left to right. Each holds one thing. The groundskeeper’s chalk notes describe what hangs where.'}
 ]
};
const DEDUCTION_PLACES=4;
const DEDUCTION_ORDERS=(function permute(rest){
 if(!rest.length)return [[]];
 return rest.flatMap((v,i)=>permute(rest.filter((_,j)=>j!==i)).map(tail=>[v,...tail]));
})([0,1,2,3]);
let deductionSettingOrder=null;
function investigationStoryBeat(theme,chapter){
 const beats={
  lighthouse:['The keeper’s maintenance board lists faults in several rooms, but the work order is missing. The lantern, lift and storage spaces offer separate leads. Keep useful parts: their partners may be somewhere else in the tower.','Over the telephone, Mara says the fog is thickening. The keeper’s last notes mention a supply shelf and a signal panel. You can follow either lead while the other repairs wait.'],
  library:['Ada has left more than one trail: the catalogue, a torn map and an old work note. The clues need not be followed in order. Keep anything that might complete a discovery somewhere else in the archive.','The archive clock strikes again. The forged paperwork and the original records are beginning to tell different stories. Ada’s next note points toward the reading desk, while the unfinished repairs may still reveal evidence.'],
  lucy:['Pip’s tracks split around the garden beds. Lucy spots clues by the gate, the shed and the porch; none tells the whole story yet. Keep the things you find, even when their uses are not clear.','A familiar bark carries over the orchard wall. Lucy knows Pip is nearby, but the garden still holds several unfinished trails. An overlooked item or a small marking may connect them.']
 };
 return (beats[theme]||beats.lighthouse)[chapter===0?0:1];
}
function deductionMatches(order,clue){
 const at=item=>order.indexOf(item),a=at(clue.a);
 if(clue.kind==='not')return a!==clue.place;
 if(clue.kind==='end')return a===0||a===order.length-1;
 const b=at(clue.b);
 if(clue.kind==='left')return a+1===b;
 if(clue.kind==='beside')return Math.abs(a-b)===1;
 if(clue.kind==='apart')return Math.abs(a-b)>1;
 if(clue.kind==='before')return a<b;
 const c=at(clue.c);
 return clue.kind==='between'&&a>Math.min(b,c)&&a<Math.max(b,c);
}
function deductionCluePool(order,setting){
 const name=i=>setting.items[i],pos=i=>order.indexOf(i),pool=[],n=order.length;
 for(let a=0;a<n;a++){
  for(let place=0;place<n;place++)if(pos(a)!==place)pool.push({kind:'not',a,place,text:'The '+name(a)+' is not '+setting.prep+' '+setting.noun+' '+(place+1)+'.'});
  if(pos(a)===0||pos(a)===n-1)pool.push({kind:'end',a,text:'The '+name(a)+' is at one end of the row.'});
  for(let b=0;b<n;b++){
   if(a===b)continue;
   if(pos(a)+1===pos(b))pool.push({kind:'left',a,b,text:'The '+name(a)+' is immediately to the left of the '+name(b)+'.'});
   if(pos(a)<pos(b)&&pos(a)+1!==pos(b))pool.push({kind:'before',a,b,text:'The '+name(a)+' is somewhere to the left of the '+name(b)+'.'});
   if(a<b&&Math.abs(pos(a)-pos(b))===1)pool.push({kind:'beside',a,b,text:'The '+name(a)+' is next to the '+name(b)+'.'});
   if(a<b&&Math.abs(pos(a)-pos(b))>1)pool.push({kind:'apart',a,b,text:'The '+name(a)+' is not next to the '+name(b)+'.'});
   for(let c=b+1;c<n;c++)if(c!==a&&pos(a)>Math.min(pos(b),pos(c))&&pos(a)<Math.max(pos(b),pos(c)))
    pool.push({kind:'between',a,b,c,text:'The '+name(a)+' is somewhere between the '+name(b)+' and the '+name(c)+'.'});
  }
 }
 return pool;
}
// Clues are chosen at random, then trimmed until each note is necessary.
// Accept only sets with several notes and at least two relational ones.
function chooseDeductionClues(order,pool){
 const fits=(clues)=>DEDUCTION_ORDERS.filter(o=>clues.every(c=>deductionMatches(o,c)));
 let best=null;
 for(let attempt=0;attempt<80;attempt++){
  let clues=[],candidates=DEDUCTION_ORDERS;
  while(candidates.length>1){
   const useful=pool.filter(c=>!clues.includes(c)&&candidates.some(o=>!deductionMatches(o,c)));
   const relational=useful.filter(c=>c.kind!=='not'&&c.kind!=='end');
   const clue=pickRandom(relational.length&&gameRandom()<.7?relational:useful);
   clues.push(clue);candidates=candidates.filter(o=>deductionMatches(o,clue));
  }
  for(const clue of shuffle(clues.slice()))if(fits(clues.filter(c=>c!==clue)).length===1)clues=clues.filter(c=>c!==clue);
  const relationalCount=clues.filter(c=>c.kind!=='not'&&c.kind!=='end').length;
  const good=clues.length>=3&&clues.length<=5&&relationalCount>=2;
  if(good)return clues;
  if(!best||Math.abs(clues.length-4)<Math.abs(best.length-4))best=clues;
 }
 return best;
}
function makeDeductionPuzzle(target,theme=activeStory.id,slot){
 const settings=DEDUCTION_THEMES[theme]||DEDUCTION_THEMES.lighthouse;
 if(!slot||!deductionSettingOrder)deductionSettingOrder=shuffle(settings.map((_,i)=>i));
 const setting=settings[deductionSettingOrder[(slot||0)%settings.length]];
 const order=pickRandom(DEDUCTION_ORDERS).slice();
 const clues=chooseDeductionClues(order,deductionCluePool(order,setting));
 const sought=randomInt(0,DEDUCTION_PLACES-1);
 const places=setting.items.map((_,i)=>setting.noun+' '+(i+1));
 return {type:'deduction',scene:setting.scene,noun:setting.noun,prep:setting.prep,places,items:setting.items.slice(),clues:shuffle(clues),sought,solutionIndex:order.indexOf(sought),order,answer:target,solved:false,hintsRemaining:PUZZLE_HINT_COUNT,eliminated:[],reveal:places.map((place,i)=>place+': '+setting.items[order[i]]).join('; ')};
}
function renderDeductionPuzzle(content,num,opts={}){
 const p=content.puzzle,isTest=!!opts.isTest;
 [cipherGridEl,cipherKeyboardEl,sliderGridEl,swapGridEl,pipesGridEl,shapesAreaEl].forEach(e=>e.hidden=true);
 // A story card already shows the scene as its message; tell it only once.
 puzzleInstructionsEl.textContent=num===null?p.scene:'';puzzleFeedbackEl.textContent='';puzzleFeedbackEl.className='puzzle-feedback';puzzleAgainEl.hidden=true;puzzleRevealEl.hidden=true;
 const area=document.createElement('section');area.id='deductionArea';area.className='deduction-area';puzzleInstructionsEl.after(area);
 const heading=document.createElement('h3');heading.textContent='Where is the '+p.items[p.sought]+'?';area.appendChild(heading);
 const evidence=document.createElement('ol');evidence.className='deduction-evidence';p.clues.forEach(c=>{const li=document.createElement('li');li.textContent=c.text;evidence.appendChild(li);});area.appendChild(evidence);
 const direction=document.createElement('p');direction.textContent='Left and right are as you face the row. Use every note: only one arrangement fits.';area.appendChild(direction);
 const choices=document.createElement('div');choices.className='deduction-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose a place to search');area.appendChild(choices);
 const check=document.createElement('button');check.type='button';check.className='primary-action';check.textContent='Check deduction';area.appendChild(check);
 if(!isTest){const penalty=document.createElement('small');penalty.textContent='Checking an incorrect deduction costs one life.';area.appendChild(penalty);}
 let selected=null;
 function draw(){
  choices.replaceChildren();p.places.forEach((place,i)=>{
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',place);
   const noun=document.createElement('small');noun.textContent=p.noun||place.replace(/\s*\d+$/,'');
   const number=document.createElement('strong');number.textContent=String(i+1);button.append(noun,number);
   button.disabled=p.solved||p.eliminated.includes(i);button.setAttribute('aria-pressed',String(selected===i));button.onclick=()=>{selected=i;draw();};choices.appendChild(button);
  });
  check.disabled=selected===null||p.solved;check.hidden=p.solved;
  puzzleHintEl.hidden=false;puzzleHintEl.textContent=puzzleHintLabel(p);puzzleHintEl.disabled=p.solved||p.hintsRemaining<=0;
 }
 check.onclick=()=>{
  if(p.solved||selected===null||runEnded&&!isTest)return;
  if(selected!==p.solutionIndex){
   p.eliminated.push(selected);selected=null;
   if(!isTest)recordTabletopError(num,'Incorrect logic deduction');
   puzzleFeedbackEl.textContent='That arrangement conflicts with the notes. Read them together and try another place.';puzzleFeedbackEl.className='puzzle-feedback wrong';draw();return;
  }
  p.solved=true;onPuzzleSolved(content,num);draw();puzzleFeedbackEl.className='puzzle-feedback correct';
  puzzleFeedbackEl.textContent=isTest?'✓ Correct. '+p.reveal:'✓ Correct. The '+p.items[p.sought]+' is '+(p.prep||'in')+' '+p.places[p.solutionIndex]+'.';
  puzzleAgainEl.hidden=!isTest;
  if(!isTest)scheduleGame(()=>{if(currentPuzzleContext?.content===content&&typeof showPuzzleSuccess==='function')showPuzzleSuccess(content,num);},700);
 };
 puzzleHintEl.onclick=()=>{if(p.solved||p.hintsRemaining<=0)return;const wrong=shuffle(p.places.map((_,i)=>i)).find(i=>i!==p.solutionIndex&&!p.eliminated.includes(i));if(wrong===undefined)return;p.eliminated.push(wrong);p.hintsRemaining--;if(selected===wrong)selected=null;draw();puzzleFeedbackEl.className='puzzle-feedback hint';puzzleFeedbackEl.textContent='You can rule out '+p.places[wrong]+'. Compare the remaining places with every note.';};
 puzzleRevealToggleEl.textContent='🔎 Show Answer (dev)';puzzleRevealToggleEl.onclick=()=>{puzzleRevealEl.hidden=!puzzleRevealEl.hidden;puzzleRevealEl.textContent=p.reveal;};puzzleAgainEl.onclick=()=>opts.onRetry?.();draw();
}
function pictureClueStory(theme,chapter){
 const lines={lighthouse:['Salt and old paint cover the keeper’s things. A weathered marking might tell you where he hid the chart fragment.','The keeper scratched a reference into something he passed every day. Look closely before searching the last storage space.'],library:['Ada left a sketch of a forgotten corner of the archive. One worn detail points to the missing shelf-map fragment.','A sketch tucked inside the ledger shows a familiar piece of furniture. Ada hid its reference in the drawing.'],lucy:['Lucy finds an old drawing of the garden. A worn marking could lead to the missing map corner.','A sketch from the gardener’s notebook catches Lucy’s eye. A small detail may point to Pip’s next trail.']};
 return (lines[theme]||lines.lighthouse)[chapter===2?0:1];
}
function pictureNumberStrokes(number){
 const segments={a:[2,2,14,2],b:[14,2,14,13],c:[14,13,14,24],d:[2,24,14,24],e:[2,13,2,24],f:[2,2,2,13],g:[2,13,14,13]};
 const digits=['abcdef','bc','abged','abgcd','fgbc','afgcd','afgecd','abc','abcdefg','abfgcd'];
 return String(number).split('').map((digit,i)=>'<g transform="translate('+(i*21)+' 0)">'+[...digits[Number(digit)]].map(key=>{const [x1,y1,x2,y2]=segments[key];return '<path d="M'+x1+' '+y1+' '+x2+' '+y2+'"/>';}).join('')+'</g>').join('');
}
// Four illustrated places per story. Each names where its number is worked in
// (x, y, rotation, scale, stroke) so the marking blends with that surface.
const HIDDEN_PICTURE_SCENES={
 lucy:[
  ()=>({host:[226,204,-4,.95,'#e9d3a6'],art:`<rect width="480" height="340" fill="#d6e9e6"/><path d="M0 205q90-40 180-12t170-20 130 10v157H0Z" fill="#b9d49a"/><circle cx="410" cy="58" r="26" fill="#f6dd8a"/><rect y="250" width="480" height="90" fill="#93bd72"/>
   ${[18,46,74,102,130,322,350,378,406,434].map(x=>`<path d="M${x} 262V166l11-12 11 12v96Z" fill="#f1e6cf" stroke="#8c7356" stroke-width="3"/>`).join('')}<path d="M10 190h150m162 0h158M10 236h150m162 0h158" stroke="#8c7356" stroke-width="7"/>
   <rect x="168" y="128" width="146" height="134" rx="6" fill="#b58556" stroke="#6e4a2c" stroke-width="5"/>${[0,1,2,3,4].map(i=>`<path d="M${180+i*27} 132v126" stroke="#8d6440" stroke-width="2.5"/>`).join('')}<path d="M172 156h138M172 236h138M176 234l130-76" stroke="#6e4a2c" stroke-width="7"/><circle cx="296" cy="200" r="6" fill="#d9b54a" stroke="#6e4a2c" stroke-width="2"/>
   <path d="M300 186q18-6 22 12" fill="none" stroke="#4d7fb8" stroke-width="5" stroke-linecap="round"/>
   ${[[40,286,'#e8857a'],[78,300,'#f2c94c'],[118,284,'#b48ad8'],[360,292,'#e8857a'],[402,280,'#f2c94c'],[440,298,'#b48ad8']].map(([x,y,c])=>`<path d="M${x} ${y+30}v-26" stroke="#5f8f4d" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff4c9"/>`).join('')}`}),
  ()=>({host:[224,224,3,.9,'#e7a27e'],art:`<rect width="480" height="340" fill="#eadcbf"/>${[0,1,2,3,4,5,6,7].map(i=>`<path d="M${i*62} 0v340" stroke="#d4c19c" stroke-width="3"/>`).join('')}<rect x="300" y="38" width="130" height="92" rx="4" fill="#bfe0ea" stroke="#8a6a46" stroke-width="7"/><path d="M365 38v92M300 84h130" stroke="#8a6a46" stroke-width="5"/>
   <rect x="20" y="258" width="440" height="16" rx="3" fill="#9b6c43"/><path d="M40 274v66m400-66v66" stroke="#7a5233" stroke-width="12"/>
   <path d="M60 258l-9-62h76l-9 62Z" fill="#c9714c" stroke="#88462c" stroke-width="4"/><path d="M55 196h70v12H55Z" fill="#b5623f"/><path d="M90 196q-20-50 4-74m-4 74q14-40 40-52m-40 52q-30-24-46-20" fill="none" stroke="#5f8f4d" stroke-width="5"/><circle cx="94" cy="118" r="9" fill="#e8857a"/>
   <path d="M182 258l-12-86h108l-12 86Z" fill="#cf7a52" stroke="#88462c" stroke-width="4"/><path d="M175 172h98v15h-98Z" fill="#b5623f"/><path d="M224 172q-6-48 22-70m-22 70q-26-34-54-36m54 36q30-20 48-12" fill="none" stroke="#5f8f4d" stroke-width="6"/><circle cx="248" cy="98" r="10" fill="#f2c94c"/><circle cx="168" cy="134" r="8" fill="#b48ad8"/>
   <path d="M328 258l-7-46h58l-7 46Z" fill="#c9714c" stroke="#88462c" stroke-width="4"/><path d="M324 212h62v10h-62Z" fill="#b5623f"/><path d="M355 212v-30m0 0q-14-8-18-22m18 22q14-6 22-20" fill="none" stroke="#5f8f4d" stroke-width="4"/>
   <path d="M396 240h44l8-30h-60Z" fill="#7aa0b8" stroke="#4d6a7c" stroke-width="4"/><path d="M440 216q22-6 28 10" fill="none" stroke="#4d6a7c" stroke-width="4"/><path d="M398 210l-26-22" stroke="#4d6a7c" stroke-width="5"/>`}),
  ()=>({host:[242,232,-90,.85,'#c79b6f'],art:`<rect width="480" height="340" fill="#d3e7ef"/><path d="M0 230q120-30 240-6t240-8v124H0Z" fill="#a9cf89"/><rect y="270" width="480" height="70" fill="#8db86a"/>
   <path d="M205 300q14-70 6-150h58q-8 80 10 150Z" fill="#9a6a43" stroke="#5f3f26" stroke-width="5"/><path d="M226 300q-6-50 4-120m20 120q4-60 0-110" stroke="#7d5233" stroke-width="3" fill="none"/><path d="M211 160q-50-10-70-40m128 40q40-16 60-50" stroke="#5f3f26" stroke-width="10" fill="none" stroke-linecap="round"/>
   ${[[150,96,62],[240,66,74],[330,98,60],[196,136,52],[290,140,54]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#6fa258" stroke="#4f7d3d" stroke-width="4"/>`).join('')}
   ${[[132,92],[186,60],[258,50],[300,116],[352,82],[214,128],[160,132],[322,150]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="#d9483b" stroke="#8c2a22" stroke-width="2"/><path d="M${x} ${y-9}v-5" stroke="#5f3f26" stroke-width="2"/>`).join('')}
   <path d="M60 300h40m-34 0 6-18h18l6 18" fill="#b98b5a" stroke="#6e4a2c" stroke-width="4"/><circle cx="74" cy="276" r="6" fill="#d9483b"/><circle cx="86" cy="278" r="6" fill="#d9483b"/>
   <path d="M360 296q8-16 30-14 18 2 24 14Z" fill="#fff" stroke="#8c7356" stroke-width="3"/><circle cx="410" cy="284" r="7" fill="#fff" stroke="#8c7356" stroke-width="3"/>`}),
  ()=>({host:[172,181,-11,.75,'#e2c9a0'],art:`<rect width="480" height="340" fill="#d8ebe3"/><path d="M0 150q240-30 480 0v40H0Z" fill="#b3d39a"/><path d="M0 200q120 20 240 6t240 8v126H0Z" fill="#7fb7cf"/><path d="M0 230q60 8 120 0t120 0 120 0 120 0M0 268q60 8 120 0t120 0 120 0 120 0" fill="none" stroke="#bfe2ee" stroke-width="4"/>
   <path d="M0 180q40 0 70 28L40 340H0Zm480 0q-40 0-70 28l30 132h40Z" fill="#8db86a"/>
   <path d="M70 196q170-90 340 0" fill="none" stroke="#7a5233" stroke-width="12"/><path d="M70 214q170-80 340 0" fill="none" stroke="#9b6c43" stroke-width="22"/>${[0,1,2,3,4,5,6,7,8].map(i=>{const x=92+i*37,y=203-Math.sin((x-70)/340*Math.PI)*58;return `<path d="M${x} ${y-14}v22" stroke="#6e4a2c" stroke-width="3"/>`;}).join('')}
   <path d="M76 200v54m328-54v54" stroke="#6e4a2c" stroke-width="12" stroke-linecap="round"/><path d="M110 168v-30m260 30v-30" stroke="#6e4a2c" stroke-width="7"/><path d="M110 140q130-66 260 0" fill="none" stroke="#6e4a2c" stroke-width="6"/>
   <path d="M330 300q14-16 30-4" fill="none" stroke="#5e8c50" stroke-width="5"/><ellipse cx="300" cy="300" rx="22" ry="8" fill="#5c9b4f"/><path d="M296 296q4-12 12-14" stroke="#3f6e36" stroke-width="3"/>`}),
 ],
 lighthouse:[
  ()=>({host:[245,236,2,1,'#e7cfa0'],art:`<rect width="480" height="340" fill="#bfd9e3"/><path d="M0 150h480v70H0Z" fill="#4f8ea3"/><path d="M20 172h60m40 18h80m60-22h90m40 30h60" stroke="#8fc0cf" stroke-width="3"/><path d="M360 80q10-10 20 0 10-10 20 0" fill="none" stroke="#56636a" stroke-width="3"/>
   <rect y="220" width="480" height="120" fill="#a77d55"/>${[0,1,2,3,4,5].map(i=>`<path d="M0 ${238+i*20}h480" stroke="#7d5a3a" stroke-width="3"/>`).join('')}<path d="M30 220v-60m420 60v-60" stroke="#6e4a2c" stroke-width="12"/>
   <rect x="150" y="164" width="190" height="98" rx="6" fill="#8a5b36" stroke="#4f331e" stroke-width="5"/><path d="M146 150q99-40 198 0v20H146Z" fill="#9c6a40" stroke="#4f331e" stroke-width="5"/><path d="M170 160v100m150-100v100" stroke="#c9a24a" stroke-width="8"/><rect x="235" y="176" width="22" height="26" rx="3" fill="#d6b24f" stroke="#4f331e" stroke-width="3"/>
   <ellipse cx="400" cy="258" rx="40" ry="14" fill="#c7a46a" stroke="#7a5a33" stroke-width="4"/><ellipse cx="400" cy="250" rx="30" ry="10" fill="none" stroke="#7a5a33" stroke-width="4"/><ellipse cx="400" cy="244" rx="18" ry="6" fill="none" stroke="#7a5a33" stroke-width="4"/>
   <path d="M60 210l14-30 14 30Z" fill="#c8553d" stroke="#7d3022" stroke-width="3"/><path d="M74 180v-26" stroke="#56636a" stroke-width="3"/>`}),
  ()=>({host:[334,226,-3,.9,'#e8d6b0'],art:`<rect width="480" height="340" fill="#c8dde6"/><path d="M0 250h480v90H0Z" fill="#4f8ea3"/><path d="M0 230q60-40 130-20t110 30 60 30H0Z" fill="#7d7a70"/>
   <path d="M150 300l22-220h76l22 220Z" fill="#f4efe3" stroke="#5a5048" stroke-width="5"/><path d="M164 160h92l4 40h-100Zm-8 80h108l4 40H152Z" fill="#c8553d"/><rect x="164" y="48" width="92" height="36" rx="4" fill="#f6df8f" stroke="#5a5048" stroke-width="5"/><path d="M156 48h108l-54-30Z" fill="#c8553d" stroke="#5a5048" stroke-width="5"/><path d="M150 86h120" stroke="#5a5048" stroke-width="6"/>
   <path d="M192 300v-46q18-16 36 0v46Z" fill="#6c4b31" stroke="#3e2b1c" stroke-width="4"/>
   <rect x="292" y="196" width="84" height="56" rx="4" fill="#b08a5c" stroke="#5f4329" stroke-width="5"/><path d="M304 252v48m60-48v48" stroke="#5f4329" stroke-width="7"/><path d="M300 210h68" stroke="#8d6a43" stroke-width="2"/>
   <path d="M330 300q40-30 150-26v66H300Z" fill="#8a8679"/><path d="M60 120q8-8 16 0 8-8 16 0m300-60q8-8 16 0 8-8 16 0" fill="none" stroke="#56636a" stroke-width="3"/>`}),
  ()=>({host:[188,230,0,1,'#f2ebdc'],art:`<rect width="480" height="340" fill="#d5e4ea"/><circle cx="80" cy="70" r="30" fill="#f6dd8a"/><path d="M0 170h480v170H0Z" fill="#4f8ea3"/><path d="M0 280h480v60H0Z" fill="#3a6f80"/>${[0,1,2,3].map(i=>`<path d="M${i*130} ${300-i%2*14}q30-10 60 0t60 0" fill="none" stroke="#8fc0cf" stroke-width="3"/>`).join('')}
   <path d="M244 178V40" stroke="#6e4a2c" stroke-width="8"/><path d="M250 46l96 120H250Z" fill="#f4efe3" stroke="#7a6f62" stroke-width="4"/><path d="M238 56l-84 108h84Z" fill="#e9d9b8" stroke="#7a6f62" stroke-width="4"/><path d="M244 40l24 10-24 10" fill="#c8553d"/>
   <path d="M100 178h300l-34 74H136Z" fill="#c8553d" stroke="#6d2a1f" stroke-width="5"/><path d="M110 198h282" stroke="#f2ebdc" stroke-width="10"/><circle cx="356" cy="222" r="9" fill="#cfe4ea" stroke="#6d2a1f" stroke-width="3"/>
   <path d="M392 190q30 10 40 50" fill="none" stroke="#a88c5c" stroke-width="4"/><circle cx="432" cy="246" r="12" fill="#e4b33c" stroke="#7d5a1d" stroke-width="3"/>`}),
  ()=>({host:[240,240,0,.9,'#c9d2c4'],art:`<rect width="480" height="340" fill="#8fa396"/>${[0,1,2,3,4,5].map(i=>`<path d="M0 ${i*60+30}h480" stroke="#82968a" stroke-width="2"/>`).join('')}
   <rect x="70" y="40" width="340" height="270" rx="10" fill="#5c7266" stroke="#33443a" stroke-width="6"/><rect x="86" y="56" width="308" height="238" rx="6" fill="#6d857a"/>
   ${[[140,110,'#e9d58a'],[240,110,'#e9d58a'],[340,110,'#e9d58a']].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="34" fill="#f2ead2" stroke="#33443a" stroke-width="5"/>${[0,1,2,3,4,5,6,7].map(k=>`<path d="M${x+Math.cos(k*Math.PI/4)*26} ${y+Math.sin(k*Math.PI/4)*26}l${Math.cos(k*Math.PI/4)*5} ${Math.sin(k*Math.PI/4)*5}" stroke="#33443a" stroke-width="2"/>`).join('')}<path d="M${x} ${y}l16-18" stroke="#c8553d" stroke-width="4" stroke-linecap="round"/>`).join('')}
   ${[110,150,320,360].map((x,i)=>`<rect x="${x-10}" y="176" width="20" height="40" rx="4" fill="#2f3d35"/><rect x="${x-7}" y="${i%2?180:196}" width="14" height="16" rx="3" fill="#e4dccb"/>`).join('')}
   <rect x="186" y="208" width="108" height="64" rx="4" fill="#a3ad9f" stroke="#33443a" stroke-width="4"/>${[[192,214],[288,214],[192,266],[288,266]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="#33443a"/>`).join('')}
   <circle cx="130" cy="262" r="10" fill="#c8553d"/><circle cx="350" cy="262" r="10" fill="#6fbf73"/><path d="M60 330q40-60 20-120" fill="none" stroke="#2f3d35" stroke-width="6"/>`}),
 ],
 library:[
  ()=>({host:[192,248,-3,.95,'#c79d6c'],art:`<rect width="480" height="340" fill="#e9dcc0"/>${[0,1,2,3,4,5,6].map(i=>`<path d="M${i*80} 0v250" stroke="#dccaa6" stroke-width="3"/>`).join('')}<rect x="330" y="30" width="110" height="130" rx="4" fill="#33465a" stroke="#6b4a2f" stroke-width="7"/><path d="M385 30v130M330 95h110" stroke="#6b4a2f" stroke-width="5"/><circle cx="410" cy="60" r="10" fill="#f2e7b8"/>
   <rect y="250" width="480" height="90" fill="#9b7350"/><rect x="60" y="176" width="360" height="22" rx="4" fill="#8a5f3c" stroke="#5b3d26" stroke-width="4"/><rect x="150" y="198" width="180" height="66" fill="#a26f45" stroke="#5b3d26" stroke-width="4"/><path d="M150 230h180" stroke="#5b3d26" stroke-width="3"/><circle cx="240" cy="214" r="4" fill="#d9b54a"/><circle cx="240" cy="248" r="4" fill="#d9b54a"/><path d="M80 198v110m320-110v110" stroke="#5b3d26" stroke-width="12"/>
   <path d="M110 176v-50" stroke="#3f5f4c" stroke-width="5"/><path d="M84 126h52l-14-34h-24Z" fill="#4f7a5e" stroke="#2f4a39" stroke-width="4"/><path d="M110 126l-30 50h60Z" fill="#f6e6a8" opacity=".35"/>
   <path d="M270 176l20-14h70l-6 14Z" fill="#f4ecd8" stroke="#8a7550" stroke-width="3"/><path d="M296 166h52" stroke="#a49073" stroke-width="2"/><rect x="200" y="160" width="40" height="16" rx="2" fill="#a6463b" stroke="#5b2a24" stroke-width="3"/>`}),
  ()=>({host:[239,176,0,.85,'#e5cf9f'],art:`<rect width="480" height="340" fill="#6b4a32"/><rect x="40" y="20" width="400" height="300" fill="#5b3d26" stroke="#3b2717" stroke-width="8"/>${[110,200,290].map(y=>`<rect x="40" y="${y}" width="400" height="12" fill="#8a5f3c"/>`).join('')}
   ${[[30,'#a6463b'],[60,'#3f6b78'],[86,'#c99a3e'],[116,'#6b7f4c'],[146,'#7d5a8a'],[300,'#a6463b'],[328,'#c99a3e'],[358,'#3f6b78'],[388,'#6b7f4c']].map(([x,c],i)=>`<rect x="${x+20}" y="${30+i%3*6}" width="26" height="${80-i%3*6}" rx="2" fill="${c}" stroke="#2f2015" stroke-width="2"/><path d="M${x+24} ${46+i%3*6}h18" stroke="#ead9a8" stroke-width="2"/>`).join('')}
   ${[[50,'#3f6b78'],[80,'#c99a3e'],[108,'#a6463b'],[136,'#7d5a8a'],[320,'#6b7f4c'],[350,'#a6463b'],[380,'#3f6b78']].map(([x,c],i)=>`<rect x="${x}" y="${128+i%2*8}" width="26" height="${72-i%2*8}" rx="2" fill="${c}" stroke="#2f2015" stroke-width="2"/>`).join('')}
   <rect x="182" y="150" width="114" height="50" rx="3" fill="#7a3f33" stroke="#2f2015" stroke-width="3"/><path d="M188 156h102v38H188Z" fill="none" stroke="#c9a24a" stroke-width="2"/>
   ${[60,90,120,150,180,210,240,270,300,330,360,390].map((x,i)=>`<rect x="${x}" y="${218+i%3*5}" width="26" height="${72-i%3*5}" rx="2" fill="${['#a6463b','#3f6b78','#c99a3e','#6b7f4c','#7d5a8a'][i%5]}" stroke="#2f2015" stroke-width="2"/>`).join('')}
   <path d="M200 110l40-26 10 26" fill="#c99a3e" stroke="#2f2015" stroke-width="2"/><circle cx="420" cy="96" r="8" fill="#e9dcc0" opacity=".6"/>`}),
  ()=>({host:[203,182,0,.75,'#e3c99a'],art:`<rect width="480" height="340" fill="#e4d4b2"/><rect y="292" width="480" height="48" fill="#9b7350"/><rect x="80" y="30" width="320" height="262" rx="6" fill="#8a5f3c" stroke="#4f331e" stroke-width="6"/>
   ${[0,1,2,3].flatMap(r=>[0,1,2,3].map(c=>`<rect x="${96+c*74}" y="${46+r*58}" width="66" height="50" rx="3" fill="#a87547" stroke="#4f331e" stroke-width="3"/><rect x="${112+c*74}" y="${54+r*58}" width="34" height="16" fill="#efe3c4" opacity="${r===2&&c===1?0:1}" stroke="#6b4a2f" stroke-width="1.5"/><circle cx="${129+c*74}" cy="${82+r*58}" r="4" fill="#d6b24f" stroke="#4f331e" stroke-width="1.5"/>`)).join('')}
   <path d="M100 292v40m280-40v40" stroke="#4f331e" stroke-width="10"/><path d="M20 290q10-40 40-30" fill="none" stroke="#6b7f4c" stroke-width="5"/><path d="M14 292h52l-6-26H20Z" fill="#c9714c" stroke="#88462c" stroke-width="3"/>
   <path d="M420 230h46l-4 62h-38Z" fill="#7a3f33" stroke="#3b2717" stroke-width="3"/><path d="M428 230v-20m10 20v-28m10 28v-16" stroke="#e4d4b2" stroke-width="5"/>`}),
  ()=>({host:[240,262,0,.75,'#c9a274'],art:`<rect width="480" height="340" fill="#dccbaa"/><path d="M0 262h480v78H0Z" fill="#8d6845"/><rect x="40" y="40" width="120" height="160" rx="60" fill="#2f4256" stroke="#6b4a2f" stroke-width="8"/><path d="M100 40v160M40 120h120" stroke="#6b4a2f" stroke-width="5"/><circle cx="72" cy="82" r="7" fill="#f2e7b8"/>
   <path d="M196 300V70q44-50 88 0v230Z" fill="#7a4f30" stroke="#3b2717" stroke-width="6"/><circle cx="240" cy="96" r="30" fill="#f4ecd8" stroke="#3b2717" stroke-width="5"/>${[0,1,2,3,4,5,6,7,8,9,10,11].map(k=>`<circle cx="${240+Math.cos(k*Math.PI/6)*23}" cy="${96+Math.sin(k*Math.PI/6)*23}" r="1.8" fill="#3b2717"/>`).join('')}<path d="M240 96v-18m0 18 12 6" stroke="#3b2717" stroke-width="3" stroke-linecap="round"/>
   <rect x="214" y="138" width="52" height="84" rx="4" fill="#3d2a1b" stroke="#c99a3e" stroke-width="3"/><path d="M240 142v54" stroke="#c99a3e" stroke-width="2"/><circle cx="240" cy="202" r="11" fill="#d6b24f" stroke="#7d5a1d" stroke-width="2"/>
   <rect x="206" y="234" width="68" height="56" rx="3" fill="#8f5e38" stroke="#3b2717" stroke-width="3"/>
   <path d="M320 262v-80h110v80" fill="#7a3f33" stroke="#3b2717" stroke-width="5"/><path d="M314 182h122" stroke="#3b2717" stroke-width="8"/><path d="M340 182q-6-30 14-40h40q20 10 14 40" fill="#4f7a5e" stroke="#2f4a39" stroke-width="4"/>`}),
 ]
};
function hiddenPictureArtwork(clue){
 const scenes=HIDDEN_PICTURE_SCENES[clue.theme]||HIDDEN_PICTURE_SCENES.lighthouse;
 const {art,host}=scenes[(clue.scene??clue.variant??0)%scenes.length]();
 const [x,y,rotate,scale,stroke]=host;
 const width=String(clue.answer).length*21-7;
 return `<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="An illustrated scene with a number worked into the drawing. Look closely.">
 <g stroke-linejoin="round">${art}</g>
 <g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale}) translate(${-width/2} -13)" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round" opacity=".8">${pictureNumberStrokes(clue.answer)}</g>
 </svg>`;
}
