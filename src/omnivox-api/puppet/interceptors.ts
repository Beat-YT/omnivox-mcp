import { Page } from "puppeteer";
import { KnownDevices } from "puppeteer-core";

export async function setupPageInterceptors(page: Page) {
    await page.setRequestInterception(true);

    page.on("request", req => {
        const requestUrl = req.url();
        const lowerUrl = requestUrl.toLowerCase();
        if (lowerUrl.includes("savelogjs") || lowerUrl.includes("omnigarder")) {
            req.respond({
                status: 200,
                contentType: "application/json; charset=utf-8",
                body: JSON.stringify('OK')
            });
        } else {
            const headers = req.headers();
            if (headers['x-ovx-download']) {
                const stripped = Object.fromEntries(
                    Object.entries(headers).filter(([k]) =>
                        !['x-ovx-download', 'x-requested-with', 'x-user-agent-ovx', 'origin'].includes(k)
                    )
                );
                req.continue({
                    headers: {
                        ...stripped,
                        'sec-fetch-dest': 'document',
                        'sec-fetch-mode': 'navigate',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-user': '?1',
                    }
                });
            } else {
                req.continue();
            }
        }
    });




}