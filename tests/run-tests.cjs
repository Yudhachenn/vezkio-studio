const {execFileSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve(__dirname,'..');const out=path.join(dir,'.testbuild');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({type:'commonjs'}));
try{
  const local=path.join(dir,'node_modules','typescript','bin','tsc');const program=fs.existsSync(local)?process.execPath:'tsc';
  const args=fs.existsSync(local)?[local]:[];
  execFileSync(program,[...args,'--module','commonjs','--target','es2022','--moduleResolution','node','--strict','--skipLibCheck','--lib','es2022,dom','--outDir',out,
    path.join(dir,'src/lib/model.ts'),path.join(dir,'src/lib/creative.ts'),path.join(dir,'src/lib/motion.ts')],{stdio:'inherit'});
  execFileSync(process.execPath,[path.join(__dirname,'creative.test.cjs')],{stdio:'inherit',cwd:dir});
}catch(error){process.exitCode=1;console.error('Creative engine test failed:',error.message);}
