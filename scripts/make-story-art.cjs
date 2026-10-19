// Small, editable SVG illustrations: no external fonts, emoji, or remote assets.
const fs = require('fs');
const vm = require('vm');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('story-content.js', 'utf8') + ';globalThis.book=STORY_BOOK;', ctx);
fs.mkdirSync('art/story', { recursive: true });
const glyph = {
  key: '<circle cx="85" cy="75" r="23"/><path d="m101 92 50 52m-16-16 13-13m-1 26 13-13"/>',
  lantern: '<path d="M85 65q25-55 50 0M85 65h50l12 95H73Zm-8 95h66M80 82h60M85 145h50M92 82v63m36-63v63"/><path fill="#f7c75e" d="m108 97-9 33h24l-9-33Z"/>',
  oil: '<path d="M80 90h60v65H80Zm10-30h40v30M140 100l24-20 10 12-34 32M96 111h28"/>',
  box: '<rect x="63" y="85" width="94" height="70" rx="8"/><path d="M85 85V65h50v20M63 108h94M102 100v21h16v-21"/>',
  rope: '<path d="M85 68c-40 0-40 60 0 60h50c35 0 35-60 0-60H85m0 18h50c12 0 12 24 0 24H85c-12 0-12-24 0-24Zm15 42v38m18-38v38"/>',
  tape: '<circle cx="110" cy="104" r="43"/><circle cx="110" cy="104" r="22"/><path d="m151 120 17 41h-45l-9-15"/>',
  hatch: '<rect x="64" y="55" width="92" height="112" rx="9"/><circle cx="110" cy="108" r="24"/><path d="M110 84v48m-24-24h48M76 69h5m58 84h5"/>',
  cable: '<path d="M69 60v42q0 28 29 28h24q29 0 29 29M60 60h18v-9H60Zm82 101h18v9h-18Z"/>',
  wire: '<ellipse cx="110" cy="105" rx="42" ry="49"/><ellipse cx="110" cy="105" rx="25" ry="34"/><path d="m146 130 25 32M85 63l51 86M71 84l74 52M70 105l74 12"/>',
  fusebox: '<rect x="65" y="55" width="90" height="112" rx="7"/><path d="M80 75h60M80 145h60m-48-39h36m-18-12v24"/><rect x="91" y="92" width="38" height="28" rx="4"/>',
  fuse: '<path d="m85 72 55 70m-64-65 18-14m37 85 18-14"/><path stroke="#79d4e7" d="m95 85 20 7-5 17 20 8"/>',
  lens: '<circle cx="109" cy="104" r="45"/><circle cx="109" cy="104" r="30"/><path d="m86 88 11-11m28 41 9-9"/>',
  cloth: '<path d="m72 65 84 15-13 80-84-15Zm0 0 22 18-17 62m17-62 62-3"/>',
  gear: '<path d="m99 57 23 0 4 16 14 8 16-5 12 20-12 11v16l12 11-12 20-16-5-14 8-4 16H99l-4-16-14-8-16 5-12-20 12-11v-16L53 96l12-20 16 5 14-8Z"/><circle cx="110" cy="115" r="21"/>',
  crank: '<path d="M75 150V95h55V65h25v28h-25M63 150h25"/>',
  map: '<path d="m58 65 36 12 32-12 36 12v85l-36-12-32 12-36-12Zm36 12v85m32-97v85"/><path stroke-dasharray="4 10" d="m75 134 30-36 39 25"/><path d="m137 94 13 13m0-13-13 13"/>',
  fragment: '<path d="m72 69 68-13 16 72-21 5-9-13-12 20-20-6-11 15Z"/><path stroke-dasharray="4 9" d="m92 92 21-10 13 25"/>',
  beacon: '<path d="m85 167 8-83h34l8 83ZM86 84h48V56H86Zm-6-28 30-17 30 17M75 167h70m-43-67h16m-17 23h18m-20 23h22"/>',
  bulb: '<path d="M90 130v-16q-43-55 20-64 63 9 20 64v16Zm0 0h40m-40 11h40m-34 11h28m-20-22-9-35m21 35 9-35"/>',
  lamp: '<path d="m72 89 25-39h30l25 39ZM110 90v65m-32 8h64"/>',
  battery: '<rect x="80" y="63" width="60" height="99" rx="9"/><path d="M98 63V53h24v10m-25 34h26m-13-13v26m-13 28h26"/>',
  book: '<path d="M65 64h86v100H65q-13-5-5-16V77q0-13 5-13Zm0 84h86M77 64v84M91 88h43m-43 15h31"/>',
  cabinet: '<rect x="70" y="51" width="80" height="115" rx="5"/><path d="M70 87h80m-80 39h80M87 168v9m46-9v9M101 70h18m-18 37h18m-18 38h18"/>',
  brush: '<path d="m108 55 16 3-9 72-16-2Zm-11 73 22 3 17 38-54-7Z"/><path d="m96 138-5 23m14-21-2 24m13-22 4 23"/>',
  envelope: '<rect x="55" y="72" width="110" height="79" rx="5"/><path d="m55 76 55 43 55-43m-110 75 40-38m70 38-40-38"/>',
  opener: '<path d="m70 155 75-99 16-8-7 21-70 99Zm0 0-15 17m13-24 24 18"/>',
  paper: '<path d="M73 53h60l24 24v92H73Zm60 0v24h24M89 99h50m-50 18h50m-50 18h36"/>',
  pencil: '<path d="m70 155 63-99 19 13-63 99-23 10Zm9-9 19 13m-13-21 52-78"/>',
  magnifier: '<circle cx="96" cy="92" r="35"/><path d="m122 119 41 44m-35-51 42 43m-92-77 9-8"/>',
  pages: '<path d="M65 70h83v99H65Zm13-13h82v99M91 87h40m-40 19h40m-40 19h32"/>',
  cord: '<path d="M70 60q65-20 77 24t-58 34q-40 8-20 31t82 9m-62-40q35-50 47-18t-47 18Z"/>',
  case: '<rect x="60" y="67" width="104" height="99" rx="8"/><path d="M78 67v99m67-99v99m-44-99V53h26v14"/><rect x="99" y="103" width="28" height="25" rx="3"/>',
  charter: '<path d="M63 62h88v91H63q-20-10-8-22h78m18-69q19 10 7 22M79 85h56m-56 17h44"/><circle cx="116" cy="135" r="15"/><path d="m108 149-7 22 16-7 11 7-4-24"/>',
  stamp: '<path d="M94 123V91q-23-48 16-48t16 48v32Zm-20 0h72v22H74Zm-9 33h90"/>',
  evidence: '<path d="M73 53h60l24 24v92H73Zm60 0v24h24M89 99h50m-50 18h35"/><circle cx="121" cy="144" r="19"/><path d="m111 143 8 8 14-17"/>',
  flashlight: '<path d="m84 62 31 0 0 23 16 17v65H68v-65l16-17ZM84 85h31m-47 21h63m-44 17h26"/>',
  latch: '<rect x="64" y="81" width="94" height="49" rx="5"/><path d="M77 96h67v19H77Zm36-15V57m0 73v28"/>',
  pin: '<path d="M101 60h20v96h-20Zm-10 0h40m-30 96 10 15 10-15"/>',
  lead: '<path d="M80 57q-40 5-13 42t49-5q-1-25-25-25m-11 27q-10 50 51 49m0 0q29-25 32 0-4 23-32 0Z"/>',
  bowl: '<path d="M55 106h110l-15 52H70Zm0 0q55-33 110 0"/><path d="m81 136 15 5m30 0 14-5"/>',
  biscuits: '<path d="M79 76q-35-18-27 8 0 16 22 13l56 43q0 33 18 15 22 2 10-20l-61-45q15-26-11-20Z"/>',
  plank: '<path d="m56 83 96-19 15 81-96 18Zm13 18 84-17m-81 35 84-16m-80 36 83-16"/>',
  peg: '<path d="m89 71 33-14 23 74-23 39Zm0 0 26 77 7 22m-7-22 30-17"/>',
  bridge: '<path d="M48 144q62-69 124 0M48 158q62-69 124 0M65 135v-43m91 43V92M65 99q45-30 91 0m-76 26-5-22m22 12-2-19m20 17 1-18m17 24 5-19"/>',
  shed: '<path d="m54 88 56-40 56 40M65 83v85h90V83M98 168v-49h28v49"/><path d="M80 100h14m43 0h7"/>',
  window: '<rect x="63" y="57" width="94" height="112" rx="4"/><path d="M110 57v112m-47-56h94m-80-39 12-6m40 71 10-6"/>',
  drain: '<ellipse cx="110" cy="118" rx="58" ry="37"/><path d="M65 101v34m22-47v60m23-67v74m23-67v60m22-47v34"/>',
  handle: '<path d="M76 161V81q0-45 34-45t34 45v80m-51 0V81q0-25 17-25t17 25v80"/>',
  ramp: '<path d="m53 157 109-86 8 20-109 86Zm21-16 10 19m12-36 10 19m12-36 10 19m12-36 10 19"/>',
  support: '<path d="m68 163 45-110 47 110Zm27-40h37m-51 40 32-77 32 77"/>',
};
const alias = { 'lantern-lit':'lantern','box-open':'box','rope-fixed':'rope','hatch-open':'hatch','cable-fixed':'cable','fusebox-lit':'fusebox','lens-clear':'lens','gear-turning':'gear','map-fixed':'map','beacon-lit':'beacon','lamp-lit':'lamp','book-open':'book','cabinet-clean':'cabinet','envelope-open':'envelope','paper-marked':'paper','magnifier-fixed':'magnifier','book-fixed':'book','flashlight-lit':'flashlight','latch-fixed':'latch','lead-fixed':'lead','bowl-filled':'bowl','shed-open':'shed','window-clear':'window','drain-open':'drain','ramp-ready':'ramp' };
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
for (const story of ctx.book) {
  story.recipes.forEach((r,i) => ['a','b','c'].forEach((part,j) => {
    const type = r[3+j];
    let drawing = glyph[alias[type] || type];
    if (!drawing) throw Error('Missing drawing: '+type);
    // Results show an actual state change, not just a new frame colour.
    const extra={
      'lantern-lit':'<path fill="#f7d688" opacity=".23" stroke="none" d="m96 95-44-31v95l44-22Zm28 0 44-31v95l-44-22Z"/>',
      'box-open':'<path d="m63 85 15-34 94 0-15 34Z"/><path d="m91 131 15-14 9 9 16-19" stroke="#f7d688"/>',
      'hatch-open':'<path d="m70 61 45 12v81l-45 9Z" fill="#121f2a"/><path d="m115 73 42-13v103l-42-9Z"/>',
      'cable-fixed':'<path d="M91 121h35v17H91Z" fill="#79d4e7"/>',
      'fusebox-lit':'<path d="M99 93h22v31H99Z" fill="#f7d688"/><path d="m76 44-10-9m80 9 10-9"/>',
      'lens-clear':'<path d="m91 111 14 13 27-37" stroke="#f7d688"/>',
      'gear-turning':'<path d="M59 63q46-34 95 0m-10-18 10 18-22 4" stroke="#f7d688"/>',
      'map-fixed':'<path d="m144 119 6 9-6 9-6-9Z" fill="#f7d688"/>',
      'beacon-lit':'<path d="m110 75-80-31v63Zm0 0 80-31v63Z" fill="#f7d688" opacity=".3" stroke="none"/>',
      'lamp-lit':'<path d="m76 93-20 61h108l-20-61Z" fill="#f7d688" opacity=".2" stroke="none"/>',
      'book-open':'<path d="m43 73 67 12 67-12v93l-67 12-67-12Zm67 12v93" fill="#293c4a"/><path d="m57 94 37 7m-37 13 37 7m32-20 36-7m-36 27 36-7"/>',
      'cabinet-clean':'<path d="M96 94h29v26H96Z" fill="#f7d688"/><path d="m103 106 5 5 10-11" stroke="#243647"/>',
      'envelope-open':'<path d="m55 72 55-39 55 39M80 79V53h60v52" fill="#293c4a"/><path d="M91 68h38"/>',
      'paper-marked':'<path d="m88 127 21-33 25 33-28 25Z" fill="#f7d688"/>',
      'magnifier-fixed':'<path d="m78 93 12 13 26-28" stroke="#f7d688"/>',
      'book-fixed':'<path d="M67 84h15m-15 18h15m-15 18h15m-15 18h15" stroke="#f7d688"/>',
      'flashlight-lit':'<path d="m85 58-17-37h62l-17 37Z" fill="#f7d688" opacity=".3" stroke="none"/>',
      'latch-fixed':'<path d="M105 69h16v69h-16Z" fill="#f7d688"/>',
      'lead-fixed':'<path d="M77 91h19v20H77Z" fill="#f7d688"/>',
      'bowl-filled':'<g fill="#dbb786"><circle cx="86" cy="100" r="7"/><circle cx="107" cy="94" r="7"/><circle cx="129" cy="99" r="7"/><circle cx="148" cy="104" r="5"/></g>',
      'shed-open':'<path d="m98 119 28 0-14 40-14 9Z" fill="#121f2a"/><path d="m112 126 28-11v43l-28 12Z"/>',
      'window-clear':'<path d="m79 102 14-15m-14 58 14-15m33-30 15-15" stroke="#f7d688"/>',
      'drain-open':'<ellipse cx="110" cy="128" rx="56" ry="29" fill="#0c1720"/><ellipse cx="110" cy="70" rx="54" ry="25"/><path d="M74 54v32m20-38v44m22-46v48m22-43v39"/>',
      'ramp-ready':'<path d="m101 126 20 38h36l-14-65m-32 48h38" stroke="#f7d688"/>',
    };
    if(j===0 && /empty lantern/i.test(r[0])) drawing=drawing.replace('<path fill="#f7c75e" d="m108 97-9 33h24l-9-33Z"/>','');
    if(j===0 && /dusty|dirty/i.test(r[0])) drawing+='<g fill="#b19470" stroke="none" opacity=".8"><circle cx="91" cy="87" r="10"/><circle cx="125" cy="131" r="14"/><circle cx="112" cy="100" r="6"/></g>';
    if(j===0 && /broken|frayed|loose|torn/i.test(r[0])) drawing+='<path d="m101 105 12-13-6 22 14-5-12 20" stroke="#ef927e" stroke-width="5"/>';
    if(j===2 && extra[type]) drawing+=extra[type];
    const color = j===2 ? '#9ddbb7' : story.accent;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 250" role="img"><title>${esc(r[j])}</title><defs><radialGradient id="bg"><stop stop-color="#303c4e"/><stop offset="1" stop-color="#17232f"/></radialGradient></defs><rect width="220" height="250" rx="22" fill="url(#bg)"/><circle cx="110" cy="110" r="82" fill="${color}" opacity=".06"/><ellipse cx="110" cy="190" rx="63" ry="8" fill="#000" opacity=".2"/><g fill="#26384a" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${drawing}</g>${j===2?'<g fill="none" stroke="#f7d688" stroke-width="3"><path d="M174 48v16m-8-8h16M45 157v12m-6-6h12"/></g>':''}<text x="110" y="226" fill="#e5edf4" font-family="sans-serif" font-size="11" text-anchor="middle">${esc(r[j])}</text></svg>`;
    fs.writeFileSync(`art/story/${story.id}-${i}-${part}.svg`, svg);
  }));
  const scene = story.id==='lighthouse'
    ? '<path d="M0 164q55-20 110 0t110 0v86H0Z" fill="#263e52"/><path d="m86 174 9-82h30l10 82M87 92h46V63H87l23-16 23 16" fill="#526878" stroke="#b8dce7" stroke-width="3"/><path d="m110 78 110-32v66Z" fill="#f7d688" opacity=".3"/>'
    : story.id==='library'
    ? '<g stroke="#d8b787" stroke-width="4" fill="#3b3840"><path d="M24 43h172v134H24Zm0 64h172M24 162h172"/><path d="M39 48v53m15-53v53m15-53v53m15-53v53m15-53v53m15-53v53m15-53v53m15-53v53m15-53v53M38 113v43m19-43v43m19-43v43m19-43v43m19-43v43m19-43v43m19-43v43m19-43v43"/></g><path d="m65 193 45-9 45 9v35l-45-9-45 9Z" fill="#ecdcc1"/>'
    : '<path d="M0 167q55-35 110-10t110-12v105H0Z" fill="#304d45"/><path d="M0 210q80-65 220-25" fill="none" stroke="#739883" stroke-width="15"/><g fill="#bd9672" stroke="#ead0a6" stroke-width="3"><ellipse cx="109" cy="135" rx="41" ry="30"/><circle cx="142" cy="111" r="24"/><path d="m125 94-10 26 21-10m-64 22-24-23m38 44v28m41-28v28"/></g><circle cx="150" cy="106" r="3" fill="#17232f"/><path d="m128 128 26-9" stroke="#79d4e7" stroke-width="7"/>';
  fs.writeFileSync(`art/story/${story.id}-cover.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 250"><title>${esc(story.title)}</title><rect width="220" height="250" rx="22" fill="#17232f"/><circle cx="176" cy="39" r="17" fill="#f7d688" opacity=".7"/>${scene}</svg>`);
}
fs.writeFileSync('story-assets.json',JSON.stringify(fs.readdirSync('art/story').filter(f=>f.endsWith('.svg')).map(f=>'./art/story/'+f),null,2)+'\n');
console.log('Created 90 item illustrations, 3 story covers, and the offline artwork list.');
