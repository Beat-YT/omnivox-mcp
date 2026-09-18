import { z } from "zod";

// Documented manifest Ids of web-only services (docs/services.md). Any other manifest Id
// is accepted as a raw string and resolved against the live manifest.
export const serviceCodeSchema = z.union([
    z.literal('AENS').describe('Teachers directory (annuaire des enseignants)'),
    z.literal('API').describe('Book an appointment with an academic advisor (API)'),
    z.literal('SRAE').describe('Student Access Centre (services adaptés): accommodations and support'),
    z.literal('ACAE').describe('Locker rental (casiers)'),
    z.literal('COVE').describe('Carpooling board (covoiturage)'),
    z.literal('IMPR').describe('Printing credits balance and top-up'),
    z.literal('TSCL_EXECUTION').describe('Language classification test (classement en langue)'),
    z.literal('CGPE').describe('Program change request (changement de programme)'),
    z.literal('REPR').describe('Repères, career and webfolio portal'),
    z.literal('Cnfq').describe('Attendance validation (fréquentation scolaire / recensement)'),
    z.literal('Insc').describe('Course registration (inscription), only active during registration windows'),
    z.literal('Mdhr').describe('Course schedule modification (modification d\'horaire)'),
    z.literal('GrilleCheminement').describe('Program progression chart (grille de cheminement)'),
    z.literal('Notb').describe('Grades transcript (bulletin d\'études collégiales)'),
    z.literal('ConsultationHoraireLocaux').describe('Room availability lookup (locaux)'),
    z.literal('SondagesVotes').describe('Surveys and votes (sondages et votes)'),
    z.literal('DesinscriptionsAbandons').describe('Course withdrawals and drops (désinscriptions et abandons)'),
    z.literal('DemandeCarteTarifReduit').describe('Reduced-fare transit card request (carte OPUS à tarif réduit)'),
    z.literal('ChoixCours').describe('Course selection for next term (choix de cours)'),
    z.string().describe('Any other service Id from the Omnivox service manifest'),
]).describe('Omnivox web-only service to open.');

export function isServiceLinksEnabled() {
    return process.env.ENABLE_EXTERNAL_SERVICE_LINKS === 'true' || process.env.ENABLE_EXTERNAL_SERVICE_LINKS === '1';
}

export function assertServiceAllowed(code: string) {
    if (!isServiceLinksEnabled()) {
        throw new Error('External service links are disabled on this server (ENABLE_EXTERNAL_SERVICE_LINKS is not "true").');
    }
}
