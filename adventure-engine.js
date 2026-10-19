const GAME_VERSION = '0.9.2';
const GAME_SCHEMA = 'ER3';
let activeStory = STORY_BOOK[0];
let runSeed = 0;
let pendingSeed = null;
let randomSource = Math.random;
let runEnded = false;
let winPending = false;
let mistakeLog = [];
let assistedRun = false;
let currentPuzzleContext = null;
let runSerial = 0;
let puzzleCleanup = null;

function scheduleGame(callback, delay) {
  const serial=runSerial;
  return setTimeout(()=>{if(serial===runSerial) callback();},delay);
}

function gameRandom() { return randomSource(); }
function withGameSeed(seed, action) {
  const previous = randomSource;
  let state = seed >>> 0;
  randomSource = () => {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  try { return action(); } finally { randomSource = previous; }
}
function adventureCode() { return `${GAME_SCHEMA}-${activeStory.id}-${runSeed.toString(16).padStart(8,'0')}`; }

// Several independent leads are available together. Partners are spread
// across other leads; every node still has a reachable, required use.
function buildAdventureGraph() {
  const nodes=[];
  const add=(kind,chapter)=>{const n={id:nodes.length,kind,chapter,depth:chapter,unlocks:[],requires:null,isStart:false,isWin:false};nodes.push(n);return n;};
  const root=add('story',0);root.isStart=true;
  const a=[],b=[],combo=[];
  for(let i=0;i<10;i++){a.push(add('object',i));b.push(add('object',i));combo.push(add('combo',i));combo[i].requires=[a[i].id,b[i].id];}
  const puzzles=Array.from({length:8},(_,i)=>add('puzzle',i));
  const logic=[add('logic',1),add('logic',7)];
  const pictures=[add('picture',2),add('picture',8)];
  const stories=[add('story',0),add('story',6)];
  const win=add('win',10);win.isWin=true;
  const link=(from,...to)=>{from.unlocks=to.map(n=>n.id);};
  link(root,a[0],a[1],a[2],puzzles[0],puzzles[1],stories[0]);
  link(stories[0],a[3],logic[0]);link(logic[0],a[4],puzzles[2]);
  link(puzzles[0],b[1]);link(puzzles[1],b[0]);
  link(combo[0],a[5],puzzles[3]);link(combo[1],pictures[0]);link(pictures[0],b[2]);
  link(combo[2],puzzles[4]);link(puzzles[2],b[3]);
  link(combo[3],puzzles[5]);link(puzzles[3],b[4]);
  link(combo[4],stories[1],logic[1]);link(stories[1],a[6]);
  link(puzzles[4],b[5]);link(combo[5],pictures[1]);
  link(puzzles[5],b[6]);link(logic[1],b[7]);
  // Every crafted result leads somewhere, so no discovery is a dead end.
  link(combo[6],a[8]);link(combo[7],puzzles[6]);link(puzzles[6],b[8]);link(combo[8],a[9]);
  link(pictures[1],puzzles[7]);link(puzzles[7],a[7]);link(combo[9],win);
  // The last finale piece has no clue pointing to it: it appears by itself
  // once every other lead is finished.
  b[9].isFinalePiece=true;
  return nodes;
}

function assignAdventureItems(nodes) {
  const items = {};
  const recipes = STORY_RECIPES.filter(r=>r.theme===activeStory.id);
  for (const n of nodes) {
    if (n.kind!=='combo') continue;
    const recipe=recipes[n.chapter];
    items[n.requires[0]]=recipe.a;
    items[n.requires[1]]=recipe.b;
    items[n.id]=recipe.c;
  }
  return items;
}

function puzzleResultText(p) {
  return describeUnlocks(p.answers || [p.answer]);
}

// A card stays useful until every outgoing clue AND every recipe using it
// has paid off. Inspect the whole deck so an ingredient can wait for a later pair.
function exhaustedCardNumbers(cards, flipped, mode) {
  const uses = new Map();
  cards.forEach((content, result) => {
    (content.requires || []).forEach(ingredient => {
      if (!uses.has(ingredient)) uses.set(ingredient, []);
      uses.get(ingredient).push(result);
    });
  });
  const exhausted = new Set();
  flipped.forEach(number => {
    const content = cards.get(number);
    if (!content || content.isWin || content.puzzle && !content.puzzle.solved) return;
    const rewards = mode === 'story' ? (content.unlocks || [])
      : (content.next == null ? [] : [content.next]);
    const targets = [...rewards, ...(uses.get(number) || [])];
    if (targets.every(target => flipped.has(target))) exhausted.add(number);
  });
  return exhausted;
}

function refreshCardExhaustion() {
  if (typeof tabletopActive === 'function' && tabletopActive()) { syncTabletop(); return; }
  const cards = [...tableEl.querySelectorAll('.card')];
  const flipped = new Set(cards.filter(card => card.classList.contains('flipped'))
    .map(card => Number(card.dataset.number)));
  const exhausted = exhaustedCardNumbers(cardContent, flipped, currentMode);
  cards.forEach(card => {
    const used = exhausted.has(Number(card.dataset.number));
    card.classList.toggle('exhausted', used);
    if (used) card.title = 'All uses completed — tap to view';
    else card.removeAttribute('title');
  });
}

// The runtime and the regression tests share this exact eligibility rule.
function availableAdventureCards(cards, flipped) {
  const available = new Set();
  cards.forEach((c,num) => {
    if (!flipped.has(num) || c.puzzle && !c.puzzle.solved) return;
    (c.unlocks || []).forEach(n=> { if (!flipped.has(n)) available.add(n); });
  });
  cards.forEach((c,num)=> {
    if (c.requires && c.requires.every(n=>flipped.has(n)) && !flipped.has(num)) available.add(num);
    if (c.isWin) {
      const complete=[...cards].every(([n,other])=>!other.isProgress || other.isWin ||
        flipped.has(n) && (!other.puzzle || other.puzzle.solved));
      if (!complete) available.delete(num);
    }
    // Revealed only when everything except it, its recipe and the ending is done.
    if (c.isFinalePiece && !flipped.has(num)) {
      const complete=[...cards].every(([n,other])=>!other.isProgress || other.isWin || n===num ||
        other.requires?.includes(num) || flipped.has(n) && (!other.puzzle || other.puzzle.solved));
      if (complete) available.add(num);
    }
  });
  return available;
}

function validateAdventure(cards, numbers) {
  const errors=[];
  if (new Set(numbers).size!==numbers.length) errors.push('Duplicate card numbers');
  if (numbers.some((n,i)=>n<0 || n>199 || i>0 && n<=numbers[i-1])) errors.push('Table range/order');
  if (cards.size!==numbers.length) errors.push('Missing content');
  const roots=[...cards].filter(([,c])=>c.isSeed);
  if (roots.length!==1) errors.push('Expected one opening card');
  cards.forEach((c,n)=> {
    if ((c.unlocks||[]).some(v=>!cards.has(v))) errors.push('Missing unlock at '+n);
    if (c.requires && (c.requires.length!==2 || c.requires[0]===c.requires[1] || c.requires[0]+c.requires[1]!==n)) errors.push('Invalid combination at '+n);
    if (c.puzzle && (c.puzzle.answers||[c.puzzle.answer]).join(',')!==c.unlocks.join(',')) errors.push('Puzzle reward mismatch at '+n);
  });
  const simulation=new Map([...cards].map(([n,c])=>[n,{...c,puzzle:c.puzzle?{...c.puzzle}:null}]));
  const flipped=new Set(roots.map(([n])=>n));
  for(let step=0;step<cards.size*2;step++) {
    simulation.forEach((c,n)=>{ if(flipped.has(n)&&c.puzzle) c.puzzle.solved=true; });
    const available=availableAdventureCards(simulation,flipped);
    if (!available.size) break;
    available.forEach(n=>flipped.add(n));
  }
  cards.forEach((c,n)=>{ if(c.isProgress&&!flipped.has(n)) errors.push('Unreachable card '+n); });
  return { ok:!errors.length, errors, cards:cards.size, combos:[...cards.values()].filter(c=>c.requires).length };
}

// Translation-only exact-cover solver, with a bounded search and a known
// original tiling as the fallback for hints on a player-created dead end.
function solveShapeRemainder(p, limit=50000) {
  if(p.restoration&&p.pieces.some(pc=>pc.placed&&pc.placedOrigin?.some((v,i)=>v!==pc.solvedOrigin[i])))return null;
  let visits=0;
  const covered=shapesCoverage(p);
  function search(remaining) {
    if (++visits>limit) return null;
    const target=covered.indexOf(null);
    if(target<0) return remaining.length?null:[];
    const row=Math.floor(target/p.cols), col=target%p.cols;
    for(const piece of remaining) {
      for(const [dr,dc] of piece.currentCells) {
        const r=row-dr,c=col-dc;
        if(p.restoration&&(r!==piece.solvedOrigin[0]||c!==piece.solvedOrigin[1]))continue;
        if(!shapesCanPlace(piece,r,c,p.rows,p.cols,covered)) continue;
        const cells=piece.currentCells.map(([rr,cc])=>(r+rr)*p.cols+c+cc);
        cells.forEach(i=>covered[i]=piece.id);
        const tail=search(remaining.filter(x=>x!==piece));
        cells.forEach(i=>covered[i]=null);
        if(tail) return [{piece,origin:[r,c]},...tail];
      }
    }
    return null;
  }
  return search(p.pieces.filter(pc=>!pc.placed));
}

function placeShapeHint(p) {
  let solution=solveShapeRemainder(p), moved=0;
  if (!solution) {
    p.pieces.forEach(pc=> {
      if(pc.placed && (pc.placedOrigin[0]!==pc.solvedOrigin[0] || pc.placedOrigin[1]!==pc.solvedOrigin[1])) {
        pc.placed=false; pc.placedOrigin=null; moved++;
      }
    });
    solution=p.pieces.filter(pc=>!pc.placed).map(piece=>({piece,origin:piece.solvedOrigin.slice()}));
  }
  if (!solution.length) return null;
  const {piece,origin}=solution[0];
  piece.placed=true; piece.placedOrigin=origin.slice();
  p.hintsRemaining--;
  return {id:piece.id,moved};
}
// Compare silhouettes independently of translation, rotation, and reflection.
function shapeSilhouette(cells){
  const variants=[];
  for(const flip of [1,-1])for(let turn=0;turn<4;turn++){
    const points=cells.map(([r,c])=>{let x=r,y=c*flip;for(let n=0;n<turn;n++)[x,y]=[y,-x];return [x,y];});
    const minR=Math.min(...points.map(p=>p[0])),minC=Math.min(...points.map(p=>p[1]));
    variants.push(points.map(([r,c])=>[r-minR,c-minC]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(p=>p.join(',')).join(';'));
  }
  return variants.sort()[0];
}
function variedShapesTiling(rows,cols){
  for(let attempt=0;attempt<100;attempt++){
    const pieces=buildShapesTiling(rows,cols,0),counts=new Map();
    pieces.forEach(cells=>{const key=shapeSilhouette(cells);counts.set(key,(counts.get(key)||0)+1);});
    if(pieces.length>=4&&pieces.length<=10&&pieces.every(c=>c.length>=2&&c.length<=8)&&
      Math.max(...counts.values())<=2&&new Set(pieces.map(c=>c.length)).size>=3)return pieces;
  }
  // Known complete, connected tilings provide a bounded fallback, without
  // relaxing the duplicate limit or producing an unsolvable board.
  const template=['AABB','ACBB','DCCE','DDCE','FFFE'].map(row=>row.split(''));
  if(rows===6)template.push(['G','G','G','G']);
  if(rows===7)template.push(['G','G','G','H'],['G','H','H','H']);
  if(cols===5)template.forEach((row,r)=>row.push(r<5?'I':'G'));
  const groups=new Map();template.forEach((row,r)=>row.forEach((id,c)=>{if(!groups.has(id))groups.set(id,[]);groups.get(id).push([r,c]);}));
  return [...groups.values()];
}
