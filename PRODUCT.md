# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Atmosphere-conscious professionals, designers, travellers, and daily weather watchers seeking immediate meteorological clarity without advertising, invasive telemetry tracking, or sensory overload.

## Product Purpose

Sterra Weather exists to provide real-time atmospheric telemetry and astronomical cycles through an ethereal, museum-grade web interface. Success means delivering instant local atmospheric awareness—current conditions, 24-hour temperature dynamics, 7-day extended forecasts, and solar horizon metrics—with poetic visual fluidity and zero cognitive friction.

## Positioning

Unlike bloated commercial weather portals cluttered with clickbait banners, ads, and opaque tracking scripts, Sterra Weather is an open-data, client-side meteorological instrument powered directly by open APIs (Open-Meteo) and browser geolocation, treating atmospheric data with typographical elegance and atmospheric beauty.

## Operating Context

Desktop browsers, mobile devices, ambient displays, and design workspaces where users check conditions at a glance, plan their day or week, and track solar transitions (dawn, solar noon, dusk, twilight) in high fidelity.

## Capabilities and Constraints

- Instant reverse geocoding city search with auto-suggest across global locations.
- One-click native GPS device geolocation.
- Live Open-Meteo telemetry integration: temperature, weather condition code, humidity, wind velocity, UV index, surface barometric pressure, optical visibility, and dew point.
- Dynamic 24-hour hourly temperature curve with smooth interactive spline rendering.
- 7-day extended weather horizon cards with daily highs, lows, and condition iconography.
- Astronomical solar cycle calculator tracking astronomical dawn, solar zenith, golden hour, and twilight horizon.
- Client-side unit conversion (°C / °F) with instant persistence.
- Zero ad networks, zero analytics trackers, private in-browser state.

## Brand Commitments

- Brand Name: Sterra (or Sterra Weather).
- Visual Identity: Monolithic Architectural Luxury in strict Black & White — deep matte obsidian canvas (#000000 / #0C0C0D), pure white typography (#FFFFFF), muted ash secondary type (#71717A), dramatic grayscale architectural imagery, generous negative space, crisp white pill/rectangular CTAs, razor-sharp 1px dividers, and ultra-high-end editorial telemetry.
- Tone: Timeless, expensive, authoritative, architectural, and serene.

## Evidence on Hand

- Live Open-Meteo API integration with working geocoding and forecast endpoints.
- Existing vanilla JS implementation with canvas spline rendering (`app.js`).
- Complete repository with verified responsive CSS and HTML foundation.

## Product Principles

1. **Atmosphere as Material:** Weather is dynamic light, humidity, and pressure—the interface should breathe and adapt gracefully to celestial and atmospheric shifts.
2. **Precision Without Noise:** Every data point must be mathematically accurate, clearly labeled, and easily digested without chart clutter or fake visual embellishment.
3. **Respect for Attention:** Zero unsolicited prompts, zero trackers, fast sub-second client-side hydration, and frictionless keyboard-friendly interaction.
4. **Sculptural Fluidity:** Transitions, glass surfaces, and curves should evoke the organic fluidity of clouds, sunlight, and air.

## Accessibility & Inclusion

- High contrast text options and legible typography hierarchy.
- Semantic HTML landmark regions (`<header>`, `<main>`, `<section>`, `<footer>`).
- Full keyboard navigation for search, GPS, unit toggling, and card inspection.
- Respect for `prefers-reduced-motion` across animated gradients and canvas splines.
