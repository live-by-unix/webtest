# Spec Inference Logic

This document details how Webtest maps performance metrics to hardware requirements.

## Overview

The spec inference system uses a tiered approach to determine minimum hardware requirements. Each component (CPU, GPU, RAM, Network, Storage) has its own inference logic based on benchmark scores and available system information.

## Confidence Levels

Each inferred specification includes a confidence level:
- **high**: Strong evidence from multiple metrics
- **medium**: Moderate evidence from available metrics
- **low**: Limited evidence or reliance on estimates

## CPU Inference

### Benchmark
The CPU benchmark calculates Fibonacci sequences (n=35) multiple times and measures execution duration.

### Scoring
```
score = 10000 / duration (ms)
```

### Inference Rules

| Score Range | Minimum Requirement | Recommended | Confidence |
|-------------|---------------------|-------------|------------|
| ≥ 500       | Dual-core 1.5 GHz   | Quad-core 2.0 GHz | high |
| 200 - 499   | Dual-core 1.0 GHz   | Dual-core 1.5 GHz | medium |
| < 200       | Single-core 1.0 GHz | Dual-core 1.0 GHz | low |

### Rationale
- Higher scores indicate faster CPU performance
- Multi-core systems typically score higher due to parallel execution
- The benchmark is CPU-intensive (recursive calculations)
- Duration is averaged over multiple iterations for consistency

## GPU Inference

### Benchmark
The GPU benchmark uses WebGL to:
1. Check WebGL support
2. Retrieve renderer information
3. Detect integrated vs discrete GPUs
4. Execute rendering operations

### Scoring
```
score = 5000 / max(rendering_duration, 1)
```

### Integrated GPU Detection
Integrated GPUs are identified by checking the renderer string for:
- "Intel"
- "integrated"
- "HD Graphics"
- "Iris"

### Inference Rules

| Score Range | Minimum Requirement | Recommended | Integrated | Confidence |
|-------------|---------------------|-------------|------------|------------|
| ≥ 300       | Integrated GPU (Intel HD 4000+) or Discrete GPU (GTX 600) | Discrete GPU (GTX 900+) | Based on detection | high |
| 100 - 299   | Integrated GPU (Intel HD 3000+) | Discrete GPU (GTX 600) | Based on detection | medium |
| < 100       | Any GPU with WebGL support | Integrated GPU (Intel HD 3000+) | Based on detection | low |
| No WebGL    | Any GPU with WebGL support | Discrete GPU with WebGL 2.0 | N/A | low |

### Rationale
- WebGL support is the baseline requirement
- Higher scores indicate better GPU performance
- Integrated GPUs typically have lower scores
- Renderer information provides specific GPU model
- Discrete GPUs generally outperform integrated GPUs

## RAM Inference

### Benchmark
The RAM benchmark uses the Performance Memory API to measure:
- `usedJSHeapSize`: Current JavaScript heap usage
- `totalJSHeapSize`: Total allocated heap
- `jsHeapSizeLimit`: Maximum heap size

### Fallback
When Performance Memory API is unavailable:
```
estimatedRam = hardwareConcurrency * 2 (GB)
```

### Inference Rules

| Used Heap (GB) | Minimum Requirement | Recommended | Confidence |
|----------------|---------------------|-------------|------------|
| ≥ 4            | 8 GB RAM            | 16 GB RAM   | high |
| 2 - 3.9        | 4 GB RAM            | 8 GB RAM    | medium |
| < 2            | 2 GB RAM            | 4 GB RAM    | low |

### Rationale
- JavaScript heap usage correlates with total RAM requirements
- Modern web applications with complex features require more RAM
- The inference accounts for browser overhead
- Estimated values are less reliable (lower confidence)

## Network Inference

### Benchmark
The network benchmark uses the Network Information API to measure:
- `effectiveType`: Connection type (slow-2g, 2g, 3g, 4g)
- `downlink`: Download speed (Mbps)
- `rtt`: Round-trip time (ms)
- `saveData`: Data saver mode status

### Fallback
When Network Information API is unavailable:
```
effectiveType = '4g'
downlink = 10 Mbps
rtt = 100 ms
```

### Inference Rules

| Effective Type | Downlink | Minimum Requirement | Recommended | Type | Confidence |
|----------------|----------|---------------------|-------------|------|------------|
| 4g             | ≥ 10     | 10 Mbps connection  | 25 Mbps connection | 4G / Broadband | high |
| 3g             | ≥ 1.5    | 1.5 Mbps connection  | 10 Mbps connection | 3G / DSL | medium |
| 2g / slow-2g   | < 1.5    | 0.5 Mbps connection  | 1.5 Mbps connection | 2G / Basic | low |

### Rationale
- Effective type provides a standardized connection classification
- Downlink speed determines bandwidth requirements
- RTT affects latency-sensitive applications
- Modern web applications benefit from faster connections
- Fallback values represent typical broadband connections

## Storage Inference

### Benchmark
The storage benchmark uses the Storage API to measure:
- `usage`: Current storage usage (bytes)
- `quota`: Available storage quota (bytes)
- `localStorage`: localStorage usage (bytes)

### Fallback
When Storage API is unavailable:
```
quota = 5 GB (default estimate)
usage = localStorage size
```

### Inference Rules

| Used Storage (MB) | Minimum Requirement | Recommended | Confidence |
|-------------------|---------------------|-------------|------------|
| ≥ 1000            | 5 GB available storage | 10 GB available storage | high |
| 100 - 999         | 1 GB available storage | 5 GB available storage | medium |
| < 100             | 500 MB available storage | 1 GB available storage | low |

### Rationale
- Storage usage includes cache, localStorage, and application data
- Modern web applications with media content require more storage
- Progressive Web Apps (PWAs) may have higher storage needs
- Quota information provides accurate available space
- Fallback estimates are conservative

## Combined Spec Generation

The final specification object combines all individual inferences:

```javascript
{
  cpu: { minimum, recommended, confidence },
  gpu: { minimum, recommended, integrated, renderer, confidence },
  ram: { minimum, recommended, confidence },
  network: { minimum, recommended, type, confidence },
  storage: { minimum, recommended, confidence }
}
```

## Limitations

1. **Browser Environment**: Benchmarks run in a browser sandbox, which may not reflect native performance
2. **API Availability**: Some APIs may not be available in all browsers
3. **System Variability**: System load and background processes can affect benchmark results
4. **Estimation Accuracy**: Fallback estimates are less accurate than direct measurements
5. **Use Case Specificity**: Requirements may vary based on specific website features

## Future Improvements

Potential enhancements to the spec inference system:

- Machine learning models for more accurate predictions
- Historical data analysis for trend-based inference
- User feedback integration for confidence calibration
- Additional benchmarks for specific use cases (gaming, video editing, etc.)
- Real-world usage pattern analysis
