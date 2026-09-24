# Design System: Monolithic Architectural Luxury

<!-- impeccable:design-schema 1 -->

## Overview
- **Archetype:** Monolithic Architectural Luxury
- **Concept:** Strict Black and White meteorological instrument inspired by classical monumental architecture and Swiss editorial typography.
- **Palette Strategy:** Committed Monochromatic Two-Tone (absolute black, deep graphite surfaces, crisp signal white, and muted stone grays).

## Color Tokens
- `--bg-black`: `#000000` (Canvas ground)
- `--bg-surface`: `#09090B` (Primary card & module ground)
- `--bg-elevated`: `#121215` (Elevated elements, active suggestion states)
- `--bg-subtle`: `#18181B` (Interactive pill buttons, controls)
- `--border-hairline`: `rgba(255, 255, 255, 0.10)` (Hairline architectural dividers)
- `--border-hover`: `rgba(255, 255, 255, 0.24)` (Hover elevation border)
- `--text-primary`: `#FFFFFF` (Headings, primary metrics, active state)
- `--text-secondary`: `#A1A1AA` (Descriptive labels, secondary values)
- `--text-muted`: `#71717A` (Monospace captions, metadata, unit indicators)

## Typography
- **Primary Typeface:** `Schibsted Grotesk` (Google Fonts, geometric Scandinavian/Swiss grotesk)
- **Hierarchy:**
  - Hero Display: `clamp(38px, 4.8vw, 68px)`, weight `500`, tracking `-0.035em`, line-height `1.08`
  - Monumental Temperature: `clamp(68px, 8vw, 104px)`, weight `400`, tabular numerals
  - Station Title: `clamp(28px, 3.5vw, 44px)`, weight `500`, tracking `-0.03em`
  - Section Headings: `20px`, weight `500`, tracking `-0.02em`
  - Telemetry Value: `clamp(26px, 2.4vw, 34px)`, weight `400`, tabular numerals
  - Monospace & Meta Tags: `11.5px`, weight `600`, letter-spacing `0.05em`, uppercase

## Corner Language & Radii
- **Buttons (Primary):** `6px` (architectural, austere, precise)
- **Cards & Modules:** `12px` to `14px` (refined chamfer)
- **Controls & Segmented Toggles:** `9999px` (pill contours)

## Component Anatomy
1. **Global Navigation:** Fixed translucent bar with 20px blur, brand monogram, search input with auto-suggestions, GPS location lock button, and `[°C / °F]` toggle.
2. **Monolithic Hero:** Split layout with left-aligned headline and pure white CTA button (`Explore Live Telemetry →`) alongside classical Parthenon fluted stone columns fading seamlessly into darkness.
3. **Manifesto Strip:** 4-column architectural grid articulating Foundation, Observatory, Architecture, and Navigation anchors.
4. **Primary Observation Deck:** Dual-card module presenting current temperature, condition badge, perceived temp, 24h range, and interactive astronomical solar transit arc.
5. **24-Hour Temperature Spline:** Precision canvas charting temperatures with smooth cubic bezier curve, white stroke, subtle gradient fill, and interactive hover scrubber on a millimeter grid.
6. **Six-Dimension Telemetry Rack:** 6 modular cards for Humidity, Pressure, Wind, UV, Visibility, and Dew Point.
7. **7-Day Weather Horizon:** 7-column forecast rack with bespoke vector weather icons and high/low temperature metrics.
