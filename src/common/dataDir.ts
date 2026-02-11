import * as path from 'path';
import * as os from 'os';

export const dataDir = process.env.OMNIVOX_DATA_DIR || path.join(os.homedir(), '.omnivox');
