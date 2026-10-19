const GAME_VERSION = '0.5.0';
const GAME_SCHEMA = 'ER2';
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

// Five interleaved chapters, ten recipes. A pair's first item is found
// before its partner; a second pair is already pending when the first pays off.
// No fallback nodes, orphaned ingredients, or budget-dependent early endings.
function buildAdventureGraph() {
  const nodes = [];
  const add = (kind, chapter) => {
    const n = { id:nodes.length, kind, chapter, depth:chapter, unlocks:[], requires:null, isStart:false, isWin:false };
    nodes.push(n); return n;
  };
  const root = add('story',0); root.isStart = true;
  let entry = root;
  for (let i=0;i<10;i+=2) {
    const a = add('object',i), b = add('object',i);
    const c = add('combo',i); c.requires=[a.id,b.id];
    const a2 = add('object',i+1), b2=add('object',i+1);
    const c2=add('combo',i+1); c2.requires=[a2.id,b2.id];
    const clue=add(i===2 || i===6 ? 'story':'puzzle',i);
    const puzzle=add('puzzle',i+1);
    entry.unlocks=[a.id,clue.id];
    clue.unlocks=[a2.id,puzzle.id];
    puzzle.unlocks=[b.id];
    c.unlocks=[b2.id];
    entry=c2;
  }
  const win=add('win',10); win.isWin=true;
  entry.unlocks=[win.id];
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
