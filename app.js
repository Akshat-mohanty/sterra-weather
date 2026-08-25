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
  
  const unitToggle = document.getElementById('unit-toggle-container');
  if (unitToggle) {
    unitToggle.classList.toggle('hidden', id !== 'dashboard');
  }

  const bgContainer = document.getElementById('weather-bg-container');
  if (bgContainer && id !== 'dashboard') {
    bgContainer.classList.remove('active');
  }
}

function getTimePhase(curTimeIso, sunriseIso, sunsetIso, isDay) {
  if (!curTimeIso || !sunriseIso || !sunsetIso) {
    return isDay ? 'day' : 'night';
  }
  const curMs = new Date(curTimeIso).getTime();
  const riseMs = new Date(sunriseIso).getTime();
  const setMs = new Date(sunsetIso).getTime();
  const hourMs = 60 * 60 * 1000;
  
  if (Math.abs(curMs - riseMs) <= 45 * 60 * 1000) {
    return 'dawn';
  }
  if (Math.abs(curMs - setMs) <= 45 * 60 * 1000) {
    return 'sunset';
  }
  if (curMs > setMs && (curMs - setMs) <= 1.2 * hourMs) {
    return 'dusk';
  }
  if (isDay === 1 || (curMs > riseMs && curMs < setMs)) {
    return 'day';
  }
  return 'night';
}

