import * as fs from 'fs';
import { InitializeAccessKey, ValidateAccessKey } from '../security/accessKey.js';
import express from 'express';
import mcpRouter from './mcpRouter.js';

const app = express();
app.set('etag', false);


// important: call mcpRouter before ValidateAccessKey, 
app.use(mcpRouter);

app.use(ValidateAccessKey);

// Auto-discover route files
fs.readdirSync('./src/express/routes').forEach(async (file) => {
    console.warn(`Loading route: ${file}`);
    const route = await import(`./routes/${file}`);
    app.use(route.default);
});

export function StartExpressServer() {
    InitializeAccessKey();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.warn(`Server is running on port ${PORT}`);
    });
}
