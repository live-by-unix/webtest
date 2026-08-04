# API Reference

This document describes the Webtest JavaScript API for programmatic access to the hardware analysis functionality.

## WebtestAnalyzer Class

The main class for performing hardware analysis.

### Constructor

```javascript
const analyzer = new WebtestAnalyzer()
```

Creates a new WebtestAnalyzer instance.

### Properties

- `currentResults`: Object | null
  - Stores the most recent analysis results
  - `null` if no analysis has been performed

- `currentUrl`: String | null
  - Stores the most recently analyzed URL
  - `null` if no analysis has been performed

### Methods

#### analyzeUrl(url)

Analyzes a website URL to determine hardware requirements.

**Parameters:**
- `url` (String): The website URL to analyze (must include protocol, e.g., `https://example.com`)

**Returns:**
- `Promise<Object>`: A promise that resolves to the analysis results object

**Throws:**
- `Error`: If the URL is invalid or analysis fails

**Example:**
```javascript
const analyzer = new WebtestAnalyzer();
try {
    const results = await analyzer.analyzeUrl('https://example.com');
    console.log(results.specs);
} catch (error) {
    console.error('Analysis failed:', error.message);
}
```

**Results Object Structure:**
```javascript
{
    url: String,              // The analyzed URL
    timestamp: String,        // ISO 8601 timestamp
    metrics: {
        cpu: {
            score: Number,     // CPU performance score
            duration: Number,  // Benchmark duration in ms
            operations: Number // Number of operations performed
        },
        gpu: {
            score: Number,           // GPU performance score
            webglSupported: Boolean // WebGL support status
            renderer: String,       // GPU renderer name
            vendor: String,         // GPU vendor
            isIntegrated: Boolean   // Integrated GPU flag
        },
        memory: {
            usedJSHeapSize: Number,  // Used heap in MB
            totalJSHeapSize: Number, // Total heap in MB
            jsHeapSizeLimit: Number, // Heap limit in MB
            estimated: Boolean       // Whether values are estimated
        },
        network: {
            effectiveType: String,  // Connection type (2g, 3g, 4g)
            downlink: Number,       // Downlink speed in Mbps
            rtt: Number,           // Round-trip time in ms
            saveData: Boolean,     // Data saver mode
            estimated: Boolean     // Whether values are estimated
        },
        storage: {
            used: Number,          // Used storage in MB
            quota: Number,         // Available quota in MB
            localStorage: Number,   // localStorage usage in KB
            estimated: Boolean     // Whether values are estimated
        }
    },
    specs: {
        cpu: {
            minimum: String,      // Minimum CPU requirement
            recommended: String,  // Recommended CPU requirement
            confidence: String    // Confidence level (high/medium/low)
        },
        gpu: {
            minimum: String,      // Minimum GPU requirement
            recommended: String,  // Recommended GPU requirement
            integrated: Boolean,  // Integrated GPU flag
            renderer: String,     // GPU renderer name
            confidence: String    // Confidence level
        },
        ram: {
            minimum: String,      // Minimum RAM requirement
            recommended: String,  // Recommended RAM requirement
            confidence: String    // Confidence level
        },
        network: {
            minimum: String,      // Minimum network requirement
            recommended: String,  // Recommended network requirement
            type: String,         // Network type
            confidence: String    // Confidence level
        },
        storage: {
            minimum: String,      // Minimum storage requirement
            recommended: String,  // Recommended storage requirement
            confidence: String    // Confidence level
        }
    }
}
```

#### exportToCsv()

Exports the current analysis results as a CSV file.

**Parameters:**
- None

**Returns:**
- None

**Throws:**
- `Error`: If no results are available to export

**Example:**
```javascript
const analyzer = new WebtestAnalyzer();
await analyzer.analyzeUrl('https://example.com');
analyzer.exportToCsv(); // Downloads webtest-results.csv
```

**CSV Format:**
```csv
Component,Minimum Requirement,Recommended,Confidence
CPU,"Dual-core 1.5 GHz","Quad-core 2.0 GHz",high
GPU,"Integrated GPU (Intel HD 4000+)","Discrete GPU (GTX 900 series)",high
RAM,"8 GB RAM","16 GB RAM",high
Network,"10 Mbps connection","25 Mbps connection",high
Storage,"5 GB available storage","10 GB available storage",high
```

