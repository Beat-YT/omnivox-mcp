import { Page } from "puppeteer";

export async function setupPageInterceptors(page: Page) {
    await page.setRequestInterception(true);

    page.on("request", req => {
        const lowerUrl = req.url().toLowerCase();
        if (lowerUrl.includes("savelogjs") || lowerUrl.includes("omnigarder") || lowerUrl.includes("analytics")) {
            req.respond({
                status: 200,
                contentType: "application/json; charset=utf-8",
                body: JSON.stringify('OK')
            });
        } else {
            req.continue();
        }
    });
}
