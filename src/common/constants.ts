// Re-export from shared constants (single source of truth for both MCP server and Electron app)
import { createRequire } from 'module';
// @ts-ignore
const require = createRequire(import.meta.url);
const shared = require('../../shared/constants.cjs');
export const { omnivoxVer, deviceInfo, device } = shared;
