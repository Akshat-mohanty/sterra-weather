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
  45: ['Fog', '☁️'],
  48: ['Icy Fog', '☁️'],
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

  if (id === 'welcome-screen') {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  }
}

function render(data) {
  S.data = data;
  S.timezone = data.timezone;
  const cur = data.current;
  const daily = data.daily;
  const [cond, emoji] = wmo(cur.weather_code);

  document.getElementById('loc-city').textContent = S.city || '—';
  const subnavCity = document.getElementById('subnav-city');
  if (subnavCity) subnavCity.textContent = S.city || '—';
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
  updateSignalLocationContext();

  show('dashboard');

  setTimeout(() => {
    drawHourlyChart(data.hourly);
  }, 50);

  updateTime();
  if (window.refreshExperienceTelemetry) window.refreshExperienceTelemetry('humidity');
  if (window.refreshSolarCycle) window.refreshSolarCycle();
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
    ctx.strokeStyle = '#121214';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.lineTo(xS(temps.length - 1), pad.t + cH);
    ctx.lineTo(xS(0), pad.t + cH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, H);
    grad.addColorStop(0, 'rgba(18, 18, 20, 0.08)');
    grad.addColorStop(1, 'rgba(18, 18, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#121214';
    for (let i = 0; i < temps.length; i++) {
      const x = xS(i), y = yS(temps[i]);
      if (x > clipW) continue;
      
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '500 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(temps[i])}°`, x, y - 10);

      const h = new Date(times[i]).getHours();
      const lbl = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillStyle = '#8e8e93';
      ctx.fillText(i === 0 ? 'NOW' : lbl, x, H - 8);
      ctx.fillStyle = '#121214';
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

function initExperienceTelemetry() {
  const tabs = document.querySelectorAll('.signal-tab');
  if (!tabs.length) return;
  const valueEl = document.getElementById('signal-value');
  const unitEl = document.getElementById('signal-unit');
  const titleEl = document.getElementById('signal-title');
  const copyEl = document.getElementById('signal-copy');
  const fillEl = document.getElementById('signal-meter-fill');
  const locationEl = document.getElementById('signal-location');
  const content = {
    humidity: ['Relative humidity', 'The amount of moisture present in the air, useful for reading comfort and cloud-building potential.', '%'],
    wind: ['Surface wind', 'How quickly air is moving at ten metres above the surface, where the day-to-day feel changes first.', ' km/h'],
    uv: ['UV exposure', 'A simple measure of ultraviolet intensity at the surface, useful for planning time outdoors.', ''],
    pressure: ['Surface pressure', 'The weight of the atmosphere above you. Changes can hint at shifting weather patterns.', ' hPa'],
    visibility: ['Horizontal visibility', 'The distance the atmosphere lets you see clearly, influenced by haze, moisture and precipitation.', ' km'],
    dew: ['Dew point', 'The temperature at which air becomes saturated and moisture starts to condense.', '°']
  };
  function update(key) {
    const c = S.data && S.data.current ? S.data.current : {};
    const values = { humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, uv: c.uv_index, pressure: c.surface_pressure, visibility: c.visibility == null ? null : +(c.visibility / 1000).toFixed(1), dew: c.dew_point_2m == null ? null : cvt(c.dew_point_2m) };
    const meta = content[key] || content.humidity;
    const number = values[key];
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.signal === key); });
    valueEl.textContent = number == null ? '—' : Math.round(number * 10) / 10;
    unitEl.textContent = meta[2];
    titleEl.textContent = meta[0];
    copyEl.textContent = meta[1];
    var pct = key === 'humidity' ? number : key === 'wind' ? Math.min((number || 0) / 18 * 100, 100) : key === 'uv' ? Math.min((number || 0) / 11 * 100, 100) : key === 'pressure' ? Math.min(Math.max(((number || 1000) - 960) / 90 * 100, 5), 100) : key === 'visibility' ? Math.min((number || 0) / 12 * 100, 100) : Math.min(Math.max(((number || 0) + 4) / 30 * 100, 5), 100);
    fillEl.style.width = Math.max(6, Math.min(100, pct || 8)) + '%';
    if (locationEl) locationEl.textContent = S.city ? S.city.toUpperCase() : 'SEARCH A LOCATION';
  }
  tabs.forEach(function(t) { t.addEventListener('click', function() { update(t.dataset.signal); }); });
  window.refreshExperienceTelemetry = update;
  update('humidity');
}

