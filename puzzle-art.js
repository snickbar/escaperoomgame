// Presentation only: puzzle answers and progression stay in the game engine.
function puzzleTheme(content){return Number.isInteger(content.chapter)&&activeStory?activeStory.id:document.getElementById('storyChoice').value||'lighthouse';}
function configurePuzzleArt(content){
  zoomCardEl.classList.remove('has-picture-clue');
  const p=content.puzzle,theme=puzzleTheme(content);
  const boardWidth=puzzleBoardWidth();
  zoomPuzzleEl.style.setProperty("--puzzle-board-width",Math.min(boardWidth,innerHeight*.64)+"px");
  pipesGridEl.style.setProperty("--pipe-cell",Math.floor((Math.min(boardWidth,innerHeight*.64)-44)/4)+"px");
  requestAnimationFrame(()=>{zoomCardEl.scrollTop=0;});
  if(!p.artwork&&(p.type==='shapes'||p.type==='swap')){
    // Four pictures per story; puzzles of one type in a run take different ones.
    const same=[...cardContent.values()].filter(c=>c.puzzle?.type===p.type);
    const rank=same.indexOf(content);
    const index=rank<0?Math.floor(Math.random()*4):((runSeed>>>5)+rank)%4;
    p.artwork='art/puzzles/'+theme+'-'+(p.type==='shapes'?'document':'picture')+'-'+index+'.svg';
  }
  p.artwork ||= 'art/scenes/'+theme+'.png';
  if(p.type==='pipes')p.pipeStyle ||= theme==='library'?'electric':'water';
  zoomPuzzleEl.dataset.puzzle=p.type;
  pipesGridEl.dataset.style=p.pipeStyle||'water';
  let tools=document.getElementById('puzzleArtTools');
  if(!tools){tools=document.createElement('div');tools.id='puzzleArtTools';tools.className='puzzle-art-tools';puzzleInstructionsEl.after(tools);}
  tools.replaceChildren();
  if(p.type==='pipes'){
    const legend=document.createElement('p');legend.className='flow-legend';legend.textContent=p.pipeStyle==='electric'?'⚡ POWER → 💡 LAMP · glass switchboard':'TAP → TANK · old waterworks';tools.appendChild(legend);
    const group=document.createElement('div');group.className='puzzle-style-choices';group.setAttribute('role','group');group.setAttribute('aria-label','Pipe puzzle style');
    for(const [style,label] of [['water','Rusty water pipes'],['electric','Electric switchboard']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(p.pipeStyle===style));
      button.onclick=()=>{p.pipeStyle=style;renderPuzzle(content,currentPuzzleContext?.num??null,{isTest:currentPuzzleContext?.num===null,onRetry:()=>openTestPuzzle(p.pipeStyle==='electric'?'electric':'pipes')});};group.appendChild(button);
    }
    tools.appendChild(group);
  }
  if(p.type==='swap'||p.type==='shapes'){
    const preview=document.createElement('img');preview.id='puzzleReference';preview.className='puzzle-reference';preview.src=p.artwork;preview.alt=p.type==='swap'?'The complete story picture to restore':'The complete document to restore';preview.hidden=true;
    if(p.type==='shapes')preview.style.aspectRatio=p.cols+'/'+p.rows;
    const button=document.createElement('button');button.type='button';button.textContent='View reference';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',preview.id);
    button.onclick=()=>{preview.hidden=!preview.hidden;button.textContent=preview.hidden?'View reference':'Hide reference';button.setAttribute('aria-expanded',String(!preview.hidden));};tools.append(button,preview);
  }
  if(p.type==='shapes'){
    shapesGridEl.style.setProperty('--document-image','url("'+p.artwork+'")');
    shapesGridEl.setAttribute('aria-label','Torn document restoration board');
  }
}
function paintRestorationCell(element,p,piece,r,c,size){
  const sourceR=piece.solvedOrigin[0]+r,sourceC=piece.solvedOrigin[1]+c;
  element.classList.add('document-fragment');
  element.style.backgroundImage='url("'+p.artwork+'")';
  element.style.backgroundSize=(p.cols*size)+'px '+(p.rows*size)+'px';
  element.style.backgroundPosition=(-sourceC*size)+'px '+(-sourceR*size)+'px';
  element.style.backgroundColor='#ead8b1';
  element.style.setProperty('--fragment-edge',piece.color);
}
// BFS retains arrival times so already-filled tubes don't refill on each tap.
// An unconnected component has no water/current, even if its local joints match.
function pipeFlowState(p,history){
  const byPos=new Map(p.tiles.map(t=>[t.row+','+t.col,t]));
  const start=p.tiles.find(t=>t.isStart),queue=[{tile:start,parent:null,entry:null}],flow=new Map(),now=performance.now();
  while(queue.length){
    const {tile,parent,entry}=queue.shift(),key=tile.row+','+tile.col;if(flow.has(key))continue;
    const signature=tile.openings+':'+parent;
    const prior=history.get(key),upstream=flow.get(parent);
    const arrival=prior?.signature===signature?prior.arrival:Math.max(now,upstream?upstream.arrival+220:now);
    const info={signature,arrival,entry};flow.set(key,info);
    for(const dir of Object.keys(DIR_BIT)){
      if(!(tile.openings&DIR_BIT[dir]))continue;
      const [dr,dc]=DIR_DELTA[dir],next=byPos.get((tile.row+dr)+','+(tile.col+dc));
      if(next&&(next.openings&DIR_BIT[OPPOSITE_DIR[dir]]))queue.push({tile:next,parent:key,entry:OPPOSITE_DIR[dir]});
    }
  }
  history.clear();flow.forEach((v,k)=>history.set(k,v));return flow;
}
function pipeTubeArt(tile,flow,style){
  const points={N:[25,0],E:[50,25],S:[25,50],W:[0,25]};
  const dirs=Object.keys(DIR_BIT).filter(d=>tile.openings&DIR_BIT[d]);
  const first=flow?.entry||dirs[0],last=dirs.find(d=>d!==first);
  const a=tile.isStart?[25,25]:(points[first]||[25,25]),b=tile.isStart?points[first]:(points[last]||[25,25]);
  const path='M '+a.join(' ')+' Q 25 25 '+b.join(' ');
  const delay=flow?flow.arrival-performance.now():0;
  const rustId='rust-'+tile.row+'-'+tile.col;
  return `<svg class="tube-art ${flow?'has-flow':''}" viewBox="0 0 50 50" aria-hidden="true" style="--fill-delay:${delay}ms">
    <defs><pattern id="${rustId}" width="11" height="13" patternUnits="userSpaceOnUse"><path d="m2 1 4 2-2 3-3-2Zm6 7 3 1-2 4-2-2Z" fill="#462b1b" opacity=".65"/><circle cx="5" cy="9" r="1.5" fill="#d19657" opacity=".7"/></pattern></defs>
    <path class="tube-shadow" d="${path}"/><path class="tube-metal" d="${path}"/><path class="tube-rust" d="${path}" stroke="url(#${rustId})" stroke-width="20"/><path class="tube-bore" d="${path}"/>
    <path class="tube-fill" d="${path}" pathLength="1"/><path class="tube-motion" d="${path}" pathLength="1"/>
    <path class="tube-shine" d="${path}"/>
    </svg>`;
}
// Match the actual modal width so enlarged boards and drag coordinates agree.
function puzzleBoardWidth(){
 const style=getComputedStyle(zoomCardEl);
 return Math.max(200,Math.min(760,zoomCardEl.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-6));
}
let puzzleResizeFrame;
window.addEventListener('resize',()=>{
 cancelAnimationFrame(puzzleResizeFrame);
 puzzleResizeFrame=requestAnimationFrame(()=>{
  const context=currentPuzzleContext;
  if(!context?.content.puzzle||context.content.puzzle.solved||zoomPuzzleEl.hidden||!zoomOverlay.classList.contains('open'))return;
  const p=context.content.puzzle;
  renderPuzzle(context.content,context.num,{isTest:context.num===null,onRetry:()=>openTestPuzzle(p.type==='pipes'&&p.pipeStyle==='electric'?'electric':p.type)});
 });
});
