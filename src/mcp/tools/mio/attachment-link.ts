import { GetMioAttachment } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { isHttpMode } from "@common/transportMode";
import { messageIdSchema } from "@common/validation";
import { createWebToken } from "src/security/omniWebToken";
import { dataDir } from "@common/dataDir";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const input = z.object({
    message_id: messageIdSchema.describe('The MIO message ID'),
    attachment_id: z.string().describe('The attachment ID (IDFichierAttachement from read-mio-message)'),
});

mcpServer.registerTool('get-mio-attachment-link',
    {
        title: 'Get MIO Attachment',
        description: 'Fetch a MIO message attachment. In HTTP mode with MCP_SERVER_URL set, returns a browser link that expires after 15 minutes; otherwise saves the file locally and returns its path. Get attachment IDs from read-mio-message.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const serverBaseUrl = process.env.MCP_SERVER_URL;
        if (isHttpMode() && serverBaseUrl) {
            const token = createWebToken({
                type: 'mio-attachment',
                messageId: args.message_id,
                attachmentId: args.attachment_id,
            });

            const url = `${serverBaseUrl}/download/mio-attachment?token=${token}`;

            return {
                content: [{ type: 'text', text: `Download link (expires in 15 minutes): ${url}` }],
            };
        }

        // Save file to disk
        const response = await GetMioAttachment(args.message_id, args.attachment_id);

        const disposition = response.contentDisposition || '';
        const filenameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/);
        const filename = filenameMatch?.[1] || `${args.attachment_id}.bin`;

        const downloadsDir = path.join(dataDir, 'downloads');
        fs.mkdirSync(downloadsDir, { recursive: true });
        const filePath = path.join(downloadsDir, filename);
        fs.writeFileSync(filePath, response.data);

        return {
            content: [{ type: 'text', text: `File saved to: ${filePath}` }],
        };
    }
);
