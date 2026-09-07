const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadApp}=require('./test-runtime.cjs');
let hasGhdl=true;try{execFileSync('ghdl',['--version']);}catch{hasGhdl=false;}
function circuit(build){
 const a=loadApp();
 a.run(`let sch=activeSch();
 function c(type,params={},label=''){let n={id:uid('c'),type,x:100*sch.components.length,y:100,params,label};sch.components.push(n);return n;}
 function w(a,p,b,q){sch.wires.push({id:uid('w'),from:{cid:a.id,pid:p},to:{cid:b.id,pid:q},name:''});}
 ${build}`);return a;
}
function compile(code,top='top',tb=''){
 if(!hasGhdl)return;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'schematic-vhdl-'));
 try{fs.writeFileSync(path.join(dir,'design.vhd'),code+'\n'+tb);
  execFileSync('ghdl',['-a','--std=08','design.vhd'],{cwd:dir,stdio:'pipe'});
  execFileSync('ghdl',['-e','--std=08',top],{cwd:dir,stdio:'pipe'});
  if(tb)execFileSync('ghdl',['-r','--std=08',top,'--assert-level=error','--stop-time=30ns'],{cwd:dir,stdio:'pipe'});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('CONST exact widths, masked low bits, and hex literals compile',()=>{
 for(const [width,value,expected] of [[1,'F',"'1'"],[6,'FF','"111111"'],[8,'0xf4','x"F4"'],[32,'FFFFFFFF','x"FFFFFFFF"']]){
  const a=circuit(`const k=c('CONST',{width:${width},value:'${value}'}),out=c('OUT',{name:'result',width:${width}});w(k,'o',out,'i');`);
  const code=a.run('generateSchVhdl(sch).code');assert.ok(code.includes('<= '+expected+';'));compile(code);
 }
});
test('wide gate replicates a scalar enable, compiles and simulates byte masking',()=>{
 const a=circuit(`const x=c('IN',{name:'data_in',width:8}),en=c('IN',{name:'en',width:1}),g=c('AND',{inputs:2,width:8}),o=c('OUT',{name:'result',width:8});w(x,'o',g,'i0');w(en,'o',g,'i1');w(g,'o',o,'i');`);
 const code=a.run('generateSchVhdl(sch).code');assert.match(code,/std_logic_vector'\(7 downto 0 => en\)/);
 compile(code,'tb',`library ieee; use ieee.std_logic_1164.all;
 entity tb is end; architecture sim of tb is signal en:std_logic:='0'; signal y:std_logic_vector(7 downto 0); begin
 u:entity work.top port map(data_in=>x"A5",en=>en,result=>y);
 process begin wait for 1 ns; assert y=x"00" severity failure; en<='1';wait for 1 ns; assert y=x"A5" severity failure;wait;end process; end;`);
});
test('unconnected wide gate has typed zero operands',()=>{
 const a=circuit(`const g=c('OR',{inputs:2,width:8}),o=c('OUT',{name:'result',width:8});w(g,'o',o,'i');`);compile(a.run('generateSchVhdl(sch).code'));
});
test('Bus Tap splits a range with correct vector type and one bit as a scalar',()=>{
 const a=circuit(`const x=c('IN',{name:'data_in',width:8}),t=c('BUSTAP',{bit:4,nbit:4,mode:'split',dir:'right'}),o=c('OUT',{name:'result',width:4});w(x,'o',t,'d');w(t,'y',o,'i');`);
 let code=a.run('generateSchVhdl(sch).code');assert.match(code,/data_in\(7 downto 4\)/);compile(code);
 a.run(`t.params.nbit=1;o.params.width=1`);code=a.run('generateSchVhdl(sch).code');assert.match(code,/data_in\(4\)/);compile(code);
});
test('merge taps assemble a bus feeding a gate without an OUTPUT marker on the bus',()=>{
 const a=circuit(`const lo=c('IN',{name:'lo',width:4}),hi=c('IN',{name:'hi',width:4}),j=c('JUNCTION',{}),l=c('BUSTAP',{bit:0,nbit:4,mode:'merge',dir:'right'}),h=c('BUSTAP',{bit:4,nbit:4,mode:'merge',dir:'right'}),g=c('NOT',{inputs:1,width:8}),o=c('OUT',{name:'result',width:8});w(lo,'o',l,'y');w(hi,'o',h,'y');w(j,'j',l,'d');w(j,'j',h,'d');w(j,'j',g,'i0');w(g,'o',o,'i');`);
 const code=a.run('generateSchVhdl(sch).code');assert.match(code,/signal bus_s : STD_LOGIC_VECTOR\(7 downto 0\)/i);compile(code);
 const repeat=a.run('generateSchVhdl(sch).code');assert.equal(repeat,code);
 a.run(`sch.components=sch.components.filter(c=>c!==l&&c!==h);sch.wires=sch.wires.filter(w=>w.from.cid!==l.id&&w.to.cid!==l.id&&w.from.cid!==h.id&&w.to.cid!==h.id);`);
 assert.doesNotMatch(a.run('generateSchVhdl(sch).code'),/signal bus_s/);
});
test('a bus slice from CONST produces valid VHDL',()=>{
 const a=circuit(`const x=c('CONST',{value:'F4',width:8}),t=c('BUSTAP',{bit:4,nbit:4,mode:'split',dir:'right'}),o=c('OUT',{name:'result',width:4});w(x,'o',t,'d');w(t,'y',o,'i');`);compile(a.run('generateSchVhdl(sch).code'));
});
for(const kind of ['DFF','JKFF','TFF','SRFF'])test(kind+' handles GND and asserted async controls; no literal in process list',()=>{
 const a=circuit(`const clk=c('IN',{name:'clk',width:1}),v=c('VCC'),gnd=c('GND'),f=c('${kind}',{edge:'rising',reset:true,preset:false},'reg'),q=c('OUT',{name:'result',width:1});w(clk,'o',f,'clk');w(gnd,'o',f,'rst');w(f,'q',q,'i');for(const p of getPorts(f).filter(p=>p.dir==='in'&&!['clk','rst','pre'].includes(p.id)))w(v,'o',f,p.id);`);
 let code=a.run('generateSchVhdl(sch).code');assert.doesNotMatch(code,/process\([^)]*'[01]'/i);compile(code);
 a.run(`sch.wires.find(w=>w.to.pid==='rst').from.cid=v.id;`);
 code=a.run('generateSchVhdl(sch).code');assert.doesNotMatch(code,/process\(/i);assert.match(code,/reg_q <= '0'/);compile(code);
});
test('VCC preset preserves a dynamic reset with higher priority',()=>{
 const a=circuit(`const reset=c('IN',{name:'reset',width:1}),v=c('VCC'),f=c('DFF',{edge:'rising',reset:true,preset:true},'reg'),o=c('OUT',{name:'result',width:1});w(reset,'o',f,'rst');w(v,'o',f,'pre');w(f,'q',o,'i');`);
 const code=a.run('generateSchVhdl(sch).code');assert.match(code,/'0' when reset = '1' else '1'/);compile(code);
});
test('JK tie-offs survive copying only the flip-flop',()=>{
 const a=circuit(`const v=c('VCC'),f=c('JKFF',{edge:'rising',reset:false,preset:false});w(v,'o',f,'j');w(v,'o',f,'k');state.selection=new Set([f.id]);copySelection();pasteClipboard();`);
 assert.equal(a.run('activeSch().components.filter(c=>c.type==="VCC").length'),3);
 const copy=a.json('activeSch().components.filter(c=>c.type==="JKFF")[1]');
 assert.equal(a.run(`activeSch().wires.filter(w=>w.to.cid==='${copy.id}').length`),2);
});
test('imported nested design compiles all referenced entities',()=>{
 const a=loadApp(); a.ctx.fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/import-v1.schproj.json')));
 a.run('importProjectData(fixture.project,{mode:"new"})');
 const all=a.json('generateAllVhdl()');compile(Object.values(all).map(r=>typeof r==='string'?r:r.code).join('\n'));
});
