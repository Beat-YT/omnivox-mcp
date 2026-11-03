/**
 * Thrown by postJson() when the Omnivox session is gone: the app logged the
 * session out (DefaultPage cleared) or the page no longer carries the mobile
 * runtime, which is what the login page looks like. The message is written
 * for the model to relay.
 */
export class OmnivoxSessionExpiredError extends Error {
    constructor() {
        super('The Omnivox session has expired or was logged out, so Omnivox cannot be queried. The student must log in again with the auth app and set the server up again with the new cookies.json and config.json (see the reset steps in the README), then restart the server.');
        this.name = 'OmnivoxSessionExpiredError';
    }
}
