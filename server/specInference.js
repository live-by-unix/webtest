export function inferSpecs(siteMetrics) {
    const loadTimeMs = siteMetrics.loadTimeMs || siteMetrics.wallClockMs || 3000;
    const pageSizeBytes = siteMetrics.totalBytes || 0;
    const confidence = siteMetrics.loadSuccess ? 'high' : 'medium';

    return {
        cpu: inferCpuSpec(loadTimeMs, pageSizeBytes, confidence),
        gpu: inferGpuSpec(loadTimeMs, pageSizeBytes, siteMetrics.scriptCount, confidence),
        ram: inferRamSpec(pageSizeBytes, siteMetrics.resourceCount, confidence),
        network: inferNetworkSpec(pageSizeBytes, loadTimeMs, confidence),
        storage: inferStorageSpec(pageSizeBytes, confidence)
    };
}

function inferCpuSpec(loadTimeMs, pageSizeBytes, confidence) {
    const pageSizeKB = pageSizeBytes / 1024;

    if (loadTimeMs >= 5000 || pageSizeKB >= 3000) {
        return {
            minimum: 'Quad-core 2.0 GHz',
            recommended: 'Quad-core 2.5 GHz or better',
            confidence
        };
    }
    if (loadTimeMs >= 2500 || pageSizeKB >= 1000) {
        return {
            minimum: 'Dual-core 1.5 GHz',
            recommended: 'Quad-core 2.0 GHz',
            confidence
        };
    }
    if (loadTimeMs >= 1000 || pageSizeKB >= 300) {
        return {
            minimum: 'Dual-core 1.0 GHz',
            recommended: 'Dual-core 1.5 GHz',
            confidence: confidence === 'high' ? 'medium' : 'low'
        };
    }

    return {
        minimum: 'Single-core 1.0 GHz',
        recommended: 'Dual-core 1.0 GHz',
        confidence: confidence === 'high' ? 'medium' : 'low'
    };
}

function inferGpuSpec(loadTimeMs, pageSizeBytes, scriptCount, confidence) {
    const pageSizeKB = pageSizeBytes / 1024;
    const isHeavy = loadTimeMs >= 3000 || pageSizeKB >= 1500 || scriptCount >= 40;

    if (isHeavy) {
        return {
            minimum: 'Discrete GPU (GTX 600 series or equivalent)',
            recommended: 'Discrete GPU (GTX 900 series or equivalent)',
            integrated: false,
            confidence
        };
    }
    if (loadTimeMs >= 1500 || pageSizeKB >= 500 || scriptCount >= 15) {
        return {
            minimum: 'Integrated GPU (Intel HD 4000+)',
            recommended: 'Discrete GPU (GTX 600 series)',
            integrated: true,
            confidence
        };
    }

    return {
        minimum: 'Any GPU with WebGL support',
        recommended: 'Integrated GPU (Intel HD 3000+)',
        integrated: true,
        confidence: confidence === 'high' ? 'medium' : 'low'
    };
}

function inferRamSpec(pageSizeBytes, resourceCount, confidence) {
    const pageSizeMB = pageSizeBytes / 1048576;
    const heavyResources = resourceCount >= 80;

    if (pageSizeMB >= 2 || heavyResources) {
        return {
            minimum: '8 GB RAM',
            recommended: '16 GB RAM',
            confidence
        };
    }
    if (pageSizeMB >= 0.5 || resourceCount >= 30) {
        return {
            minimum: '4 GB RAM',
            recommended: '8 GB RAM',
            confidence
        };
    }

    return {
        minimum: '2 GB RAM',
        recommended: '4 GB RAM',
        confidence: confidence === 'high' ? 'medium' : 'low'
    };
}

function inferNetworkSpec(pageSizeBytes, loadTimeMs, confidence) {
    const loadSeconds = Math.max(loadTimeMs / 1000, 0.5);
    const requiredMbps = Math.ceil(((pageSizeBytes * 8) / loadSeconds / 1000000) * 1.5);

    if (requiredMbps >= 25) {
        return {
            minimum: '10 Mbps connection',
            recommended: `${Math.max(requiredMbps, 25)} Mbps connection`,
            type: '4G / Broadband',
            confidence
        };
    }
    if (requiredMbps >= 5) {
        return {
            minimum: '5 Mbps connection',
            recommended: '10 Mbps connection',
            type: '4G / Broadband',
            confidence
        };
    }

    return {
        minimum: '1.5 Mbps connection',
        recommended: '5 Mbps connection',
        type: '3G / DSL',
        confidence: confidence === 'high' ? 'medium' : 'low'
    };
}

function inferStorageSpec(pageSizeBytes, confidence) {
    const cacheEstimateMB = Math.round((pageSizeBytes * 3) / 1048576);

    if (cacheEstimateMB >= 1000) {
        return {
            minimum: '5 GB available storage',
            recommended: '10 GB available storage',
            confidence
        };
    }
    if (cacheEstimateMB >= 100) {
        return {
            minimum: '1 GB available storage',
            recommended: '5 GB available storage',
            confidence
        };
    }

    return {
        minimum: '500 MB available storage',
        recommended: '1 GB available storage',
        confidence: confidence === 'high' ? 'medium' : 'low'
    };
}
