'use strict';

const CACHE_KEY = 'sterra_monolith_v1';
const CACHE_TTL = 60 * 60 * 1000;

const S = {
  unit: 'C',
  lat: null,
  lon: null,
  city: null,
  region: null,
  data: null,
  timezone: null,
  consoleOpen: false,
};

const SVG_ICONS = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  cloudSun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"/><path d="M15.5 13a4.5 4.5 0 0 0-8.5-1.5A4 4 0 0 0 3 15.5 4.5 4.5 0 0 0 7.5 20h8a4.5 4.5 0 0 0 0-9h-.5z"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
  fog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h16M2 18h20M7 10h10M17.5 10a4.5 4.5 0 0 0-8.5-1.5A4 4 0 0 0 5 10"/></svg>`,
  drizzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14H9a6 6 0 1 1 5.71-7.8h1.79a3.5 3.5 0 0 1 1 6.8Z"/><path d="m8 17-.5 2M12 17l-.5 2M16 17l-.5 2"/></svg>`,
  rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14H9a6 6 0 1 1 5.71-7.8h1.79a3.5 3.5 0 0 1 1 6.8Z"/><path d="m8 16-1 4M12 16l-1 4M16 16l-1 4"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14H9a6 6 0 1 1 5.71-7.8h1.79a3.5 3.5 0 0 1 1 6.8Z"/><path d="M8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01"/></svg>`,
  thunder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14H9a6 6 0 1 1 5.71-7.8h1.79a3.5 3.5 0 0 1 1 6.8Z"/><path d="m13 14-3 5h4l-2 5"/></svg>`
};

const WMO_MAP = {
  0:  ['Clear Sky', SVG_ICONS.sun],
  1:  ['Mainly Clear', SVG_ICONS.cloudSun],
  2:  ['Partly Cloudy', SVG_ICONS.cloudSun],
  3:  ['Overcast', SVG_ICONS.cloud],
  45: ['Atmospheric Fog', SVG_ICONS.fog],
  48: ['Rime Fog', SVG_ICONS.fog],
  51: ['Light Drizzle', SVG_ICONS.drizzle],
  53: ['Moderate Drizzle', SVG_ICONS.drizzle],
  55: ['Dense Drizzle', SVG_ICONS.drizzle],
  61: ['Slight Rain', SVG_ICONS.rain],
  63: ['Moderate Rain', SVG_ICONS.rain],
  65: ['Heavy Rain', SVG_ICONS.rain],
  71: ['Slight Snowfall', SVG_ICONS.snow],
  73: ['Moderate Snowfall', SVG_ICONS.snow],
  75: ['Heavy Snowfall', SVG_ICONS.snow],
  77: ['Snow Grains', SVG_ICONS.snow],
  80: ['Slight Showers', SVG_ICONS.rain],
  81: ['Moderate Showers', SVG_ICONS.rain],
  82: ['Violent Showers', SVG_ICONS.rain],
  85: ['Snow Showers', SVG_ICONS.snow],
  86: ['Heavy Snow Showers', SVG_ICONS.snow],
  95: ['Thunderstorm', SVG_ICONS.thunder],
  96: ['Thunderstorm & Hail', SVG_ICONS.thunder],
  99: ['Severe Thunderstorm', SVG_ICONS.thunder],
};

function wmo(code) {
  return WMO_MAP[code] || ['Atmospheric Telemetry', SVG_ICONS.cloud];
}

function toC(c) { return +c.toFixed(1); }
function toF(c) { return +(c * 9/5 + 32).toFixed(1); }
function cvt(c) { return S.unit === 'F' ? toF(c) : toC(c); }
function sym() { return S.unit === 'F' ? '°F' : '°C'; }
function fmt(c) { return `${cvt(c)}${sym()}`; }

function saveCache(lat, lon, data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      lat, lon, data, ts: Date.now(),
      city: S.city, region: S.region,
    }));
  } catch(e) {}
}

function loadCache(lat, lon) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (Math.abs(c.lat - lat) > 0.05 || Math.abs(c.lon - lon) > 0.05) return null;
    if (Date.now() - c.ts > CACHE_TTL) return null;
    return c.data;
  } catch(e) { return null; }
}

