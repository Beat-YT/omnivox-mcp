import * as fs from 'fs';
import * as path from 'path';

// Chrome leaves these behind when it is killed instead of closed.
// They are dangling symlinks, so fs.existsSync() reports false; rmSync removes the link itself.
const SINGLETON_FILES = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];

export function cleanupPreviousChrome(browserDataDir: string, pidFile: string) {
    try {
        killOrphanedChrome(pidFile, browserDataDir);

        for (const name of SINGLETON_FILES) {
            fs.rmSync(path.join(browserDataDir, name), { force: true });
        }
    } catch (err) {
        console.error('Error cleaning up previous Chrome instance:', err);
        console.error('Continuing without cleanup. This may cause issues if Chrome is already running.');
    }
}

function killOrphanedChrome(pidFile: string, browserDataDir: string) {
    if (!fs.existsSync(pidFile)) return;

    const pid = Number(fs.readFileSync(pidFile, 'utf-8').trim());
    fs.unlinkSync(pidFile);

    if (!pid || !isChromeUsingProfile(pid, browserDataDir)) return;

    console.warn(`[Puppet] Killing orphaned Chrome (pid ${pid}) from a previous run`);
    try {
        process.kill(pid, 'SIGKILL');
    } catch { }
}

// After a Docker restart the PID namespace is fresh, so the saved pid can belong to any process.
// On Linux, check the command line before killing. Other platforms keep the old behaviour.
function isChromeUsingProfile(pid: number, browserDataDir: string): boolean {
    if (process.platform !== 'linux') return true;

    try {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf-8');
        return cmdline.includes(browserDataDir);
    } catch {
        return false;
    }
}
