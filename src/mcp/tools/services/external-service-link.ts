import { BuildServiceAutoLoginUrl } from "@api/AutoLoginWeb";
import { isServiceLinksEnabled, serviceCodeSchema } from "@common/externalServices";
import { isHttpMode } from "@common/transportMode";
import { createWebToken } from "src/security/omniWebToken";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    service: serviceCodeSchema,
});

const NOTES = [
    'Notes for the assistant:',
    '- This link opens the page already logged into the user\'s Omnivox account. You may open it yourself with browser tools to read the page for the user, hand it to the user, or both.',
    '- Treat it like a password: share it only with the user, and do not paste it into summaries, notes or memory.',
    '- Reading is fine. Taking an action on the page (registering or withdrawing from a course, changing a schedule or program, editing the personal file, changing security settings, submitting any form) needs the user\'s explicit authorization for that specific action, given beforehand or in the moment. Do not act on a general "handle it" or on your own initiative.',
    '- Do not use this link as a workaround for a tool that refused or returned nothing.',
].join('\n');

mcpServer.registerTool('get-service-link',
    {
        title: 'Get Omnivox Service Link',
        description: 'Get a pre-authenticated link to an Omnivox web-only service (lockers, transcript, progression chart, advisor appointments, ...). These services have no API here, so the link is how to reach them. Open it yourself to read the page for the user, or give it to the user. Any action on the page needs the user\'s explicit authorization for that specific action. It logs the browser into the user\'s full Omnivox account, so treat it like a password. Expires after 15 minutes.',
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
                    text: 'Service links are disabled on this server. They are off by default because each link logs into the full Omnivox account. The server owner can enable them at their own risk with ENABLE_EXTERNAL_SERVICE_LINKS=true. Otherwise, point the user to Omnivox directly.'
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
                    text: `Link for "${code}" (expires in 15 minutes): ${url}\nThis logs the browser into the user's full Omnivox account. Treat it like a password.\n\n${NOTES}`,
                }],
            };
        }

        const { service, url } = await BuildServiceAutoLoginUrl(code);
        return {
            content: [{
                type: 'text',
                text: `Link for "${service.Texte}": ${url}\nSingle-use login token, open it once and soon. It logs the browser into the user's full Omnivox account, so treat it like a password.\n\n${NOTES}`,
            }],
        };
    }
);

