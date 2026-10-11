import { ResponseEnvelope } from '@typings/ResponseEnvelope';
import { isRealInt, toDisplayDate } from '@common/transformHelpers';

type Envelope = Partial<ResponseEnvelope> & { CodeAcces?: string };

const naviguerMessages: Record<string, string> = {
    'ErrorPage.DocumentCollegeBlock': 'Omnivox is blocked until the student opens a mandatory college document in Omnivox (Mes documents). Tell the student to open it in Omnivox, then retry.',
    'ErrorPage.SondageVoteBlock': 'Omnivox is blocked until the student answers a mandatory survey or vote in Omnivox. Tell the student to answer it in Omnivox, then retry.',
    'ErrorPage.ModuleNonAccessible': 'This Omnivox module is not accessible for this account.',
};

export class OmnivoxMoblError extends Error {
    readonly payload: Envelope;

    constructor(payload: Envelope) {
        super(describe(payload));
        this.name = 'OmnivoxMoblError';
        this.payload = payload;
    }

    static isError(payload: unknown): payload is Envelope {
        if (!payload || typeof payload !== 'object') return false;
        const p = payload as Envelope;
        return !!p.NaviguerPage || p.IsPeriodeArret === true || p.IsAvailable === false;
    }
}

function describe(p: Envelope): string {
    const page = p.NaviguerPage?.split('?')[0];

    if (p.IsPeriodeArret || page === 'ErrorPage.PeriodeArret') {
        const back = isRealInt(p.DateRetourSysteme) ? toDisplayDate(p.DateRetourSysteme) : undefined;
        return back
            ? `Omnivox is in a maintenance window and is expected to be back at "${back}". Retry after that time.`
            : 'Omnivox is in a maintenance window. Please try again later.';
    }

    if (p.NaviguerPage) {
        return naviguerMessages[page!] ?? `Omnivox redirected to "${p.NaviguerPage}" instead of returning data. Depending on the error page, this may be a temporary issue, or a restriction on the account that the student must resolve in Omnivox.`;
    }

    return p.CodeAcces
        ? 'Omnivox reports this module as unavailable: it is protected by an access code that must be entered in the Omnivox app, it cannot be read through the API at this time.'
        : 'Omnivox reports this module as unavailable for this account right now, without giving a reason. It may be disabled by the college or temporarily restricted.';
}
