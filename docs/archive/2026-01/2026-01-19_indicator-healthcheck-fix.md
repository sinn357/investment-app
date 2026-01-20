# Indicator Health Check Fix (Updated 24h)

Date: 2026-01-19
Project: investment-app

## Context
- /indicators page showed stale Updated 24h counts even after manual crawl.
- Root cause: health-check logic used crawl_info based on a limited indicator list and Updated 24h only used crawl time.

## What Changed
1) Update status sharing and polling
- Redis-backed update_status to avoid instance mismatch and 0/54 stuck progress.
- Progress updates now reflect task completion order.
- Health check refreshes after manual update completes.

2) crawl_info coverage
- /api/v2/crawl-info now uses enabled indicators (54) instead of DB indicators table.
- Missing crawl_info entries are returned with status=missing.

3) Updated 24h logic
- Updated 24h now uses BOTH:
  - release_date/time (actual value date)
  - last_crawl_time (crawl attempt time)
- Updated 24h only counts when the time delta between release and crawl is within 24 hours.
- Healthy/Stale/Outdated now computed from the release_date vs last_crawl_time delta per user requirement.
- Crawl errors and missing crawl_info are classified as error.

## Verified By Manual Calculation
- Updated 24h = 10
- Matched indicators where release_date/time and last_crawl_time delta <= 24h:
  - ten-year-treasury
  - usd-index
  - usd-krw
  - terms-of-trade
  - brent-oil
  - wti-oil
  - vix
  - sp500-pe
  - shiller-pe
  - put-call-ratio

## Files Touched
- backend/app.py
- frontend/src/app/indicators/page.tsx

## Commits
- 82347ba fix: sync indicator update status
- d50f547 fix: refresh health check after updates
- 9dc6eba fix: include all indicators in crawl info
- 63c5b24 fix: align updated 24h with release time
- 17c5f6e fix: compute status from release vs crawl time

## Follow-up
- After pressing the update button, verify:
  - /api/v2/crawl-info returns 54 indicators
  - /api/v2/indicators/health-check updated_recent matches manual calculation
