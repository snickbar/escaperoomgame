// Native release smoke test. Deliberately restricted to an Android emulator.
// Requires a running, authorized emulator and a built APK for package.json's version.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const version=require(path.join(root,'package.json')).version;
const sdk=process.env.ANDROID_HOME||path.join(process.env.LOCALAPPDATA,'Android','Sdk');
const adb=path.join(sdk,'platform-tools','adb.exe');
const serial=process.env.ANDROID_SERIAL||'emulator-5556';
assert.match(serial,/^emulator-\d+$/,'This smoke test only changes a virtual test device.');
const out=path.join(root,'.qa-output');fs.mkdirSync(out,{recursive:true});
const run=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:60000}).trim();
const shell=(...args)=>run('shell',...args);
function nodes() {
  // The preview Android image occasionally reports a null root while a
  // window is changing. Never reuse yesterday's dump as the current screen.
  for(let attempt=0;attempt<5;attempt++) {
    let output;
    try {output=shell('uiautomator','dump','/sdcard/escape-test.xml');}
    catch(error) {output=String(error.stdout);if(!output.includes('dumped'))throw error;}
    if(!output.includes('dumped'))continue;
    const xml=shell('cat','/sdcard/escape-test.xml');
    const list=[...xml.matchAll(/<node\s+([^>]+)>?/g)].map(match=>Object.fromEntries(
      [...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')])));
    if(list.some(n=>n.text))return list;
  }
  throw Error('Android accessibility screen did not become ready.');
}
function waitForText(text) {
  const deadline=Date.now()+25000;
  do {const list=nodes();if(list.some(n=>(n.text||'').toLowerCase().includes(text.toLowerCase())))return list;}while(Date.now()<deadline);
  throw Error('Android screen did not become ready: '+text);
}
function tapText(text, list=nodes()) {
  for(let attempt=0;attempt<5;attempt++) {
    const footerTop=Math.min(...list.filter(n=>['soundToggle','testingToggle'].includes(n['resource-id'])).map(n=>Number(n.bounds.match(/\d+/g)[1])),Infinity);
    const node=list.find(n=>{
      const b=(n.bounds||'').match(/-?\d+/g)?.map(Number);
      const inFooter=['soundToggle','testingToggle'].includes(n['resource-id']);
      return (n.text||'').includes(text)&&b&&b[2]>b[0]&&b[3]>b[1]&&(inFooter||(b[1]+b[3])/2<footerTop-20);
    });
    if(node){tapNode(node);return;}
    shell('input','swipe','540','1700','540','600','300');list=nodes();
  }
  throw Error('Missing visible control: '+text);
}
function tapNode(node) {
  const bounds=node.bounds.match(/\d+/g).map(Number);
  assert.ok(bounds[2]>bounds[0]&&bounds[3]>bounds[1]);
  shell('input','tap',String(Math.round((bounds[0]+bounds[2])/2)),String(Math.round((bounds[1]+bounds[3])/2)));
}
function screenshot(name) {run('emu','screenrecord','screenshot',path.join(out,name));}
function launch() {shell('am','start','-W','-n','com.snickbar.escaperoom/.MainActivity');waitForText('Version '+version);}

try {
  run('install','-r',path.join(root,'dist',`EscapeRoom-${version}.apk`));
  shell('svc','wifi','disable');shell('svc','data','disable');
  shell('am','force-stop','com.snickbar.escaperoom');launch();
  let ui=nodes();
  assert.ok(ui.some(n=>n.text==='Android app · Ready to play offline'));
  assert.ok(ui.some(n=>n.text==='Version '+version));
  console.log('Offline APK home loaded.');
  const originalSound=ui.find(n=>/^Sound (on|off)$/.test(n.text)).text;
  tapText(originalSound,ui);
  const changedSound=originalSound==='Sound on'?'Sound off':'Sound on';
  waitForText(changedSound);
  // Normal backgrounding gives WebView time to flush its asynchronous storage.
  shell('input','keyevent','3');nodes();
  shell('am','force-stop','com.snickbar.escaperoom');launch();
  ui=nodes();
  assert.ok(ui.some(n=>n.text===changedSound),'Sound preference must survive restart');
  console.log('Saved setting survived restart.');
  tapText(changedSound,ui);screenshot('android-home.png');
  tapText('Begin adventure');
  // First Back closes the opening story; the table starts with two leads.
  waitForText('Your first two leads');shell('input','keyevent','4');
  ui=waitForText('The Last Light');assert.ok(ui.some(n=>n.text==='The Last Light'),'Offline story must be generated');
  screenshot('android-story.png');
  console.log('Story dealt offline.');
  tapText('Enter code');waitForText('What did you find?');shell('input','keyevent','4');
  // The system keyboard can consume the first Back before the HTML dialog.
  if(nodes().some(n=>n.text==='What did you find?'))shell('input','keyevent','4');
  assert.ok(!nodes().some(n=>n.text==='What did you find?'),'Back must close the code dialog');
  shell('input','keyevent','4');
  ui=nodes();assert.ok(ui.some(n=>n.text==='Return to home?'),'Back must ask before abandoning a deck');
  tapNode(ui.find(n=>n['resource-id']==='android:id/button2'));
  assert.ok(nodes().some(n=>n.text==='The Last Light'),'Cancel must preserve the game');
  shell('input','keyevent','4');
  tapNode(waitForText('Return to home?').find(n=>n['resource-id']==='android:id/button1'));
  tapText('Quick play');
  tapText('Mini-Games Try out');tapText('Shapes');
  ui=nodes();assert.ok(ui.some(n=>(n.text||'').toLowerCase().includes('shapes test')),'Native puzzle must render');
  screenshot('android-shapes.png');
  shell('input','keyevent','4');
  // Android's accessibility dump can retain text from an opacity-hidden modal.
  // The following Back/home/gallery path also verifies the modal stopped intercepting input.
  nodes();screenshot('android-closed-puzzle.png');
  shell('input','keyevent','4');
  tapText('Art Gallery Browse');
  ui=nodes();assert.ok(ui.some(n=>(n.text||'').includes('Art Gallery')),'Bundled gallery must load');
  screenshot('android-gallery.png');
  shell('input','keyevent','4');
  shell('input','swipe','540','500','540','1800','300');
  assert.ok(waitForText('Choose your story').some(n=>n.text.toLowerCase()==='choose your story'),'Back from gallery must restore home');
  console.log('Signed APK installed; offline home/story/puzzle/gallery, native Back and saved preference checks passed.');
} finally {
  shell('svc','wifi','enable');shell('svc','data','enable');
}
