const BASE_HOUR = "08:30";
const SLOT_MINUTES = 30;
const HEADER_ROWS = 1;

const DAY_TO_COLUMN = {
    'lunes': 2,
    'martes': 3,
    'miércoles': 4,
    'jueves': 5,
    'viernes': 6
};

const calendar = document.querySelector('.calendar');
const filtersContainer = document.querySelector('.filters');

function extractModules(events) {
    const map = new Map();

    events.forEach(e => {
        if (!map.has(e.module)) {
            map.set(e.module, e.label);
        }
    });

    return [...map.entries()].map(([id, label]) => ({ id, label }));
}

function renderFiltersFromEvents(events) {
    const modules = extractModules(events);

    filtersContainer.innerHTML = modules.map(m => `
    <label>
      <input type="checkbox" checked value="${m.id}">
      ${m.label}
    </label>
  `).join('');
}

fetch('./data/examenes.json')
    .then(res => res.json())
    .then(data => {
        renderFiltersFromEvents(data.events);
        renderEvents(data.events);
        bindFilters();
    });

/* ---------- TIME UTILS ---------- */

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function getRowFromTime(time) {
    const base = timeToMinutes(BASE_HOUR);
    const current = timeToMinutes(time);
    const diff = current - base;

    return HEADER_ROWS + 1 + diff / SLOT_MINUTES;
}

function parseTimeRange(range) {
    const [start, end] = range.split(' - ');
    return {
        rowStart: getRowFromTime(start),
        rowEnd: getRowFromTime(end)
    };
}

/* ---------- RENDER FILTERS ---------- */

function renderFilters(modules) {
    filtersContainer.innerHTML = modules.map(m => `
    <label>
      <input type="checkbox" checked value="module-${m.id}">
      ${m.label}
    </label>
  `).join('');
}

/* ---------- RENDER EVENTS ---------- */
function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 55%)`;
}


function renderEvents(events) {
    const fragment = document.createDocumentFragment();

    events.forEach(e => {
        const { rowStart, rowEnd } = parseTimeRange(e.time);
        const div = document.createElement('div');
        const moduleClass = `module-${e.module}`;
        const color = e.color || randomColor();

        div.className = `event ${moduleClass}`;
        div.style.gridColumn = DAY_TO_COLUMN[e.day.toLowerCase()];
        div.style.gridRow = `${rowStart} / ${rowEnd}`;
        div.style.setProperty('--event-color', color);
        div.innerHTML = `
      ${e.title}
      <small>${e.time}</small>
    `;

        fragment.appendChild(div);
    });

    calendar.appendChild(fragment);
}

/* ---------- FILTER LOGIC ---------- */

function bindFilters() {
    document.querySelectorAll('.filters input').forEach(cb => {
        cb.addEventListener('change', () => {
            document.querySelectorAll('.module-' + cb.value).forEach(event => {
                event.classList.toggle('hidden', !cb.checked);
            });
        });
    });
}