async function fetchWeather(lat, lon) {
  const cached = loadCache(lat, lon);
  if (cached) return cached;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  const p = url.searchParams;
  p.set('latitude', lat);
  p.set('longitude', lon);
  p.set('current', [
    'temperature_2m','apparent_temperature','weather_code',
    'relative_humidity_2m','wind_speed_10m','surface_pressure',
    'uv_index','visibility','dew_point_2m'
  ].join(','));
  p.set('hourly', 'temperature_2m,precipitation_probability');
  p.set('daily', [
    'weather_code','temperature_2m_max','temperature_2m_min',
    'precipitation_probability_max','sunrise','sunset'
  ].join(','));
  p.set('timezone', 'auto');
  p.set('forecast_days', '7');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  saveCache(lat, lon, data);
  return data;
}

async function geocode(q) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  return (await res.json()).results || [];
}

function show(id) {
  ['loading-screen', 'error-screen'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });
}

function render(data) {
  S.data = data;
  S.timezone = data.timezone;
  const cur = data.current;
  const daily = data.daily;
  const [cond, svgIcon] = wmo(cur.weather_code);

  const dashboard = document.getElementById('dashboard');
  if (dashboard) dashboard.classList.remove('hidden');

  const unitToggle = document.getElementById('unit-toggle-container');
  if (unitToggle) unitToggle.classList.remove('hidden');

  const navModeBtn = document.getElementById('nav-mode-btn');
  if (navModeBtn) {
    navModeBtn.textContent = 'Close Console';
    navModeBtn.setAttribute('onclick', 'returnToOverview()');
  }

  S.consoleOpen = true;

  const locCity = document.getElementById('loc-city');
  if (locCity) locCity.textContent = S.city || 'Observatory';

  const subnavCity = document.getElementById('subnav-city');
  if (subnavCity) subnavCity.textContent = S.city || 'Observatory';

  const locRegion = document.getElementById('loc-region');
  if (locRegion) locRegion.textContent = S.region || `${S.lat.toFixed(2)}°N, ${Math.abs(S.lon).toFixed(2)}°W`;

  const heroTemp = document.getElementById('hero-temp');
  if (heroTemp) heroTemp.textContent = cvt(cur.temperature_2m);

  const heroDeg = document.getElementById('hero-deg');
  if (heroDeg) heroDeg.textContent = sym();

  const heroIcon = document.getElementById('hero-icon');
  if (heroIcon) heroIcon.innerHTML = svgIcon;

  const heroDesc = document.getElementById('hero-desc');
  if (heroDesc) heroDesc.textContent = cond;

  const heroFeels = document.getElementById('hero-feels');
  if (heroFeels) heroFeels.textContent = fmt(cur.apparent_temperature);

  const heroRange = document.getElementById('hero-range');
  if (heroRange) {
    heroRange.textContent = `${fmt(daily.temperature_2m_min[0])} / ${fmt(daily.temperature_2m_max[0])}`;
  }

  const sunriseVal = document.getElementById('sunrise-val');
  if (sunriseVal) sunriseVal.textContent = fmtTime(daily.sunrise[0]);

  const sunsetVal = document.getElementById('sunset-val');
  if (sunsetVal) sunsetVal.textContent = fmtTime(daily.sunset[0]);

  updateSolarTransit(daily.sunrise[0], daily.sunset[0]);

  const stHumidity = document.getElementById('st-humidity');
  if (stHumidity) stHumidity.textContent = `${cur.relative_humidity_2m}%`;

  const stPressure = document.getElementById('st-pressure');
  if (stPressure) stPressure.textContent = `${Math.round(cur.surface_pressure)} hPa`;

  const stWind = document.getElementById('st-wind');
  if (stWind) stWind.textContent = `${cur.wind_speed_10m} km/h`;

  const stUv = document.getElementById('st-uv');
  if (stUv) stUv.textContent = cur.uv_index !== undefined ? cur.uv_index.toFixed(1) : '—';

  const stVis = document.getElementById('st-vis');
  if (stVis) {
    const vis = cur.visibility;
    stVis.textContent = vis >= 1000 ? `${(vis / 1000).toFixed(1)} km` : `${vis} m`;
  }

  const stDew = document.getElementById('st-dew');
  if (stDew) stDew.textContent = fmt(cur.dew_point_2m);

  renderForecast(daily);
  updateTime();

  setTimeout(() => {
    drawHourlyChart(data.hourly);
  }, 60);

  scrollToDashboard();
}

