import { makeSkytechRequest } from "../puppet/index";
import { getConfig } from "../config";
import { omnivoxVer } from "@common/constants";

export interface TokenRedirectionResponse {
    TokenRedirection: string;
}

/**
 * Mints a single-use token that lets a plain browser (no OVX user-agent, no session cookies)
 * be logged into the web portal via /Mobl/Login/AutoLogin?TokenRedirection=...
 */
export function GetTokenRedirection() {
    return makeSkytechRequest<TokenRedirectionResponse>('/Mobl/Login/GetTokenRedirection', {});
}

/**
 * Builds the pre-authenticated URL the mobile app opens for "Remettre" on an assignment:
 *   /Mobl/Login/AutoLogin  ->  /Mobl/Login/AutoLoginCvir  ->  <college>-lea.omnivox.ca/cvir/dtrv/DepotTravail.aspx
 * A fresh TokenRedirection is fetched on every call — Omnivox treats them as single-use.
 */
export async function BuildAssignmentSubmitUrl(courseId: string, assignmentId: string, term: string): Promise<string> {
    const [noCours, noGroupe] = courseId.split('.');
    const origin = new URL(getConfig().DefaultPage).origin;
    const nocache = String(Date.now());

    const depotQs = new URLSearchParams({
        idTravail: assignmentId,
        NoCours: noCours,
        NoGroupe: noGroupe,
        AnSes: term,
        nocache,
    });
    const depotUrl = `/cvir/dtrv/DepotTravail.aspx?${depotQs}`;

    const cvirQs = new URLSearchParams({ UrlRetour: depotUrl, nocache });
    const cvirUrl = `/Mobl/Login/AutoLoginCvir?${cvirQs}`;

    const { TokenRedirection } = await GetTokenRedirection();

    const autoLoginQs = new URLSearchParams({
        UrlRetour: cvirUrl,
        ForceSession: 'true',
        nocache,
        AppVersion: omnivoxVer,
        TokenRedirection,
    });

    return `${origin}/Mobl/Login/AutoLogin?${autoLoginQs}`;
}
