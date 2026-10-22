import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeSync } from 'node:fs'
import { deflateRawSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Explicit allowlist: no Studio history, attachments, credentials, dependencies,
// build output, app/account connection metadata, or recursive copies of the ZIP.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const output=resolve(root,'public/downloads/sonic-project.zip')
const roots=['src','public/art','public/audio','public/favicon.svg','scripts','README.md','index.html','package.json','pnpm-lock.yaml','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','.gitignore','.oxlintrc.json']
const files=[]
function collect(path){const full=resolve(root,path),stat=lstatSync(full);if(stat.isSymbolicLink())throw Error('Refusing symbolic link: '+path);if(stat.isDirectory()){for(const name of readdirSync(full).sort()){if(name.startsWith('.')||name.endsWith('.log'))continue;collect(path+'/'+name)}}else if(stat.isFile())files.push(path)}
for(const path of roots)if(existsSync(resolve(root,path)))collect(path)
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0})
const crc32=data=>{let crc=0xffffffff;for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0}
mkdirSync(dirname(output),{recursive:true})
const temp=output+'.tmp',fd=openSync(temp,'w'),central=[];let offset=0
function write(data){let n=0;while(n<data.length)n+=writeSync(fd,data,n,data.length-n);offset+=data.length}
try{
 for(const path of files){
  const raw=readFileSync(resolve(root,path)),packed=deflateRawSync(raw,{level:6}),method=packed.length<raw.length?8:0,data=method?packed:raw
  const name=Buffer.from('sonic-project/'+path),crc=crc32(raw),start=offset,header=Buffer.alloc(30)
  header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(method,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(raw.length,22);header.writeUInt16LE(name.length,26)
  write(header);write(name);write(data)
  const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x800,8);record.writeUInt16LE(method,10);record.writeUInt16LE(33,14);record.writeUInt32LE(crc,16);record.writeUInt32LE(data.length,20);record.writeUInt32LE(raw.length,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE(start,42);central.push(record,name)
 }
 const centralOffset=offset;for(const part of central)write(part)
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(offset-centralOffset,12);end.writeUInt32LE(centralOffset,16);write(end)
}finally{closeSync(fd)}
renameSync(temp,output)
console.log(`Project ZIP ready: ${files.length} files, ${(offset/1048576).toFixed(1)} MB`)
