// Picture Puzzle scenes and Shapes documents: four of each per story.
// Medium detail: more colour than item icons, calmer than the painted covers,
// and something recognisable in every quarter so 4×4 tiles stay distinct.
const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'..','art','puzzles');fs.mkdirSync(out,{recursive:true});
const INK='#3b4639';
const line=(w=3)=>`stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
function seeded(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const cloud=(x,y,s=1)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 20q0-18 20-18 6-14 24-10 14-8 26 6 18 0 18 16 0 12-14 12H10Q0 26 0 20Z" fill="#fffdf6" ${line(2)}/>`;
const sun=(x,y,r,c='#f6d06b')=>`<circle cx="${x}" cy="${y}" r="${r+9}" fill="${c}" opacity=".3"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${line(2)}/>`;
const flower=(x,y,c,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0v26" stroke="#4f7d3d" stroke-width="3"/><path d="M0 16q-10-2-12-10 10 0 12 8" fill="#6fa258"/>${[0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a*Math.PI/180)*6}" cy="${Math.sin(a*Math.PI/180)*6}" r="5.5" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`).join('')}<circle r="3.6" fill="#fbe29a" stroke="${INK}" stroke-width="1"/></g>`;
const tree=(x,y,s=1,leaf='#6fa258',fruit=null,rand=Math.random)=>{
 const blobs=[[-30,-58,30],[0,-78,34],[30,-56,30],[-14,-40,26],[16,-38,26]];
 return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 0q4-30 2-50h14q-3 22 3 50Z" fill="#9a6a43" ${line(2.5)}/>${blobs.map(([bx,by,r])=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="${leaf}" ${line(2.5)}/>`).join('')}${blobs.map(([bx,by])=>`<path d="M${bx-8} ${by+4}q6 5 14 0" fill="none" stroke="#4f7d3d" stroke-width="2"/>`).join('')}${fruit?[[-34,-62],[-6,-90],[22,-74],[36,-48],[-18,-36],[8,-50]].map(([fx,fy])=>`<circle cx="${fx}" cy="${fy}" r="5.5" fill="${fruit}" stroke="${INK}" stroke-width="1.5"/>`).join(''):''}</g>`;};
const pip=(x,y,s=1,flip=false)=>`<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s})">
 <path d="M28-18q22-14 18-34" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M28-18q22-14 18-34" fill="none" stroke="#fffaf0" stroke-width="3.5" stroke-linecap="round"/>
 <path d="M-30-6q-6-34 26-36h28q20 2 18 30v12h-10v-10h-36v10h-10v-10Z" fill="#fffaf0" ${line(2.5)}/><path d="M-8-38q14-6 22 6-6 12-22 6Z" fill="#b98557"/>
 <path d="M-30 0v-8m10 8v-8m36 8v-8m10 8v-8" ${line(3)}/>
 <circle cx="-30" cy="-46" r="20" fill="#fffaf0" ${line(2.5)}/><path d="M-44-60q-10 10-4 26l8-6q-2-12 2-20Z" fill="#b98557" ${line(2)}/><path d="M-18-62q12 4 10 22l-8-4q0-10-6-14Z" fill="#b98557" ${line(2)}/>
 <path d="M-50-40q-8 2-8 8 6 6 14 0" fill="#fffaf0" ${line(2)}/><circle cx="-56" cy="-36" r="3.5" fill="${INK}"/><circle cx="-34" cy="-50" r="3" fill="${INK}"/><circle cx="-24" cy="-50" r="3" fill="${INK}"/>
 <path d="M-24-28q8 6 4 14" fill="none" stroke="#3d78b8" stroke-width="4"/><path d="M-28-26l-10 6 2-10Zm4 0 10 6-2-10Z" fill="#4d8fd6" stroke="#2c5a8c" stroke-width="1.5"/></g>`;
const lucy=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">
 <path d="M-8 0v-20m16 20v-20" ${line(5)}/><path d="M-12 2h10m4 0h10" stroke="#c8553d" stroke-width="7" stroke-linecap="round"/>
 <path d="M-22-20 0-74l22 54Z" fill="#f2c94c" ${line(2.5)}/><path d="M0-70v48" stroke="#c99a2e" stroke-width="2"/>
 <path d="M-14-60l-14 26m42-26 14 26" ${line(5)}/>
 <circle cy="-86" r="15" fill="#f4d5b8" ${line(2.5)}/><path d="M-16-88q2-20 18-18 16 2 14 18-10-10-32 0Z" fill="#7a4b2a" ${line(2)}/><path d="M14-86q8 10 2 22" fill="none" stroke="#7a4b2a" stroke-width="5"/>
 <circle cx="-5" cy="-86" r="2" fill="${INK}"/><circle cx="5" cy="-86" r="2" fill="${INK}"/><path d="M-4-79q4 3 8 0" fill="none" stroke="${INK}" stroke-width="1.5"/></g>`;
const waves=(y,color,amp=6,step=50,w=400)=>{let d=`M0 ${y}`;for(let x=0;x<w;x+=step)d+=`q${step/4} ${-amp} ${step/2} 0t${step/2} 0`;return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;};
const boat=(x,y,s=1,hull='#c8553d',sail='#fffaf0')=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-50 0h100l-16 26h-68Z" fill="${hull}" ${line(2.5)}/><path d="M-44 8h88" stroke="#fffaf0" stroke-width="5"/><path d="M0 0v-80" ${line(3)}/><path d="M4-76l40 70H4Z" fill="${sail}" ${line(2.5)}/><path d="M-4-66l-30 60h30Z" fill="#e9d9b8" ${line(2.5)}/><path d="M0-80l16 6-16 6" fill="#f2c94c" stroke="${INK}" stroke-width="1.5"/></g>`;
const lighthouse=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 0l10-150h40l10 150Z" fill="#fffaf0" ${line(3)}/><path d="M-27-40h54l2 22h-58Zm6-70h42l2 24h-46Z" fill="#c8553d"/><path d="M-30 0l10-150h40l10 150Z" fill="none" ${line(3)}/><rect x="-24" y="-182" width="48" height="32" rx="3" fill="#f6df8f" ${line(3)}/><path d="M-8-182v32m16-32v32" stroke="${INK}" stroke-width="2"/><path d="M-30-182h60L0-206Z" fill="#c8553d" ${line(3)}/><path d="M-32-150h64" ${line(4)}/><path d="M-8 0v-26q8-8 16 0v26" fill="#6c4b31" ${line(2.5)}/><circle cy="-120" r="5" fill="#bfe0ea" ${line(2)}/></g>`;
const gull=(x,y,s=1)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M-12 0q6-8 12 0 6-8 12 0" fill="none" ${line(2.5)}/>`;
const star=(x,y,r=5,c='#f6e3a1')=>`<path transform="translate(${x} ${y})" d="M0 ${-r}L${r*.3} ${-r*.3} ${r} 0 ${r*.3} ${r*.3} 0 ${r} ${-r*.3} ${r*.3} ${-r} 0 ${-r*.3} ${-r*.3}Z" fill="${c}"/>`;
const SPINES=['#a6463b','#3f6b78','#c99a3e','#6b7f4c','#7d5a8a','#b5623f','#4f7a5e'];
const books=(x,y,w,h,rand)=>{let s='',cx=x;while(cx<x+w-14){const bw=12+Math.floor(rand()*12),bh=h-Math.floor(rand()*h*.28),c=SPINES[Math.floor(rand()*SPINES.length)];
 if(rand()<.12&&cx+bh<x+w){s+=`<rect x="${cx}" y="${y-bw}" width="${bh}" height="${bw}" rx="2" fill="${c}" ${line(1.8)}/>`;cx+=bh+2;continue;}
 s+=`<rect x="${cx}" y="${y-bh}" width="${bw}" height="${bh}" rx="2" fill="${c}" ${line(1.8)}/><path d="M${cx+3} ${y-bh+8}h${bw-6}m${-(bw-6)} 5h${bw-6}" stroke="#f1e2b5" stroke-width="1.5"/>`;cx+=bw+1;}return s;};
const frame=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${body}<rect x="1.5" y="1.5" width="397" height="397" fill="none" stroke="${INK}" stroke-width="3" opacity=".5"/></svg>`;

const PICTURES={
 lucy:[
  // Pip waiting in the flower garden
  r=>frame(`<rect width="400" height="400" fill="#cfe6ea"/>${sun(330,62,28)}${cloud(40,40,1.1)}${cloud(190,70,.8)}
   <path d="M0 200q100-40 200-10t200-14v224H0Z" fill="#b5d396"/>${tree(80,214,1.05,'#6fa258','#d9483b',r)}
   ${[200,228,256,284,312,340,368].map(x=>`<path d="M${x} 236v-58l10-11 10 11v58Z" fill="#f4ebd6" ${line(2)}/>`).join('')}<path d="M196 198h184m-184 26h184" ${line(4)}/>
   <rect y="236" width="400" height="164" fill="#93bd72"/><path d="M150 400q30-80 110-164" fill="none" stroke="#d9c7a0" stroke-width="34" stroke-linecap="round"/>${[[168,372],[196,322],[226,280]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="16" ry="8" fill="#c9b78f" ${line(1.5)}/>`).join('')}
   ${pip(300,330,1.05)}
   ${[[24,300,'#e8857a'],[54,326,'#f2c94c'],[86,300,'#b48ad8'],[30,360,'#f2c94c'],[70,372,'#e8857a'],[110,346,'#7fb3e0'],[120,392,'#b48ad8'],[350,372,'#e8857a'],[380,392,'#f2c94c'],[250,384,'#b48ad8']].map(([x,y,c])=>flower(x,y-20,c)).join('')}
   <path d="M330 270h34l-4 22h-26Z" fill="#7aa0b8" ${line(2)}/><path d="M364 274q14 0 12 12" fill="none" ${line(2)}/><path d="M330 272l-18-12" ${line(3)}/>`),
  // The little footbridge over the stream
  r=>frame(`<rect width="400" height="400" fill="#d9ece6"/>${cloud(250,36,1)}${cloud(30,70,.7)}
   ${tree(56,180,1,'#6fa258','#d9483b',r)}${tree(340,170,.9,'#7fae62','#e2a03f',r)}<path d="M0 160q200-30 400 0v40H0Z" fill="#b8d79c"/>
   <path d="M0 196q200-12 400 6v198H0Z" fill="#8db86a"/><path d="M110 400q30-110 10-204h150q-40 90 30 204Z" fill="#7fb7cf" ${line(2.5)}/>
   ${waves(260,'#bfe2ee',5,40)}${waves(320,'#bfe2ee',5,46)}${waves(372,'#bfe2ee',5,52)}
   <path d="M40 300q160-110 320 0" fill="none" stroke="#6e4a2c" stroke-width="12" stroke-linecap="round"/><path d="M40 320q160-100 320 0" fill="none" stroke="#a77a4d" stroke-width="22"/><path d="M40 320q160-100 320 0" fill="none" stroke="${INK}" stroke-width="2" transform="translate(0 11)"/>
   ${[0,1,2,3,4,5,6,7].map(i=>{const t=(i+.5)/8,x=40+320*t,y=320-2*t*(1-t)*100*1;return `<path d="M${x} ${y-10}v20" stroke="#6e4a2c" stroke-width="2.5"/>`;}).join('')}
   <path d="M60 306v-46m280 46v-46" ${line(5)}/><path d="M60 262q140-90 280 0" fill="none" stroke="#7a5233" stroke-width="5"/>
   ${lucy(170,256,.75)}${pip(236,258,.55,true)}
   <path d="M330 376q8-14 22-12 14 2 16 14Z" fill="#fffaf0" ${line(2)}/><circle cx="366" cy="364" r="6" fill="#fffaf0" ${line(2)}/><path d="M371 364l6 2-6 2" fill="#f2a33a"/>
   ${[[20,380],[36,360],[372,330]].map(([x,y])=>`<path d="M${x} ${y}q-4-30 4-44m4 44q2-26 12-36" fill="none" stroke="#4f7d3d" stroke-width="3"/><path d="M${x+4} ${y-44}v-10" stroke="#7a5233" stroke-width="5" stroke-linecap="round"/>`).join('')}`),
  // The potting shed
  r=>frame(`<rect width="400" height="400" fill="#d6e8ef"/>${cloud(280,30,.9)}${sun(60,58,22)}<rect y="290" width="400" height="110" fill="#8db86a"/>
   <path d="M90 300V150l100-70 100 70v150Z" fill="#c98f5a" ${line(3)}/>${[0,1,2,3,4,5,6,7,8].map(i=>`<path d="M92 ${160+i*16}h196" stroke="#a7723f" stroke-width="2"/>`).join('')}<path d="M78 156l112-82 112 82" fill="none" stroke="#7a3f33" stroke-width="12" stroke-linecap="round"/>
   <path d="M118 300v-90h56v90" fill="#5b3d26" ${line(3)}/><path d="M174 212l30 14v84l-30-10Z" fill="#a7723f" ${line(2.5)}/><circle cx="196" cy="262" r="3.5" fill="#d6b24f"/>
   <rect x="214" y="176" width="58" height="46" fill="#bfe0ea" ${line(3)}/><path d="M243 176v46m-29-23h58" ${line(2)}/><path d="M210 222h66" ${line(5)}/>${flower(226,206,'#e8857a',.7)}${flower(258,206,'#f2c94c',.7)}
   <path d="M300 300l40-150" ${line(4)}/><path d="M326 156h28m-24 0-4 14m10-14-2 14m10-14v14" ${line(3)}/>
   <path d="M18 300h70l-6-40H24Z" fill="#9b6c43" ${line(2.5)}/>${[[34,'#c9714c'],[56,'#cf7a52'],[76,'#c9714c']].map(([x,c])=>`<path d="M${x-10} 260l4-24h16l4 24Z" fill="${c}" ${line(2)}/><path d="M${x} 236q-6-14 2-24m-2 24q8-10 16-8" fill="none" stroke="#4f7d3d" stroke-width="3"/>`).join('')}
   <path d="M300 352h70l-10 26h-50Z" fill="#7aa0b8" ${line(2.5)}/><circle cx="318" cy="384" r="10" fill="#5b3d26" ${line(2)}/><path d="M300 352l-40-14" ${line(4)}/><path d="M314 352q4-20 16-18 10 2 14 18" fill="#d9483b" ${line(2)}/>
   ${pip(150,368,.7)}<path d="M200 330h60m-40 14h60m-90 16h50" stroke="#76a35a" stroke-width="3" stroke-linecap="round"/>`),
  // Sunset in the orchard
  r=>frame(`<defs><linearGradient id="dusk" x2="0" y2="1"><stop stop-color="#f3b27a"/><stop offset=".6" stop-color="#f7dca0"/></linearGradient></defs><rect width="400" height="400" fill="url(#dusk)"/>${sun(200,150,40,'#f9e08a')}
   <path d="M0 190q100-30 200-6t200-10v226H0Z" fill="#a6c27e"/>${tree(50,200,.7,'#7a9e5a','#d9483b',r)}${tree(140,190,.6,'#7a9e5a','#d9483b',r)}${tree(260,190,.6,'#7a9e5a','#d9483b',r)}${tree(352,200,.7,'#7a9e5a','#d9483b',r)}
   <rect y="250" width="400" height="150" fill="#86ad62"/>${tree(70,330,1.05,'#6fa258','#d9483b',r)}${tree(330,322,1,'#6fa258','#d9483b',r)}
   <path d="M150 290h100v70H150Z" fill="none" ${line(4)}/><path d="M150 290v70m25-70v70m25-70v70m25-70v70m25-70v70" ${line(3)}/><path d="M150 310l100 30" ${line(3)}/>
   <path d="M168 392l-6-26h76l-6 26Z" fill="#b98b5a" ${line(2.5)}/><path d="M162 366q38-26 76 0" fill="none" ${line(3)}/>${[176,192,208,224].map((x,i)=>`<circle cx="${x}" cy="${362-i%2*4}" r="7" fill="#d9483b" stroke="${INK}" stroke-width="1.5"/>`).join('')}
   ${pip(300,388,.6,true)}${[40,80,120].map(x=>gull(x+200,60+x/4,.8)).join('')}`),
 ],
 lighthouse:[
  // Lighthouse on the headland
  r=>frame(`<rect width="400" height="400" fill="#bcd8e3"/>${cloud(30,40,1)}${cloud(280,90,.8)}<path d="M240 70 400 30v70Z" fill="#fff4c4" opacity=".7"/>
   <rect y="230" width="400" height="170" fill="#4f8ea3"/>${waves(262,'#8fc0cf',5,40)}${waves(300,'#8fc0cf',6,52)}${waves(345,'#8fc0cf',6,60)}<path d="M0 380h400v20H0Z" fill="#3a6f80"/>
   <path d="M150 400q20-120 110-180 70 0 140 30v150Z" fill="#7d7a70" ${line(3)}/><path d="M200 320q40-60 120-70m-60 120q30-40 100-50" fill="none" stroke="#69665c" stroke-width="3"/>
   ${lighthouse(300,236,.85)}<path d="M200 236v-40h54v40Z" fill="#f4ebd6" ${line(2.5)}/><path d="M194 198l33-26 33 26Z" fill="#7a3f33" ${line(2.5)}/><rect x="220" y="210" width="14" height="26" fill="#6c4b31" ${line(1.5)}/>
   ${boat(90,300,.8)}${gull(120,120)}${gull(150,100,.8)}${gull(60,150,.7)}<path d="M20 372q10-18 26-8 14-12 26 6" fill="#3a6f80" ${line(2)}/>`),
  // The harbour
  r=>frame(`<rect width="400" height="400" fill="#cfe2ea"/>${sun(70,60,24)}${cloud(220,40,1)}<path d="M0 150q60-30 120-10t130-20 150 10v40H0Z" fill="#8c9c8e"/>
   <rect y="170" width="400" height="230" fill="#4f8ea3"/>${waves(200,'#8fc0cf',4,44)}${waves(250,'#8fc0cf',5,52)}
   ${boat(110,236,.9,'#2f6b7f','#fffaf0')}${boat(300,226,.7,'#c8553d','#f2c94c')}
   <rect y="290" width="400" height="110" fill="#a77d55" ${line(3)}/>${[0,1,2,3].map(i=>`<path d="M0 ${312+i*24}h400" stroke="#7d5a3a" stroke-width="3"/>`).join('')}<path d="M40 290v-50m120 50v-50m120 50v-50m100 50v-50" ${line(8)}/>
   <rect x="196" y="318" width="56" height="44" fill="#c99a5a" ${line(2.5)}/><path d="M196 318l56 44m0-44-56 44" stroke="#8a6438" stroke-width="2.5"/><rect x="258" y="332" width="40" height="30" fill="#b6844c" ${line(2.5)}/>
   <ellipse cx="90" cy="356" rx="36" ry="12" fill="#c7a46a" ${line(2.5)}/><ellipse cx="90" cy="348" rx="24" ry="8" fill="none" ${line(2.5)}/>
   <circle cx="350" cy="270" r="14" fill="#e4b33c" ${line(2.5)}/><path d="M340 262h20" stroke="#c8553d" stroke-width="4"/>${gull(300,110)}${gull(340,90,.8)}<path d="M350 336q6-8 14 0 8 6 0 12" fill="#fffaf0" ${line(2)}/>`),
  // Inside the lamp room
  r=>frame(`<rect width="400" height="400" fill="#2f4a5a"/>${[0,1,2,3].map(i=>`<rect x="${10+i*96}" y="20" width="88" height="170" fill="${i%2?'#5a8ea3':'#4f8098'}" ${line(3)}/>`).join('')}${[0,1,2,3].map(i=>waves(150+i*8,'#9cc7d6',3,30,400)).slice(0,2).join('')}${star(60,50)}${star(250,40,4)}${star(330,70,3)}
   <path d="M0 190h400v210H0Z" fill="#8a6a4f"/>${[0,1,2,3,4].map(i=>`<path d="M${i*90} 190v210" stroke="#6f533d" stroke-width="3"/>`).join('')}
   <path d="M130 360v-150h140v150" fill="#c9a24a" ${line(3)}/><ellipse cx="200" cy="210" rx="70" ry="14" fill="#d6b24f" ${line(3)}/>
   <path d="M150 214q50 90 0 140m100-140q-50 90 0 140M175 214q20 70 0 140m50-140q-20 70 0 140" fill="none" stroke="#f6e7b0" stroke-width="4"/><circle cx="200" cy="280" r="24" fill="#fff4c4" ${line(2.5)}/>
   <rect x="120" y="360" width="160" height="22" fill="#5b4433" ${line(3)}/>
   <path d="M30 400l30-170m30 170 30-170M42 340h56M50 300h52M56 260h50" ${line(4)}/>
   <rect x="300" y="300" width="70" height="40" rx="4" fill="#a6463b" ${line(2.5)}/><path d="M318 300v-10h34v10" fill="none" ${line(2.5)}/><path d="M310 352l40 20m-30-26 34 12" stroke="#9aa3a8" stroke-width="5" stroke-linecap="round"/>`),
  // The keeper's kitchen on a stormy night
  r=>frame(`<rect width="400" height="400" fill="#e5d6b8"/>${[0,1,2,3,4,5].map(i=>`<path d="M${i*70} 0v250" stroke="#d6c39d" stroke-width="3"/>`).join('')}
   <rect x="230" y="40" width="140" height="120" fill="#3f5b6a" ${line(4)}/><path d="M300 40v120m-70-60h140" ${line(3)}/><path d="M250 60l-8 30m40-20-8 30m50-40-8 30m40-10-6 24" stroke="#9cc7d6" stroke-width="2.5"/>
   <rect y="250" width="400" height="150" fill="#9b7350"/><rect x="30" y="230" width="270" height="20" rx="3" fill="#8a5f3c" ${line(3)}/><path d="M50 250v130m230-130v130" ${line(8)}/>
   <path d="M90 230v-46h32v46" fill="#c9a24a" ${line(2.5)}/><path d="M86 184h40l-6-12h-28Z" fill="#7a5a33" ${line(2)}/><circle cx="106" cy="208" r="10" fill="#fff0a8" ${line(2)}/><circle cx="106" cy="208" r="26" fill="#fff0a8" opacity=".25"/>
   <path d="M150 230l12-22h90l-6 22Z" fill="#efe3c4" ${line(2)}/><path d="M168 216h60m-56 8h50" stroke="#7d8f9c" stroke-width="2"/><circle cx="228" cy="214" r="5" fill="none" stroke="#c8553d" stroke-width="2"/>
   <path d="M260 230v-18h22v18Z" fill="#fffaf0" ${line(2)}/><path d="M282 216q8 0 6 8" fill="none" ${line(2)}/><path d="M266 204q-4-8 2-14m8 14q-4-8 2-14" fill="none" stroke="#b8a88a" stroke-width="2"/>
   <rect x="320" y="250" width="70" height="120" fill="#4b4f52" ${line(3)}/><rect x="332" y="300" width="46" height="40" rx="4" fill="#2d3133" ${line(2)}/><path d="M340 330q6-20 14-8 6-14 12 8Z" fill="#f2a33a"/><path d="M330 250v-30h18v30" fill="#4b4f52" ${line(2.5)}/>
   <path d="M30 40h120v14H30Z" fill="#8a5f3c" ${line(2)}/><path d="M44 40v-24h18v24m14 0v-30h20v30m14 0v-18h16v18" fill="#c8553d" ${line(2)}/><circle cx="170" cy="100" r="22" fill="#fffaf0" ${line(3)}/><path d="M170 100v-12m0 12 8 4" ${line(2)}/>`),
 ],
 library:[
  // The reading room
  r=>frame(`<rect width="400" height="400" fill="#e9dcc0"/><rect x="10" y="10" width="160" height="250" fill="#6b4a32" ${line(3)}/>${[60,120,180,240].map(y=>`<path d="M14 ${y}h152" stroke="#8a5f3c" stroke-width="6"/>${books(18,y-3,148,46,r)}`).join('')}
   <rect x="250" y="30" width="120" height="150" rx="60" fill="#2f4256" ${line(4)}/><path d="M310 30v150m-60-70h120" ${line(3)}/><circle cx="340" cy="70" r="12" fill="#f2e7b8"/>${star(276,60,4)}${star(290,140,3)}
   <rect y="260" width="400" height="140" fill="#9b7350"/><ellipse cx="220" cy="350" rx="170" ry="40" fill="#a6463b" ${line(2.5)}/><ellipse cx="220" cy="350" rx="140" ry="28" fill="none" stroke="#e1b56a" stroke-width="3"/>
   <rect x="190" y="234" width="190" height="20" rx="3" fill="#8a5f3c" ${line(3)}/><path d="M206 254v80m160-80v80" ${line(8)}/><path d="M230 234v-40" ${line(4)}/><path d="M208 194h44l-10-28h-24Z" fill="#4f7a5e" ${line(2.5)}/><path d="M230 194l-28 40h56Z" fill="#fff0a8" opacity=".35"/>
   <path d="M270 234l14-12h60l-4 12Z" fill="#f4ecd8" ${line(2)}/><path d="M290 226h44" stroke="#a49073" stroke-width="2"/>
   <circle cx="200" cy="120" r="26" fill="#6fa3b8" ${line(3)}/><path d="M184 108q10 6 8 16t12 8m-6-30q10 4 18 0" fill="none" stroke="#6b8a4e" stroke-width="4"/><path d="M200 146v18m-14 0h28" ${line(4)}/>
   <path d="M30 330q20-40 60-30" fill="none" stroke="#6b7f4c" stroke-width="5"/><path d="M24 380h56l-6-40H30Z" fill="#c9714c" ${line(2.5)}/>`),
  // The archive stacks with a ladder
  r=>frame(`<rect width="400" height="400" fill="#5b3d26"/>${[0,1,2].map(c=>`<rect x="${10+c*130}" y="10" width="120" height="380" fill="#6b4a32" ${line(3)}/>${[80,160,240,320,390].map(y=>`<path d="M${14+c*130} ${y}h112" stroke="#8a5f3c" stroke-width="7"/>`).join('')}${[80,160,240,320].map(y=>books(16+c*130,y-4,108,62,r)).join('')}`).join('')}
   <path d="M220 400l60-360m40 360-30-360" ${line(5)}/>${[0,1,2,3,4,5,6,7].map(i=>{const y=380-i*44;const t=(400-y)/360;return `<path d="M${220+t*60} ${y}h${100-t*30-t*60+30*0}" ${line(4)}/>`;}).join('')}
   <path d="M270 64q-6-14 6-20 10-4 16 6l10-8 2 12q6 12-6 18h-22Z" fill="#3d3a38" ${line(2)}/><circle cx="282" cy="56" r="2" fill="#f2d36b"/><circle cx="292" cy="56" r="2" fill="#f2d36b"/><path d="M302 70q20 0 16 24" fill="none" stroke="#3d3a38" stroke-width="5" stroke-linecap="round"/>
   <rect x="40" y="350" width="70" height="40" fill="#c9a274" ${line(2.5)}/><rect x="54" y="360" width="40" height="12" fill="#f4ecd8" ${line(1.5)}/>`),
  // Ada's desk, close up
  r=>frame(`<rect width="400" height="400" fill="#7a5233"/>${[0,1,2,3,4,5,6,7].map(i=>`<path d="M0 ${i*52+20}q200 ${i%2?8:-8} 400 0" fill="none" stroke="#6b4629" stroke-width="3"/>`).join('')}
   <path d="M40 120l130-20 10 150-130 20Z" fill="#efe3c4" ${line(2.5)}/><path d="M60 140l90-14m-88 30 90-14m-88 30 90-14m-88 30 60-9" stroke="#8d7a5a" stroke-width="2"/><path d="M90 210q20-20 40 0t40-6" fill="none" stroke="#3f6b78" stroke-width="2"/>
   <path d="M190 110q50-20 100 0v120q-50-18-100 0Z" fill="#f4ecd8" ${line(2.5)}/><path d="M290 110q50-20 100 0v120q-50-18-100 0Z" fill="#f4ecd8" ${line(2.5)}/><path d="M204 132h70m-70 14h70m-70 14h60m46-28h70m-70 14h70m-70 14h50" stroke="#8d7a5a" stroke-width="2"/><path d="M300 180q20-14 34 0 14 14 34 0" fill="none" stroke="#a6463b" stroke-width="2"/>
   <path d="M60 300q40-120 140-200" stroke="#fffaf0" stroke-width="5" stroke-linecap="round"/><path d="M60 300q30-80 70-120 0 40-60 120Z" fill="#fffaf0" ${line(2)}/>
   <path d="M210 300v-30h40v30Z" fill="#2c3a4a" ${line(2.5)}/><rect x="222" y="260" width="16" height="12" fill="#3d3a38" ${line(2)}/>
   <circle cx="320" cy="300" r="34" fill="#cfe4ea" opacity=".6" ${line(4)}/><path d="M344 324l36 36" stroke="#8a5f3c" stroke-width="12" stroke-linecap="round"/>
   <path d="M60 352h50v-24h-50Z" fill="#f6e7b0" ${line(2)}/><path d="M85 328v-24" ${line(3)}/><path d="M85 304q-6-10 0-18 6 8 0 18" fill="#f2a33a" ${line(1.5)}/>
   <circle cx="170" cy="350" r="18" fill="#a6463b" ${line(2.5)}/><path d="M162 344l8 8 8-8m-8 8v-14" stroke="#e1b56a" stroke-width="2.5" fill="none"/>
   <path d="M250 370l60-10 4 24-60 10Z" fill="#c99a3e" ${line(2)}/>`),
  // Midnight over the town and the archive
  r=>frame(`<rect width="400" height="400" fill="#23344a"/>${[[30,40],[90,90],[150,30],[360,50],[330,120],[60,160],[260,24],[390,180]].map(([x,y],i)=>star(x,y,3+i%3)).join('')}<circle cx="300" cy="70" r="30" fill="#f2e7b8"/><circle cx="314" cy="62" r="26" fill="#23344a"/>
   <path d="M150 400V150l50-50 50 50v250Z" fill="#c9a274" ${line(3)}/><circle cx="200" cy="170" r="30" fill="#f4ecd8" ${line(3)}/>${[0,1,2,3,4,5,6,7,8,9,10,11].map(k=>`<path d="M${200+Math.cos(k*Math.PI/6)*24} ${170+Math.sin(k*Math.PI/6)*24}l${Math.cos(k*Math.PI/6)*4} ${Math.sin(k*Math.PI/6)*4}" stroke="${INK}" stroke-width="2"/>`).join('')}<path d="M200 170v-22m0 22v-20" ${line(3)}/>
   <path d="M150 150l50-60 50 60" fill="#7a3f33" ${line(3)}/>${[230,280,330].map(y=>`<rect x="176" y="${y}" width="18" height="30" rx="9" fill="#f6df8f" ${line(2)}/><rect x="206" y="${y}" width="18" height="30" rx="9" fill="#f6df8f" ${line(2)}/>`).join('')}
   <path d="M0 400V270l30-30 30 30v130Z" fill="#6b5a7a" ${line(2.5)}/><path d="M60 400V300h80v100Z" fill="#7a6a5a" ${line(2.5)}/><path d="M56 300l44-40 44 40" fill="#a6463b" ${line(2.5)}/>
   <path d="M250 400V290h70v110Z" fill="#5a6a7a" ${line(2.5)}/><path d="M246 290l39-36 39 36" fill="#3f6b78" ${line(2.5)}/><path d="M320 400V250h80v150Z" fill="#7a6a5a" ${line(2.5)}/>
   ${[[16,300],[80,320],[110,350],[264,310],[290,350],[340,270],[370,310],[340,350]].map(([x,y])=>`<rect x="${x}" y="${y}" width="16" height="18" fill="#f6df8f" ${line(1.5)}/>`).join('')}`),
 ],
};

// Shapes documents: the whole page carries detail so every fragment has a place.
const paper=(body,tint='#fff5d6',edge='#d7b983')=>`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420"><defs><radialGradient id="paper"><stop stop-color="${tint}"/><stop offset="1" stop-color="${edge}"/></radialGradient><pattern id="grain" width="7" height="9" patternUnits="userSpaceOnUse"><path d="M1 2h1m3 4h1" stroke="#a47f48" opacity=".11"/></pattern></defs><rect width="300" height="420" fill="url(#paper)"/><rect width="300" height="420" fill="url(#grain)"/>${body}</svg>`;
const T=(x,y,s,text,o='')=>`<text x="${x}" y="${y}" font-size="${s}" ${o}>${text}</text>`;
const serif='font-family="Georgia,serif"',hand='font-family="cursive" font-style="italic"';
const border=(c)=>`<rect x="12" y="12" width="276" height="396" fill="none" stroke="${c}" stroke-width="2"/><rect x="18" y="18" width="264" height="384" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="4 3"/>${[[12,12],[288,12],[12,408],[288,408]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="${c}"/>`).join('')}`;
const compass=(x,y,r,c)=>`<g transform="translate(${x} ${y})" stroke="${c}" fill="none" stroke-width="1.6"><circle r="${r}"/><circle r="${r*.7}" stroke-dasharray="2 3"/><path d="M0 ${-r-6}L${r*.2} 0 0 ${r+6} ${-r*.2} 0Z" fill="${c}" fill-opacity=".25"/><path d="M${-r-6} 0L0 ${r*.2} ${r+6} 0 0 ${-r*.2}Z"/></g><text x="${x}" y="${y-r-10}" text-anchor="middle" font-size="10" ${serif} fill="${c}">N</text>`;
const DOCUMENTS={
 lucy:[
  ()=>fs.readFileSync(path.join(__dirname,'..','art','scenes','lucy-document.svg'),'utf8'),
  ()=>paper(`${border('#8a6a45')}<g fill="#5b4a33">${T(150,52,20,'The Garden Map',`${serif} font-style="italic" text-anchor="middle"`)}</g>
   <path d="M40 90h220v250H40Z" fill="#e9dfb6" stroke="#8a6a45" stroke-width="2"/><path d="M60 330q40-90 90-110t100-120" fill="none" stroke="#c9b083" stroke-width="12" stroke-linecap="round"/><path d="M60 330q40-90 90-110t100-120" fill="none" stroke="#8a6a45" stroke-width="1.5" stroke-dasharray="5 5"/>
   ${[[70,120],[100,110],[220,300],[240,270],[200,320]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="13" fill="#9cbf7e" stroke="#4f7d3d" stroke-width="2"/><circle cx="${x-4}" cy="${y-3}" r="2.5" fill="#d9483b"/>`).join('')}
   <path d="M60 200h60v40H60Z" fill="#c98f5a" stroke="#6e4a2c" stroke-width="2"/><path d="M56 200l34-20 34 20" fill="#a6463b" stroke="#6e4a2c" stroke-width="2"/>${T(64,256,9,'potting shed',`${hand} fill="#5b4a33"`)}
   <ellipse cx="200" cy="170" rx="34" ry="20" fill="#9fcfe0" stroke="#3f6b78" stroke-width="2"/>${T(178,200,9,'the pond',`${hand} fill="#3f6b78"`)}
   <path d="M150 300h40m-40 8h40" stroke="#6e4a2c" stroke-width="3"/>${T(146,326,9,'gate',`${hand} fill="#5b4a33"`)}<path d="M236 112l12 12m0-12-12 12" stroke="#c8553d" stroke-width="3"/>${T(214,140,9,'Pip?',`${hand} fill="#c8553d"`)}
   ${compass(234,236,16,'#8a6a45')}<g fill="#635a47" ${hand}>${T(36,368,12,'Follow the stepping stones.')}${T(40,388,12,'Pip always goes this way.')}</g>`,'#fbf3d2','#d9c48f'),
  ()=>paper(`<rect x="20" y="20" width="260" height="380" fill="#fffaf0" stroke="#c8553d" stroke-width="4"/><g fill="#c8553d" ${serif} font-weight="bold" text-anchor="middle">${T(150,72,40,'LOST DOG')}</g><path d="M40 86h220" stroke="#c8553d" stroke-width="2"/>
   <rect x="60" y="100" width="180" height="140" fill="#dfeccf" stroke="#5b4a33" stroke-width="2"/><g transform="translate(150 230) scale(1.25)"><path d="M-30-6q-6-34 26-36h28q20 2 18 30v12h-10v-10h-36v10h-10v-10Z" fill="#fffaf0" stroke="#3b4639" stroke-width="2"/><circle cx="-30" cy="-46" r="20" fill="#fffaf0" stroke="#3b4639" stroke-width="2"/><path d="M-44-60q-10 10-4 26l8-6q-2-12 2-20Zm26-2q12 4 10 22l-8-4q0-10-6-14Z" fill="#b98557" stroke="#3b4639" stroke-width="1.5"/><circle cx="-34" cy="-50" r="2.5" fill="#3b4639"/><circle cx="-24" cy="-50" r="2.5" fill="#3b4639"/><circle cx="-52" cy="-38" r="3" fill="#3b4639"/><path d="M-28-26l-10 6 2-10Zm4 0 10 6-2-10Z" fill="#4d8fd6"/><path d="M28-18q22-14 18-34" fill="none" stroke="#3b4639" stroke-width="3"/></g>
   <g ${serif} fill="#3b4639" text-anchor="middle">${T(150,272,26,'“PIP”')}</g><g fill="#5b4a33" font-family="system-ui,sans-serif" font-size="12" text-anchor="middle">${T(150,298,12,'Small, white, one brown ear.')}${T(150,316,12,'Wearing a blue ribbon.')}${T(150,334,12,'Loves biscuits and apples.')}</g>
   <path d="M30 352h240" stroke="#c8553d" stroke-dasharray="6 4" stroke-width="1.5"/>${[0,1,2,3,4,5].map(i=>`<rect x="${34+i*39}" y="358" width="36" height="34" fill="none" stroke="#c8553d" stroke-width="1" stroke-dasharray="3 2"/><text x="${52+i*39}" y="372" font-size="8" text-anchor="middle" fill="#5b4a33" font-family="system-ui">Lucy</text><text x="${52+i*39}" y="384" font-size="7" text-anchor="middle" fill="#5b4a33" font-family="system-ui">Garden Row</text>`).join('')}`,'#fffaf0','#efe2c4'),
  ()=>paper(`${border('#6b7f4c')}<g ${serif} fill="#4e493c">${T(30,54,19,'Planting chart',`font-style="italic"`)}</g>${T(30,72,9,'GARDENER’S NOTEBOOK · SPRING',`fill="#6b7f4c" ${serif} letter-spacing="1.5"`)}
   ${[0,1,2,3].flatMap(r=>[0,1,2].map(c=>{const x=32+c*80,y=88+r*70,kind=(r*3+c)%4;
    const art=kind===0?`<circle cx="${x+38}" cy="${y+30}" r="14" fill="#d9483b" stroke="#6b2a22" stroke-width="2"/><path d="M${x+38} ${y+16}q4-8 10-8" fill="none" stroke="#4f7d3d" stroke-width="2"/>`:kind===1?`<path d="M${x+38} ${y+50}v-30" stroke="#4f7d3d" stroke-width="2.5"/>${[0,72,144,216,288].map(a=>`<circle cx="${x+38+Math.cos(a*Math.PI/180)*7}" cy="${y+18+Math.sin(a*Math.PI/180)*7}" r="5" fill="#b48ad8"/>`).join('')}`:kind===2?`<path d="M${x+20} ${y+46}q18-40 36 0Z" fill="#e2a03f" stroke="#7a5233" stroke-width="2"/><path d="M${x+38} ${y+12}v14m-6-10 6 8 6-8" stroke="#4f7d3d" stroke-width="2" fill="none"/>`:`<path d="M${x+24} ${y+46}l4-22h20l4 22Z" fill="#c9714c" stroke="#88462c" stroke-width="2"/><path d="M${x+38} ${y+24}q-8-12 0-18 8 6 0 18" fill="#6fa258"/>`;
    return `<rect x="${x}" y="${y}" width="76" height="66" fill="#fbf6e2" stroke="#b9a984" stroke-width="1.5"/>${art}<text x="${x+6}" y="${y+62}" font-size="8" fill="#6b5a3c" font-family="cursive" font-style="italic">${['apples','violets','pumpkins','herbs'][kind]} · row ${r*3+c+1}</text>`;})).join('')}
   <g fill="#635a47" ${hand}>${T(32,384,12,'Water before sunset. Check the gate!')}</g>`,'#fbf6e0','#d8c592'),
 ],
 lighthouse:[
  ()=>fs.readFileSync(path.join(__dirname,'..','art','scenes','lighthouse-document.svg'),'utf8'),
  ()=>paper(`${border('#3f6b78')}<g ${serif} fill="#2f4a5a" text-anchor="middle">${T(150,50,18,'Chart of the Northern Reef',`font-style="italic"`)}</g>
   <rect x="30" y="66" width="240" height="280" fill="#d6e6e2" stroke="#3f6b78" stroke-width="2"/><path d="M30 120q60-20 90 10t60 70 90-20V66H30Z" fill="#e8dcb2" stroke="#8a6a45" stroke-width="2"/>
   ${[[90,250],[120,280],[200,240],[230,300],[160,320],[60,300]].map(([x,y])=>`<path d="M${x-8} ${y}l4-8 6 4 6-6 4 10Z" fill="#7d7a70" stroke="#3b4639" stroke-width="1.2"/>`).join('')}
   <path d="M140 340q-10-60 10-110t-20-80" fill="none" stroke="#c8553d" stroke-width="2.5" stroke-dasharray="7 5"/><path d="M128 156l2-12 8 9" fill="#c8553d"/>
   <g transform="translate(70 110) scale(.35)"><path d="M-30 0l10-150h40l10 150Z" fill="#fffaf0" stroke="#3b4639" stroke-width="5"/><path d="M-27-40h54l2 22h-58Zm6-70h42l2 24h-46Z" fill="#c8553d"/></g>
   ${[0,1,2,3,4].map(i=>`<text x="${40+i*50}" y="${200+i%2*30}" font-size="9" fill="#3f6b78" ${serif}>${[12,9,4,7,15][i]}</text>`).join('')}${compass(232,124,20,'#3f6b78')}
   <g fill="#2f4a5a" ${hand}>${T(32,372,12,'Keep the red line to port.')}${T(36,392,12,'The channel is narrow but true.')}</g>`,'#f5f0dc','#cdd7c6'),
  ()=>paper(`<rect x="20" y="20" width="260" height="380" fill="none" stroke="#7a5233" stroke-width="2"/><g ${serif} fill="#4e493c">${T(32,52,19,'Keeper’s Logbook',`font-style="italic"`)}</g>${T(32,70,9,'NIGHT WATCH · LAMP &amp; WEATHER',`fill="#7a5233" ${serif} letter-spacing="1.5"`)}
   <path d="M30 84h240M30 104h240M90 84v190M160 84v190M220 84v190" stroke="#8e7350" stroke-width="1.2"/>${T(36,98,10,'Time',`${serif} fill="#5b4a33"`)}${T(96,98,10,'Lamp',`${serif} fill="#5b4a33"`)}${T(166,98,10,'Wind',`${serif} fill="#5b4a33"`)}${T(226,98,10,'Sea',`${serif} fill="#5b4a33"`)}
   ${['18:00','20:00','22:00','23:30','00:15','01:00','02:30','04:00'].map((t,i)=>`<path d="M30 ${124+i*20}h240" stroke="#c4ae86" stroke-width=".8"/><g font-size="11" fill="#635a47" font-family="cursive" font-style="italic">${T(36,120+i*20,11,t)}${T(96,120+i*20,11,i<4?'bright':i===4?'OUT!':'dark')}${T(166,120+i*20,11,['NW 3','NW 4','W 5','W 6','W 7','SW 7','SW 6','S 5'][i])}${T(226,120+i*20,11,['calm','choppy','rough','rough','high','high','high','rough'][i])}</g>`).join('')}
   <path d="M100 206l40-4" stroke="#c8553d" stroke-width="2"/>
   <g transform="translate(150 330)"><ellipse cy="40" rx="50" ry="8" fill="#c4ae86" opacity=".5"/><path d="M-30 30v-50h60v50Z" fill="#f6df8f" stroke="#7a5233" stroke-width="2"/><path d="M-30-20l30-26 30 26" fill="#c8553d" stroke="#7a5233" stroke-width="2"/><path d="M-10 30V5h20v25" fill="none" stroke="#7a5233" stroke-width="2"/><path d="M40-30 90-50M40-10l60 0M40 10l50 20" stroke="#e2a03f" stroke-width="3"/><path d="M-40-30-90-50M-40-10h-60M-40 10l-50 20" stroke="#e2a03f" stroke-width="3"/></g>
   <g fill="#635a47" ${hand}>${T(32,396,12,'Lamp tampered with. Fetch Ellis.')}</g>`,'#fbf3da','#d9c597'),
  ()=>paper(`${border('#2f6b7f')}<g ${serif} fill="#2f4a5a" text-anchor="middle">${T(150,56,22,'TIDE TABLE')}${T(150,76,10,'HARBOUR OFFICE · STORM WEEK',`letter-spacing="2"`)}</g>
   <path d="M30 170q30-60 60 0t60 0 60 0 60 0" fill="none" stroke="#2f6b7f" stroke-width="3"/><path d="M30 170q30-60 60 0t60 0 60 0 60 0V200H30Z" fill="#9fcfe0" opacity=".5"/>${[60,120,180,240].map((x,i)=>`<text x="${x}" y="${i%2?186:104}" font-size="10" text-anchor="middle" fill="#2f4a5a" ${serif}>${['HIGH 06:12','LOW 12:30','HIGH 18:41','LOW 00:55'][i]}</text>`).join('')}
   ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>`<rect x="30" y="${212+i*24}" width="240" height="22" fill="${i%2?'#eef3ea':'#f8f3e0'}" stroke="#b9c3b8" stroke-width="1"/><g font-size="11" fill="#2f4a5a" ${serif}>${T(36,227+i*24,11,d)}${T(140,227+i*24,11,['06:12','06:58','07:41','08:30','09:12','09:55'][i])}${T(206,227+i*24,11,['3.9 m','4.1 m','4.4 m','4.6 m','4.2 m','3.8 m'][i])}</g>`).join('')}
   <g transform="translate(240 120) scale(.55)">${'<path d="M-50 0h100l-16 26h-68Z" fill="#c8553d" stroke="#3b4639" stroke-width="3"/><path d="M0 0v-70" stroke="#3b4639" stroke-width="3"/><path d="M4-66l36 60H4Z" fill="#fffaf0" stroke="#3b4639" stroke-width="3"/>'}</g>
   <g fill="#2f4a5a" ${hand}>${T(32,380,12,'Wednesday: storm tide over the reef.')}${T(32,398,11,'Light must be lit by 23:00.')}</g>`,'#f6f3e4','#cfd9cc'),
 ],
 library:[
  ()=>fs.readFileSync(path.join(__dirname,'..','art','scenes','library-document.svg'),'utf8'),
  ()=>paper(`${border('#6b4a2f')}<g ${serif} fill="#4e3a28" text-anchor="middle">${T(150,50,18,'Archive Floor Plan',`font-style="italic"`)}${T(150,66,9,'GROUND FLOOR · RESTRICTED WING',`letter-spacing="1.5"`)}</g>
   <rect x="34" y="80" width="232" height="270" fill="#f4ead0" stroke="#6b4a2f" stroke-width="3"/>${[0,1,2,3,4].map(i=>`<rect x="${50+i*42}" y="96" width="26" height="110" fill="#c9a274" stroke="#6b4a2f" stroke-width="1.5"/><text x="${63+i*42}" y="226" font-size="9" text-anchor="middle" fill="#6b4a2f" ${serif}>${'ABCDE'[i]}</text>`).join('')}
   <rect x="50" y="250" width="90" height="44" fill="#a87547" stroke="#6b4a2f" stroke-width="1.5"/>${T(56,312,9,'reading desk',`${hand} fill="#5b4a33"`)}<circle cx="210" cy="280" r="24" fill="#e1d2a8" stroke="#6b4a2f" stroke-width="1.5"/>${T(190,320,9,'stair',`${hand} fill="#5b4a33"`)}
   <path d="M234 80v-0m0 270h-30" stroke="#6b4a2f" stroke-width="3"/><path d="M220 350v-8h28v8" fill="none" stroke="#6b4a2f" stroke-width="2"/>
   <path d="M245 118q-6-10 4-14 10 0 6 14l-5 10Z" fill="#6b7f4c"/><path d="M226 140q20-10 20-26" fill="none" stroke="#a6463b" stroke-width="2" stroke-dasharray="4 3"/>${T(200,160,9,'cabinet?',`${hand} fill="#a6463b"`)}
   ${compass(250,236,12,'#6b4a2f')}<g fill="#635a47" ${hand}>${T(34,376,12,'The leaf marks the garden deeds.')}${T(38,396,12,'Behind the public shelves.')}</g>`,'#fbf3da','#d7c08f'),
  ()=>paper(`<rect x="16" y="16" width="268" height="388" fill="none" stroke="#a6463b" stroke-width="3"/><rect x="24" y="24" width="252" height="372" fill="none" stroke="#c99a3e" stroke-width="1.5"/>${[[24,24],[276,24],[24,396],[276,396]].map(([x,y])=>`<path transform="translate(${x} ${y})" d="M-10 0q10-10 20 0-10 10-20 0Zm10-10q10 10 0 20-10-10 0-20Z" fill="#c99a3e"/>`).join('')}
   <g ${serif} fill="#4e3a28" text-anchor="middle">${T(150,66,24,'Town Charter',`font-style="italic"`)}${T(150,86,9,'OF THE COMMON GARDEN · 1872',`letter-spacing="2"`)}</g><path d="M60 98h180" stroke="#c99a3e" stroke-width="1.5"/>
   <text x="40" y="146" font-size="44" fill="#a6463b" ${serif}>B</text><g fill="#4e3a28" font-family="cursive" font-style="italic" font-size="11">${['e it known that the garden','beyond Orchard Lane is given','to the people of this town, to','be kept for ever as common','ground, never to be sold.','Witnessed under seal by the','founders and the archivist.'].map((l,i)=>T(i<2?72:40,124+i*20+(i>1?14:0),11,l)).join('')}</g>
   <g transform="translate(150 316)"><circle r="40" fill="#a6463b" stroke="#6b2a22" stroke-width="2"/><circle r="31" fill="none" stroke="#e1b56a" stroke-width="1.5"/><path d="M0 22V-6m0 0q-14-4-16-18 14 2 16 18m0 0q14-4 16-18-14 2-16 18M0 6q-10-2-12-12 10 2 12 12m0 0q10-2 12-12-10 2-12 12" fill="#e1b56a" stroke="#e1b56a" stroke-width="1.5"/></g>
   <path d="M40 386q30-10 60 0t50-6" fill="none" stroke="#4e3a28" stroke-width="1.5"/><path d="M200 380q20-14 40-4t30-6" fill="none" stroke="#4e3a28" stroke-width="1.5"/>`,'#fbf0d0','#d4b67c'),
  ()=>paper(`<g ${serif} fill="#4e3a28">${T(30,46,18,'Catalogue cards',`font-style="italic"`)}</g>${T(30,62,9,'RESTRICTED SHELF · ADA’S COPIES',`fill="#7a5233" ${serif} letter-spacing="1.5"`)}
   ${[0,1,2,3].map(i=>{const y=78+i*76,rot=[-2,1.5,-1,2][i];return `<g transform="rotate(${rot} 150 ${y+34})"><rect x="34" y="${y}" width="232" height="68" fill="#fffdf4" stroke="#a49073" stroke-width="1.5"/><path d="M34 ${y+18}h232" stroke="#c8553d" stroke-width="1.2"/>${[1,2,3].map(k=>`<path d="M34 ${y+18+k*12}h232" stroke="#9cc0d0" stroke-width=".8"/>`).join('')}<circle cx="150" cy="${y+60}" r="3.5" fill="none" stroke="#a49073"/><g font-size="10" fill="#4e3a28" font-family="Courier New,monospace">${T(40,y+13,10,['GD-112','GD-113','LD-07','CH-01'][i])}${T(110,y+13,10,['Garden Deeds','Garden Survey','Donations Ledger','Town Charter'][i])}</g><g font-size="10" fill="#635a47" font-family="cursive" font-style="italic">${T(40,y+40,10,['Cabinet 3, drawer with leaf','Cabinet 3, rolled','Shelf C, rebind needed','Fireproof case, desk'][i])}${T(40,y+52,10,['moved 11 Oct.','missing pages?','pages loose','DO NOT LEND'][i])}</g></g>`;}).join('')}
   <g fill="#a6463b" ${hand}>${T(40,396,12,'Someone has borrowed these twice.')}</g>`,'#f9f2dc','#d6c49a'),
 ],
};

for(const [theme,scenes] of Object.entries(PICTURES))scenes.forEach((make,i)=>fs.writeFileSync(path.join(out,`${theme}-picture-${i}.svg`),make(seeded(i*97+theme.length*13))));
for(const [theme,docs] of Object.entries(DOCUMENTS))docs.forEach((make,i)=>fs.writeFileSync(path.join(out,`${theme}-document-${i}.svg`),make()));
// The offline cache reads this list; it covers story items and puzzle art.
process.chdir(path.join(__dirname,'..'));
fs.writeFileSync('story-assets.json',JSON.stringify(['story','puzzles'].flatMap(dir=>fs.existsSync('art/'+dir)?fs.readdirSync('art/'+dir).filter(f=>f.endsWith('.svg')).map(f=>'./art/'+dir+'/'+f):[]),null,2)+'\n');
console.log('Wrote',Object.values(PICTURES).flat().length,'pictures and',Object.values(DOCUMENTS).flat().length,'documents to',out);