#### exportToJson()

Exports the current analysis results as a JSON file.

**Parameters:**
- None

**Returns:**
- None

**Throws:**
- `Error`: If no results are available to export

**Example:**
```javascript
const analyzer = new WebtestAnalyzer();
await analyzer.analyzeUrl('https://example.com');
analyzer.exportToJson(); // Downloads webtest-results.json
```

**JSON Format:**
The exported JSON contains the complete results object as returned by `analyzeUrl()`.

## Usage Examples

### Basic Analysis

```javascript
const analyzer = new WebtestAnalyzer();

// Analyze a single URL
const results = await analyzer.analyzeUrl('https://example.com');

// Access specifications
console.log('CPU:', results.specs.cpu.minimum);
console.log('GPU:', results.specs.gpu.minimum);
console.log('RAM:', results.specs.ram.minimum);
```

### Batch Analysis

```javascript
const analyzer = new WebtestAnalyzer();
const urls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com'
];

const results = await Promise.all(
    urls.map(url => analyzer.analyzeUrl(url))
);

results.forEach((result, index) => {
    console.log(`${urls[index]}:`, result.specs);
});
```

### Custom Export

```javascript
const analyzer = new WebtestAnalyzer();
await analyzer.analyzeUrl('https://example.com');

// Export as CSV
analyzer.exportToCsv();

// Export as JSON
analyzer.exportToJson();
```

### Error Handling

```javascript
const analyzer = new WebtestAnalyzer();

try {
    const results = await analyzer.analyzeUrl('invalid-url');
} catch (error) {
    if (error.message.includes('Failed to analyze')) {
        console.error('Analysis error:', error.message);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

### Accessing Raw Metrics

```javascript
const analyzer = new WebtestAnalyzer();
const results = await analyzer.analyzeUrl('https://example.com');

// Access raw benchmark metrics
console.log('CPU Score:', results.metrics.cpu.score);
console.log('GPU Renderer:', results.metrics.gpu.renderer);
console.log('Memory Used:', results.metrics.memory.usedJSHeapSize, 'MB');
console.log('Network Type:', results.metrics.network.effectiveType);
console.log('Storage Used:', results.metrics.storage.used, 'MB');
```

## Browser Compatibility

The WebtestAnalyzer class requires modern browser APIs:

- **Performance API**: Required for CPU and memory benchmarks
- **WebGL API**: Required for GPU detection and benchmarking
- **Network Information API**: Required for network metrics (partial support)
- **Storage API**: Required for storage quota estimation

### Fallback Behavior

When certain APIs are unavailable, the analyzer falls back to estimated values:
- Memory: Estimated based on `navigator.hardwareConcurrency`
- Network: Default values (4g, 10 Mbps, 100ms RTT)
- Storage: Default quota (5GB) with localStorage measurement

## Integration Examples

### With a Web Framework

```javascript
// React example
import { useState } from 'react';

function AnalyzerComponent() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const analyze = async (url) => {
        setLoading(true);
        const analyzer = new WebtestAnalyzer();
        try {
            const data = await analyzer.analyzeUrl(url);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input type="url" onChange={(e) => analyze(e.target.value)} />
            {loading && <p>Analyzing...</p>}
            {results && <pre>{JSON.stringify(results.specs, null, 2)}</pre>}
        </div>
    );
}
```

### As a Node.js Module (with Puppeteer)

```javascript
// Note: This requires a browser environment
// For Node.js, use Puppeteer to run in a headless browser

const puppeteer = require('puppeteer');

async function analyzeWithPuppeteer(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto('file:///path/to/webtest/index.html');
    
    const results = await page.evaluate(async (targetUrl) => {
        const analyzer = new WebtestAnalyzer();
        return await analyzer.analyzeUrl(targetUrl);
    }, url);
    
    await browser.close();
    return results;
}
```

## Performance Considerations

- Analysis typically takes 2-5 seconds depending on system performance
- Benchmarks run in parallel where possible
- CPU benchmark is the most intensive operation
- GPU benchmark requires WebGL support
- Memory and network benchmarks are relatively fast

## Security Notes

- All analysis runs client-side in the browser
- No data is transmitted to external servers
- URL validation prevents XSS attacks
- Same-origin policy is respected
- No persistent storage of analyzed URLs
