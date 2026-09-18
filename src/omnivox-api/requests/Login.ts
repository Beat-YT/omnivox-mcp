import { makeSkytechRequest } from "../puppet/index";

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

