import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { omnivoxVer, deviceInfo } from '@common/constants';
import { dataDir } from '@common/dataDir';

const configPath = path.join(dataDir, 'config.json');
const cookiePath = path.join(dataDir, 'cookies.json');
let config: OmnivoxConfig;

export interface OmnivoxConfig {
    DefaultPage: string;
    Code?: string;
    IdAppareil?: string;
}

/*
export function InitializeConfig() {
    if (configExists) {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configFile);
    } else {
        console.error('Configuration file config.json not found. Please make sure the mcp was set up correctly.');
        console.error('Expected config path (file not exist):', configPath);
        return process.exit(1);
    }

    if (!config.DefaultPage) {
        console.error('Configuration file is missing required fields. Please check omnivox-config.json.');
        console.error('Required fields: omnivoxBaseUrl');
        return process.exit(1);
    }

    if (!config.Code) {
        console.warn('Warning: Configuration file is missing optional field "Code". Some features may not work properly.');
    }

    if (!config.IdAppareil) {
        console.warn('Warning: Configuration file is missing optional field "IdAppareil". A new IdAppareil will be generated for this session.');
    }

    const defaultUrl = new URL(config.DefaultPage);
    client.defaults.baseURL = defaultUrl.origin;

    const IdAppareil = config.IdAppareil || crypto.randomBytes(20).toString("hex");
    const AuthHash = config.Code || '';
    const userAgent = `OVX InfoDevice=${deviceInfo} AppVer=${omnivoxVer} IdAppareil=${IdAppareil} Code=${AuthHash}`;

    client.defaults.headers['User-Agent'] = userAgent;
    client.defaults.headers['X-User-Agent-Ovx'] = userAgent;
    client.defaults.headers['Origin'] = defaultUrl.origin;
}*/

export function getElectronCookies(): any[] {
    if (!fs.existsSync(cookiePath)) {
        console.error('Cookie file not found. Please ensure you have logged in through the Electron app first.');
        console.error('Expected cookie path (file not exist):', cookiePath);
        throw new Error('Cookie file not found');
    }

    const cookieFile = fs.readFileSync(cookiePath, 'utf-8');
    const cookies = JSON.parse(cookieFile);
    return cookies;
}

export function getConfig(): OmnivoxConfig {
    if (config) return config;

    if (!fs.existsSync(configPath)) {
        console.error('Configuration file config.json not found. Please make sure the mcp was set up correctly.');
        console.error('Expected config path (file not exist):', configPath);
        throw new Error('Configuration file not found');
    }

    const configFile = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configFile);

    if (!config.DefaultPage) {
        console.error('Configuration file is missing required fields. Please check omnivox-config.json.');
        console.error('Required fields: omnivoxBaseUrl');
        throw new Error('Missing required configuration fields');
    }

    if (!config.Code) {
        console.warn('Warning: Configuration file is missing optional field "Code". Some features may not work properly.');
        config.Code = '';
    }

    if (!config.IdAppareil) {
        console.warn('Warning: Configuration file is missing optional field "IdAppareil". A new IdAppareil will be generated for this session.');
        config.IdAppareil = crypto.randomBytes(20).toString("hex");
    }

    return config;
}

export function updateConfig(updatedConfig: Partial<OmnivoxConfig>) {
    config = { ...config, ...updatedConfig };
    
    fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8', (err) => {
        if (err) {
            console.error('Error writing configuration file:', err);
        }
    });

    return config;
}