function updateSolarTransit(sunriseIso, sunsetIso) {
  if (!sunriseIso || !sunsetIso) return;
  const rise = new Date(sunriseIso).getTime();
  const set = new Date(sunsetIso).getTime();
  const now = Date.now();

  const total = set - rise;
  const progress = Math.min(Math.max((now - rise) / total, 0), 1);

  const activePath = document.getElementById('solar-active-path');
  const sunDot = document.getElementById('solar-sun-dot');
  const sunPulse = document.getElementById('solar-sun-pulse');

  if (activePath) {
    const totalLength = 420;
    const offset = totalLength - (totalLength * progress);
    activePath.style.strokeDashoffset = offset;
  }

  if (sunDot && sunPulse) {
    const startX = 30;
    const endX = 330;
    const currX = startX + (endX - startX) * progress;
    const currY = 140 - Math.sin(progress * Math.PI) * 120;

    sunDot.setAttribute('cx', currX);
    sunDot.setAttribute('cy', currY);
    sunPulse.setAttribute('cx', currX);
    sunPulse.setAttribute('cy', currY);
  }
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function updateTime() {
  const el = document.getElementById('loc-time');
  if (!el) return;
  try {
    const tz = S.timezone || S.data?.timezone;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || undefined,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    el.textContent = formatter.format(now).toUpperCase();
  } catch(e) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour12: false });
  }
}
setInterval(updateTime, 1000);

function renderForecast(daily) {
  const row = document.getElementById('forecast-row');
  if (!row) return;
  row.innerHTML = '';
  const DAY = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(daily.time[i]);
    const [_, svg] = wmo(daily.weather_code[i]);
    const hi = cvt(daily.temperature_2m_max[i]);
    const lo = cvt(daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'fc-card';
    card.innerHTML = `
      <div class="fc-day">${i === 0 ? 'TODAY' : DAY[d.getDay()]}</div>
      <div class="fc-icon">${svg}</div>
      <div class="fc-temps">
        <span class="fc-hi">${hi}°</span>
        <span class="fc-lo">${lo}°</span>
      </div>
    `;
    row.appendChild(card);
  }
}

let chartHoverX = null;

function drawHourlyChart(hourly) {
  const canvas = document.getElementById('hourly-chart');
  if (!canvas) return;

  const parent = canvas.parentElement;
  const W = parent.clientWidth;
  const H = parent.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const nowH = new Date().getHours();
  const rawTemps = hourly.temperature_2m.slice(nowH, nowH + 24).map(cvt);
  const rawTimes = hourly.time.slice(nowH, nowH + 24);

  if (rawTemps.length < 2) return;

  const minT = Math.min(...rawTemps);
  const maxT = Math.max(...rawTemps);
  const range = (maxT - minT) || 1;

  const padLeft = 40;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const gridSteps = 4;
  for (let g = 0; g <= gridSteps; g++) {
    const y = padTop + (plotH / gridSteps) * g;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(W - padRight, y);
    ctx.stroke();

    const tVal = (maxT - (range / gridSteps) * g).toFixed(0);
    ctx.fillStyle = '#71717A';
    ctx.font = '11px "Schibsted Grotesk", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${tVal}°`, padLeft - 10, y + 3);
  }
  ctx.setLineDash([]);

  const points = rawTemps.map((temp, i) => {
    const x = padLeft + (plotW / (rawTemps.length - 1)) * i;
    const y = padTop + plotH - ((temp - minT) / range) * plotH;
    return { x, y, temp, time: rawTimes[i] };
  });

  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.00)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  ctx.lineTo(points[points.length - 1].x, padTop + plotH);
  ctx.lineTo(points[0].x, padTop + plotH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#71717A';
  ctx.font = '11px "Schibsted Grotesk", sans-serif';
  ctx.textAlign = 'center';

  points.forEach((pt, idx) => {
    if (idx % 3 === 0 || idx === points.length - 1) {
      const dt = new Date(pt.time);
      const hStr = `${String(dt.getHours()).padStart(2, '0')}:00`;
      ctx.fillText(hStr, pt.x, H - 12);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  });

  if (chartHoverX !== null && chartHoverX >= padLeft && chartHoverX <= W - padRight) {
    let closest = points[0];
    let minDist = Infinity;
    points.forEach(pt => {
      const dist = Math.abs(pt.x - chartHoverX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(closest.x, padTop);
    ctx.lineTo(closest.x, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(closest.x, closest.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const dt = new Date(closest.time);
    const label = `${String(dt.getHours()).padStart(2, '0')}:00 · ${closest.temp}°`;
    ctx.font = '11.5px "Schibsted Grotesk", sans-serif';
    const textW = ctx.measureText(label).width;
    const boxX = Math.min(Math.max(closest.x - textW / 2 - 8, 10), W - textW - 26);
    const boxY = Math.max(closest.y - 32, 10);

    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, textW + 16, 22, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(label, boxX + 8, boxY + 15);
  }
}

function setupChartEvents() {
  const canvas = document.getElementById('hourly-chart');
  if (!canvas) return;

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    chartHoverX = e.clientX - rect.left;
    if (S.data?.hourly) drawHourlyChart(S.data.hourly);
  });

  canvas.addEventListener('mouseleave', () => {
    chartHoverX = null;
    if (S.data?.hourly) drawHourlyChart(S.data.hourly);
  });
}

async function loadLocation(lat, lon, cityName, regionName) {
  show('loading-screen');
  try {
    S.lat = lat;
    S.lon = lon;
    S.city = cityName;
    S.region = regionName;

    const data = await fetchWeather(lat, lon);
    render(data);
    show(null);
  } catch (err) {
    show('error-screen');
    const msg = document.getElementById('error-msg');
    if (msg) msg.textContent = err.message || 'Telemetry connection failed.';
  }
}

function getUserLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by this browser.');
    return;
  }
  show('loading-screen');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      let city = 'Local Coordinates';
      let region = `${lat.toFixed(2)}°N, ${Math.abs(lon).toFixed(2)}°W`;

      try {
        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        if (rev.ok) {
          const res = await rev.json();
          city = res.address?.city || res.address?.town || res.address?.village || city;
          region = res.address?.country || region;
        }
      } catch(e) {}

      loadLocation(lat, lon, city, region);
    },
    err => {
      loadLocation(37.7749, -122.4194, 'San Francisco', 'California, USA');
    },
    { timeout: 8000 }
  );
}

