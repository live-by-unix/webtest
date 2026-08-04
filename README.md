# Webtest

Webtest is a hardware requirements analyzer that determines the minimum CPU, GPU, RAM, network, and storage specifications needed to run any website optimally. It uses headless browser benchmarks to measure performance metrics and infer hardware requirements.

## Features

- **Performance Analysis**: Runs headless browser benchmarks to measure CPU, GPU, memory, network, and storage performance
- **Spec Inference**: Maps performance metrics to minimum hardware requirements
- **Integrated GPU Detection**: Identifies and accounts for integrated graphics when available
- **Export Options**: Export results as CSV or JSON for further analysis
- **Responsive UI**: Clean, modern interface that works on all devices
- **Confidence Scoring**: Provides confidence levels for each inferred specification

## Installation **For Source Code**

1. Clone the repository:
```bash
git clone https://github.com/live-by-unix/webtest.git
cd webtest
```

2. Open `index.html` in a web browser:
```bash
# Simply open the file or use a local server
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

Or use a local server:
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

## Usage

1. Enter a website URL in the input field (e.g., `https://example.com`)
2. Click the "Analyze" button to run performance benchmarks
3. View the results table showing minimum hardware requirements
4. Export results as CSV or JSON using the export buttons

## Example Output

### CSV Format
```csv
Component,Minimum Requirement,Recommended,Confidence
CPU,"Dual-core 1.5 GHz","Quad-core 2.0 GHz",high
GPU,"Integrated GPU (Intel HD 4000+)","Discrete GPU (GTX 900 series or equivalent)",high
RAM,"8 GB RAM","16 GB RAM",high
Network,"10 Mbps connection","25 Mbps connection",high
Storage,"5 GB available storage","10 GB available storage",high
```

### JSON Format
```json
{
  "url": "https://example.com",
  "timestamp": "2026-08-04T12:00:00.000Z",
  "metrics": {
    "cpu": {
      "score": 523,
      "duration": 19,
      "operations": 175
    },
    "gpu": {
      "score": 342,
      "webglSupported": true,
      "renderer": "Intel Iris Xe Graphics",
      "vendor": "Intel",
      "isIntegrated": true
    },
    "memory": {
      "usedJSHeapSize": 4256,
      "totalJSHeapSize": 8192,
      "jsHeapSizeLimit": 16384,
      "estimated": false
    },
    "network": {
      "effectiveType": "4g",
      "downlink": 12.5,
      "rtt": 85,
      "saveData": false
    },
    "storage": {
      "used": 1250,
      "quota": 5120,
      "localStorage": 45
    }
  },
  "specs": {
    "cpu": {
      "minimum": "Dual-core 1.5 GHz",
      "recommended": "Quad-core 2.0 GHz",
      "confidence": "high"
    },
    "gpu": {
      "minimum": "Integrated GPU (Intel HD 4000+)",
      "recommended": "Discrete GPU (GTX 900 series or equivalent)",
      "integrated": true,
      "renderer": "Intel Iris Xe Graphics",
      "confidence": "high"
    },
    "ram": {
      "minimum": "8 GB RAM",
      "recommended": "16 GB RAM",
      "confidence": "high"
    },
    "network": {
      "minimum": "10 Mbps connection",
      "recommended": "25 Mbps connection",
      "type": "4G / Broadband",
      "confidence": "high"
    },
    "storage": {
      "minimum": "5 GB available storage",
      "recommended": "10 GB available storage",
      "confidence": "high"
    }
  }
}
```

## Architecture

Webtest consists of three main components:

- **index.html**: The main entry point with the user interface
- **style.css**: Responsive styling for the application
- **script.js**: Core logic for performance scanning and spec inference

For detailed architecture information, see the [docs/](docs/) folder.

## Spec Inference Logic

The spec inference system maps performance metrics to hardware requirements using the following logic:

- **CPU**: Based on computational benchmark scores (Fibonacci sequence calculation)
- **GPU**: Based on WebGL performance scores and renderer information
- **RAM**: Based on JavaScript heap size usage and memory pressure
- **Network**: Based on Network Information API (effective type, downlink, RTT)
- **Storage**: Based on Storage API estimates and localStorage usage

For detailed spec inference documentation, see [docs/spec-inference.md](docs/spec-inference.md).

## API Reference

Webtest provides a JavaScript API for programmatic access:

```javascript
const analyzer = new WebtestAnalyzer();
const results = await analyzer.analyzeUrl('https://example.com');
console.log(results.specs);
```

For complete API documentation, see [docs/api.md](docs/api.md).

## Browser Compatibility

Webtest requires a modern browser with support for:
- Performance API
- WebGL
- Network Information API (partial support)
- Storage API

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the BSD-3-Clause License. See [LICENSE](LICENSE) for details.

## Author

**Live-by-Unix**

## GitHub

https://github.com/live-by-unix/webtest

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

Webtest provides estimates based on browser-based benchmarks. Actual hardware requirements may vary based on specific use cases, browser configurations, and system conditions.
