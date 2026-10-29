const assert=require('node:assert/strict');
const {createProject,e,isValidProject}=require('../.testbuild/model.js');
const {auditPage,mutatePage,repairPage,guardProject,motionRadar,makeReplayFrame,platformZones,contrast,DEFAULT_CONSTITUTION}=require('../.testbuild/creative.js');
const page=createProject().pages[0];
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS',name);}
test('default project passes construction',()=>assert.ok(page.elements.length>=4));
test('color contrast verifies black/white',()=>assert.ok(contrast('#000000','#ffffff')>20));
test('platform zones have valid areas',()=>assert.ok(platformZones(page,'shorts').every(z=>z.width>0&&z.height>0)));
test('mutation is deterministic',()=>assert.deepEqual(mutatePage(page,3),mutatePage(page,3)));
test('mutation preserves content and IDs',()=>assert.deepEqual(mutatePage(page,2).elements.map(x=>x.text),page.elements.map(x=>x.text)));
test('protected layers remain unchanged during mutation',()=>{
  const policy={...DEFAULT_CONSTITUTION,enabled:true,protectedIds:[page.elements[0].id]};
  assert.deepEqual(mutatePage(page,5,policy).elements[0],page.elements[0]);
});
test('audit detects out of bounds',()=>{
  const invalid={...page,elements:[e('text',{x:-500,y:0,width:100,height:60,fill:'#ffffff'})]};
  assert.ok(auditPage(invalid).some(x=>x.code==='outside'));
});
test('repair clamps out of bounds',()=>{
  const invalid={...page,elements:[e('text',{x:-500,y:-400,width:100,height:60})]};
  const fixed=repairPage(invalid,DEFAULT_CONSTITUTION);
  assert.ok(fixed.page.elements[0].x>=0 && fixed.page.elements[0].y>=0);
  assert.ok(fixed.changes.length);
});
test('repair does not alter locked layers',()=>{
  const locked=e('rect',{x:-500,y:-400,locked:true});
  assert.deepEqual(repairPage({...page,elements:[locked]},DEFAULT_CONSTITUTION).page.elements[0],locked);
});
test('constitution guard restores protected changes and deletions',()=>{
  const source=createProject(); const original=source.pages[0].elements[0];
  const policy={...DEFAULT_CONSTITUTION,enabled:true,protectedIds:[original.id]};
  source.constitution=policy;
  const changed={...source,pages:[{...source.pages[0],elements:source.pages[0].elements.filter(el=>el.id!==original.id)}]};
  const guarded=guardProject(source,changed);
  assert.deepEqual(guarded.pages[0].elements.find(el=>el.id===original.id),original);
});
test('replay strips embedded image payload',()=>{
  const image=e('image',{image:'data:image/png;base64,long-data'});
  const frame=makeReplayFrame({...page,elements:[image]},'test');
  assert.equal(frame.page.elements[0].image,undefined);
});
test('motion radar is bounded',()=>assert.ok(motionRadar(page,'slide').length<150));
test('legacy projects without constitution remain valid',()=>assert.ok(isValidProject(createProject())));
test('invalid constitution import is rejected',()=>{
 const source=createProject();source.constitution={enabled:'yes'};
 assert.equal(isValidProject(source),false);
});
test('mutation preserves image references',()=>{
 const source={...page,elements:[e('image',{image:'data:image/png;base64,AAA'})]};
 assert.equal(mutatePage(source,1).elements[0].image,source.elements[0].image);
});
test('guardian audit catches text overlap',()=>{
 const source={...page,elements:[e('text',{x:30,y:40,width:300,height:100}),e('text',{x:60,y:40,width:300,height:100})]};
 assert.ok(auditPage(source).some(x=>x.code==='text-collision'));
});
console.log(`TOTAL ${tests} passed`);
