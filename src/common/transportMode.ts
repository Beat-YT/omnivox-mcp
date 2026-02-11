let httpMode = false;
let logMode = false;

export function setHttpMode(enabled: boolean) {
    httpMode = enabled;
}

export function isHttpMode() {
    return httpMode;
}

export function setLogMode(enabled: boolean) {
    logMode = enabled;
}

export function isLogMode() {
    return logMode;
}
