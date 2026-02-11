import { omnivoxVer, deviceInfo } from '@common/constants';

export function buildUserAgent(IdAppareil, Code) {
    return `OVX InfoDevice=${deviceInfo} AppVer=${omnivoxVer} IdAppareil=${IdAppareil} Code=${Code}`
}