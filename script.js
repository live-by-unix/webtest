// Webtest - Hardware Requirements Analyzer
// Frontend: calls Puppeteer backend, device fallback if server unavailable

class WebtestAnalyzer {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || '/api/analyze';
        this.currentResults = null;
        this.currentUrl = null;
    }

    async analyzeUrl(url) {
        const trimmed = url.trim();
        if (!trimmed) {
            throw new Error('Please enter a valid URL');
        }

        this.currentUrl = trimmed;

        try {
            const results = await this.analyzeViaServer(trimmed);
            this.currentResults = results;
            return results;
        } catch (serverError) {
            console.warn('Server analysis failed, using device fallback:', serverError.message);
            const results = await this.analyzeViaDeviceFallback(trimmed, serverError.message);
            this.currentResults = results;
            return results;
        }
    }

    async analyzeViaServer(url) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server error (${response.status})`);
        }

        return data;
    }

    async analyzeViaDeviceFallback(url, serverError) {
        const metrics = await this.runDeviceBenchmarks();
        metrics.analysisMode = 'device-fallback';
        metrics.fallbackReason = serverError;

        const specs = this.inferDeviceSpecs(metrics);

        return {
            url,
            timestamp: new Date().toISOString(),
            analysisMode: 'device-fallback',
            metrics,
            specs
        };
    }

    async runDeviceBenchmarks() {
        const results = await Promise.all([
            this.measureCpuPerformance(),
            this.measureGpuPerformance(),
            this.measureMemoryUsage(),
            this.measureNetworkPerformance(),
            this.measureStorageRequirements()
        ]);

        return {
            cpu: results[0],
            gpu: results[1],
            memory: results[2],
            network: results[3],
            storage: results[4]
        };
    }

    async measureCpuPerformance() {
        const start = performance.now();
        const fib = (n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);

        for (let i = 0; i < 5; i++) {
            fib(35);
        }

        const duration = performance.now() - start;

        return {
            score: Math.round(10000 / duration),
            duration: Math.round(duration),
            operations: 175
        };
    }

    async measureGpuPerformance() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            return {
                score: 0,
                webglSupported: false,
                renderer: 'Not available',
                vendor: 'Not available'
            };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        const start = performance.now();

        for (let i = 0; i < 10; i++) {
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        const duration = performance.now() - start;
        const rendererLower = renderer.toLowerCase();

        return {
            score: Math.round(5000 / Math.max(duration, 1)),
            webglSupported: true,
            renderer,
            vendor,
            isIntegrated: rendererLower.includes('intel') ||
                rendererLower.includes('integrated') ||
                rendererLower.includes('hd graphics') ||
                rendererLower.includes('iris')
        };
    }

    async measureMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
                jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
                estimated: false
            };
        }

        const cores = navigator.hardwareConcurrency || 4;
        const estimatedRam = cores * 2;

        return {
            usedJSHeapSize: estimatedRam * 0.5,
            totalJSHeapSize: estimatedRam,
            jsHeapSizeLimit: estimatedRam * 2,
            estimated: true
        };
    }

    async measureNetworkPerformance() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection) {
            return {
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
        }

        return {
            effectiveType: '4g',
            downlink: 10,
            rtt: 100,
            saveData: false,
            estimated: true
        };
    }

    async measureStorageRequirements() {
        let storageUsed = 0;

        try {
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    storageUsed += localStorage[key].length * 2;
                }
            }
        } catch (error) {
            // localStorage might be disabled
        }

        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: Math.round(estimate.usage / 1048576),
                    quota: Math.round(estimate.quota / 1048576),
                    localStorage: Math.round(storageUsed / 1024)
                };
            } catch (error) {
                // Fall through
            }
        }

        return {
            used: Math.round(storageUsed / 1024),
            quota: 5000,
            localStorage: Math.round(storageUsed / 1024),
            estimated: true
        };
    }

    inferDeviceSpecs(metrics) {
        return {
            cpu: this.inferCpuSpec(metrics.cpu),
            gpu: this.inferGpuSpec(metrics.gpu),
            ram: this.inferRamSpec(metrics.memory),
            network: this.inferNetworkSpec(metrics.network),
            storage: this.inferStorageSpec(metrics.storage)
        };
    }

    inferCpuSpec(cpuMetrics) {
        const score = cpuMetrics.score;

        if (score >= 500) {
            return { minimum: 'Dual-core 1.5 GHz', recommended: 'Quad-core 2.0 GHz', confidence: 'medium' };
        }
        if (score >= 200) {
            return { minimum: 'Dual-core 1.0 GHz', recommended: 'Dual-core 1.5 GHz', confidence: 'low' };
        }
        return { minimum: 'Single-core 1.0 GHz', recommended: 'Dual-core 1.0 GHz', confidence: 'low' };
    }

    inferGpuSpec(gpuMetrics) {
        if (!gpuMetrics.webglSupported) {
            return {
                minimum: 'Any GPU with WebGL support',
                recommended: 'Discrete GPU with WebGL 2.0',
                integrated: false,
                confidence: 'low'
            };
        }

        const score = gpuMetrics.score;
        const isIntegrated = gpuMetrics.isIntegrated;

        if (score >= 300) {
            return {
                minimum: isIntegrated ? 'Integrated GPU (Intel HD 4000+)' : 'Discrete GPU (GTX 600 series)',
                recommended: 'Discrete GPU (GTX 900 series or equivalent)',
                integrated: isIntegrated,
                renderer: gpuMetrics.renderer,
                confidence: 'medium'
            };
        }
        if (score >= 100) {
            return {
                minimum: 'Integrated GPU (Intel HD 3000+)',
                recommended: 'Discrete GPU (GTX 600 series)',
                integrated: isIntegrated,
                renderer: gpuMetrics.renderer,
                confidence: 'low'
            };
        }

        return {
            minimum: 'Any GPU with WebGL support',
            recommended: 'Integrated GPU (Intel HD 3000+)',
            integrated: isIntegrated,
            renderer: gpuMetrics.renderer,
            confidence: 'low'
        };
    }

    inferRamSpec(memoryMetrics) {
        const usedGB = memoryMetrics.usedJSHeapSize / 1024;

        if (usedGB >= 4) {
            return { minimum: '8 GB RAM', recommended: '16 GB RAM', confidence: 'medium' };
        }
        if (usedGB >= 2) {
            return { minimum: '4 GB RAM', recommended: '8 GB RAM', confidence: 'low' };
        }
        return { minimum: '2 GB RAM', recommended: '4 GB RAM', confidence: 'low' };
    }

    inferNetworkSpec(networkMetrics) {
        const { effectiveType, downlink } = networkMetrics;

        if (effectiveType === '4g' && downlink >= 10) {
            return {
                minimum: '10 Mbps connection',
                recommended: '25 Mbps connection',
                type: '4G / Broadband',
                confidence: 'medium'
            };
        }
        if (effectiveType === '3g' || downlink >= 1.5) {
            return {
                minimum: '1.5 Mbps connection',
                recommended: '10 Mbps connection',
                type: '3G / DSL',
                confidence: 'low'
            };
        }
        return {
            minimum: '0.5 Mbps connection',
            recommended: '1.5 Mbps connection',
            type: '2G / Basic',
            confidence: 'low'
        };
    }

    inferStorageSpec(storageMetrics) {
        const usedMB = storageMetrics.used;

        if (usedMB >= 1000) {
            return { minimum: '5 GB available storage', recommended: '10 GB available storage', confidence: 'medium' };
        }
        if (usedMB >= 100) {
            return { minimum: '1 GB available storage', recommended: '5 GB available storage', confidence: 'low' };
        }
        return { minimum: '500 MB available storage', recommended: '1 GB available storage', confidence: 'low' };
    }

    formatBytes(bytes) {
        if (bytes === null || bytes === undefined) {
            return 'Unknown';
        }
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1048576) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / 1048576).toFixed(2)} MB`;
    }

    exportToCsv() {
        if (!this.currentResults) {
            throw new Error('No results to export');
        }

        const { specs, analysisMode } = this.currentResults;
        const headers = ['Component', 'Minimum Requirement', 'Recommended', 'Confidence'];
        const rows = [
            ['Analysis Mode', analysisMode, '', ''],
            ['CPU', specs.cpu.minimum, specs.cpu.recommended, specs.cpu.confidence],
            ['GPU', specs.gpu.minimum, specs.gpu.recommended, specs.gpu.confidence],
            ['RAM', specs.ram.minimum, specs.ram.recommended, specs.ram.confidence],
            ['Network', specs.network.minimum, specs.network.recommended, specs.network.confidence],
            ['Storage', specs.storage.minimum, specs.storage.recommended, specs.storage.confidence]
        ];

        let csv = headers.join(',') + '\n';
        rows.forEach((row) => {
            csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
        });

        this.downloadFile(csv, 'webtest-results.csv', 'text/csv');
    }

    exportToJson() {
        if (!this.currentResults) {
            throw new Error('No results to export');
        }

        this.downloadFile(JSON.stringify(this.currentResults, null, 2), 'webtest-results.json', 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    const analyzer = new WebtestAnalyzer();
    const urlForm = document.getElementById('urlForm');
    const scanBtn = document.getElementById('scanBtn');
    const resultsSection = document.getElementById('resultsSection');
    const analysisBanner = document.getElementById('analysisBanner');
    const displayUrl = document.getElementById('displayUrl');
    const resultsBody = document.getElementById('resultsBody');
    const metricsDetails = document.getElementById('metricsDetails');
    const exportCsv = document.getElementById('exportCsv');
    const exportJson = document.getElementById('exportJson');
    const closeResults = document.getElementById('closeResults');
    const isAppWindow = new URLSearchParams(window.location.search).get('window') === '1';

    if (isAppWindow) {
        closeResults.textContent = 'Close window';
        document.title = 'Webtest - App Window';
    }

    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        scanBtn.classList.add('loading');
        scanBtn.disabled = true;
        resultsSection.style.display = 'none';

        try {
            displayResults(await analyzer.analyzeUrl(url));
        } catch (error) {
            alert(error.message);
        } finally {
            scanBtn.classList.remove('loading');
            scanBtn.disabled = false;
        }
    });

    function displayResults(results) {
        displayUrl.textContent = results.url;
        displayAnalysisBanner(results);
        displaySpecsTable(results.specs);
        displayMetrics(results);
        resultsSection.style.display = 'block';
    }

    function displayAnalysisBanner(results) {
        let bannerClass = 'banner-success';
        let message = '';

        if (results.analysisMode === 'puppeteer') {
            message = 'Analyzed the target website using headless Chrome (Puppeteer).';
        } else {
            bannerClass = 'banner-warning';
            message = `Server analysis unavailable (${results.metrics.fallbackReason}). Showing device benchmark fallback — results reflect your browser, not the site.`;
        }

        analysisBanner.className = `analysis-banner ${bannerClass}`;
        analysisBanner.textContent = message;
        analysisBanner.style.display = 'block';
    }

    function displaySpecsTable(specs) {
        resultsBody.innerHTML = `
            <tr>
                <td><strong>CPU</strong></td>
                <td>${escapeHtml(specs.cpu.minimum)}</td>
                <td class="confidence-${specs.cpu.confidence}">${escapeHtml(specs.cpu.confidence)}</td>
            </tr>
            <tr>
                <td><strong>GPU</strong></td>
                <td>${escapeHtml(specs.gpu.minimum)}${specs.gpu.renderer ? ` (${escapeHtml(specs.gpu.renderer)})` : ''}</td>
                <td class="confidence-${specs.gpu.confidence}">${escapeHtml(specs.gpu.confidence)}</td>
            </tr>
            <tr>
                <td><strong>RAM</strong></td>
                <td>${escapeHtml(specs.ram.minimum)}</td>
                <td class="confidence-${specs.ram.confidence}">${escapeHtml(specs.ram.confidence)}</td>
            </tr>
            <tr>
                <td><strong>Network</strong></td>
                <td>${escapeHtml(specs.network.minimum)} (${escapeHtml(specs.network.type)})</td>
                <td class="confidence-${specs.network.confidence}">${escapeHtml(specs.network.confidence)}</td>
            </tr>
            <tr>
                <td><strong>Storage</strong></td>
                <td>${escapeHtml(specs.storage.minimum)}</td>
                <td class="confidence-${specs.storage.confidence}">${escapeHtml(specs.storage.confidence)}</td>
            </tr>
        `;
    }

    function displayMetrics(results) {
        if (results.analysisMode === 'device-fallback') {
            const metrics = results.metrics;
            metricsDetails.innerHTML = `
                <div class="metric-item">
                    <div class="metric-label">CPU Score</div>
                    <div class="metric-value">${metrics.cpu.score}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">GPU Score</div>
                    <div class="metric-value">${metrics.gpu.score}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Memory Used</div>
                    <div class="metric-value">${metrics.memory.usedJSHeapSize} MB</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Network Type</div>
                    <div class="metric-value">${escapeHtml(metrics.network.effectiveType)}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Storage Used</div>
                    <div class="metric-value">${metrics.storage.used} MB</div>
                </div>
            `;
            return;
        }

        const site = results.metrics.site;
        metricsDetails.innerHTML = `
            <div class="metric-item">
                <div class="metric-label">Load Time</div>
                <div class="metric-value">${site.loadTimeMs !== null ? `${site.loadTimeMs} ms` : 'Unknown'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">DOM Content Loaded</div>
                <div class="metric-value">${site.domContentLoadedMs !== null ? `${site.domContentLoadedMs} ms` : 'Unknown'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Time to First Byte</div>
                <div class="metric-value">${site.ttfbMs !== null ? `${site.ttfbMs} ms` : 'Unknown'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Total Transfer Size</div>
                <div class="metric-value">${analyzer.formatBytes(site.totalBytes)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Resources Loaded</div>
                <div class="metric-value">${site.resourceCount}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Scripts / Images</div>
                <div class="metric-value">${site.scriptCount} / ${site.imageCount}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">HTTP Status</div>
                <div class="metric-value">${site.statusCode ?? 'Unknown'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Analysis Engine</div>
                <div class="metric-value">${escapeHtml(site.analysisEngine)}</div>
            </div>
        `;
    }

    exportCsv.addEventListener('click', () => {
        try {
            analyzer.exportToCsv();
        } catch (error) {
            alert(error.message);
        }
    });

    exportJson.addEventListener('click', () => {
        try {
            analyzer.exportToJson();
        } catch (error) {
            alert(error.message);
        }
    });

    closeResults.addEventListener('click', () => {
        if (isAppWindow) {
            window.close();
            return;
        }

        resultsSection.style.display = 'none';
        analysisBanner.style.display = 'none';
    });
});
