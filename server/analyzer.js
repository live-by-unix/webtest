import puppeteer from 'puppeteer';
import { inferSpecs } from './specInference.js';

const ANALYSIS_TIMEOUT_MS = 30000;
let browserPromise = null;

async function getBrowser() {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
    }
    return browserPromise;
}

function collectPageMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');

    let totalBytes = 0;
    let scriptCount = 0;
    let imageCount = 0;
    let stylesheetCount = 0;

    for (const resource of resources) {
        totalBytes += resource.transferSize || 0;

        if (resource.initiatorType === 'script') {
            scriptCount += 1;
        } else if (resource.initiatorType === 'img') {
            imageCount += 1;
        } else if (resource.initiatorType === 'link' || resource.name.endsWith('.css')) {
            stylesheetCount += 1;
        }
    }

    return {
        loadTimeMs: navigation ? Math.round(navigation.loadEventEnd - navigation.startTime) : null,
        domContentLoadedMs: navigation
            ? Math.round(navigation.domContentLoadedEventEnd - navigation.startTime)
            : null,
        ttfbMs: navigation ? Math.round(navigation.responseStart - navigation.startTime) : null,
        totalBytes,
        resourceCount: resources.length,
        scriptCount,
        imageCount,
        stylesheetCount
    };
}

export async function analyzeWebsite(url) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    const wallClockStart = Date.now();

    try {
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Webtest/1.0'
        );

        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: ANALYSIS_TIMEOUT_MS
        });

        const pageMetrics = await page.evaluate(collectPageMetrics);
        const wallClockMs = Date.now() - wallClockStart;
        const statusCode = response ? response.status() : null;
        const finalUrl = page.url();

        const site = {
            ...pageMetrics,
            wallClockMs,
            statusCode,
            finalUrl,
            loadSuccess: Boolean(response && response.ok()),
            analysisEngine: 'puppeteer'
        };

        if (site.loadTimeMs !== null && site.loadTimeMs <= 0) {
            site.loadTimeMs = wallClockMs;
        }

        const specs = inferSpecs(site);

        return {
            url,
            timestamp: new Date().toISOString(),
            analysisMode: 'puppeteer',
            metrics: { site },
            specs
        };
    } finally {
        await page.close();
    }
}

export async function closeBrowser() {
    if (browserPromise) {
        const browser = await browserPromise;
        await browser.close();
        browserPromise = null;
    }
}
