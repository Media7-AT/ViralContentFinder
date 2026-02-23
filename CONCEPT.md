# ViralContentFinder — Full Software Concept Document

**Version:** 1.1
**Date:** 2026-02-23 (updated 2026-02-23: added Facebook Reels as data source)
**Authored by:** viral-auto-data-engine agent
**Target:** Development agent specification — build-ready

---

## Table of Contents

1. [Product Vision & Goal](#1-product-vision--goal)
2. [Feature Set](#2-feature-set)
3. [Data Sources & API Integrations](#3-data-sources--api-integrations)
4. [Virality Score Formula](#4-virality-score-formula)
5. [Data Pipeline Architecture](#5-data-pipeline-architecture)
6. [Dashboard & UI Blueprint](#6-dashboard--ui-blueprint)
7. [Tech Stack Decisions](#7-tech-stack-decisions)
8. [API Routes](#8-api-routes)
9. [File & Folder Structure](#9-file--folder-structure)
10. [Development Roadmap](#10-development-roadmap)

---

## 1. Product Vision & Goal

ViralContentFinder is a real-time social media intelligence dashboard that monitors TikTok, YouTube Shorts, Instagram Reels, and Facebook Reels to identify and rank viral automotive video content targeting the DACH (Germany, Austria, Switzerland) market. It ingests raw platform data, applies a quantitative Virality Score formula composed of six computed metrics, and surfaces the top-performing content with a full metric breakdown so that DACH automotive professionals can reverse-engineer what made each video succeed and replicate those patterns in their own content production.

**Primary user persona:** Social media manager or digital marketing lead at a DACH car dealership, automotive brand (OEM or aftermarket), or automotive media publisher. This user has 1–3 active social channels, publishes 5–15 videos per week, and needs to know — with mathematical precision — which content formats, hook structures, audio choices, and visual pacing are currently driving views and engagement in their niche, without spending hours manually scrolling platforms.

**Core value proposition:** Replace intuition-based content decisions with a single ranked feed of DACH automotive viral content, each item annotated with the exact metric that made it perform — HSI, EV velocity, VPI, BPM correlation — so every production decision maps to a measurable outcome.

---

## 2. Feature Set

### 2.1 MVP Features (Phase 1)

#### F1 — Viral Content Feed
- Continuously polled ranked list of DACH automotive videos from YouTube, TikTok, Instagram Reels, and Facebook Reels
- Each card shows: thumbnail, platform badge, title, channel name, publish timestamp, view count, Virality Score (VS), and Virality Tier badge (Tier 1 / Tier 2 / Non-Viral)
- Filter bar: platform, date range (last 24h / 7d / 30d / custom), vehicle category (Sportwagen, SUV, Elektroauto, Tuning, Gebrauchtwagen, Probefahrt, Motorrad), Virality Tier
- Sort by: VS descending (default), EV_24h, HSI, publish date
- Pagination: 20 items per page, infinite scroll supported

#### F2 — Video Detail Drill-down
- Opens on card click; full-page or modal view
- Displays all computed metrics in a structured layout:
  - Hook Strength Index (HSI) with color-coded badge
  - Engagement Velocity at 1h, 6h, 24h with sparkline
  - Retention Curve chart with drop-off markers
  - Audio BPM and dominant frequency band
  - Visual Pacing Index (VPI) with scene cut timeline
  - Audio Correlation Coefficient (ACC)
  - Master Virality Score with component breakdown bar
- Raw engagement numbers: views, likes, comments, shares
- Geo-distribution donut chart (DE / AT / CH / Other)
- Top hashtags used
- Publishing time with day-of-week and hour annotation

#### F3 — Retention Curve Panel
- Line chart: audience retention % (Y) vs. video time in seconds (X)
- Overlay: niche average retention curve (gray dashed)
- Annotated markers:
  - Red triangle at each Retention Drop-off Point (RDP), sized by `|dR/dt|`
  - Green star at timestamps with positive engagement spike
  - Orange scissors icon at scene cut clusters (VPI hotspots)
- HSI badge top-left
- Tooltip on hover: retention %, scene type from CV annotations, engagement delta

#### F4 — Metric Comparison Table
- Sortable, filterable table of all analyzed videos
- Columns: Rank, Title, Platform, Published, Views, HSI, EV_24h, VPI, BPM, ACC, VS, Tier
- Row click opens F2 detail view
- CSV export of all visible rows

#### F5 — Dashboard Summary Header
- Four KPI tiles: Total Videos Analyzed (rolling 30d), Avg VS this week vs. last week, Top Platform by average VS, Top Vehicle Category by VS
- Refresh timestamp and next-poll countdown

#### F6 — Data Ingestion API Layer
- Next.js API routes that poll YouTube Data API v3, Apify TikTok Scraper, Apify Instagram Scraper, and Apify Facebook Scraper on a configurable schedule
- DACH keyword search logic applied at query time
- Deduplication against existing database records
- Metric computation pipeline triggered per new video

#### F7 — Settings Page
- API key management (YouTube Data API key, Apify API token)
- Polling interval configuration (default 30 minutes)
- DACH keyword list management (add/remove/reorder)
- Virality threshold overrides (HSI alert floor, VS Tier 1 cutoff)
- GDPR data retention policy: configurable TTL for raw data (default 90 days)

### 2.2 Phase 2 Features

#### F8 — DACH Geographic Heatmap
- Choropleth map: Germany (Bundesländer), Austria (Bundesländer), Switzerland (Kantone)
- Metric: aggregated VS scores and view velocity by geographic origin of views
- Requires geo-distribution data from platform APIs (YouTube Analytics API with OAuth, or estimated from comment/account language signals as fallback)
- Platform and date range filters
- Click a region to show top 5 videos from that area

#### F9 — Audio Intelligence Panel
- BPM distribution histogram for all videos in the current filter set
- Scatter plot: BPM (X) vs. retention at 50% mark (Y), with Pearson r displayed
- Dominant frequency band breakdown (bass < 300Hz, mid 300Hz–4kHz, treble > 4kHz)
- Audio trend: most common BPM range in Tier 1 videos this week

#### F10 — Computer Vision Annotations
- Frame-level annotation viewer: scrub through video thumbnails with overlaid CV labels
- Labels: vehicle type (YOLOv8 classification), face count (Mediapipe), text overlay presence (Tesseract OCR confidence), scene type
- Correlation table: each visual element type vs. average retention at that timestamp

#### F11 — Trend Alerts
- Configurable alert rules: e.g. "notify when a video from DE with VS >= 0.78 and EV_1h > 500 is detected"
- Delivery: in-app notification bell, optional webhook to Slack or email
- Alert history log

#### F12 — Competitor Channel Tracker
- User enters a list of YouTube channel IDs or TikTok handles to monitor
- Dashboard tab shows all recent videos from those channels with full VS breakdown
- Comparative VS chart: own channel vs. tracked competitors over time

#### F13 — Content Calendar Recommendation
- Based on rolling 90-day EV analysis: recommend optimal posting days and hours (CET) per platform for DACH automotive content
- Output: heatmap grid of day × hour colored by average EV_24h, with recommended slots highlighted

---

## 3. Data Sources & API Integrations

### 3.1 Platform APIs

#### YouTube
- **Primary endpoint (public):** YouTube Data API v3
  - `GET https://www.googleapis.com/youtube/v3/search` with `q=<DACH keyword>`, `type=video`, `videoDuration=short`, `publishedAfter=<ISO8601>`, `regionCode=DE` (rotate between DE, AT, CH)
  - `GET https://www.googleapis.com/youtube/v3/videos` with `part=snippet,statistics,contentDetails` for batch video detail fetch (up to 50 IDs per request)
  - Quota cost: search = 100 units; videos list = 1 unit per request. Daily quota: 10,000 units (default). At 30-minute polling intervals with 2 search queries per cycle: 4,800 units/day — within budget.
  - Rate limit: 100 requests per 100 seconds per user
- **Retention curves (requires OAuth, channel-owner access only):**
  - `GET https://youtubeanalytics.googleapis.com/v2/reports` with `metrics=audienceWatchRatio` and `dimensions=elapsedVideoTimeRatio`
  - This data is NOT available for third-party channel videos. Fallback: use public `statistics.viewCount` at crawl intervals to derive EV; use VPI as retention proxy.
- **Geo data:** `regionCode` filter on search is a request constraint, not a response field. True geo-distribution requires YouTube Analytics API with channel-owner OAuth. Fallback: infer DACH signal from video language (`snippet.defaultAudioLanguage = de`), channel description language, and top comment language distribution via Natural Language Detection.

#### TikTok
- **Primary (approved research access):** TikTok Research API
  - `POST https://open.tiktokapis.com/v2/research/video/query/` with filter `create_date`, `keyword`, `region_code` in [DE, AT, CH]
  - Returns: `id`, `create_time`, `view_count`, `like_count`, `comment_count`, `share_count`, `hashtag_names`, `music_id`, `duration`
  - Rate limit: 1,000 requests/day (research tier)
- **Fallback (no approved access):** Apify TikTok Scraper actor `clockworks/tiktok-scraper`
  - Input: hashtag list or keyword list; returns public video metadata
  - Cost: Apify platform compute units; approximately $0.50–2.00 per 1,000 videos depending on scraper depth
- **TikTok retention curves:** Not publicly available through any API. Fallback: EV computed from like/comment/share counts scraped at T+1h, T+6h, T+24h intervals.

#### Instagram Reels
- **Primary (business account access):** Meta Graph API
  - `GET /{media-id}/insights?metric=reach,impressions,video_views,plays` — requires Business account OAuth
  - `GET /{ig-user-id}/media` to list recent reels
  - Only available for owned accounts or accounts where the app has been granted permissions
- **Fallback:** Apify Instagram Scraper actor `apify/instagram-scraper`
  - Input: hashtag or username; returns public post metadata
  - Returns: `likesCount`, `commentsCount`, `videoViewCount`, `timestamp`, `hashtags`, `caption`

#### Facebook Reels

Facebook Reels is distinct from Instagram Reels despite sharing the Meta infrastructure. Public Reels are surfaced on Facebook's video feed and have separate engagement counts, distribution logic, and audience demographics — skewing older (25–54) compared to Instagram, which is relevant for DACH car-buying demographics.

**Data availability — honest assessment:**

| Data Point | Availability | Method |
|---|---|---|
| Video title / description / caption | Yes | Apify scraper |
| Publish timestamp | Yes | Apify scraper |
| View count | Partial — Facebook shows "X views" publicly on some Reels; others show only reaction counts | Apify scraper (field: `videoPlayCount`; may be null) |
| Reaction count (Likes + Love + Haha + etc.) | Yes | Apify scraper (field: `reactionsCount`) |
| Comment count | Yes | Apify scraper (field: `commentsCount`) |
| Share count | Yes | Apify scraper (field: `sharesCount`) |
| Hashtags | Yes | Parsed from caption text |
| Audio track metadata | No — Facebook does not expose audio BPM or track ID publicly |  AudD fallback if audio URL accessible |
| Retention curve | No — never available publicly; requires Facebook Page Insights with Page admin access |  |
| Geo-distribution of viewers | No — requires Facebook Page Insights (admin-only) |  |
| HSI (3-second retention) | No — requires Facebook Insights (admin-only) |  |

**Important limitation:** Facebook's Graph API v17+ removed access to public post metrics for third-party apps not approved under advanced access. The only reliable public data collection path is Apify scraping.

- **Primary (public content):** Apify Facebook Scraper actor `apify/facebook-pages-scraper` or `apify/facebook-posts-scraper`
  - Input: Facebook Page URL, keyword search, or hashtag
  - Scrape strategy: search `https://www.facebook.com/reel/<reel_id>` or crawl automotive Page feeds
  - Returns: `videoPlayCount` (where visible), `reactionsCount`, `commentsCount`, `sharesCount`, `message` (caption), `created_time`, `permalink_url`
  - Cost: Apify compute units; approximately $1.00–3.00 per 1,000 Reels depending on page depth
  - Rate note: Facebook aggressively blocks headless browsers — use Apify's residential proxy rotation; expect higher failure rate (~15–25%) vs. TikTok/Instagram scrapers

- **Fallback / owned Facebook Pages:** Meta Graph API — Video Insights endpoint
  - `GET /{video-id}/video_insights?metric=total_video_views,total_video_avg_watch_time,total_video_view_time_by_country_id`
  - Requires: Page access token with `pages_read_engagement` and `pages_show_list` permissions
  - Returns: `total_video_views`, `total_video_avg_watch_time` (seconds — usable as HSI proxy), `total_video_view_time_by_country_id` (usable for DACH geo-distribution)
  - This is the ONLY path to real retention or geo data for Facebook Reels. HSI proxy: `avg_watch_time / video_duration` × 100 — not equivalent to 3-second retention but the closest available signal.
  - Endpoint: `GET https://graph.facebook.com/v19.0/{video-id}/video_insights`

**DACH-specific signals for Facebook Reels:**
- Language: `franc` applied to caption text; threshold >= 0.85 confidence for German classification
- Page country: Facebook Pages have a country field accessible via `GET /{page-id}?fields=country_page_likes,location` — a Page with `location.country = DE/AT/CH` is a strong DACH Tier 1 signal
- Hashtags: same DACH automotive hashtag list as other platforms (parsed from `message` field)
- DACH signal scoring: same three-tier formula as Section 3.4, with `channel_country_in_DACH` sourced from Page location field
- Note: Facebook Reels from German-language automotive Pages (e.g., AutoBild, ADAC, Autohaus24) are the highest-value targets; build a curated seed list of ~50 such Page IDs for the initial ingest

**EV computation for Facebook Reels:**
- `EV = reactionsCount + commentsCount + sharesCount` (reactions substitute for likes)
- `sharesCount` is a stronger virality signal on Facebook than on other platforms due to Facebook's share-based distribution model — consider weighting shares × 1.5 in EV computation for Facebook only:
  ```
  EV_facebook = reactionsCount + commentsCount + (sharesCount × 1.5)
  ```
- This platform-specific EV adjustment is applied before normalization; the `ev_1h`, `ev_6h`, `ev_24h` fields store the adjusted value

**HSI for Facebook Reels (non-owned):**
- HSI is never available for non-owned Facebook Reels through public scraping.
- Always substitute `HSI = 60.0` (Facebook Reels seed benchmark) and set `hsi_estimated = true`.
- If owned Page with Graph API access: use `total_video_avg_watch_time / duration_seconds × 100` as HSI proxy and set `hsi_estimated = false` but annotate in `cv_annotations` as `{"hsi_method": "avg_watch_time_proxy"}`.

**VPI for Facebook Reels:**
- Same as other platforms: unavailable without video download. Set `vpi_estimated = true`, substitute 0.5.

### 3.2 Audio Analysis
- **AudD API:** `POST https://api.audd.io/` with audio file or URL. Returns: `bpm`, `title`, `artist`, Spotify metadata if track identified.
  - Rate limit: varies by plan; 300 requests/month on free tier; use paid tier for production.
- **librosa (local):** Python microservice (called via Next.js API route as subprocess or HTTP). Input: audio file path. Output: BPM (beat tracking), spectral centroid, dominant frequency band.
  - Preferred for cost control; requires audio file download from platform CDN (where permissible).
  - Note: Downloading TikTok audio from CDN URLs may violate ToS — use AudD API with URL method for TikTok to avoid local storage of files.

### 3.3 Computer Vision (Phase 2)
- **PySceneDetect:** Scene change detection. Config: `ContentDetector` with `threshold=27`. Output: list of (start_time, end_time, scene_index) tuples.
- **OpenCV:** Frame extraction at 1 FPS from downloaded/streamed video.
- **Mediapipe Face Detection:** Face presence and count per frame.
- **Tesseract OCR:** Text overlay detection. Confidence score threshold: > 60 to count as "text present".
- **YOLOv8 (custom fine-tuned):** Vehicle type classification. Classes: Sportwagen, SUV, Elektroauto, Motorrad, Transporter, Gebrauchtwagen. Base model: YOLOv8m fine-tuned on automotive dataset. Inference endpoint: FastAPI microservice.
- **Deployment of CV microservices:** Docker containers, called via internal HTTP from Next.js API routes or n8n workflows.

### 3.4 DACH-Specific Signals

**Language detection:**
- Primary: `snippet.defaultAudioLanguage == "de"` (YouTube) or caption language via `langdetect` Python library applied to video title/description/hashtags
- Threshold: language confidence score >= 0.85 for German classification
- Hashtag signals: presence of any of the following in hashtag list qualifies as DACH automotive:
  - `#autohaus`, `#probefahrt`, `#sportwagen`, `#gebrauchtwagen`, `#tuning`, `#elektroauto`, `#neuewagen`, `#autotest`, `#fahrbericht`, `#autokauf`, `#gebrauchtwagenkauf`, `#dachautomotive`, `#deutschesauto`, `#bmw`, `#mercedes`, `#audi`, `#volkswagen`, `#porsche`, `#opel`
- English equivalents also tracked: `#carreview`, `#testdrive`, `#sportscar`, `#electriccar`, `#usedcar`, `#cardealer`, `#germancars`

**Geographic scoring:**
- Tier 1 DACH signal (high confidence): `defaultAudioLanguage == "de"` AND at least one DACH hashtag AND channel description language == German
- Tier 2 DACH signal (medium confidence): `defaultAudioLanguage == "de"` OR >= 2 DACH hashtags
- Tier 3 DACH signal (low confidence): at least 1 DACH hashtag OR German title/description
- Only Tier 1 and Tier 2 videos are included in VS computation; Tier 3 are stored but flagged `dach_signal_weak = true`

**Geo-distribution fallback formula (when platform geo API unavailable):**
```
estimated_DACH_pct = (
  0.5 × (language_is_german ? 1 : 0) +
  0.3 × min(dach_hashtag_count / 3, 1.0) +
  0.2 × (channel_country_in_DACH ? 1 : 0)
)
```
If `estimated_DACH_pct >= 0.40`, the video passes the geo filter.

---

## 4. Virality Score Formula

### 4.1 Component Metrics

#### A. Hook Strength Index (HSI)
```
HSI = (Viewers at T+3s / Total Impressions) × 100
```
- **Data source:** YouTube Analytics API `audienceWatchRatio` at `elapsedVideoTimeRatio = 0.05` (proxy for 3s on a 60s video) for owned channels. For non-owned channels: use CTR as proxy where available, otherwise set `HSI = null` and exclude from VS or substitute rolling niche average.
- **Benchmark:** Rolling 90-day average HSI for DACH automotive content stored in `niche_benchmarks` table. Initial seed value: 62% (derived from published YouTube Creator Academy data for short-form automotive content).
- **Alert thresholds:**
  - HSI < 55%: critical hook failure (red badge)
  - HSI 55–65%: below average (yellow badge)
  - HSI 65–75%: above average (blue badge)
  - HSI > 75%: top-decile hook (green badge)

#### B. Retention Drop-off Points (RDP) and Resilience Score
```
RDP_resilience_score = 1 - (sum(|dR/dt| for all t where dR/dt < -2.5%/s) / (video_length_seconds × 5.0))
```
- `dR/dt` = first derivative of retention curve at each second
- Critical drop-off: `dR/dt < -2.5%/s`
- 5.0 = normalizing constant (max plausible sum of drop-off magnitudes per second across a full video)
- Score range: 0.0 (catastrophic retention loss) to 1.0 (no drop-offs)
- Data source: `retention_curve` JSON from YouTube Analytics API (1-second resolution preferred, 5-second fallback). For non-owned channels: not available; substitute `RDP_resilience_score = 0.5` (neutral) and flag `rdp_estimated = true`.

#### C. Engagement Velocity (EV)
```
EV_1h  = (likes + shares + comments) accumulated in first 1 hour
EV_6h  = (likes + shares + comments) accumulated in first 6 hours
EV_24h = (likes + shares + comments) accumulated in first 24 hours

EV_normalized = min(EV_24h / EV_benchmark_90d_avg, 1.0)
```
- **Virality signal check:** `EV_1h / EV_24h > 0.35` = front-loaded virality (platform algorithm boost phase active)
- **EV_benchmark_90d_avg:** Rolling 90-day average EV_24h for DACH automotive content, stored per platform in `niche_benchmarks`. Seed values: YouTube = 850, TikTok = 2,400, Instagram = 420, Facebook = 310 (adjusted; reactions + comments + shares×1.5).
- **Data collection:** Scrape engagement metrics at publish + 1h, + 6h, + 24h. Store all three snapshots in `video_snapshots` table with timestamp. Compute EV values from the snapshot with the closest matching timestamp.

#### D. Audio Correlation Coefficient (ACC)
```
ACC = Pearson r between BPM and retention_at_50pct across all videos in rolling 90-day DACH automotive corpus

ACC_signal = |r| if (|r| > 0.6 AND p_value < 0.05) else 0.5
```
- This is a **corpus-level** correlation coefficient, not per-video. It answers: "In our dataset, does higher BPM correlate with higher mid-video retention?"
- Per-video contribution: the video's BPM is evaluated against the current corpus ACC signal. If the video's BPM falls within the optimal BPM range (determined by the corpus — the BPM decile with highest average mid-retention), `ACC_signal_per_video = 1.0`; if outside optimal range, scaled linearly down to 0.0.
- BPM extraction: AudD API or librosa. Target range for DACH automotive (seed benchmark): 95–125 BPM.
- Dominant frequency band: bass-heavy (< 300Hz), mid (300Hz–4kHz), treble-heavy (> 4kHz). Correlate each band with HSI across corpus.

#### E. Visual Pacing Index (VPI)
```
VPI = scene_changes_detected / (video_duration_seconds / 10)
```
(i.e., scene changes per 10 seconds)

```
VPI_optimal_match = 1 - (|VPI - 4.5| / 4.5)
VPI_optimal_match = max(0.0, VPI_optimal_match)
```
- Optimal target: 4.5 scene changes per 10 seconds for high-energy DACH automotive short-form
- VPI < 0.8: documentary/static style
- VPI 0.8–2.0: moderate pacing
- VPI 3.5–6.0: high-energy automotive (optimal range)
- VPI > 8.0: hypercut, potentially disorienting
- Tool: PySceneDetect `ContentDetector(threshold=27)` on downloaded/streamed video frames
- Fallback (no video access): VPI = null; substitute `VPI_optimal_match = 0.5` (neutral); flag `vpi_estimated = true`

#### F. View Velocity Bonus (VVB)
A binary bonus applied at the VS computation level to reward fast-breaking viral content:
```
VVB = 1 if (views_at_6h >= 50000 OR views_at_48h >= 500000) else 0
```
- VVB does not appear in the weighted sum formula below, but acts as a VS floor booster: if `VVB == 1` and computed VS < 0.60, apply `VS = max(VS, 0.60)` to ensure fast-breaking videos are never classified as Non-Viral regardless of incomplete metric data.

### 4.2 Master Virality Score Formula

```
VS = (0.30 × HSI_normalized)
   + (0.25 × EV_normalized)
   + (0.20 × RDP_resilience_score)
   + (0.15 × VPI_optimal_match)
   + (0.10 × ACC_signal_per_video)
```

Where:
```
HSI_normalized        = HSI / 100
EV_normalized         = min(EV_24h / EV_benchmark_90d_avg, 1.0)
RDP_resilience_score  = 1 - (sum_drop_magnitudes / (video_length_s × 5.0))
VPI_optimal_match     = max(0.0, 1 - |VPI - 4.5| / 4.5)
ACC_signal_per_video  = 1.0 if BPM_in_optimal_range else linear_decay_to_0
```

All five components are bounded [0.0, 1.0]. VS is therefore bounded [0.0, 1.0].

### 4.3 Virality Tiers

| VS Range | Tier | Action |
|---|---|---|
| VS >= 0.78 | Tier 1 — Viral | Trigger alert; pin to feed top; full metric breakdown |
| 0.60 <= VS < 0.78 | Tier 2 — High Performer | Include in feed with high-performer badge |
| VS < 0.60 | Non-Viral | Store in DB; exclude from main feed by default (visible via filter) |

### 4.4 Missing Data Substitution Policy

When a required metric cannot be computed due to API access limitations, apply these neutral substitutions to avoid biasing VS downward:

| Metric | Missing Condition | Substitution | Flag Field |
|---|---|---|---|
| HSI | Retention API unavailable (non-owned channel) | HSI = 62.0 (niche average seed) | `hsi_estimated = true` |
| RDP_resilience_score | Retention curve unavailable | 0.5 | `rdp_estimated = true` |
| VPI_optimal_match | Video file inaccessible | 0.5 | `vpi_estimated = true` |
| ACC_signal_per_video | BPM extraction failed | 0.5 | `acc_estimated = true` |
| EV_normalized | Only one snapshot available | Use available count / EV_benchmark × 0.5 | `ev_partial = true` |

A VS computed with 3 or more estimated components is flagged `vs_confidence = low` in the UI.

### 4.5 DACH Automotive Benchmarks (Seed Values — Update from Live Data After 90 Days)

| Metric | Seed Benchmark | Source |
|---|---|---|
| HSI 90d avg (YouTube) | 62% | YouTube Creator Academy automotive vertical |
| HSI 90d avg (TikTok) | 58% | Estimated; TikTok short-form norms skew lower than YouTube |
| HSI 90d avg (Instagram) | 60% | Estimated from Meta Business insights reports |
| HSI 90d avg (Facebook) | 60% | Estimated; avg_watch_time proxy — less precise than YouTube |
| EV_24h avg (YouTube) | 850 interactions | Estimated from public channel analytics surveys |
| EV_24h avg (TikTok) | 2,400 interactions | Estimated from TikTok business case studies |
| EV_24h avg (Instagram) | 420 interactions | Estimated from Meta Business insights reports |
| EV_24h avg (Facebook) | 310 interactions | Estimated; reactions + comments + shares×1.5; Facebook DACH automotive pages tend to have lower raw volume but higher share rates than Instagram |
| Optimal BPM range | 95–125 BPM | Music theory + automotive content production norms |
| Optimal VPI | 4.5 cuts/10s | Short-form automotive content production standard |
| View velocity Tier 1 | >= 50,000 views in 6h | DACH niche extrapolation from global benchmarks |

All seed values must be replaced with empirically computed values once 90 days of live data have been collected. Benchmarks are stored in `niche_benchmarks` table and recalculated via a nightly cron job.

---

## 5. Data Pipeline Architecture

### 5.1 Data Flow Overview

```
[Platform APIs / Scrapers]
         |
         v
[Next.js API Routes: /api/ingest/*]
  - Poll on schedule (Vercel Cron or node-cron)
  - Keyword + geo filter applied
  - Deduplication check vs. PostgreSQL
         |
         v
[Job Queue: BullMQ + Redis]
  - Queue: "video-analysis"
  - Priority: EV_1h > threshold = HIGH priority
         |
         v
[Worker Processes: /src/workers/]
  - Snapshot collector (T+1h, T+6h, T+24h)
  - Metric computation (HSI, EV, VPI, ACC, RDP, VS)
  - Optional: CV microservice HTTP call (Phase 2)
  - Optional: Audio analysis HTTP call or AudD API call
         |
         v
[PostgreSQL (primary store)]
  - video_analyses
  - video_snapshots
  - niche_benchmarks
  - alert_rules
  - settings
         |
         v
[Next.js App Router: /app/dashboard/*]
  - Server Components fetch from DB via Prisma
  - Client Components handle charts and interactions
  - SWR for real-time refresh (30-second polling on feed)
```

### 5.2 Polling Architecture

| Workflow | Trigger | Frequency | Action |
|---|---|---|---|
| Viral Detector | node-cron `*/30 * * * *` | Every 30 min | Search APIs for new DACH automotive videos; filter; enqueue new IDs |
| Snapshot Collector | BullMQ delayed job | At T+1h, T+6h, T+24h per video | Re-fetch engagement counts; store snapshot; recompute EV |
| Benchmark Recalculator | node-cron `0 3 * * *` | Nightly at 03:00 CET | Recompute all 90-day rolling averages; update `niche_benchmarks` |
| Alert Evaluator | BullMQ event on VS write | On every new VS computation | Evaluate all active alert rules; dispatch notifications if triggered |
| GDPR Cleanup | node-cron `0 4 * * 0` | Weekly Sunday 04:00 CET | Delete records older than configured TTL (default 90 days) |

### 5.3 Caching Strategy

- **API responses:** Cache raw YouTube/TikTok/Instagram/Facebook API responses in Redis with TTL = 6 hours (keyed by `platform:video_id:timestamp_bucket`). Prevents redundant API calls on repeated polls.
- **VS computation:** Cache computed VS in PostgreSQL `video_analyses.virality_score`. Only recompute on new snapshot arrival.
- **Niche benchmarks:** Cache in Redis with TTL = 24 hours (keyed by `benchmark:platform:metric`). Invalidated and refreshed by nightly cron.
- **Dashboard data:** Next.js `unstable_cache` with `revalidate = 60` seconds for server-side data fetches. Client uses SWR with `refreshInterval = 30000` on the viral feed.

### 5.4 Database Schema

```sql
-- Primary video analysis record
CREATE TABLE video_analyses (
  video_id              VARCHAR(255) PRIMARY KEY,
  platform              VARCHAR(20) NOT NULL,       -- 'youtube' | 'tiktok' | 'instagram' | 'facebook'
  publish_timestamp     TIMESTAMPTZ NOT NULL,
  title                 TEXT NOT NULL,
  channel_id            VARCHAR(255),
  channel_name          VARCHAR(255),
  video_url             TEXT,
  thumbnail_url         TEXT,
  duration_seconds      INTEGER,
  dach_signal_tier      SMALLINT,                   -- 1 | 2 | 3
  dach_signal_score     FLOAT,                      -- 0.0–1.0 from geo scoring formula
  geo_distribution      JSONB,                      -- {"DE": 0.45, "AT": 0.12, "CH": 0.09}
  hashtags              TEXT[],
  language_detected     VARCHAR(10),                -- ISO 639-1
  vehicle_category      VARCHAR(50),                -- 'Sportwagen' | 'SUV' | 'Elektroauto' etc.
  -- Hook metrics
  hsi                   FLOAT,
  hsi_estimated         BOOLEAN DEFAULT false,
  hsi_benchmark         FLOAT,
  -- Retention
  retention_curve       JSONB,                      -- [{"t": 0, "pct": 1.0}, ...]
  drop_off_points       JSONB,                      -- [{"t": 7, "magnitude": -3.2, "scene_type": "text_overlay"}]
  rdp_resilience_score  FLOAT,
  rdp_estimated         BOOLEAN DEFAULT false,
  -- Engagement velocity
  ev_1h                 FLOAT,
  ev_6h                 FLOAT,
  ev_24h                FLOAT,
  ev_partial            BOOLEAN DEFAULT false,
  ev_benchmark_90d      FLOAT,
  ev_share_weight       FLOAT DEFAULT 1.0,         -- 1.5 for facebook (shares weighted higher), 1.0 for all others
  -- Audio
  bpm                   FLOAT,
  dominant_freq_band    VARCHAR(20),                -- 'bass' | 'mid' | 'treble'
  audio_correlation     FLOAT,                      -- ACC corpus r value at time of analysis
  acc_signal_per_video  FLOAT,
  acc_estimated         BOOLEAN DEFAULT false,
  -- Visual pacing
  vpi                   FLOAT,
  vpi_optimal_match     FLOAT,
  vpi_estimated         BOOLEAN DEFAULT false,
  -- View velocity
  views_at_6h           BIGINT,
  views_at_48h          BIGINT,
  view_velocity_bonus   BOOLEAN DEFAULT false,
  -- Virality score
  virality_score        FLOAT,
  virality_tier         VARCHAR(20),               -- 'Tier1' | 'Tier2' | 'NonViral'
  vs_confidence         VARCHAR(10),               -- 'high' | 'medium' | 'low'
  -- CV annotations (Phase 2)
  cv_annotations        JSONB,
  -- Metadata
  analyzed_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  raw_api_response      JSONB                      -- cached raw response; purged after TTL
);

-- Engagement snapshots for EV computation
CREATE TABLE video_snapshots (
  id                    SERIAL PRIMARY KEY,
  video_id              VARCHAR(255) NOT NULL REFERENCES video_analyses(video_id) ON DELETE CASCADE,
  snapshot_at           TIMESTAMPTZ NOT NULL,
  hours_since_publish   FLOAT NOT NULL,             -- 1.0 | 6.0 | 24.0 | 48.0
  view_count            BIGINT,
  like_count            BIGINT,
  comment_count         BIGINT,
  share_count           BIGINT,
  UNIQUE(video_id, hours_since_publish)
);

-- Rolling niche benchmarks
CREATE TABLE niche_benchmarks (
  id                    SERIAL PRIMARY KEY,
  platform              VARCHAR(20) NOT NULL,       -- 'youtube' | 'tiktok' | 'instagram' | 'facebook'
  metric_name           VARCHAR(50) NOT NULL,       -- 'hsi_avg' | 'ev_24h_avg' | 'optimal_bpm_low' etc.
  metric_value          FLOAT NOT NULL,
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_days           INTEGER DEFAULT 90,
  sample_count          INTEGER,
  UNIQUE(platform, metric_name)
);

-- Alert rules
CREATE TABLE alert_rules (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  condition_json        JSONB NOT NULL,             -- {"field": "virality_score", "op": "gte", "value": 0.78}
  delivery_channel      VARCHAR(50),               -- 'in_app' | 'slack' | 'email'
  delivery_target       TEXT,                      -- Slack webhook URL or email address
  active                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Alert notification log
CREATE TABLE alert_notifications (
  id                    SERIAL PRIMARY KEY,
  rule_id               INTEGER NOT NULL REFERENCES alert_rules(id),
  video_id              VARCHAR(255) NOT NULL,
  triggered_at          TIMESTAMPTZ DEFAULT NOW(),
  delivered             BOOLEAN DEFAULT false,
  payload_json          JSONB
);

-- App settings (key-value)
CREATE TABLE app_settings (
  key                   VARCHAR(100) PRIMARY KEY,
  value                 TEXT NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_video_analyses_platform ON video_analyses(platform);
CREATE INDEX idx_video_analyses_publish_timestamp ON video_analyses(publish_timestamp DESC);
CREATE INDEX idx_video_analyses_virality_score ON video_analyses(virality_score DESC);
CREATE INDEX idx_video_analyses_virality_tier ON video_analyses(virality_tier);
CREATE INDEX idx_video_analyses_vehicle_category ON video_analyses(vehicle_category);
CREATE INDEX idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX idx_video_analyses_analyzed_at ON video_analyses(analyzed_at DESC);
```

### 5.5 Queue Architecture (BullMQ + Redis)

**Queue: `video-analysis`**

Job types:
- `INGEST_VIDEO` — payload: `{ video_id, platform, raw_data }` — priority: normal
- `COLLECT_SNAPSHOT` — payload: `{ video_id, target_hours }` — scheduled delayed job
- `COMPUTE_METRICS` — payload: `{ video_id }` — triggered after each snapshot
- `EXTRACT_AUDIO` — payload: `{ video_id, audio_url }` — priority: low
- `COMPUTE_VS` — payload: `{ video_id }` — triggered after all available metrics are written
- `EVALUATE_ALERTS` — payload: `{ video_id, virality_score }` — triggered after VS write

Worker concurrency: 5 concurrent jobs per worker process.
Redis: single instance (local dev) or Redis Cloud / Upstash (production).

---

## 6. Dashboard & UI Blueprint

### 6.1 Page Structure

| Route | Page | Description |
|---|---|---|
| `/` | Redirect to `/dashboard` | |
| `/dashboard` | Main Dashboard | Feed + KPI header + filter bar |
| `/dashboard/video/[id]` | Video Detail | Full metric breakdown for one video |
| `/dashboard/table` | Comparison Table | Sortable/filterable metric table |
| `/dashboard/trends` | Trend Analysis | Audio intelligence, VPI trends (Phase 2) |
| `/dashboard/heatmap` | DACH Heatmap | Geographic choropleth (Phase 2) |
| `/dashboard/alerts` | Alert Manager | Create/manage/log alert rules (Phase 2) |
| `/settings` | Settings | API keys, polling config, keyword lists |

### 6.2 Screen Blueprints

#### Screen 1: Main Dashboard (`/dashboard`)

```
+----------------------------------------------------------+
|  ViralContentFinder          [Refresh: 28m ago] [Settings]|
+----------------------------------------------------------+
|  KPI TILES                                               |
|  +----------+ +----------+ +----------+ +----------+    |
|  | 1,247    | | VS 0.71  | | TikTok   | | Elektro  |    |
|  | Videos   | | +0.04    | | Top Plat.| | Top Cat. |    |
|  | Analyzed | | vs. last | |          | |          |    |
|  +----------+ +----------+ +----------+ +----------+    |
+----------------------------------------------------------+
|  FILTER BAR                                              |
|  [Platform v] [Date Range v] [Category v] [Tier v] [Sort]|
+----------------------------------------------------------+
|  VIRAL FEED                                              |
|                                                          |
|  +------------------------------------------------------+|
|  | [THUMB] [T1] BMW M3 Probefahrt — krasses Driftcircle ||
|  |         MarcusAutoDE  •  YouTube  •  3h ago          ||
|  |         Views: 87,432  |  VS: 0.84  |  HSI: 78%      ||
|  |         EV_1h: 1,240   |  VPI: 5.2  |  BPM: 118      ||
|  +------------------------------------------------------+|
|  | [THUMB] [T1] Audi RS6 vs Tesla — Autobahn Test       ||
|  |         AutohausVienna •  TikTok  •  1h ago          ||
|  |         Views: 52,100  |  VS: 0.81  |  HSI: 71%      ||
|  |         EV_1h: 2,870   |  VPI: 4.8  |  BPM: 107      ||
|  +------------------------------------------------------+|
|  | [THUMB] [T2] VW Golf GTI Gebrauchtwagen Check        ||
|  |         AutoExperte    •  Reels   •  5h ago          ||
|  |         Views: 28,900  |  VS: 0.67  |  HSI: 63%      ||
|  |         EV_6h: 890     |  VPI: 3.1  |  BPM: 98       ||
|  +------------------------------------------------------+|
|  [Load more...]                                          |
+----------------------------------------------------------+
```

#### Screen 2: Video Detail (`/dashboard/video/[id]`)

```
+----------------------------------------------------------+
| < Back to Feed                                           |
|                                                          |
|  BMW M3 Probefahrt — krasses Driftcircle                 |
|  MarcusAutoDE  |  YouTube  |  Published: 2026-02-23 09:14|
|                                                          |
|  +-------------------+  +------------------------------+ |
|  | VIRALITY SCORE    |  | METRIC BREAKDOWN             | |
|  |                   |  |  HSI:  78% [=======  ] GREEN | |
|  |     0.84          |  |  EV:   0.92 (norm.)          | |
|  |   TIER 1          |  |  RDP:  0.87 resilience       | |
|  |   VIRAL           |  |  VPI:  5.2 (optimal: 4.5)    | |
|  |                   |  |  ACC:  BPM 118 — in range    | |
|  | Components:       |  |  VVB:  YES (50k+ at 6h)      | |
|  | HSI  |||||| 30%   |  +------------------------------+ |
|  | EV   |||||  25%   |                                   |
|  | RDP  ||||   20%   |  +------------------------------+ |
|  | VPI  |||    15%   |  | GEO DISTRIBUTION             | |
|  | ACC  ||     10%   |  |  DE 62% | AT 18% | CH 11%    | |
|  +-------------------+  |  Other 9%   [donut chart]    | |
|                         +------------------------------+ |
|                                                          |
| RETENTION CURVE                                          |
| 100%|                                                    |
|  80%| ~~~~~~~~~~~                                        |
|  60%|            ~~~~~~~~~~  ▼(t=23s, -4.1%/s)          |
|  40%|                    ~~~~~~~~~~~~~~                  |
|  20%|                                   ~~~~~~~~~~~~~~   |
|   0%+-------------------------------------------->      |
|     0s    10s    20s    30s    40s    50s    60s         |
|     --- niche avg  — this video  ▼ drop-off  ★ spike    |
|                                                          |
| ENGAGEMENT VELOCITY                                      |
|  +------------------+------------------+--------------+  |
|  | EV_1h: 1,240     | EV_6h: 3,890     | EV_24h: 8,420| |
|  |  [sparkline]     |  [sparkline]     | [sparkline]  | |
|  | EV_1h/EV_24h: 0.47 (front-loaded VIRAL signal)     | |
|  +------------------+------------------+--------------+  |
|                                                          |
| AUDIO ANALYSIS                                           |
|  BPM: 118 bpm  |  Band: Mid (300Hz–4kHz)               |
|  Optimal BPM range: 95–125 bpm  [IN RANGE: YES]         |
|  ACC corpus r = 0.68 (p < 0.01) — statistically signif. |
|                                                          |
| VISUAL PACING                                            |
|  VPI: 5.2 cuts/10s  |  Optimal: 4.5  |  Match: 0.84    |
|  Scene cut timeline:                                     |
|  [|||  || ||||||  |||   |||||  ||  |||]  (60s timeline) |
+----------------------------------------------------------+
```

#### Screen 3: Comparison Table (`/dashboard/table`)

```
+----------------------------------------------------------+
|  Metric Comparison Table                   [Export CSV]  |
|  [Filter: Platform v] [Tier v] [Date v] [Category v]     |
+----------------------------------------------------------+
| # | Title          | Plat | Pub  |Views  |HSI |EV_24h|VPI |BPM|VS  |Tier|
|---|----------------|------|------|-------|----|----- |----|---|----|----|
| 1 | BMW M3 Drift.. | YT   |02-23 | 87K   | 78%| 8,420|5.2 |118|0.84| T1 |
| 2 | Audi RS6 vs .. | TT   |02-23 | 52K   | 71%|12,100|4.8 |107|0.81| T1 |
| 3 | VW GTI Gebr.. | IG   |02-22 | 28K   | 63%| 3,890|3.1 | 98|0.67| T2 |
| 4 | Porsche Test  | FB   |02-22 | 21K   | 60%| 1,840|3.6 | 96|0.63| T2 |
| 5 | Mercedes EQS  | YT   |02-22 | 19K   | 58%| 1,200|2.3 | 88|0.54| NV |
+----------------------------------------------------------+
|  Showing 5 of 1,247 videos  |  < 1  2  3 ... >          |
+----------------------------------------------------------+
```

#### Screen 4: Settings (`/settings`)

```
+----------------------------------------------------------+
|  Settings                                                |
|                                                          |
|  API CONFIGURATION                                       |
|  YouTube Data API Key:  [**********************] [Edit]  |
|  Apify API Token:       [**********************] [Edit]  |
|  AudD API Key:          [**********************] [Edit]  |
|                                                          |
|  POLLING CONFIGURATION                                   |
|  Polling interval:      [30] minutes                     |
|  Platforms: [x] YouTube  [x] TikTok  [x] Instagram  [x] Facebook|
|                                                          |
|  DACH KEYWORDS                                           |
|  [#autohaus] [#probefahrt] [#sportwagen] [+ Add]         |
|  [#elektroauto] [#tuning] [#gebrauchtwagen]              |
|                                                          |
|  VIRALITY THRESHOLDS                                     |
|  Tier 1 VS floor:       [0.78]                           |
|  Tier 2 VS floor:       [0.60]                           |
|  HSI alert floor:       [55] %                           |
|                                                          |
|  DATA RETENTION (GDPR)                                   |
|  Raw API data TTL:      [90] days  [Save]                |
|  Anonymize channels:    [ ] Enable                       |
|                                                          |
|  [Save All Settings]                                     |
+----------------------------------------------------------+
```

### 6.3 Component Inventory

| Component | File | Description |
|---|---|---|
| `VideoCard` | `components/feed/VideoCard.tsx` | Feed card with thumbnail, metrics, tier badge |
| `ViralityScoreBadge` | `components/ui/ViralityScoreBadge.tsx` | Color-coded VS badge with tier label |
| `HSIBadge` | `components/ui/HSIBadge.tsx` | HSI % with red/yellow/blue/green coding |
| `RetentionCurveChart` | `components/charts/RetentionCurveChart.tsx` | Recharts LineChart with RDP markers |
| `EngagementVelocityPanel` | `components/charts/EngagementVelocityPanel.tsx` | EV_1h/6h/24h with sparklines |
| `SceneCutTimeline` | `components/charts/SceneCutTimeline.tsx` | Visual VPI timeline bar |
| `GeoDonuts` | `components/charts/GeoDonutChart.tsx` | Recharts PieChart for DE/AT/CH distribution |
| `KPITile` | `components/ui/KPITile.tsx` | Summary stat box |
| `FilterBar` | `components/feed/FilterBar.tsx` | Platform / date / category / tier / sort controls |
| `MetricTable` | `components/table/MetricTable.tsx` | TanStack Table sortable columns |
| `ComponentBreakdownBar` | `components/charts/ComponentBreakdownBar.tsx` | Stacked bar showing VS component weights |
| `DACHHeatmap` | `components/charts/DACHHeatmap.tsx` | Phase 2: Leaflet/React-Leaflet choropleth |
| `AlertRuleEditor` | `components/alerts/AlertRuleEditor.tsx` | Phase 2: Rule builder UI |

### 6.4 Key UI Interactions

- **Filter bar:** All filters are URL query parameters (e.g., `?platform=youtube&tier=Tier1&category=Sportwagen&range=7d`). This enables shareable filtered views and browser back/forward navigation.
- **Video card click:** Navigates to `/dashboard/video/[id]` (full page, not modal), ensuring SEO-friendly URL and direct link sharing.
- **Table sort:** Client-side sort on already-fetched page data using TanStack Table. Server-side sort for initial load via `?sort=virality_score&order=desc` query params.
- **CSV export:** Client-side export from current table state using `papaparse` — no server round-trip needed.
- **Retention curve tooltip:** On hover over chart, tooltip shows: `t={seconds}s | Retention: {pct}% | Scene: {scene_type} | Engagement delta: {delta}`.
- **Tier badge click:** Opens a tooltip explaining the VS formula and what the tier means — educational inline content for non-technical users.
- **Settings save:** Optimistic UI update; validated server-side before persistence; error toast on validation failure.

---

## 7. Tech Stack Decisions

### 7.1 Framework
- **Next.js 16 (App Router)** — already scaffolded. Use App Router exclusively. No Pages Router.
- **React 19** — already installed. Use Server Components for data-fetch-heavy pages; Client Components for interactive charts and filter controls.
- **TypeScript 5** — strict mode. All types defined in `src/types/`.

### 7.2 Database
- **PostgreSQL via Neon (serverless Postgres)** — justification: serverless scaling matches Vercel deployment model; Neon's connection pooling (PgBouncer) handles Next.js serverless function cold-start connection surge; JSONB columns available for retention curves and CV annotations; full SQL query support for complex metric aggregations.
- **ORM: Prisma 5** — type-safe queries; auto-generated TypeScript client; migration management via `prisma migrate`; compatible with Neon serverless driver (`@prisma/adapter-neon`).
- **Redis (Upstash)** — serverless Redis for BullMQ queue and API response cache. Upstash HTTP-based REST API works in Vercel serverless functions (no persistent connection required).

### 7.3 Queue System
- **BullMQ** with Upstash Redis. For local dev: local Redis via Docker (`docker run -p 6379:6379 redis:alpine`).
- Background workers run as a separate long-running Node.js process (not a Vercel function — cannot be serverless due to BullMQ worker requiring persistent connection). For production: deploy worker on Railway, Fly.io, or a small VPS alongside the Next.js app on Vercel.
- Worker entry point: `src/workers/index.ts` — run with `node --loader ts-node/esm src/workers/index.ts` or compiled.

### 7.4 State Management
- **No global state library needed for MVP.** Use:
  - React Server Components for initial data load
  - URL query parameters for filter state (managed with `nuqs` library for type-safe URL state)
  - SWR for client-side data freshness (feed refresh every 30s)
  - React `useState` + `useReducer` for local UI state (modal open, selected row, etc.)
- If Phase 2 complexity demands it: Zustand (lightweight, no boilerplate).

### 7.5 Charting Library
- **Recharts** — justification: React-native (no D3 imperative code); supports composable chart elements (custom dots, reference lines, tooltips) needed for retention curve RDP markers; active maintenance; works well with TypeScript.
- Custom chart components wrap Recharts primitives. Never import Recharts directly in page files — always via named components in `src/components/charts/`.
- For the DACH geographic heatmap (Phase 2): **React-Leaflet** with GeoJSON overlays for Bundesländer/Kantone polygons.

### 7.6 Authentication
- **NextAuth.js v5 (Auth.js)** — single-user / small team. Use GitHub OAuth or Google OAuth provider. Session stored in JWT (no database session table needed for MVP).
- All `/dashboard/*` and `/api/*` routes protected by middleware checking session.
- Settings page: additionally requires session role == 'admin' (single admin user for MVP).
- Future: role-based access (admin vs. read-only viewer) using Auth.js callbacks.

### 7.7 UI Component Library
- **Tailwind CSS v4** — already configured. Custom design tokens defined in `globals.css`.
- **shadcn/ui** — headless, copy-paste components. Install: `npx shadcn@latest init`. Use for: Button, Card, Badge, Table, Dialog, Sheet, Tooltip, Toast, Input, Select, Tabs.
- Do NOT install a full component library (MUI, Chakra) — Tailwind + shadcn provides sufficient flexibility.

### 7.8 Data Fetching
- **Server Components:** Use `fetch()` with `next: { revalidate: 60 }` for dashboard pages.
- **Client Components:** Use **SWR** (`swr` package) for real-time feed updates.
- **API calls from workers to external APIs:** Use native `fetch()` or `axios` (axios recommended for retry and timeout support in worker processes).
- **Prisma Client:** Singleton pattern — instantiate once in `src/lib/prisma.ts`, export and reuse.

### 7.9 Form Handling
- **React Hook Form** + **Zod** for the Settings page form. Zod schemas defined in `src/lib/validation/` and shared between client-side form validation and server-side API route validation.

### 7.10 Additional Libraries

| Package | Purpose |
|---|---|
| `nuqs` | Type-safe URL query parameter state |
| `swr` | Client-side data fetching with revalidation |
| `bullmq` | Job queue with Redis |
| `ioredis` | Redis client for BullMQ |
| `@prisma/client` + `prisma` | Database ORM |
| `@neondatabase/serverless` | Neon serverless Postgres driver |
| `axios` | HTTP client for worker API calls |
| `papaparse` | CSV export |
| `recharts` | Charts |
| `react-leaflet` + `leaflet` | Geographic heatmap (Phase 2) |
| `date-fns` | Date formatting and CET timezone handling |
| `zod` | Schema validation |
| `react-hook-form` | Form state management |
| `@tanstack/react-table` | Headless table for metric comparison |
| `node-cron` | Polling cron jobs in worker process |
| `langdetect` or `franc` | Language detection for DACH signal scoring |
| `next-auth` | Authentication (Auth.js v5) |
| `sonner` | Toast notifications |

---

## 8. API Routes

All routes under `/src/app/api/`. All routes require authenticated session (checked in middleware) except `/api/health`.

### 8.1 Ingestion Routes

#### `POST /api/ingest/trigger`
Manually trigger a full ingest cycle (also called by cron worker).
- **Input:** `{ platforms?: string[], keyword_override?: string[] }` (all optional)
- **Output:** `{ job_ids: string[], queued_count: number }`
- **Notes:** Enqueues INGEST_VIDEO jobs for all new videos found.

#### `POST /api/ingest/video`
Ingest a single video by ID (used for manual add or webhook).
- **Input:** `{ video_id: string, platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' }`
- **Output:** `{ video_id: string, status: 'queued' | 'already_exists' }`

### 8.2 Video Data Routes

#### `GET /api/videos`
List analyzed videos with filtering and pagination.
- **Input (query params):**
  - `platform?: string` — 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'all'
  - `tier?: string` — 'Tier1' | 'Tier2' | 'NonViral' | 'all'
  - `category?: string` — vehicle category slug
  - `range?: string` — '24h' | '7d' | '30d' | 'custom'
  - `date_from?: string` — ISO8601 (used with range=custom)
  - `date_to?: string` — ISO8601
  - `sort?: string` — 'virality_score' | 'ev_24h' | 'hsi' | 'publish_timestamp'
  - `order?: string` — 'asc' | 'desc'
  - `page?: number` — default 1
  - `per_page?: number` — default 20, max 100
- **Output:**
```json
{
  "data": [ VideoAnalysisSummary[] ],
  "total": 1247,
  "page": 1,
  "per_page": 20,
  "total_pages": 63
}
```

#### `GET /api/videos/[id]`
Full metric breakdown for a single video.
- **Input:** `id` path param (video_id)
- **Output:** `VideoAnalysisFull` — all fields from `video_analyses` + joined `video_snapshots[]`
- **Error:** `404` if not found

#### `GET /api/videos/[id]/snapshots`
All engagement snapshots for a video (for EV sparkline).
- **Input:** `id` path param
- **Output:** `{ snapshots: VideoSnapshot[] }` sorted by `hours_since_publish` asc

### 8.3 Metrics & Benchmarks Routes

#### `GET /api/benchmarks`
Current niche benchmarks for all platforms.
- **Input:** `platform?: string`
- **Output:**
```json
{
  "youtube":   { "hsi_avg": 62.3, "ev_24h_avg": 891,  "optimal_bpm_low": 95,  "optimal_bpm_high": 125 },
  "tiktok":    { "hsi_avg": 58.1, "ev_24h_avg": 2480, "optimal_bpm_low": 100, "optimal_bpm_high": 130 },
  "instagram": { "hsi_avg": 60.5, "ev_24h_avg": 435,  "optimal_bpm_low": 90,  "optimal_bpm_high": 120 },
  "facebook":  { "hsi_avg": 60.0, "ev_24h_avg": 310,  "optimal_bpm_low": 90,  "optimal_bpm_high": 120 }
}
```

#### `GET /api/metrics/summary`
Aggregate KPI summary for the dashboard header tiles.
- **Input:** `range?: string` — '24h' | '7d' | '30d'
- **Output:**
```json
{
  "total_videos_analyzed": 1247,
  "avg_vs_current_period": 0.71,
  "avg_vs_previous_period": 0.67,
  "top_platform": "tiktok",
  "top_vehicle_category": "Elektroauto"
}
```

#### `POST /api/metrics/recompute/[id]`
Force recomputation of all metrics for a video ID.
- **Input:** `id` path param
- **Output:** `{ job_id: string, status: 'queued' }`

### 8.4 Settings Routes

#### `GET /api/settings`
Retrieve all app settings.
- **Output:** `{ [key: string]: string }` key-value map

#### `PUT /api/settings`
Update one or more settings.
- **Input:** `{ [key: string]: string }` partial key-value map
- **Validation:** Zod schema checks value types (e.g., polling_interval must be 5–1440 minutes)
- **Output:** `{ updated: string[] }` list of updated keys

### 8.5 Alert Routes (Phase 2)

#### `GET /api/alerts/rules`
List all alert rules.
- **Output:** `AlertRule[]`

#### `POST /api/alerts/rules`
Create a new alert rule.
- **Input:** `{ name: string, condition_json: object, delivery_channel: string, delivery_target: string }`
- **Output:** `AlertRule`

#### `DELETE /api/alerts/rules/[id]`
Delete an alert rule.
- **Output:** `{ deleted: true }`

#### `GET /api/alerts/notifications`
Recent alert notification log.
- **Input:** `limit?: number` (default 50)
- **Output:** `AlertNotification[]`

### 8.6 Utility Routes

#### `GET /api/health`
Health check. No auth required.
- **Output:** `{ status: 'ok', db: 'connected' | 'error', redis: 'connected' | 'error', timestamp: string }`

#### `GET /api/export/csv`
Export current filtered video data as CSV.
- **Input:** Same query params as `GET /api/videos` (no pagination — exports all matching)
- **Output:** `text/csv` response with Content-Disposition header
- **Notes:** Capped at 10,000 rows to prevent timeout. GDPR note: exclude `raw_api_response` field.

---

## 9. File & Folder Structure

```
/Users/lukasstranzinger/Coding/ViralContentFinder/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (fonts, providers, auth)
│   │   ├── page.tsx                      # Root redirect to /dashboard
│   │   ├── globals.css                   # Tailwind base + design tokens
│   │   │
│   │   ├── (auth)/                       # Auth route group
│   │   │   └── login/
│   │   │       └── page.tsx              # NextAuth sign-in page
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Dashboard shell (sidebar, header)
│   │   │   ├── page.tsx                  # Main feed page (Server Component)
│   │   │   ├── video/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Video detail page (Server Component)
│   │   │   ├── table/
│   │   │   │   └── page.tsx              # Metric comparison table page
│   │   │   ├── trends/
│   │   │   │   └── page.tsx              # Trend analysis (Phase 2)
│   │   │   ├── heatmap/
│   │   │   │   └── page.tsx              # DACH heatmap (Phase 2)
│   │   │   └── alerts/
│   │   │       └── page.tsx              # Alert manager (Phase 2)
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx                  # Settings page
│   │   │
│   │   └── api/
│   │       ├── health/
│   │       │   └── route.ts
│   │       ├── ingest/
│   │       │   ├── trigger/
│   │       │   │   └── route.ts
│   │       │   └── video/
│   │       │       └── route.ts
│   │       ├── videos/
│   │       │   ├── route.ts              # GET /api/videos
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET /api/videos/[id]
│   │       │       └── snapshots/
│   │       │           └── route.ts
│   │       ├── benchmarks/
│   │       │   └── route.ts
│   │       ├── metrics/
│   │       │   ├── summary/
│   │       │   │   └── route.ts
│   │       │   └── recompute/
│   │       │       └── [id]/
│   │       │           └── route.ts
│   │       ├── settings/
│   │       │   └── route.ts
│   │       ├── alerts/
│   │       │   ├── rules/
│   │       │   │   ├── route.ts          # GET, POST
│   │       │   │   └── [id]/
│   │       │   │       └── route.ts      # DELETE
│   │       │   └── notifications/
│   │       │       └── route.ts
│   │       └── export/
│   │           └── csv/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── feed/
│   │   │   ├── VideoCard.tsx             # Individual video card
│   │   │   ├── VideoFeed.tsx             # Feed container with SWR
│   │   │   └── FilterBar.tsx             # Platform/date/tier/category filters
│   │   │
│   │   ├── charts/
│   │   │   ├── RetentionCurveChart.tsx   # Recharts line chart with markers
│   │   │   ├── EngagementVelocityPanel.tsx
│   │   │   ├── SceneCutTimeline.tsx      # Custom SVG timeline bar
│   │   │   ├── GeoDonutChart.tsx         # DE/AT/CH distribution
│   │   │   ├── ComponentBreakdownBar.tsx # VS component stacked bar
│   │   │   ├── EVSparkline.tsx           # Small EV sparkline
│   │   │   └── DACHHeatmap.tsx           # Phase 2: React-Leaflet choropleth
│   │   │
│   │   ├── metrics/
│   │   │   ├── ViralityScoreBadge.tsx
│   │   │   ├── HSIBadge.tsx
│   │   │   ├── MetricBreakdownPanel.tsx  # Full VS breakdown layout
│   │   │   └── AudioAnalysisPanel.tsx
│   │   │
│   │   ├── table/
│   │   │   └── MetricTable.tsx           # TanStack Table comparison table
│   │   │
│   │   ├── alerts/
│   │   │   ├── AlertRuleEditor.tsx       # Phase 2
│   │   │   └── AlertNotificationLog.tsx  # Phase 2
│   │   │
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── KPITileRow.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma singleton
│   │   ├── redis.ts                      # Upstash/ioredis singleton
│   │   ├── queue.ts                      # BullMQ queue definitions
│   │   ├── auth.ts                       # NextAuth config
│   │   ├── virality-score.ts             # VS formula computation (pure functions)
│   │   ├── dach-signal.ts                # DACH geo signal scoring logic
│   │   ├── benchmarks.ts                 # Benchmark fetch/cache utilities
│   │   └── validation/
│   │       ├── settings.schema.ts        # Zod: settings form validation
│   │       ├── alert-rule.schema.ts      # Zod: alert rule validation
│   │       └── ingest.schema.ts          # Zod: ingest input validation
│   │
│   ├── services/                         # External API integration clients
│   │   ├── youtube.ts                    # YouTube Data API v3 client
│   │   ├── tiktok.ts                     # TikTok Research API / Apify client
│   │   ├── instagram.ts                  # Meta Graph API / Apify client
│   │   ├── facebook.ts                   # Apify Facebook scraper + Meta Graph API Video Insights client
│   │   ├── audd.ts                       # AudD audio analysis client
│   │   └── apify.ts                      # Apify actor run/poll utilities
│   │
│   ├── workers/
│   │   ├── index.ts                      # Worker process entry point
│   │   ├── processors/
│   │   │   ├── ingest-video.ts           # INGEST_VIDEO job processor
│   │   │   ├── collect-snapshot.ts       # COLLECT_SNAPSHOT job processor
│   │   │   ├── compute-metrics.ts        # COMPUTE_METRICS job processor
│   │   │   ├── extract-audio.ts          # EXTRACT_AUDIO job processor
│   │   │   ├── compute-vs.ts             # COMPUTE_VS job processor
│   │   │   └── evaluate-alerts.ts        # EVALUATE_ALERTS job processor
│   │   └── cron.ts                       # node-cron schedule definitions
│   │
│   ├── types/
│   │   ├── video.ts                      # VideoAnalysis, VideoSummary, VideoSnapshot types
│   │   ├── metrics.ts                    # HSI, EV, VPI, ACC, VS types
│   │   ├── benchmark.ts                  # NicheBenchmark type
│   │   ├── alert.ts                      # AlertRule, AlertNotification types
│   │   └── api.ts                        # API request/response types
│   │
│   ├── hooks/
│   │   ├── useVideos.ts                  # SWR hook for video feed
│   │   ├── useVideoDetail.ts             # SWR hook for video detail
│   │   ├── useBenchmarks.ts              # SWR hook for benchmarks
│   │   └── useMetricsSummary.ts          # SWR hook for KPI tiles
│   │
│   └── test/
│       ├── setup.ts                      # Vitest setup (already exists)
│       ├── lib/
│       │   ├── virality-score.test.ts    # Unit tests for VS formula
│       │   └── dach-signal.test.ts       # Unit tests for geo scoring
│       ├── api/
│       │   ├── videos.test.ts            # API route integration tests
│       │   └── benchmarks.test.ts
│       └── components/
│           ├── VideoCard.test.tsx
│           └── ViralityScoreBadge.test.tsx
│
├── prisma/
│   ├── schema.prisma                     # Prisma schema (mirrors SQL schema above)
│   └── migrations/                       # Auto-generated migration files
│
├── public/
│   ├── geojson/
│   │   ├── germany-bundeslaender.geojson # Phase 2: geographic data
│   │   ├── austria-bundeslaender.geojson
│   │   └── switzerland-kantone.geojson
│   └── favicon.ico
│
├── .env.local                            # Local secrets (never commit)
├── .env.example                          # Template for required env vars
├── next.config.ts
├── prisma/schema.prisma
├── tailwind.config.ts                    # (if needed; Tailwind 4 uses CSS config)
├── vitest.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── tsconfig.json
```

### 9.1 Required Environment Variables (`.env.example`)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/viral_content_finder"

# Redis (Upstash for production, local for dev)
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# YouTube Data API v3
YOUTUBE_API_KEY=""

# Apify
APIFY_API_TOKEN=""

# AudD Audio API
AUDD_API_TOKEN=""

# Meta Graph API (Instagram owned accounts - Phase 2)
META_ACCESS_TOKEN=""

# Meta Graph API (Facebook Pages - Video Insights for owned pages)
# Requires pages_read_engagement + pages_show_list permissions
META_PAGE_ACCESS_TOKEN=""

# TikTok Research API (Phase 2 - approved access)
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""

# Alerts (Phase 2)
SLACK_WEBHOOK_URL=""
ALERT_EMAIL_FROM=""
ALERT_EMAIL_TO=""
```

---

## 10. Development Roadmap

### Phase 1: MVP (Target: 6–8 weeks)

#### Sprint 1 (Week 1–2): Foundation

| Task | Priority | Notes |
|---|---|---|
| Install and configure Prisma with Neon Postgres | P0 | Write `prisma/schema.prisma` mirroring the SQL schema above; run `prisma migrate dev` |
| Install and configure Redis + BullMQ | P0 | Docker Redis for local; Upstash env vars for production |
| Set up NextAuth v5 with GitHub OAuth | P0 | Protect all `/dashboard/*` and `/api/*` routes via middleware |
| Install shadcn/ui | P0 | Run `npx shadcn@latest init`; install: Button, Badge, Card, Input, Select, Table, Tooltip, Tabs, Dialog, Sheet, Sonner |
| Install Recharts, SWR, nuqs, date-fns, zod, react-hook-form, @tanstack/react-table | P0 | Add to `package.json` |
| Create `src/lib/prisma.ts` singleton | P0 | Standard Next.js + Prisma singleton pattern |
| Create `src/lib/redis.ts` singleton | P0 | ioredis or Upstash client |
| Create `src/lib/queue.ts` | P0 | Define all BullMQ queue and job type definitions |
| Implement `src/lib/virality-score.ts` | P0 | Pure functions for all 6 metric formulas; fully unit tested |
| Implement `src/lib/dach-signal.ts` | P0 | DACH geo scoring formula; unit tested |
| Write Vitest unit tests for VS formula | P0 | Target: 100% branch coverage; test all substitution edge cases |

#### Sprint 2 (Week 2–3): Data Ingestion

| Task | Priority | Notes |
|---|---|---|
| Implement `src/services/youtube.ts` | P0 | YouTube Data API v3: search + videos.list; rate limit handling; exponential backoff |
| Implement `src/services/apify.ts` | P0 | Apify actor run + status poll; generic for any actor |
| Implement `src/services/tiktok.ts` | P0 | Use Apify TikTok scraper as primary; TikTok Research API as optional upgrade path |
| Implement `src/services/instagram.ts` | P1 | Apify Instagram scraper; lower priority than YouTube/TikTok for MVP |
| Implement `src/services/facebook.ts` | P1 | Apify `apify/facebook-posts-scraper` as primary; Meta Graph API Video Insights as fallback for owned Pages; apply EV share weight 1.5; set `hsi_estimated = true` for all non-owned Reels; build seed list of ~50 DACH automotive Page IDs |
| Implement `src/workers/processors/ingest-video.ts` | P0 | Fetch video data; compute DACH signal tier; write to `video_analyses`; schedule snapshot jobs |
| Implement `src/workers/processors/collect-snapshot.ts` | P0 | Re-fetch engagement counts at T+1h, T+6h, T+24h; write to `video_snapshots` |
| Implement `src/workers/processors/compute-metrics.ts` | P0 | Compute EV from snapshots; fetch benchmarks; compute EV_normalized |
| Implement `src/workers/cron.ts` | P0 | node-cron at `*/30 * * * *` calling `POST /api/ingest/trigger` |
| Implement `src/workers/index.ts` entry point | P0 | Register all processors; start cron |
| Implement `POST /api/ingest/trigger` | P0 | Calls YouTube/TikTok/Instagram/Facebook services; deduplicates; enqueues INGEST_VIDEO jobs |
| Implement `POST /api/ingest/video` | P1 | Manual single-video ingest |
| Seed `niche_benchmarks` table with initial values | P0 | INSERT seed values from Section 4.5, including Facebook row (`hsi_avg=60.0`, `ev_24h_avg=310`) |

#### Sprint 3 (Week 3–4): Audio + VS Computation

| Task | Priority | Notes |
|---|---|---|
| Implement `src/services/audd.ts` | P1 | AudD API BPM extraction; fallback: skip BPM, set `acc_estimated = true` |
| Implement `src/workers/processors/extract-audio.ts` | P1 | Call AudD API; write BPM and dominant_freq_band to `video_analyses` |
| Implement `src/workers/processors/compute-vs.ts` | P0 | Assemble all components; run VS formula; write `virality_score` + `virality_tier` + `vs_confidence` |
| Implement `GET /api/benchmarks` | P0 | Read from `niche_benchmarks`; cache in Redis TTL 24h |
| Implement benchmark recalculation cron | P1 | Nightly at 03:00 CET; SQL aggregation over rolling 90d window |
| Implement GDPR cleanup cron | P1 | Weekly; delete `raw_api_response` column data and records beyond TTL |

#### Sprint 4 (Week 4–5): API + Dashboard Shell

| Task | Priority | Notes |
|---|---|---|
| Implement `GET /api/videos` | P0 | Full filter/sort/paginate logic; use Prisma with dynamic where clause |
| Implement `GET /api/videos/[id]` | P0 | Full record with snapshots |
| Implement `GET /api/metrics/summary` | P0 | Aggregate query for KPI tiles |
| Implement `GET /api/settings` and `PUT /api/settings` | P1 | Read/write `app_settings` table; Zod validation |
| Implement `GET /api/export/csv` | P1 | Streaming CSV response; papaparse |
| Implement `GET /api/health` | P0 | DB ping + Redis ping |
| Build dashboard layout: `app/dashboard/layout.tsx` | P0 | Sidebar + header shell |
| Build `components/layout/Sidebar.tsx` | P0 | Nav links: Feed, Table, Settings |
| Build `components/layout/Header.tsx` | P0 | App name, refresh timestamp, user menu |
| Build `components/layout/KPITileRow.tsx` | P0 | 4 KPI tiles, server component |

#### Sprint 5 (Week 5–6): Feed + Video Detail UI

| Task | Priority | Notes |
|---|---|---|
| Build `components/ui/ViralityScoreBadge.tsx` | P0 | |
| Build `components/ui/HSIBadge.tsx` | P0 | |
| Build `components/feed/VideoCard.tsx` | P0 | Thumbnail, metrics row, tier badge |
| Build `components/feed/FilterBar.tsx` | P0 | nuqs for URL state; platform/tier/category/date controls |
| Build `components/feed/VideoFeed.tsx` | P0 | SWR with refreshInterval=30000; infinite scroll |
| Build `app/dashboard/page.tsx` | P0 | Server Component: initial data + KPITileRow + VideoFeed |
| Build `components/charts/RetentionCurveChart.tsx` | P0 | Recharts ComposedChart; custom dot for RDP markers |
| Build `components/charts/EngagementVelocityPanel.tsx` | P0 | Three stat boxes + EVSparkline |
| Build `components/charts/GeoDonutChart.tsx` | P0 | Recharts PieChart |
| Build `components/charts/ComponentBreakdownBar.tsx` | P0 | Recharts BarChart stacked |
| Build `components/metrics/MetricBreakdownPanel.tsx` | P0 | Full VS breakdown layout assembly |
| Build `app/dashboard/video/[id]/page.tsx` | P0 | Server Component fetching full video detail |

#### Sprint 6 (Week 6–8): Table + Settings + Polish

| Task | Priority | Notes |
|---|---|---|
| Build `components/table/MetricTable.tsx` | P0 | TanStack Table; sortable columns; row click navigation |
| Build `app/dashboard/table/page.tsx` | P0 | |
| Build `app/settings/page.tsx` | P1 | React Hook Form + Zod; settings save with optimistic update |
| Build `src/hooks/useVideos.ts` | P0 | SWR hook wrapping GET /api/videos |
| Build `src/hooks/useVideoDetail.ts` | P0 | SWR hook wrapping GET /api/videos/[id] |
| Build `src/hooks/useMetricsSummary.ts` | P0 | SWR hook wrapping GET /api/metrics/summary |
| End-to-end test: ingest 10 YouTube videos, verify VS computation | P0 | Manual QA pass |
| Validate VS formula: backtest against 50 known DACH viral videos | P0 | Target Precision@10 > 80%: top 10 by VS must include >= 8 confirmed viral videos |
| Write Vitest integration tests for all API routes | P1 | Mock Prisma client |
| Deploy to Vercel (Next.js app) + Railway (worker process) | P1 | Set all env vars; verify cron firing |
| Write `.env.example` | P0 | Document all required env vars |

### Phase 2: Expansion (Weeks 9–16)

| Feature | Target Sprint | Depends On |
|---|---|---|
| DACH Geographic Heatmap (React-Leaflet + GeoJSON) | Week 9–10 | Real geo-distribution data from platform APIs |
| Audio Intelligence Panel (BPM histogram, scatter plot) | Week 9–10 | AudD BPM data from Phase 1 |
| Computer Vision pipeline (PySceneDetect + Mediapipe + YOLOv8) | Week 11–13 | External Python microservice containerized; deployed on Railway |
| CV annotations viewer in video detail page | Week 13–14 | CV pipeline complete |
| Trend Alerts system (rule builder + Slack/email dispatch) | Week 11–12 | Alert rules schema from Phase 1 |
| Competitor Channel Tracker | Week 13–14 | YouTube channel-level API calls |
| Content Calendar Recommendation (posting time heatmap) | Week 15–16 | 90+ days of EV data accumulated |
| YouTube Analytics API OAuth integration (for owned channels — real retention curves) | Week 15–16 | Auth.js provider expansion |
| Benchmark auto-update: replace seed values with empirically computed values | Week 13 | 90 days of live data; nightly benchmark recalculator running |
| Mobile-responsive dashboard layout | Week 11–12 | Phase 1 layout complete |

---

## Appendix A: GDPR Compliance Notes

This application collects social media video metadata. The following measures apply:

1. **Data minimization:** The `raw_api_response` JSONB column stores the full API response for debugging only. This field is purged after 7 days (separate TTL from the analysis record). Only derived metric fields are retained for 90 days.
2. **No personal data storage:** Channel names are stored for display purposes. No individual user/viewer personal data is collected.
3. **Data retention policy:** All records deleted after configurable TTL (default 90 days). Enforced by weekly GDPR cleanup cron job.
4. **Processing basis:** Social media content metadata is public data; processing for analytical purposes falls within legitimate interest under GDPR Art. 6(1)(f).
5. **Right to deletion:** If a channel owner requests deletion of their content's analysis data, a `DELETE /api/videos/[id]` route (admin-only) provides the mechanism.
6. **Data location:** Neon Postgres region should be set to `eu-west-1` (AWS Frankfurt) or `eu-central-1` to ensure data residency within the EU.
7. **No cross-border transfers:** Upstash Redis EU region; Vercel Frankfurt edge region for Next.js deployment.

---

## Appendix B: VS Formula Validation Protocol

Before declaring the VS formula production-ready, execute the following validation:

1. **Backtest corpus:** Collect 100 DACH automotive videos with known outcomes — 50 confirmed viral (verified by view velocity threshold), 50 confirmed non-viral.
2. **Compute VS** for all 100 using the formula in Section 4.2.
3. **Precision@10:** Sort all 100 by VS descending; check top 10 — target: >= 8 of top 10 are confirmed viral.
4. **Recall@20:** Of all 50 known viral videos, how many appear in the top 20 by VS? Target: >= 35 (70% recall).
5. **AUC-ROC:** Compute the AUC-ROC treating VS as a classifier score and viral/non-viral as binary label. Target: AUC > 0.80.
6. **If targets not met:** Adjust component weights in VS formula using logistic regression on the backtest corpus — fit weights `w1..w5` to maximize AUC, subject to constraint `sum(wi) = 1.0` and `wi >= 0`.
7. **Re-record validated weights** in this document and in `src/lib/virality-score.ts` with a comment citing the validation date and corpus size.

---

*End of document. This specification is complete and ready for handoff to a development agent.*
