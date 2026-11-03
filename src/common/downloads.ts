import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { dataDir } from './dataDir';
import type { DownloadResult } from 'src/omnivox-api/puppet';

/** Streams a downloaded file into the data dir's downloads folder and returns its path. */
export async function saveDownload(file: DownloadResult, fallbackName: string): Promise<string> {
    const downloadsDir = path.join(dataDir, 'downloads');
    fs.mkdirSync(downloadsDir, { recursive: true });

    const name = path.basename(file.filename || fallbackName).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    const filePath = path.join(downloadsDir, name);
    await pipeline(file.body, fs.createWriteStream(filePath));

    return filePath;
}
