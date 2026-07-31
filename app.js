'use strict';

const CACHE_KEY = 'sterra_desktop_v1';
const CACHE_TTL = 60 * 60 * 1000;

const S = {
  unit: 'C',
  lat: null, lon: null,
  city: null, region: null,
  data: null,
};

const WMO = {
  0:  ['Clear Sky', '☀️'],
  1:  ['Mainly Clear', '🌤️'],
  2:  ['Partly Cloudy', '⛅'],
  3:  ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Icy Fog', '🌫️'],
  51: ['Light Drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Heavy Drizzle', '🌧️'],
  61: ['Light Rain', '🌧️'],
  63: ['Rain', '🌧️'],
  65: ['Heavy Rain', '🌧️'],
  71: ['Light Snow', '🌨️'],
  73: ['Snow', '❄️'],
  75: ['Heavy Snow', '❄️'],
  77: ['Snow Grains', '🌨️'],
  80: ['Showers', '🌦️'],
  81: ['Rain Showers', '🌧️'],
  82: ['Violent Showers', '⛈️'],
  85: ['Snow Showers', '🌨️'],
  86: ['Heavy Snow Showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm + Hail', '⛈️'],
  99: ['Severe Thunderstorm', '🌩️'],
};

function wmo(code) { return WMO[code] || ['Unknown', '🌡️']; }
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
  ['welcome-screen','loading-screen','error-screen','dashboard'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });
}

