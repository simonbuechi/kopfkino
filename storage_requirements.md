# Storage and Bandwidth Requirements Analysis

This document outlines the calculated storage and bandwidth requirements for a movie project based on specific assumptions, along with estimated costs on Firebase.

## Assumptions
*   **Total Scenes:** 100
*   **Shots per Scene:** 10
*   **Images per Shot:** 3
*   **Videos per Shot:** 1
*   **Image File Size:** 100 KB
*   **Video File Size:** 1 MB

## Quantity Calculations

| Item Type | Calculation | Total Quantity |
| :--- | :--- | :--- |
| **Total Shots** | 100 scenes * 10 shots/scene | **1,000 shots** |
| **Total Images** | 1,000 shots * 3 images/shot | **3,000 images** |
| **Total Videos** | 1,000 shots * 1 video/shot | **1,000 videos** |

## Storage Requirements

| Item Type | Total Quantity | Size per Item | Total Size (KB/MB) | Total Size (GB) |
| :--- | :--- | :--- | :--- | :--- |
| **Images** | 3,000 | 100 KB | 300,000 KB (300 MB) | 0.29 GB |
| **Videos** | 1,000 | 1 MB | 1,000 MB (1 GB) | 0.98 GB |
| **Total** | | | **1,300 MB** | **~1.27 GB** |

> **Note:** Assumes 1 MB = 1024 KB and 1 GB = 1024 MB for binary calculations, though cloud providers often use decimal (1000) measurements. For safety, we estimate **1.3 GB** total storage.

## Bandwidth Analysis (Egress)

Bandwidth usage depends entirely on how often the data is accessed. The calculations below represent the data transfer required for a *single full download* or viewing of the entire project assets.

*   **1 Full Project View:** ~1.3 GB
*   **10 Full Project Views:** ~13 GB
*   **100 Full Project Views:** ~130 GB

## Firebase Cost Analysis

Firebase costs are based on the **Blaze (Pay as you go)** plan, as the Spark (Free) plan has strict limitations. Pricing uses Google Cloud Storage Multi-Region (US) rates as a baseline.

### 1. Storage Costs
*   **Standard Rate:** ~$0.026 per GB / month
*   **Monthly Cost:** 1.3 GB * $0.026 &#8776; **$0.03 / month**

### 2. Bandwidth (Egress) Costs
Google Cloud typically offers a free tier for egress (e.g., 10 GB/month to internet), after which standard rates apply.
*   **Standard Rate:** ~$0.12 per GB (North America/Europe)
*   **Cost per Full Project View:** 1.3 GB * $0.12 &#8776; **$0.16**

### 3. Operation Costs (Read/Write)
*   **Upload (Write) Costs:** Small cost for 4,000 initial upload operations (Class A ops).
    *   Rate: $0.05 per 10,000 operations.
    *   Cost: (4,000 / 10,000) * $0.05 = **$0.02 (one-time)**.
*   **Download (Read) Costs:** Small cost for listing/reading metadata (Class B ops).
    *   Rate: $0.004 per 10,000 operations.
    *   Cost: Negligible for typical usage.

## Summary

| Resource | Estimated Usage | Estimated Cost |
| :--- | :--- | :--- |
| **Storage** | 1.3 GB | **$0.03 / month** |
| **Bandwidth** | 1.3 GB per full view | **$0.16 per view** (after free tier) |

**Conclusion:**
Storage costs are negligible ($0.03/mo). The primary cost driver will be bandwidth. If 10 people view the full project every month (13 GB total), the first ~10 GB might be covered by the free tier, and the remaining 3 GB would cost approximately $0.36.
