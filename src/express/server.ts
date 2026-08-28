import * as fs from 'fs';
import { InitializeAccessKey, ValidateAccessKey } from '../security/accessKey.js';
import express from 'express';
import mcpRouter from './mcpRouter.js';
import { requestLogger } from './logger.js';
import { dataDir } from '../common/dataDir.js';

const app = express();
app.set('etag', false);

app.use(requestLogger);

// important: call mcpRouter before ValidateAccessKey,
app.use(mcpRouter);

app.use(ValidateAccessKey);

// Auto-discover route files
fs.readdirSync('./src/express/routes').forEach(async (file) => {
    const route = await import(`./routes/${file}`);
    app.use(route.default);
});

export function StartExpressServer() {
    InitializeAccessKey();

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Data directory: ${dataDir}`);
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\nError: Port ${PORT} is already in use (EADDRINUSE). Is another instance running?\n`);
        } else {
            console.error(`Failed to start server: ${err.message}`);
        }
        process.exit(1);
    });
}
