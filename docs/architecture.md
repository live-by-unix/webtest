# Architecture

Webtest is designed as a client-side web application that runs entirely in the browser. This architecture ensures privacy (no data is sent to external servers) and allows for easy deployment.

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  index.html  │  │  style.css   │  │  script.js   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    WebtestAnalyzer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  analyzeUrl(url)                                 │  │
│  │    ├─ runBenchmarks()                            │  │
│  │    │    ├─ measureCpuPerformance()               │  │
│  │    │    ├─ measureGpuPerformance()               │  │
│  │    │    ├─ measureMemoryUsage()                 │  │
│  │    │    ├─ measureNetworkPerformance()          │  │
│  │    │    └─ measureStorageRequirements()         │  │
│  │    └─ inferSpecs(metrics)                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Browser APIs                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Performance  │  │     WebGL    │  │   Network    │  │
│  │     API      │  │     API      │  │  Info API    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Storage    │  │  Navigator   │                    │
│  │     API      │  │     API      │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### index.html
The main entry point that provides:
- URL input form
- Results display table
- Export buttons (CSV/JSON)
- Responsive layout structure

### style.css
Handles all styling including:
- CSS custom properties for theming
- Responsive grid layouts
- Mobile-first design
- Loading states and animations
- Table styling

### script.js
Contains the core application logic:

#### WebtestAnalyzer Class
The main analyzer class that orchestrates the entire analysis process.

**Key Methods:**
- `analyzeUrl(url)`: Main entry point for analysis
- `runBenchmarks(url)`: Executes all performance benchmarks
- `inferSpecs(metrics)`: Maps metrics to hardware requirements
- `exportToCsv()`: Exports results as CSV
- `exportToJson()`: Exports results as JSON

#### Benchmark Methods
Each benchmark method measures a specific hardware component:

1. **measureCpuPerformance()**
   - Executes Fibonacci sequence calculations
   - Measures execution time
   - Calculates a performance score

2. **measureGpuPerformance()**
   - Checks WebGL support
   - Retrieves GPU renderer information
   - Detects integrated vs discrete GPUs
   - Runs rendering benchmarks

3. **measureMemoryUsage()**
   - Uses Performance Memory API when available
   - Falls back to hardware concurrency estimation
   - Tracks heap size usage

4. **measureNetworkPerformance()**
   - Uses Network Information API
   - Retrieves effective type, downlink, and RTT
   - Falls back to estimates when API unavailable

5. **measureStorageRequirements()**
   - Uses Storage API for quota estimation
   - Measures localStorage usage
   - Calculates storage requirements

#### Spec Inference Methods
Each inference method maps benchmark results to hardware specifications:

- `inferCpuSpec(cpuMetrics)`: Maps CPU score to processor requirements
- `inferGpuSpec(gpuMetrics)`: Maps GPU score to graphics requirements
- `inferRamSpec(memoryMetrics)`: Maps memory usage to RAM requirements
- `inferNetworkSpec(networkMetrics)`: Maps network metrics to connection requirements
- `inferStorageSpec(storageMetrics)`: Maps storage usage to disk requirements

## Data Flow

1. **Input**: User enters URL in the form
2. **Validation**: URL is validated for proper format
3. **Benchmarking**: All benchmarks run in parallel using Promise.all()
4. **Inference**: Metrics are mapped to hardware specs
5. **Display**: Results are rendered in the UI
6. **Export**: Results can be exported as CSV or JSON

## Browser API Dependencies

Webtest relies on the following browser APIs:

| API | Purpose | Fallback |
|-----|---------|----------|
| Performance API | CPU benchmarking, memory measurement | Estimation based on hardware concurrency |
| WebGL API | GPU detection and benchmarking | Basic GPU detection |
| Network Information API | Network performance metrics | Default estimates |
| Storage API | Storage quota estimation | localStorage-based estimates |
| Navigator API | Hardware concurrency, user agent | Default values |

## Error Handling

The application implements error handling at multiple levels:

1. **URL Validation**: Ensures proper URL format before analysis
2. **API Availability**: Checks for API support before use
3. **Graceful Degradation**: Falls back to estimates when APIs unavailable
4. **User Feedback**: Displays error messages to users
5. **Loading States**: Shows loading indicators during analysis

## Performance Considerations

- Benchmarks run in parallel to minimize total analysis time
- Fibonacci calculations are limited to prevent browser freezing
- WebGL rendering operations are bounded
- Memory measurements are non-invasive
- Storage API calls are asynchronous

## Security Considerations

- All analysis runs client-side
- No data is transmitted to external servers
- URL validation prevents XSS attacks
- Same-origin policy is respected
- No persistent storage of analyzed URLs

## Extensibility

The architecture is designed for easy extension:

- New benchmarks can be added as methods
- Spec inference logic can be customized
- Export formats can be extended
- UI components are modular
- CSS custom properties allow easy theming
