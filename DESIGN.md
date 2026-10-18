# Design System: Editorial Luxury, Archetype & Tengile MalaMala Synthesis

<!-- impeccable:design-schema 1 -->

## Overview
- **Brand Identity:** Santerra (Santerra Weather)
- **Archetype:** Editorial Luxury & Observational Precision
- **Inspirations:** Archetype Studio, Tengile MalaMala Collection, Anthropic Design Language
- **Concept:** High-end architectural weather telemetry instrument presented in a tactile, warm ivory and slate aesthetic with terracotta and botanical olive accents. Zero artificial clutter, advertisements, or tracking scripts.

## Palette Tokens
- `--swatch--ivory-light`: `#FAF9F5` (Warm ivory canvas ground)
- `--swatch--ivory-medium`: `#F0EEE6` (Elevated card surfaces, module ground)
- `--swatch--ivory-dark`: `#E8E6DC` (Borders, track indicators, dividers)
- `--swatch--slate-dark`: `#141413` (Headings, primary numerals, high-contrast badges)
- `--swatch--slate-medium`: `#3D3D3A` (Body paragraphs, descriptive editorial copy)
- `--swatch--slate-light`: `#5E5D59` (Secondary labels, inactive controls)
- `--swatch--slate-faded`: `#71706B` (Monospace technical metadata, timestamps)
- `--swatch--slate-faded-10`: `rgba(20, 20, 19, 0.08)` (Hairline architectural grid lines)
- `--swatch--slate-faded-20`: `rgba(20, 20, 19, 0.18)` (Interactive card hover borders)
- `--swatch--clay`: `#D97757` (Primary interactive pill accent, active solar arc, spline chart curve)
- `--swatch--clay-hover`: `#C6613F` (Hover elevation state for primary actions)
- `--swatch--olive`: `#5C6E21` (Botanical luxury highlight from Tengile MalaMala)
- `--swatch--white`: `#FFFFFF` (Crisp elevated luxury card surfaces)

## Typography
- **Editorial Display Serif:** `Newsreader` / `Instrument Serif` (Google Fonts, editorial serif with italics for poetic headlines, station headers, and monumental numerals)
- **Primary Interface Sans:** `Plus Jakarta Sans` (Contemporary, highly legible geometric sans for UI controls and body prose)
- **Technical Telemetry Monospace:** `JetBrains Mono` (Sensor telemetry codes, chronometer timestamps, and tabular coordinates)

## Hierarchy & Scales
- **Hero Headline:** `clamp(2.5rem, 4.8vw, 4.25rem)`, weight `400`, letter-spacing `-0.025em`, line-height `1.08`
- **Monumental Reading:** `clamp(4.5rem, 8vw, 7rem)`, weight `300`, line-height `0.95`, tabular numerals
- **Station Name:** `clamp(1.75rem, 3.2vw, 2.5rem)`, weight `400`, letter-spacing `-0.02em`
- **Section Heading:** `clamp(1.65rem, 2.8vw, 2.4rem)`, weight `400`, letter-spacing `-0.02em`
- **Telemetry Values:** `1.25rem`, weight `600`, monospace
- **Metadata & Kicker Chips:** `0.7rem` to `0.75rem`, weight `600`, letter-spacing `0.08em`, uppercase

## Corner Language & Radii
- **Pills (Primary CTA, Toggles, Tags):** `9999px` (tactile pill silhouette)
- **Cards & Primary Modules:** `14px` (`--radius-md`)
- **Large Framed Surfaces:** `20px` (`--radius-lg`)
- **Micro Badges:** `4px` (`--radius-xs`)

## Component Anatomy
1. **Editorial Navigation:** Fixed translucent ivory bar with 14px backdrop blur, Archetype geometric monogram with clay core, pill search capsule with auto-complete and GPS locator, segmented `[ °C | °F ]` pill toggle, and clay action button with arrow `↗`.
2. **Editorial Hero:** Asymmetrical composition with editorial serif headline, italic emphasis, pill kicker badge, dual action buttons, and museum archival photo frame with hairline border and gallery caption.
3. **Manifesto Strip:** 4-column balanced grid with hairline vertical dividers articulating Signal, Coverage, Temporal Spline, and Privacy.
4. **Telemetry Architecture & Principles:** Multi-column tactile white cards with terracotta index numbers (`01`–`04`), botanical olive icon containers, and monospace parameter badges.
5. **Observation Deck:** Primary temperature card with condition badge, perceived temperature, 24h range, and interactive celestial solar transit arc with amber trajectory and pulsing sun dot.
6. **24-Hour Temperature Spline:** Interactive HTML5 canvas with smooth cubic bezier curve in terracotta clay (`#D97757`), subtle warm gradient fill, hairline grid, and interactive hover tooltip with time and temperature.
7. **Six-Dimension Surface Telemetry:** 6 modular sensor cards for Humidity, Pressure, Wind, UV, Visibility, and Dew Point.
8. **7-Day Weather Horizon:** 7-column forecast rack with vector iconography and high/low temperature metrics.
9. **Editorial Footer:** Wordmark, tagline, copyright, and repository links.
