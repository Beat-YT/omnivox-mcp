import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { dataDir } from '@common/dataDir';
import omnivoxApp from '../../shared/omnivoxApp.json' with { type: 'json' };
import DeviceConfig from './DeviceConfig';

const configPath = path.join(dataDir, 'config.json');
const sessionPath = path.join(dataDir, 'session.json');
const browserPath = path.join(dataDir, 'browser');

export class OmnivoxConfig {
    DefaultPage: string;
    Code: string;
    IdAppareil: string;
    Device: DeviceConfig;

    /** Cookies of a new session, until BrowserManager has put them in an empty profile */
    sessionCookies: any[] | null = null;

    constructor() {
        const session = readSession();
        if (session) {
            fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(configPath, JSON.stringify({ ...session.configuration, Device: session.device }, null, 2));
            this.sessionCookies = session.cookies;
        }

        if (!fs.existsSync(configPath)) {
            throw new Error(`No config.json in ${dataDir}. Log in with the auth app and place session.json there.`);
        }

        const file = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this.DefaultPage = decodeURIComponent(file.DefaultPage || '');
        this.Code = file.Code || '';
        this.IdAppareil = file.IdAppareil || crypto.randomBytes(20).toString('hex');
        this.Device = new DeviceConfig(file.Device);
    }

    get userAgent(): string {
        return `OVX InfoDevice=${this.Device.data.deviceInfo} AppVer=${omnivoxApp.version} IdAppareil=${this.IdAppareil} Code=${this.Code}`;
    }

    get appVersion(): string {
        return omnivoxApp.version;
    }

    update(changes: { DefaultPage?: string; Code?: string }) {
        Object.assign(this, changes);

        const file = { DefaultPage: this.DefaultPage, Code: this.Code, IdAppareil: this.IdAppareil, Device: this.Device.data };
        fs.writeFile(configPath, JSON.stringify(file, null, 2), (err) => {
            if (err) console.error('Error writing config.json:', err);
        });
    }

    /** session.json is one time only */
    sessionInstalled() {
        this.sessionCookies = null;
        fs.rmSync(sessionPath, { force: true });
    }
}

function readSession() {
    if (fs.existsSync(sessionPath)) return JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));

    // Last resort for hosts without a volume: OMNIVOX_SESSION (raw or base64 JSON), only when there is no browser profile
    const env = process.env.OMNIVOX_SESSION?.trim();
    if (!env || fs.existsSync(browserPath)) return null;

    return JSON.parse(env.startsWith('{') ? env : Buffer.from(env, 'base64').toString('utf-8'));
}

export const omnivoxConfig = new OmnivoxConfig();
