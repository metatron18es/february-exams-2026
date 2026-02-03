/* ---------- CONFIG ---------- */

const BASE_HOUR = "08:30";
const SLOT_MINUTES = 30;
const HEADER_ROWS = 1;
const STORAGE_KEY = 'calendar-state';

const DAY_TO_COLUMN = {
    'lunes': 2,
    'martes': 3,
    'miércoles': 4,
    'jueves': 5,
    'viernes': 6
};

const DAY_LABELS = {
    'lunes': 'Lunes 2 de febrero',
    'martes': 'Martes 3 de febrero',
    'miércoles': 'Miércoles 4 de febrero',
    'jueves': 'Jueves 5 de febrero',
    'viernes': 'Viernes 6 de febrero'
};

const TITLES = {
    DAM: 'EXÁMENES PARCIALES DEL C.F.G.S. de D.A.M. – Del 2 al 6 de Febrero del 2026',
    DAW: 'EXÁMENES PARCIALES DEL C.F.G.S. de D.A.W. – Del 2 al 6 de Febrero del 2026'
};

/* ---------- DOM ---------- */

const calendarSelect = document.querySelector('.calendar-select');
const calendar = document.querySelector('.calendar');
const trigger = document.querySelector('.dropdown-trigger');
const filtersContainer = document.querySelector('.filters');
const dropdownPanel = filtersContainer.querySelector('.dropdown-panel');
const filterList = filtersContainer.querySelector('.filter-list');
const titleEl = document.querySelector('.calendar-title');
const baseCalendarHTML = calendar.innerHTML;

/* ---------- STORAGE ---------- */

function saveState(partial) {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...current, ...partial })
    );
}

function loadState() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

/* ---------- CALENDAR LIST ---------- */

function loadCalendars() {
    fetch('./data/index.json')
        .then(res => res.json())
        .then(data => {
            calendarSelect.innerHTML = data.calendars.map(c => `
                <option value="${c.id}">${c.label}</option>
            `).join('');

            const state = loadState();
            calendarSelect.value = state.calendar || data.calendars[0].id;

            loadCalendar(calendarSelect.value);
        });
}

/* ---------- FETCH CALENDAR ---------- */

function loadCalendar(name) {
    fetch(`./data/${name}.json`)
        .then(res => res.json())
        .then(data => {
            calendar.innerHTML = baseCalendarHTML;
            filterList.innerHTML = '';
            filtersContainer.querySelector('.chips').innerHTML = '';

            if (titleEl && TITLES[name]) {
                titleEl.textContent = TITLES[name];
            }

            renderFiltersFromEvents(data.events);
            renderEvents(data.events);
            bindFilters();
            restoreFilters();
            renderLegend(data.events);
        });
}

calendarSelect.addEventListener('change', e => {
    saveState({ calendar: e.target.value });
    loadCalendar(e.target.value);
});

/* ---------- TIME UTILS ---------- */

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function getRowFromTime(time) {
    const base = timeToMinutes(BASE_HOUR);
    const current = timeToMinutes(time);
    return HEADER_ROWS + 1 + (current - base) / SLOT_MINUTES;
}

function parseTimeRange(range) {
    const [start, end] = range.split(' - ');
    return {
        rowStart: getRowFromTime(start),
        rowEnd: getRowFromTime(end)
    };
}

