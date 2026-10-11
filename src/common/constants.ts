// Re-export from shared constants (single source of truth for both MCP server and Electron app)
import { createRequire } from 'module';
// @ts-ignore
const require = createRequire(import.meta.url);
const shared = require('../../shared/constants.cjs');
export const clientConfig: OmnivoxClientConfig = shared;
export const { omnivoxVer, deviceInfo, device } = clientConfig;

export interface DeviceViewport {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
}

export interface UserAgentMetadata {
    platform: string;
    platformVersion: string;
    architecture: string;
    model: string;
    mobile: boolean;
}

export interface DeviceConfig {
    viewport: DeviceViewport;
    platform: string;
    userAgentMetadata: UserAgentMetadata;
}

export interface OmnivoxClientConfig {
    omnivoxVer: `${number}.${number}.${number}`;
    deviceInfo: string;
    device: DeviceConfig;
}
