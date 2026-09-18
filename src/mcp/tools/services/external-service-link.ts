import { BuildServiceAutoLoginUrl } from "@api/AutoLoginWeb";
import { isServiceLinksEnabled, serviceCodeSchema } from "@common/externalServices";
import { isHttpMode } from "@common/transportMode";
import { createWebToken } from "src/security/omniWebToken";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    service: serviceCodeSchema,
});

const GUARDS = [
    'Instructions for the assistant:',
    '- Hand this link to the user who asked for this service, and only them. Do not open, fetch, scrape or screenshot it, and do not repeat it in summaries, notes or memory.',
    '- If the user did not explicitly ask for this service, do not send the link. Ask first.',
    '- The page may let the user take real account actions: register or withdraw from courses, change their schedule or program, edit their personal file, change security settings. Do not walk them through completing any of these or suggest doing so. Give the link and let them decide on the Omnivox page.',
    '- Do not use this link to work around a tool that refused or returned nothing.',
].join('\n');

mcpServer.registerTool('get-service-link',
    {
        title: 'Get Omnivox Service Link',
        description: 'Get a link that opens an Omnivox web-only service in the user\'s browser, already logged in. These services have no API here; the link is the only way to reach them. Give it to the user, never open or scrape it yourself. The link logs the browser into the user\'s full Omnivox portal session, so only hand it out when the user asked for that service. Expires after 15 minutes.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: false,
        },
    },
    async (args) => {
        if (!isServiceLinksEnabled()) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: 'Service links are currently disabled on this server. Service links are a security-sensitive feature that are disabled by default by the mcp server.'
                }],
            };
        }

        const code = args.service;
        console.warn(`[ServiceLink] "${code}" requested`);

        const serverBaseUrl = process.env.MCP_SERVER_URL;
        if (isHttpMode() && serverBaseUrl) {
            const token = createWebToken({ type: 'external-service', code });
            const url = `${serverBaseUrl}/link/service?token=${token}`;
            return {
                content: [{
                    type: 'text',
                    text: `Link for "${code}" (expires in 15 minutes): ${url}\nSensitive: opening it logs the browser into the user's full Omnivox account, not just this service. Share it with the user only, never post or forward it.\n\n${GUARDS}`,
                }],
            };
        }

        const { service, url } = await BuildServiceAutoLoginUrl(code);
        return {
            content: [{
                type: 'text',
                text: `Link for "${service.Texte}": ${url}\nSensitive: this URL carries a single-use login token and opens the user's full Omnivox account, not just this service. It must be opened once, soon, by the user only. Never post or forward it.\n\n${GUARDS}`,
            }],
        };
    }
);

