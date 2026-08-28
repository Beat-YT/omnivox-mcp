import * as path from 'path';
import { fileURLToPath } from 'url';

// Default: the gitignored data/ folder at the project root, independent of cwd.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const dataDir = process.env.OMNIVOX_DATA_DIR || path.join(projectRoot, 'data');