/* ---------- MODULE EXTRACTION ---------- */

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 55%)`;
}

function extractModules(events) {
    const map = new Map();

    events.forEach(e => {
        if (!map.has(e.module)) {
            map.set(e.module, {
                id: e.module,
                label: e.label,
                color: e.color || randomColor(),
                name: e.title
            });
        }
    });

    return [...map.values()];
}

/* ---------- RENDER FILTERS ---------- */

function renderFiltersFromEvents(events) {
    const modules = extractModules(events);

    filterList.innerHTML = modules.map(m => `
        <label class="filter-item" data-label="${m.label.toLowerCase()}">
            <input
              type="checkbox"
              checked
              value="${m.id}"
              data-module="${m.id}"
              data-color="${m.color}"
            >
            <span class="color-dot" style="--color:${m.color}"></span>
            ${m.label}
        </label>
    `).join('');
}

/* ---------- RENDER EVENTS ---------- */

function renderEvents(events) {
    const fragment = document.createDocumentFragment();
    const moduleColors = new Map();
    const renderedDays = new Set();

    events.forEach(e => {
        const day = e.day.toLowerCase();

        if (!renderedDays.has(day)) {
            const dayTitle = document.createElement('div');
            dayTitle.className = 'day-title mobile-only';
            dayTitle.textContent = DAY_LABELS[day] ?? day;
            fragment.appendChild(dayTitle);
            renderedDays.add(day);
        }

        if (!moduleColors.has(e.module)) {
            moduleColors.set(e.module, e.color || randomColor());
        }

        const { rowStart, rowEnd } = parseTimeRange(e.time);
        const div = document.createElement('div');

        div.className = `event module-${e.module}`;
        div.style.gridColumn = DAY_TO_COLUMN[day];
        div.style.gridRow = `${rowStart} / ${rowEnd}`;
        div.style.setProperty('--event-color', moduleColors.get(e.module));
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
    const selectAll = document.getElementById('filter-all');
    const moduleCheckboxes = filtersContainer.querySelectorAll('input[data-module]');
    const search = filtersContainer.querySelector('.filter-search');

    selectAll.addEventListener('change', () => {
        moduleCheckboxes.forEach(cb => {
            cb.checked = selectAll.checked;
            toggleModule(cb.value, cb.checked);
        });

        saveState({
            visibleModules: selectAll.checked
                ? [...moduleCheckboxes].map(c => c.value)
                : []
        });

        updateChips();
    });

    moduleCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            toggleModule(cb.value, cb.checked);
            selectAll.checked = [...moduleCheckboxes].every(c => c.checked);

            saveState({
                visibleModules: [...moduleCheckboxes]
                    .filter(c => c.checked)
                    .map(c => c.value)
            });

            updateChips();
        });
    });

    search.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        saveState({ search: q });

        filtersContainer.querySelectorAll('.filter-item')
            .forEach(item => {
                item.hidden = !item.dataset.label.includes(q);
            });
    });
}

/* ---------- FILTER HELPERS ---------- */

function toggleModule(moduleId, visible) {
    document.querySelectorAll('.module-' + moduleId)
        .forEach(event => {
            event.classList.toggle('hidden', !visible);
        });
}

function updateChips() {
    const chips = filtersContainer.querySelector('.chips');
    const checked = filtersContainer.querySelectorAll('input[data-module]:checked');

    chips.innerHTML = `
        ${[...checked].map(cb => `
            <span class="chip" style="--color:${cb.dataset.color}" data-module="${cb.value}">
                <button class="chip-remove" aria-label="Quitar filtro">
                    <img src="img/icons/close.svg" alt="">
                </button>
                <span class="chip-label">
                    ${cb.closest('label').textContent.trim()}
                </span>
            </span>
        `).join('')}
        <span class="chips-hint">Pulsa para filtrar</span>
    `;
}

function restoreFilters() {
    const state = loadState();
    const all = filtersContainer.querySelectorAll('input[data-module]');
    const selectAll = document.getElementById('filter-all');

    if (!state.visibleModules) {
        all.forEach(cb => toggleModule(cb.value, true));
        selectAll.checked = true;
        updateChips();
        return;
    }

    all.forEach(cb => {
        const visible = state.visibleModules.includes(cb.value);
        cb.checked = visible;
        toggleModule(cb.value, visible);
    });

    selectAll.checked = [...all].every(c => c.checked);

    if (state.search) {
        const search = filtersContainer.querySelector('.filter-search');
        search.value = state.search;
        search.dispatchEvent(new Event('input'));
    }

    updateChips();
}

/* ---------- DROPDOWN ---------- */

trigger.addEventListener('click', e => {
    e.stopPropagation();
    dropdownPanel.classList.toggle('hidden');
});

dropdownPanel.addEventListener('click', e => e.stopPropagation());

document.addEventListener('click', () => {
    dropdownPanel.classList.add('hidden');
});

filtersContainer.querySelector('.chips').addEventListener('click', e => {
    const removeBtn = e.target.closest('.chip-remove');
    if (!removeBtn) return;

    e.stopPropagation();

    const chip = removeBtn.closest('.chip');
    const moduleId = chip.dataset.module;

    const checkbox = filtersContainer.querySelector(
        `input[data-module="${moduleId}"]`
    );

    if (checkbox) {
        checkbox.checked = false;
        toggleModule(moduleId, false);

        const all = filtersContainer.querySelectorAll('input[data-module]');
        saveState({
            visibleModules: [...all]
                .filter(c => c.checked)
                .map(c => c.value)
        });

        updateChips();

        const selectAll = document.getElementById('filter-all');
        selectAll.checked = [...all].every(c => c.checked);
    }
});

/* ---------- LEGEND ---------- */

function renderLegend(events) {
    const legend = document.querySelector('.legend-list');
    if (!legend) return;

    const modules = extractModules(events);

    legend.innerHTML = modules.map(m => `
        <div class="legend-item">
            <dt class="legend-label">
                <span class="legend-dot" style="--color:${m.color}"></span>
                ${m.label}
            </dt>
            <dd class="legend-desc">${m.name}</dd>
        </div>
    `).join('');
}

/* ---------- INIT ---------- */

loadCalendars();
