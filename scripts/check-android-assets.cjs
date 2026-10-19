// Every file the game caches for offline play must also be packaged in the APK;
// a missing folder shows up on the phone as blank puzzle pictures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const gradle=fs.readFileSync(path.join(root,'android','app','build.gradle'),'utf8');
const block=gradle.slice(gradle.indexOf('include '),gradle.indexOf('}',gradle.indexOf('include ')));
const patterns=[...block.matchAll(/'([^']+)'/g)].map(m=>m[1]);
const covered=file=>patterns.some(p=>p.endsWith('/**')?file.startsWith(p.slice(0,-2)):file===p);
const assets=JSON.parse(fs.readFileSync(path.join(root,'story-assets.json'),'utf8')).map(f=>f.replace(/^\.\//,''));
const missing=assets.filter(f=>!covered(f));
assert.deepEqual(missing,[],'Not packaged in the APK: '+missing.join(', '));
console.log('Android packaging covers all',assets.length,'listed artwork files.');
