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
        }
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
        }
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
        }
    }
]

function getRandomDevice() {
    const randomIndex = Math.floor(Math.random() * devicesAvailable.length);
    return devicesAvailable[randomIndex];
}

module.exports = { getRandomDevice };