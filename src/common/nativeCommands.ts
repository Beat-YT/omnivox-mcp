// Re-export from shared (single source of truth for both MCP server and Electron app)
import { createRequire } from 'module';
// @ts-ignore
const require = createRequire(import.meta.url);
const shared = require('../../shared/nativeCommands.cjs');
export const { staticResponses, nullCallbackCommands, silentCommands, generateFcmToken } = shared;
