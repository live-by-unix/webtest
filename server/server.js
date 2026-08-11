import express from 'express';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { analyzeWebsite, closeBrowser } from './analyzer.js';
import { validateUrl } from './urlValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

function openInChrome() {
    if (process.env.OPEN_BROWSER === '0') {
        return;
    }

    const launchUrl = `http://localhost:${PORT}/launch.html`;
    let command;

    if (process.platform === 'win32') {
        command = `start chrome "${launchUrl}"`;
    } else if (process.platform === 'darwin') {
        command = `open -a "Google Chrome" "${launchUrl}"`;
    } else {
        command = `google-chrome "${launchUrl}" || xdg-open "${launchUrl}"`;
    }

    exec(command, (error) => {
        if (error) {
            console.log(`Could not auto-open Chrome. Open ${launchUrl} manually.`);
            return;
        }
        console.log('Opening Webtest in Chrome...');
    });
}

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(express.static(rootDir));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', engine: 'puppeteer' });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const normalizedUrl = await validateUrl(req.body?.url);
        const results = await analyzeWebsite(normalizedUrl);
        res.json(results);
    } catch (error) {
        const message = error.message || 'Analysis failed';
        const statusCode = message.includes('not allowed') || message.includes('valid URL') ? 400 : 500;
        res.status(statusCode).json({ error: message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Webtest server running at http://localhost:${PORT}`);
    console.log('Opening in Chrome (or visit /launch.html manually).');
    openInChrome();
});

async function shutdown() {
    console.log('Shutting down...');
    server.close();
    await closeBrowser();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
