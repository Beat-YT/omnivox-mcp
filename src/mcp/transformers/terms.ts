import { getPage } from "../../omnivox-api/puppet/index";

export async function transformTerms(termIds: string[]) {
    const page = await getPage();

    const formatted: Record<string, string> = await page.evaluate((ids: string[]) => {
        const result: Record<string, string> = {};
        for (const id of ids) {
            result[id] = (window as any).Skytech.Commun.Utils.Chaines.FormatAnSession(id);
        }
        return result;
    }, termIds);

    return termIds.map(id => ({
        id,
        name: formatted[id] || id,
    }));
}