function updateSignalLocationContext() {
  const headline = document.getElementById('signal-headline-location');
  const subtitle = document.getElementById('signal-subtitle');
  const city = document.getElementById('signal-context-city');
  const meta = document.getElementById('signal-context-meta');
  const location = document.getElementById('signal-location');
  if (!S.city) return;
  if (headline) headline.textContent = S.city;
  if (subtitle) subtitle.textContent = S.region
    ? `Live atmospheric signals for ${S.city}, ${S.region}. Move through each layer to see what the sky is actually doing.`
    : `Live atmospheric signals for ${S.city}. Move through each layer to see what the sky is actually doing.`;
  if (city) city.textContent = S.city.toUpperCase();
  if (meta) meta.textContent = S.region ? `${S.region} · LOCAL ATMOSPHERE` : 'LOCAL ATMOSPHERE';
  if (location) location.textContent = S.city.toUpperCase();
}

function initSolarCycle() {
  var dawn = document.getElementById('solar-dawn');
  var noon = document.getElementById('solar-noon');
  var dusk = document.getElementById('solar-dusk');
  var loc = document.getElementById('solar-location');
  if (!dawn) return;
  function update() {
    var d = S.data && S.data.daily;
    if (d && d.sunrise && d.sunrise[0]) dawn.textContent = fmtTime(d.sunrise[0]);
    if (d && d.sunset && d.sunset[0]) dusk.textContent = fmtTime(d.sunset[0]);
    if (d && d.sunrise && d.sunrise[0] && d.sunset && d.sunset[0]) {
      var midpoint = (new Date(d.sunrise[0]).getTime() + new Date(d.sunset[0]).getTime()) / 2;
      noon.textContent = new Date(midpoint).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (loc) loc.textContent = S.city ? S.city.toUpperCase() + ' · LOCAL SOLAR WINDOW' : 'LOCAL SOLAR WINDOW';
  }
  window.refreshSolarCycle = update;
  update();
}

function initScrollAnimations() {
  const sections = document.querySelectorAll('.scroll-reveal-section');
  if (!sections.length) return;
  sections.forEach((section) => {
    section.style.transform = 'none';
    section.style.opacity = '1';
    section.style.filter = 'none';
    section.querySelectorAll('.scroll-reveal-card').forEach((card) => {
      card.style.transform = 'none';
    });
  });
}

function initShowcaseHero() {
  const headline = document.getElementById('headline');
  if (headline) {
    headline.textContent = "Weather that moves with you";
  }

  const burgerBtn = document.getElementById('burger-btn');
  const menuPanel = document.getElementById('menu-panel');
  let menuOpen = false;

  window.closeMenu = function() {
    if (menuOpen && burgerBtn && menuPanel) {
      menuOpen = false;
      burgerBtn.classList.remove('open');
      menuPanel.classList.remove('open');
      burgerBtn.setAttribute('aria-label', 'Open menu');
    }
  };

  if (burgerBtn && menuPanel) {
    burgerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menuOpen = !menuOpen;
      if (menuOpen) {
        burgerBtn.classList.add('open');
        menuPanel.classList.add('open');
        burgerBtn.setAttribute('aria-label', 'Close menu');
      } else {
        burgerBtn.classList.remove('open');
        menuPanel.classList.remove('open');
        burgerBtn.setAttribute('aria-label', 'Open menu');
      }
    });

    menuPanel.querySelectorAll('nav a').forEach(function(a) {
      a.addEventListener('click', function() {
        closeMenu();
      });
    });

    document.addEventListener('click', function(e) {
      if (menuOpen && !menuPanel.contains(e.target) && !burgerBtn.contains(e.target)) {
        closeMenu();
      }
    });
  }

  const SPOTLIGHT_R = 260;
  const canvas = document.getElementById('reveal-canvas');
  const imgLayer = document.getElementById('reveal-img');
  if (canvas && imgLayer) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.style.display = 'block';

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const mouse = { x: -999, y: -999 };
      const smooth = { x: -999, y: -999 };

      window.addEventListener('mousemove', function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });

      function loop() {
        if (mouse.x > -500 && mouse.y > -500) {
          smooth.x += (mouse.x - smooth.x) * 0.1;
          smooth.y += (mouse.y - smooth.y) * 0.1;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          var grad = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R);
          grad.addColorStop(0, 'rgba(255,255,255,1)');
          grad.addColorStop(0.4, 'rgba(255,255,255,1)');
          grad.addColorStop(0.6, 'rgba(255,255,255,0.75)');
          grad.addColorStop(0.75, 'rgba(255,255,255,0.4)');
          grad.addColorStop(0.88, 'rgba(255,255,255,0.12)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');

          ctx.beginPath();
          ctx.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          var dataUrl = canvas.toDataURL();
          imgLayer.style.webkitMaskImage = 'url(' + dataUrl + ')';
          imgLayer.style.maskImage = 'url(' + dataUrl + ')';
          imgLayer.style.webkitMaskSize = '100% 100%';
          imgLayer.style.maskSize = '100% 100%';
        }

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }
  }
}

(function init() {
  localStorage.removeItem(CACHE_KEY);
  show('welcome-screen');
  initScrollAnimations();
  initExperienceTelemetry();
  initSolarCycle();
  initShowcaseHero();
})();
