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

const DAY_LABELS = {
    'lunes': 'Lunes 2 de febrero',
    'martes': 'Martes 3 de febrero',
    'miércoles': 'Miércoles 4 de febrero',
    'jueves': 'Jueves 5 de febrero',
    'viernes': 'Viernes 6 de febrero'
};

const calendar = document.querySelector('.calendar');
const trigger = document.querySelector('.dropdown-trigger');
const filtersContainer = document.querySelector('.filters');
const dropdownPanel = filtersContainer.querySelector('.dropdown-panel');
const filterList = filtersContainer.querySelector('.filter-list');


/* ---------- MODULE EXTRACTION ---------- */

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

/* ---------- RENDER FILTERS FROM EVENTS ---------- */

function renderFiltersFromEvents(events) {
    const modules = extractModules(events);

    filterList.innerHTML = `
        ${modules.map(m => `
        <label
            class="filter-item"
            data-label="${m.label.toLowerCase()}"
        >
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
        `).join('')}
    `;
}


/* ---------- FETCH ---------- */

fetch('./data/examenes.json')
    .then(res => res.json())
    .then(data => {
        renderFiltersFromEvents(data.events);
        renderEvents(data.events);
        bindFilters();
        updateChips();
        renderLegend(data.events);
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

/* ---------- RENDER EVENTS ---------- */

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 55%)`;
}

function renderEvents(events) {
    const fragment = document.createDocumentFragment();
    const moduleColors = new Map();
    const renderedDays = new Set();

    events.forEach(e => {
        const day = e.day.toLowerCase();

        // 👉 Título de día (solo móvil, una vez por día)
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
    const moduleCheckboxes = filtersContainer.querySelectorAll(
        'input[data-module]'
    );
    const search = filtersContainer.querySelector('.filter-search');

    selectAll.addEventListener('change', () => {
        moduleCheckboxes.forEach(cb => {
            cb.checked = selectAll.checked;
            toggleModule(cb.value, cb.checked);
        });
        updateChips();
    });

    moduleCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            toggleModule(cb.value, cb.checked);
            selectAll.checked = [...moduleCheckboxes].every(c => c.checked);
            updateChips();
        });
    });

    // ➕ Buscador
    search.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        filtersContainer
            .querySelectorAll('.filter-item')
            .forEach(item => {
                item.hidden = !item.dataset.label.includes(q);
            });
    });

    updateChips();
}

/* ---------- HELPERS ---------- */

function toggleModule(moduleId, visible) {
    document
        .querySelectorAll('.module-' + moduleId)
        .forEach(event => {
            event.classList.toggle('hidden', !visible);
        });
}

function updateChips() {
    const chips = filtersContainer.querySelector('.chips');
    const checked = filtersContainer.querySelectorAll(
        'input[data-module]:checked'
    );

    if (!chips) return;

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



/* ---------- DROPDOWN LOGIC (FIXED) ---------- */

// Abrir / cerrar al pulsar chips o trigger
trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownPanel.classList.toggle('hidden');
});

// Click dentro del dropdown → NO cerrar
dropdownPanel.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Click fuera → cerrar
document.addEventListener('click', () => {
    dropdownPanel.classList.add('hidden');
});

filtersContainer.querySelector('.chips').addEventListener('click', (e) => {
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
        updateChips();

        // actualizar "seleccionar todo"
        const all = filtersContainer.querySelectorAll(
            'input[data-module]'
        );
        const selectAll = document.getElementById('filter-all');
        selectAll.checked = [...all].every(c => c.checked);
    }
});

/* ---------- LEGEND ---------- */

function renderLegend(events) {
    const legend = document.querySelector('.legend-list');
    if (!legend) return;

    const modules = extractModules(events);

    legend.innerHTML = `
      ${modules.map(m => `
        <div class="legend-item">
          <dt class="legend-label">
            <span
              class="legend-dot"
              style="--color:${m.color}"
              aria-hidden="true"
            ></span>
            <span title="${m.label}">
              ${m.label}
            </span>
          </dt>
          <dd class="legend-desc">
            ${m.name}
          </dd>
        </div>
      `).join('')}
    `;
}