function getWeatherBgImage(cur, daily) {
  const code = cur.weather_code;
  const isDay = cur.is_day === 1;
  const temp = cur.temperature_2m;
  const curTime = cur.time;
  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];
  
  const phase = getTimePhase(curTime, sunrise, sunset, isDay);

  if (code >= 95) {
    return 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=90&w=2560&auto=format&fit=crop';
  }
  
  if ((code >= 71 && code <= 86) || (temp < 0 && (code >= 51 || code >= 61))) {
    if (phase === 'night' || phase === 'dusk') {
      return 'https://images.unsplash.com/photo-1516431883659-655d41c09bf9?q=90&w=2560&auto=format&fit=crop';
    }
    if (phase === 'dawn' || phase === 'sunset') {
      return 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=90&w=2560&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=90&w=2560&auto=format&fit=crop';
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    if (phase === 'night' || phase === 'dusk') {
      return 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=90&w=2560&auto=format&fit=crop';
    }
    if (phase === 'dawn' || phase === 'sunset') {
      return 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=90&w=2560&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1428592953211-077101b2021b?q=90&w=2560&auto=format&fit=crop';
  }

  if (code === 45 || code === 48) {
    if (phase === 'night' || phase === 'dusk') {
      return 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=90&w=2560&auto=format&fit=crop';
    }
    if (phase === 'dawn' || phase === 'sunset') {
      return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=90&w=2560&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1487621167305-5d248087c724?q=90&w=2560&auto=format&fit=crop';
  }

  if (code === 3) {
    if (phase === 'night' || phase === 'dusk') {
      return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=90&w=2560&auto=format&fit=crop';
    }
    if (phase === 'sunset' || phase === 'dawn') {
      return 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=90&w=2560&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=90&w=2560&auto=format&fit=crop';
  }

  if (code === 2) {
    if (phase === 'night') {
      return 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=90&w=2560&auto=format&fit=crop';
    }
    if (phase === 'sunset' || phase === 'dusk') {
      return 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=90&w=2560&auto=format&fit=crop';
    }
    if (phase === 'dawn') {
      return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=90&w=2560&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=90&w=2560&auto=format&fit=crop';
  }

  if (phase === 'night' || phase === 'dusk') {
    return 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=90&w=2560&auto=format&fit=crop';
  }
  if (phase === 'sunset') {
    return 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=90&w=2560&auto=format&fit=crop';
  }
  if (phase === 'dawn') {
    return 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=90&w=2560&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=90&w=2560&auto=format&fit=crop';
}

let ambientParticles = [];
let ambientAnimId = null;

function getAuroraGradient(code, phase, temp) {
  if (code >= 95) {
    return 'radial-gradient(circle at 50% 15%, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 75%)';
  }
  if ((code >= 71 && code <= 86) || temp < 0) {
    return 'radial-gradient(circle at 35% 20%, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.25) 45%, transparent 75%), radial-gradient(circle at 80% 70%, rgba(147, 197, 253, 0.2) 0%, transparent 60%)';
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'radial-gradient(circle at 60% 20%, rgba(2, 132, 199, 0.35) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 75%)';
  }
  if (phase === 'sunset' || phase === 'dusk') {
    return 'radial-gradient(circle at 75% 25%, rgba(245, 158, 11, 0.4) 0%, rgba(239, 68, 68, 0.25) 45%, transparent 75%)';
  }
  if (phase === 'dawn') {
    return 'radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.35) 0%, rgba(236, 72, 153, 0.2) 45%, transparent 75%)';
  }
  if (phase === 'night') {
    return 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.15) 50%, transparent 75%)';
  }
  return 'radial-gradient(circle at 50% 10%, rgba(253, 224, 71, 0.3) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 75%)';
}

function initAmbientParticles(code, phase, temp) {
  const canvas = document.getElementById('weather-ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (ambientAnimId) {
    cancelAnimationFrame(ambientAnimId);
    ambientAnimId = null;
  }

  canvas.width = window.innerWidth + 200;
  canvas.height = window.innerHeight + 200;

  let mode = 'ambient';
  if ((code >= 71 && code <= 86) || temp < 0) mode = 'snow';
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) mode = 'rain';
  else if (code >= 95) mode = 'storm';
  else if (phase === 'night') mode = 'stars';
  else if (phase === 'sunset' || phase === 'dawn') mode = 'ember';

  const count = mode === 'rain' ? 80 : mode === 'snow' ? 60 : mode === 'stars' ? 50 : 35;
  ambientParticles = [];

  for (let i = 0; i < count; i++) {
    ambientParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: mode === 'rain' ? (Math.random() * 1.5 + 1) : (Math.random() * 2.5 + 0.8),
      len: mode === 'rain' ? (Math.random() * 16 + 8) : 0,
      vy: mode === 'rain' ? (Math.random() * 12 + 8) : mode === 'snow' ? (Math.random() * 1.5 + 0.5) : (Math.random() * 0.4 - 0.2),
      vx: mode === 'rain' ? -1.5 : mode === 'snow' ? (Math.random() * 0.8 - 0.4) : (Math.random() * 0.4 - 0.2),
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2
    });
  }

  function draw() {
    if (!document.getElementById('weather-bg-container')?.classList.contains('active')) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let p of ambientParticles) {
      p.pulse += 0.03;
      const curAlpha = mode === 'stars' ? p.alpha * (0.6 + 0.4 * Math.sin(p.pulse)) : p.alpha;
      
      ctx.beginPath();
      if (mode === 'rain') {
        ctx.strokeStyle = `rgba(186, 230, 253, ${curAlpha * 0.6})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.len);
        ctx.stroke();
      } else if (mode === 'snow') {
        ctx.fillStyle = `rgba(255, 255, 255, ${curAlpha * 0.85})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (mode === 'ember') {
        ctx.fillStyle = `rgba(251, 191, 36, ${curAlpha * 0.7})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${curAlpha * 0.6})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      if (p.y < -20) { p.y = canvas.height + 20; }
      if (p.x > canvas.width + 20) { p.x = -20; }
      if (p.x < -20) { p.x = canvas.width + 20; }
    }

    ambientAnimId = requestAnimationFrame(draw);
  }

  draw();
}

function updateWeatherBg(cur, daily) {
  const container = document.getElementById('weather-bg-container');
  const imgEl = document.getElementById('weather-bg-image');
  const auroraEl = document.getElementById('weather-bg-aurora');
  if (!container || !imgEl || !cur) return;
  
  const imgUrl = getWeatherBgImage(cur, daily);
  const phase = getTimePhase(cur.time, daily?.sunrise?.[0], daily?.sunset?.[0], cur.is_day === 1);
  
  if (auroraEl) {
    auroraEl.style.background = getAuroraGradient(cur.weather_code, phase, cur.temperature_2m);
  }

  const img = new Image();
  img.src = imgUrl;
  img.onload = () => {
    imgEl.style.backgroundImage = `url('${imgUrl}')`;
    container.classList.add('active');
    initAmbientParticles(cur.weather_code, phase, cur.temperature_2m);
  };
}

function render(data) {
  S.data = data;
  S.timezone = data.timezone;
  const cur = data.current;
  const daily = data.daily;
  const [cond, emoji] = wmo(cur.weather_code);

  updateWeatherBg(cur, daily);

  document.getElementById('loc-city').textContent = S.city || '—';
  document.getElementById('loc-region').textContent = S.region || '—';
  document.getElementById('hero-temp').textContent = cvt(cur.temperature_2m);
  document.getElementById('hero-deg').textContent = sym();
  const iconEl = document.getElementById('hero-icon');
  iconEl.textContent = emoji;
  if (cur.weather_code === 0) {
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    el.textContent = `${formatter.format(now)}`;
  } catch(e) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  }
}
setInterval(updateTime, 10000);

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
  const rawTemps = hourly.temperature_2m.slice(nowH, nowH + 24).map(cvt);
  const rawTimes = hourly.time.slice(nowH, nowH + 24);

  if (rawTemps.length < 2) return;

  const step = W < 500 ? 4 : 3; 
  const temps = [];
  const times = [];
  for (let i = 0; i < rawTemps.length; i += step) {
    temps.push(rawTemps[i]);
    times.push(rawTimes[i]);
  }

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
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.lineTo(xS(temps.length - 1), pad.t + cH);
    ctx.lineTo(xS(0), pad.t + cH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, H);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < temps.length; i++) {
      const x = xS(i), y = yS(temps[i]);
      if (x > clipW) continue;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#0C1017';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '500 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(temps[i])}°`, x, y - 12);

      const h = new Date(times[i]).getHours();
      const lbl = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
      ctx.font = '400 11px Inter, sans-serif';
      ctx.fillStyle = '#A0AAB4';
      ctx.fillText(i === 0 ? 'Now' : lbl, x, H - 8);
      ctx.fillStyle = '#FFFFFF';
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
    results.slice(0, 6).forEach((r) => {
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
