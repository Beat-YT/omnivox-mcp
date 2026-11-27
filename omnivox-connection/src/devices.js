const devicesAvailable = [
    {
        name: 'Samsung Galaxy Tab S8',
        deviceInfo: 'Android-14_samsung_SM-X700_Build/UP1A.231005.007',
        device: {
            viewport: {
                width: 1205,
                height: 753,
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
                isLandscape: true,
            },
            platform: 'Linux armv8l',
            userAgentMetadata: {
                platform: 'Android',
                platformVersion: '14',
                architecture: '',
                model: 'SM-X700',
                mobile: true,
            },
        },
        deviceInfoMeta: {
            Manufacturer: 'samsung',
            Model: 'SM-X700',
            OsVersion: '14',
            Device: 'gts8wifi',
            IsOsModified: false,
        },
        diskSpace: 111400001536,
    },
    {
        name: 'Samsung Galaxy Tab S9',
        deviceInfo: 'Android-14_samsung_SM-X710_Build/UP1A.231005.007',
        device: {
            viewport: {
                width: 1205,
                height: 753,
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
                isLandscape: true,
            },
            platform: 'Linux armv8l',
            userAgentMetadata: {
                platform: 'Android',
                platformVersion: '14',
                architecture: '',
                model: 'SM-X710',
                mobile: true,
            },
        },
        deviceInfoMeta: {
            Manufacturer: 'samsung',
            Model: 'SM-X710',
            OsVersion: '14',
            Device: 'gts9wifi',
            IsOsModified: false,
        },
        diskSpace: 111341993984,
    },
    {
        name: 'Samsung Galaxy Tab S12+',
        deviceInfo: 'Android-17_samsung_SM-X846B_Build/CP2A.260605.016',
        device: {
            viewport: {
                width: 1400,
                height: 876,
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
                isLandscape: true,
            },
            platform: 'Linux armv8l',
            userAgentMetadata: {
                platform: 'Android',
                platformVersion: '17',
                architecture: '',
                model: 'SM-X846B',
                mobile: true,
            },
        },
        deviceInfoMeta: {
            Manufacturer: 'samsung',
            Model: 'SM-X846B',
            OsVersion: '17',
            Device: 'gts12p',
            IsOsModified: false,
        },
        diskSpace: 239427649536,
    },
    {
        name: 'Samsung Galaxy Tab A11',
        deviceInfo: 'Android-16_samsung_SM-X135F_Build/BP2A.250605.031.A3',
        device: {
            viewport: {
                width: 1007,
                height: 601,
                deviceScaleFactor: 1.33125,
                isMobile: true,
                hasTouch: true,
                isLandscape: true,
            },
            platform: 'Linux armv8l',
            userAgentMetadata: {
                platform: 'Android',
                platformVersion: '16',
                architecture: '',
                model: 'SM-X135F',
                mobile: true,
            },
        },
        deviceInfoMeta: {
            Manufacturer: 'samsung',
            Model: 'SM-X135F',
            OsVersion: '16',
            Device: 'gta11',
            IsOsModified: false,
        },
        diskSpace: 48177856512,
    },
    {
        name: 'Google Pixel Tablet',
        deviceInfo: 'Android-14_google_Pixel Tablet_Build/AP1A.240405.002',
        device: {
            viewport: {
                width: 1280,
                height: 712,
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
                isLandscape: true,
            },
            platform: 'Linux armv8l',
            userAgentMetadata: {
                platform: 'Android',
                platformVersion: '14',
                architecture: '',
                model: 'Pixel Tablet',
                mobile: true,
            },
        },
        deviceInfoMeta: {
            Manufacturer: 'Google',
            Model: 'Pixel Tablet',
            OsVersion: '14',
            Device: 'tangorpro',
            IsOsModified: false,
        },
        diskSpace: 114487721984,
    }
]

function getRandomDevice() {
    const randomIndex = Math.floor(Math.random() * devicesAvailable.length);
    return devicesAvailable[randomIndex];
}

function getRandomFreeDiskSpace(maxDiskSpace, maxRatio = 0.9) {
    const realisticMin = Math.floor(maxDiskSpace * 0.25);
    const realisticMax = Math.floor(maxDiskSpace * maxRatio); // 90% of max disk space

    return Math.floor(Math.random() * (realisticMax - realisticMin + 1)) + realisticMin;
}

function getWebViewVersion() {
    const versionName = process.versions.chrome;
    const [, , build, patch] = versionName.split('.').map(Number);

    return {
        webViewVersionName: versionName,
        webViewVersionCode: build * 100000 + patch * 100 + 4,
    };
}

module.exports = { getRandomDevice, getRandomFreeDiskSpace, getWebViewVersion };