function setUnit(unit) {
  if (S.unit === unit) return;
  S.unit = unit;

  document.getElementById('unit-c')?.classList.toggle('active', unit === 'C');
  document.getElementById('unit-f')?.classList.toggle('active', unit === 'F');

  if (S.data) render(S.data);
}

function setupSearch() {
  const input = document.getElementById('city-input');
  const suggestions = document.getElementById('suggestions');
  if (!input || !suggestions) return;

  let debounceTimer;

  input.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    if (q.length < 2) {
      suggestions.classList.add('hidden');
      suggestions.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const results = await geocode(q);
        suggestions.innerHTML = '';
        if (results.length === 0) {
          suggestions.classList.add('hidden');
          return;
        }

        results.forEach(item => {
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          const reg = [item.admin1, item.country].filter(Boolean).join(', ');
          div.textContent = `${item.name}${reg ? ` — ${reg}` : ''}`;
          div.addEventListener('click', () => {
            input.value = '';
            suggestions.classList.add('hidden');
            loadLocation(item.latitude, item.longitude, item.name, reg);
          });
          suggestions.appendChild(div);
        });

        suggestions.classList.remove('hidden');
      } catch(e) {
        suggestions.classList.add('hidden');
      }
    }, 280);
  });

  input.addEventListener('keydown', async e => {
    if (e.key === 'Escape') suggestions.classList.add('hidden');
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q.length >= 2) {
        try {
          const results = await geocode(q);
          if (results.length > 0) {
            const item = results[0];
            const reg = [item.admin1, item.country].filter(Boolean).join(', ');
            input.value = '';
            suggestions.classList.add('hidden');
            loadLocation(item.latitude, item.longitude, item.name, reg);
          }
        } catch(err) {}
      }
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-search-container')) {
      suggestions.classList.add('hidden');
    }
  });
}

function focusSearch() {
  const input = document.getElementById('city-input');
  if (input) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      input.focus();
      const wrap = input.closest('.search-input-wrapper');
      if (wrap) {
        wrap.style.borderColor = '#FFFFFF';
        setTimeout(() => { wrap.style.borderColor = ''; }, 1200);
      }
    }, 350);
  }
}

function returnToOverview() {
  const dashboard = document.getElementById('dashboard');
  if (dashboard) dashboard.classList.add('hidden');

  const unitToggle = document.getElementById('unit-toggle-container');
  if (unitToggle) unitToggle.classList.add('hidden');

  const navModeBtn = document.getElementById('nav-mode-btn');
  if (navModeBtn) {
    navModeBtn.textContent = 'Search Station';
    navModeBtn.setAttribute('onclick', 'focusSearch()');
  }

  S.consoleOpen = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToDashboard() {
  const el = document.getElementById('dashboard');
  if (el) {
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function retryFetch() {
  if (S.lat && S.lon) {
    loadLocation(S.lat, S.lon, S.city, S.region);
  } else {
    loadLocation(37.7749, -122.4194, 'San Francisco', 'California, USA');
  }
}

window.addEventListener('resize', () => {
  if (S.data?.hourly && S.consoleOpen) drawHourlyChart(S.data.hourly);
});

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupChartEvents();
});
