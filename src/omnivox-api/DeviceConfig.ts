import defaultDevice from '../../shared/defaultDevice.json' with { type: 'json' };

/** A device as the auth app writes it in session.json */
export type DeviceData = typeof defaultDevice;

/** The tablet the browser presents itself as. Configs written before devices were saved get the default one. */
export default class DeviceConfig {
    readonly data: DeviceData;

    constructor(data?: DeviceData) {
        if (data && !isDeviceData(data)) {
            console.warn(`[Config] The device in config.json is incomplete, using ${defaultDevice.name}`);
        }

        this.data = isDeviceData(data) ? data! : defaultDevice;
    }

    /** Answer to Application.DeviceStats */
    stats(chromeVersion: string) {
        const diskSpace = this.data.diskSpace;
        const freeSpace = randomFreeSpace(diskSpace);
        const [, , build, patch] = chromeVersion.split('.').map(Number);

        return {
            totalDiskSpace: diskSpace,
            freeDiskSpace: freeSpace,
            externalTotalDiskSpace: diskSpace,
            externalFreeDiskSpace: freeSpace,
            systemTotalDiskSpace: randomFreeSpace(freeSpace, 0.3),
            systemFreeDiskSpace: 0,
            webViewVersionName: chromeVersion,
            webViewVersionCode: build * 100000 + patch * 100 + 4,
        };
    }
}

function isDeviceData(data: any): boolean {
    return typeof data?.deviceInfo === 'string'
        && typeof data.device?.platform === 'string'
        && !!data.device.viewport
        && !!data.device.userAgentMetadata
        && !!data.deviceInfoMeta
        && typeof data.diskSpace === 'number';
}

function randomFreeSpace(max: number, maxRatio = 0.9): number {
    const low = Math.floor(max * 0.25);
    const high = Math.floor(max * maxRatio);
    return Math.floor(Math.random() * (high - low + 1)) + low;
}
