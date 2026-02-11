import fs from 'fs';
import path from 'path';
import os from 'os';

const dataDir = process.env.OMNIVOX_DATA_DIR || path.join(os.homedir(), '.omnivox');
const targets = ['browser', 'cookies.json', 'config.json'];

for (const target of targets) {
    const fp = path.join(dataDir, target);
    try {
        fs.rmSync(fp, { recursive: true, force: true });
        console.log('Deleted', fp);
    } catch {}
}

console.log('Session data cleared. Run the Electron app to re-authenticate.');
