import * as esbuild from 'esbuild';
import { readFile,writeFile,mkdir,cp,rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.resolve(root,'dist');
// The only recursive removal is this repository's generated build directory.
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw new Error('Invalid build directory.');
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'assets'),{recursive:true});
await cp(path.join(root,'public'),dist,{recursive:true});
await mkdir(path.join(dist,'licenses'),{recursive:true});
for (const font of ['ibm-plex-sans','pixelify-sans']) {
  await cp(path.join(root,'node_modules','@fontsource',font,'LICENSE'),path.join(dist,'licenses',font+'-LICENSE.txt'));
}
const dev=process.argv.includes('--serve');
const html=(await readFile(path.join(root,'index.html'),'utf8')).replace('src="/src/main.ts"','src="./assets/game.js"').replace('href="/favicon.svg"','href="./favicon.svg"').replace('</head>','<link rel="stylesheet" href="./assets/game.css"></head>').replace('</body>',dev?'<script>new EventSource("/esbuild").addEventListener("change",()=>location.reload())</script></body>':'</body>');
await writeFile(path.join(dist,'index.html'),html);
const options={absWorkingDir:root,entryPoints:['src/main.ts'],bundle:true,outfile:'dist/assets/game.js',format:'esm',target:'es2022',minify:!dev,sourcemap:dev,loader:{'.woff':'file','.woff2':'file'},assetNames:'fonts/[name]-[hash]',logLevel:'info'};
if(dev){const ctx=await esbuild.context(options);await ctx.watch();const server=await ctx.serve({servedir:dist,host:'127.0.0.1',port:5173});console.log(`Waterloo Engineering Life: http://127.0.0.1:${server.port}/`);const stop=async()=>{await ctx.dispose();process.exit(0);};process.on('SIGINT',stop);process.on('SIGTERM',stop);}
else await esbuild.build(options);
