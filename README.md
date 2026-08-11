# Webtest

Webtest analyzes websites to estimate minimum CPU, GPU, RAM, network, and storage requirements. It uses **headless Chrome (Puppeteer)** on a small Node.js server to load the URL you enter and measure real load time, transfer size, and resource counts.

## Features

- **Real URL analysis**: Headless Chrome loads the target website on the server
- **Site metrics**: Load time, TTFB, transfer size, script/image counts
- **Spec inference**: Maps site metrics to hardware requirement estimates
- **Device fallback**: If the server is unavailable, falls back to browser device benchmarks
- **Export options**: CSV or JSON
- **Responsive UI**: Works on desktop and mobile

## Requirements

- **Node.js 18+**
- **npm**

Puppeteer downloads Chromium automatically on first install.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/live-by-unix/webtest.git
cd webtest
```

2. Install server dependencies:

```bash
cd server
npm install
```

## Usage

1. Start the server (from the `server/` folder):

```bash
npm start
```

2. Open in Chrome (automatic when the server starts):

```
http://localhost:3000/launch.html
```

This opens Webtest in a **dedicated Chrome window**. The **Close** button will shut that window.

To disable auto-open: `set OPEN_BROWSER=0` (Windows) then `npm start`.

3. Enter a website URL (e.g. `https://example.com`) and click **Analyze**.

4. Export results as CSV or JSON if needed.

> **Important:** Use the server (`npm start`) — not `index.html` directly. Use `/launch.html` so **Close** can shut the Chrome app window.

## How it works

```
Browser UI  →  POST /api/analyze  →  Puppeteer (headless Chrome)
                                           ↓
                                    Loads the URL, collects metrics
                                           ↓
                                    Spec inference  →  JSON response  →  UI
```

### Metrics collected (Puppeteer)

| Metric | Description |
|--------|-------------|
| Load time | Time until page load event |
| DOM Content Loaded | Time until DOM is ready |
| TTFB | Time to first byte |
| Total transfer size | Sum of downloaded bytes |
| Resource count | Number of assets loaded |
| Script / image counts | Breakdown by type |

### Fallback

If the server is not running or analysis fails, the frontend runs local device benchmarks (CPU, GPU, memory, network, storage) and shows a warning banner.

## API

### `POST /api/analyze`

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "url": "https://example.com/",
  "timestamp": "2026-08-04T12:00:00.000Z",
  "analysisMode": "puppeteer",
  "metrics": {
    "site": {
      "loadTimeMs": 1240,
      "domContentLoadedMs": 890,
      "ttfbMs": 120,
      "totalBytes": 245000,
      "resourceCount": 12,
      "scriptCount": 2,
      "imageCount": 1,
      "analysisEngine": "puppeteer"
    }
  },
  "specs": { ... }
}
```

### `GET /api/health`

Returns `{ "status": "ok", "engine": "puppeteer" }`.

## Project structure

```
webtest/
├── index.html          # UI
├── script.js           # Frontend (calls API, fallback logic)
├── style.css           # Styles
├── server/
│   ├── package.json
│   ├── server.js       # Express server + static files
│   ├── analyzer.js     # Puppeteer analysis
│   ├── specInference.js
│   └── urlValidator.js # URL validation + SSRF protection
└── docs/               # Additional documentation
```

## Security notes

The server validates URLs and blocks private network addresses (SSRF protection). Do not expose an unsecured instance to the public internet without rate limiting and authentication.

## Disclaimer

Webtest provides **estimates** based on page weight and load behavior. Actual hardware needs vary by use case, browser, and user behavior.

## License

BSD-3-Clause — see [LICENSE](LICENSE).

## Author

**Live-by-Unix**

## GitHub

https://github.com/live-by-unix/webtest