function render(data) {
  S.data = data;
  const cur = data.current;
  const daily = data.daily;
  const [cond, emoji] = wmo(cur.weather_code);

  document.getElementById('loc-city').textContent = S.city || '—';
  document.getElementById('loc-region').textContent = S.region || '—';
  document.getElementById('hero-temp').textContent = cvt(cur.temperature_2m);
  document.getElementById('hero-deg').textContent = sym();
  const iconEl = document.getElementById('hero-icon');
  iconEl.textContent = emoji;
  if ([0, 1].includes(cur.weather_code)) {
    iconEl.classList.add('spinning');
  } else {
    iconEl.classList.remove('spinning');
  }
  document.getElementById('hero-desc').textContent = cond;
  
  document.getElementById('hero-feels').textContent = fmt(cur.apparent_temperature);
  document.getElementById('hero-range').textContent = 
    `${fmt(daily.temperature_2m_min[0])} / ${fmt(daily.temperature_2m_max[0])}`;

  document.getElementById('sunrise-val').textContent = fmtTime(daily.sunrise[0]);
  document.getElementById('sunset-val').textContent = fmtTime(daily.sunset[0]);

  document.getElementById('st-humidity').textContent = `${cur.relative_humidity_2m}%`;
  document.getElementById('st-wind').textContent = `${cur.wind_speed_10m} km/h`;
  document.getElementById('st-uv').textContent = cur.uv_index?.toFixed(1) || '0';
  document.getElementById('st-pressure').textContent = `${Math.round(cur.surface_pressure)} hPa`;
  
  const vis = cur.visibility;
  document.getElementById('st-vis').textContent = vis >= 1000 ? `${(vis/1000).toFixed(1)} km` : `${vis} m`;
  document.getElementById('st-dew').textContent = fmt(cur.dew_point_2m);

  renderForecast(daily);

  show('dashboard');

  setTimeout(() => {
    drawHourlyChart(data.hourly);
  }, 50);

  updateTime();
  const now = new Date();
  document.getElementById('updated-ts').textContent = 
    `Last updated ${now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;

  show('dashboard');
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function updateTime() {
  const el = document.getElementById('loc-time');
  if (!el) return;
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  el.textContent = `${days[now.getDay()]} ${now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;
}
setInterval(updateTime, 60000);

function renderForecast(daily) {
  const row = document.getElementById('forecast-row');
  row.innerHTML = '';
  const DAY = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(daily.time[i]);
    const [_, emo] = wmo(daily.weather_code[i]);
    const hi = cvt(daily.temperature_2m_max[i]);
    const lo = cvt(daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'fc-card';
    card.innerHTML = `
      <div class="fc-day">${i === 0 ? 'TODAY' : DAY[d.getDay()]}</div>
      <div class="fc-icon">${emo}</div>
      <div class="fc-hi">${hi}°</div>
      <div class="fc-lo">${lo}°</div>
    `;
    row.appendChild(card);
  }
}

let chartAnimFrame;
let lastChartWidth = 0;

function drawHourlyChart(hourly) {
  const canvas = document.getElementById('hourly-chart');
  if (!canvas) return;
  if (chartAnimFrame) cancelAnimationFrame(chartAnimFrame);
  
  const W = canvas.parentElement.offsetWidth;
  lastChartWidth = W;
  const H = canvas.parentElement.offsetHeight;
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const nowH = new Date().getHours();
  const temps = hourly.temperature_2m.slice(nowH, nowH + 24).map(cvt);
  const times = hourly.time.slice(nowH, nowH + 24);

  if (temps.length < 2) return;

  const pad = { t: 30, r: 20, b: 30, l: 20 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const minT = Math.min(...temps) - 2;
  const maxT = Math.max(...temps) + 2;
  const rng = maxT - minT;

  const xS = i => pad.l + (i / (temps.length - 1)) * cW;
  const yS = t => pad.t + cH - ((t - minT) / rng) * cH;

  const startTime = performance.now();
  const duration = 800;

  function animate(time) {
    let prog = (time - startTime) / duration;
    if (prog > 1) prog = 1;
    
    const ease = 1 - Math.pow(1 - prog, 4);
    
    ctx.clearRect(0, 0, W, H);
    const clipW = W * ease;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, clipW, H);
    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(xS(0), yS(temps[0]));
    for (let i = 1; i < temps.length; i++) {
      const mx = (xS(i-1) + xS(i)) / 2;
      ctx.bezierCurveTo(mx, yS(temps[i-1]), mx, yS(temps[i]), xS(i), yS(temps[i]));
    }
    ctx.strokeStyle = '#0D0D0D';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.lineTo(xS(temps.length - 1), pad.t + cH);
    ctx.lineTo(xS(0), pad.t + cH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, H);
    grad.addColorStop(0, 'rgba(13, 13, 13, 0.1)');
    grad.addColorStop(1, 'rgba(13, 13, 13, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#0D0D0D';
    for (let i = 0; i < temps.length; i += 4) {
      const x = xS(i), y = yS(temps[i]);
      if (x > clipW) continue;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#FAFAF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '500 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(temps[i])}°`, x, y - 12);

      const h = new Date(times[i]).getHours();
      const lbl = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
      ctx.font = '400 11px Inter, sans-serif';
      ctx.fillStyle = '#7A7A7A';
      ctx.fillText(i === 0 ? 'Now' : lbl, x, H - 8);
      ctx.fillStyle = '#0D0D0D';
    }
    
    ctx.restore();
    
    if (prog < 1) {
      chartAnimFrame = requestAnimationFrame(animate);
    }
  }
  
  chartAnimFrame = requestAnimationFrame(animate);
}

const input = document.getElementById('city-input');
const sugBox = document.getElementById('suggestions');
let timer;

input.addEventListener('input', e => {
  clearTimeout(timer);
  const q = e.target.value.trim();
  if (q.length < 2) { sugBox.classList.add('hidden'); return; }
  timer = setTimeout(() => doSearch(q), 300);
});

async function doSearch(q) {
  try {
    const results = await geocode(q);
    if (!results.length) { sugBox.classList.add('hidden'); return; }
    
    sugBox.innerHTML = '';
    results.slice(0, 6).forEach(r => {
      const parts = [r.admin1, r.country].filter(Boolean).join(', ');
      const el = document.createElement('div');
      el.className = 'sug-item';
      el.innerHTML = `<strong>${r.name}</strong><small>${parts}</small>`;
      el.onclick = () => pick(r);
      sugBox.appendChild(el);
    });
    sugBox.classList.remove('hidden');
  } catch(e) {}
}

async function pick(loc) {
  sugBox.classList.add('hidden');
  input.value = '';
  S.lat = loc.latitude;
  S.lon = loc.longitude;
  S.city = loc.name;
  S.region = [loc.admin1, loc.country].filter(Boolean).join(', ');
  await load();
}

async function getUserLocation() {
  if (!navigator.geolocation) return;
  show('loading-screen');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      S.lat = pos.coords.latitude;
      S.lon = pos.coords.longitude;
      await reverseGeocode(S.lat, S.lon);
      await load();
    },
    () => {
      document.getElementById('error-msg').textContent = 'Location denied. Try searching.';
      show('error-screen');
    }
  );
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const d = await res.json();
    const a = d.address || {};
    S.city = a.city || a.town || a.village || 'My Location';
    S.region = [a.state, a.country].filter(Boolean).join(', ');
  } catch(e) {
    S.city = 'My Location';
    S.region = '';
  }
}

async function load() {
  show('loading-screen');
  try {
    const data = await fetchWeather(S.lat, S.lon);
    render(data);
  } catch(e) {
    show('error-screen');
  }
}

function retry() {
  if (S.lat && S.lon) load();
  else show('welcome-screen');
}

function setUnit(u) {
  S.unit = u;
  document.getElementById('unit-c').classList.toggle('active', u === 'C');
  document.getElementById('unit-f').classList.toggle('active', u === 'F');
  if (S.data) render(S.data);
}

window.addEventListener('resize', () => {
  const canvas = document.getElementById('hourly-chart');
  if (!canvas) return;
  const w = canvas.parentElement.offsetWidth;
  if (w !== lastChartWidth) {
    lastChartWidth = w;
    if (S.data) drawHourlyChart(S.data.hourly);
  }
});

(function init() {
  localStorage.removeItem(CACHE_KEY);
  show('welcome-screen');
})();
