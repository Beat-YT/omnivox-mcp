import { getPage } from "../puppet/index";
import { getConfig } from "../config";
import { GetTokenRedirection } from "./Login";
import { ServiceMenuItem } from "@typings/OffreService";

async function GetServiceMenuItems(): Promise<ServiceMenuItem[]> {
    const page = await getPage();
    return page.evaluate(() => (window as any).Skytech.Commun.Application.GetOffreServices() || []);
}

async function FindService(idOrCode: string): Promise<ServiceMenuItem> {
    const items = await GetServiceMenuItems();
    const needle = idOrCode.toLowerCase();

    const byId = items.find(s => s.Id.toLowerCase() === needle);
    if (byId) return byId;

    const byCode = items.filter(s => s.CodeModule.toLowerCase() === needle);
    if (byCode.length === 1) return byCode[0];
    if (byCode.length > 1) {
        throw new Error(`Service code "${idOrCode}" matches several modules: ${byCode.map(s => s.Id).join(', ')}. Use the Id instead.`);
    }

    throw new Error(`Unknown service "${idOrCode}". Not present in this user's service manifest.`);
}

async function BuildIntraflexAutoLoginUrl(intranetPath: string | null, withToken = true): Promise<string> {
    const page = await getPage();
    const relative = await page.evaluate(
        (p: string | null) => (window as any).Skytech.Commun.Module.LoginWorker.CreerLienPreAuthentifierIntraflex(p),
        intranetPath,
    );
    return finalize(relative, withToken);
}

export async function BuildCvirAutoLoginUrl(cvirPath: string, anSession?: string, withToken = true): Promise<string> {
    const page = await getPage();
    const relative = await page.evaluate(
        (p: string, a?: string) => (window as any).Skytech.Commun.Module.LoginWorker.CreerLienPreAuthentifierCvir(p, a),
        cvirPath,
        anSession,
    );
    return finalize(relative, withToken);
}

export async function BuildServiceAutoLoginUrl(idOrCode: string, withToken = true) {
    const service = await FindService(idOrCode);

    if (!service.UrlService && service.EstModuleMobile) {
        throw new Error(`Service "${service.Id}" (${service.Texte}) has no web page; it only exists as a native module.`);
    }
    if (service.UrlService && /^[a-zA-Z]+:\/\//.test(service.UrlService) && !/^https?:\/\//.test(service.UrlService)) {
        throw new Error(`Service "${service.Id}" opens an external app (${service.UrlService}), not a web page.`);
    }
    if (!service.EstActif) {
        throw new Error(`Service "${service.Id}" (${service.Texte}) is currently inactive.`);
    }
    if (service.EstBloque) {
        throw new Error(`Service "${service.Id}" (${service.Texte}) is blocked for this user${service.RaisonBloque ? `: ${service.RaisonBloque}` : ''}.`);
    }

    const url = await BuildIntraflexAutoLoginUrl(service.UrlService, withToken);
    return { service, url };
}

export async function BuildAssignmentSubmitUrl(courseId: string, assignmentId: string, term: string): Promise<string> {
    const [noCours, noGroupe] = courseId.split('.');
    const depotQs = new URLSearchParams({
        idTravail: assignmentId,
        NoCours: noCours,
        NoGroupe: noGroupe,
        AnSes: term,
        nocache: String(Date.now()),
    });
    return BuildCvirAutoLoginUrl(`/cvir/dtrv/DepotTravail.aspx?${depotQs}`);
}

async function finalize(relativeUrl: string, withToken: boolean): Promise<string> {
    const origin = new URL(getConfig().DefaultPage).origin;
    let url = relativeUrl.startsWith('http') ? relativeUrl : origin + relativeUrl;
    if (withToken) {
        const { TokenRedirection } = await GetTokenRedirection();
        url += `&TokenRedirection=${encodeURIComponent(TokenRedirection)}`;
    }
    return url;
}
