import { omnivoxVer } from "@common/constants";
import { getPage, loadPageInFrame, makeSkytechRequest } from "../puppet";
import { MioSearch } from "@typings/Mio/Search";
import { HTTPResponse } from "puppeteer";

const SVC = '(window.Skytech.Service.SelectionIndividu.SelectionIndividu)';

// Wraps a Skytech proxy call (success/failed callbacks) into a Promise
function skytechCall(frame: any, method: string, ...args: any[]): Promise<any> {
    return frame.evaluate((svc: string, m: string, a: any[]) => {
        return new Promise((resolve, reject) => {
            const proxy = eval(svc);
            proxy[m](...a, (result: any) => resolve(result), (err: any) => reject(err));
        });
    }, SVC, method, args);
}

// this is 100% going to break and be a nightmare to maintain but it is what it is. fuckass omnivox web. i want APIS!!!
export async function GetCoursePeople(courseId: string) {
    const [courseCode, courseGroup] = courseId.split('.');
    const page = await getPage();

    const baseUrl = new URL(page.url()).origin;
    const userOid = await page.evaluate(() => {
        return (window as any).Skytech.Commun.Utils.LocalStorage.GetData("Login-OID", "");
    });

    if (!userOid) {
        throw new Error('User OID not found in page storage.');
    }

    const mioUrl = generateOmnivoxMessagingUrl({
        baseUrl: baseUrl,
        creatorId: userOid,
        appVersion: omnivoxVer
    });

    // Intercept the POST response to extract categories from embedded JS
    let resolveCategories: (data: any[]) => void;
    const categoriesPromise = new Promise<any[]>((resolve) => { resolveCategories = resolve; });

    const responseHandler = async (response: HTTPResponse) => {
        const url = response.url();
        if (response.request().method() !== 'POST') return;
        if (!url.includes('Commun.SelectionIndividu/Prive') || !url.includes('eModeRecherche')) return;
        try {
            const body = await response.text();
            const match = body.match(/var\s+categories\s*=\s*(\[[\s\S]*?\]);/);
            if (match) {
                resolveCategories(JSON.parse(match[1]));
            }
        } catch {}
    };
    page.on('response', responseHandler);

    const frame = await loadPageInFrame(mioUrl);

    // Click "One or many students or teachers from my classes" — triggers __doPostBack
    await frame.waitForSelector('#uListeCategorie_lnk0', { timeout: 10000 });
    await frame.evaluate(() => {
        (document.querySelector('#uListeCategorie_lnk0') as HTMLElement).click();
    });

    const categories = await categoriesPromise;
    page.off('response', responseHandler);

    // Find matching category (NoCours: "2434K5EM", NoGroupe: " gr.01011")
    const category = categories.find((c: any) =>
        c.NoCours === courseCode && c.NoGroupe.includes(courseGroup)
    );
    if (!category) {
        await page.evaluate(() => {
            document.querySelector('iframe[style*="-9999px"]')?.remove();
        });
        console.error('Available categories:', categories);
        throw new Error(`Course ${courseId} not found in categories`);
    }

    const id = await frame.evaluate(() => (window as any).IdRechercheIndividu);

    // Use Skytech proxy for all .asmx calls
    await skytechCall(frame, 'AjouterItemSelectionneTousEtudiants', id, category);
    await skytechCall(frame, 'Sauvegarder', id, id);

    // Get the real recipient data from the mobile API
    const recipients = await makeSkytechRequest<MioSearch.IndividuItem[]>(
        '/Mobl/Mio/ObtenirDestinatiaresWeb',
        { idRecherche: String(id) }
    );

    // Clean up iframe
    await page.evaluate(() => {
        document.querySelector('iframe[style*="-9999px"]')?.remove();
    });

    return recipients;
}

interface OmnivoxUrlOptions {
    baseUrl: string;
    creatorId: string;
    searchId?: number;
    hiddenFieldName?: string;
    isMobile?: number;
    appVersion?: string;
    nocache?: number;
}

function generateOmnivoxMessagingUrl(options: OmnivoxUrlOptions): string {
    const {
        baseUrl = '',
        creatorId = '',
        searchId = -1,
        hiddenFieldName = 'idChampHiddenRecherche',
        isMobile = 1,
        appVersion = '',
        nocache = Date.now()
    } = options;

    // Layer 3: The innermost URL (selection individu)
    const layer3Params = new URLSearchParams({
        eModeRecherche: 'MessagerieInterneOmnivox',
        OidCreateur: creatorId,
        IdRechercheIndividu: String(searchId),
        strChampHiddenRecherche: hiddenFieldName,
        isMobile: String(isMobile)
    });
    const layer3 = `/WebApplication/Commun.SelectionIndividu/Prive/?${layer3Params}`;

    // Layer 2: Authentification wrapper
    const layer2Params = new URLSearchParams({
        id: 'Commun.SelectionIndividu',
        lk: layer3
    });
    const layer2 = `/WebApplication/Authentification/Acces/Omnivox/?${layer2Params}`;

    // Layer 1: Intraflex wrapper
    const layer1Params = new URLSearchParams({
        UrlIntraflex: layer2,
        IndicateurAppNative: 'true',
        nocache: String(nocache)
    });
    const layer1 = `/Mobl/Login/AutoLoginIntraflex?${layer1Params}`;

    // Final URL: AutoLogin wrapper
    const finalParams = new URLSearchParams({
        UrlRetour: layer1,
        ForceSession: 'true',
        nocache: String(nocache),
        AppVersion: appVersion
    });

    return `${baseUrl}/Mobl/Login/AutoLogin?${finalParams}`;
}