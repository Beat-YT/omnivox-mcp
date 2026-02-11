import * as fs from 'fs';
import * as path from 'path';

export default function InitializeMcpTools() {
    const dir = fs.readdirSync(path.join(process.cwd(), 'src', 'mcp', 'tools'), { recursive: true }) as string[];
    const validFiles = dir.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of validFiles) {
        import(`./tools/${file}`);
    }
}