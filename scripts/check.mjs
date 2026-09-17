import fs from 'node:fs';import {execFileSync} from 'node:child_process';
for(const file of fs.readdirSync('src').filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check','src/'+file]);
for(const file of ['forest','cavern','mangrove','summit'])if(!fs.existsSync(`assets/backgrounds/${file}.png`))throw Error(`Missing ${file}`);
console.log('All source modules parse; all four background assets are present.');
