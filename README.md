# 📅 Calendario de Exámenes — DAW

Calendario interactivo de exámenes del C.F.G.S. de Desarrollo de Aplicaciones Web (DAW), desarrollado en **HTML, CSS y JavaScript vanilla**, sin frameworks.

Incluye:
- Vista calendario tipo agenda
- Filtros por módulo con dropdown
- Chips interactivos con botón de cierre
- Buscador dentro del dropdown
- Diseño responsive (desktop / móvil)

---

## 🚀 Cómo verlo en local

⚠️ El proyecto utiliza `fetch()` para cargar datos, por lo que **no funciona abriendo el HTML directamente con `file://`**.

### Opción 1 — Live Server (VS Code)
1. Instala la extensión **Live Server**
2. Abre el proyecto en VS Code
3. Click derecho en `index.html`
4. Selecciona **Open with Live Server**

### Opción 2 — Servidor HTTP simple

Desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Luego abre en el navegador:

```
http://localhost:8000
```

---

## 📁 Estructura del proyecto

```txt
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── data/
│   └── examenes.json
└── img/
    └── icons/
        └── close.svg
```

---

## 📅 Selector de calendario

El calendario permite alternar entre los distintos ciclos formativos disponibles.

### Uso
1. Utiliza el selector **Calendario** situado en la parte superior de la página.
2. Selecciona el ciclo que deseas consultar (**DAM** o **DAW**).
3. El calendario se actualizará automáticamente mostrando los exámenes correspondientes al ciclo elegido.

No es necesario recargar la página.

### Observaciones
- Al cambiar de calendario se actualizan también los filtros y la leyenda.
- Cada calendario muestra únicamente los módulos del ciclo seleccionado.
- El funcionamiento es idéntico en escritorio y en dispositivos móviles.

### Formato de los archivos `*.json`

```json
{
  "events": [
    {
      "module": "prog",
      "label": "PROG",
      "title": "Programación",
      "day": "martes",
      "time": "12:00 - 15:00",
      "color": "#8338ec"
    }
  ]
}
```

### Reglas importantes
- Cada `module` debe ser único
- Los colores **no deben repetirse**
- El formato de hora debe ser exacto (`HH:MM - HH:MM`)
- Los días deben coincidir con los definidos en el código

---

## 🎛️ Funcionamiento de los filtros

### Dropdown de filtros
- Al hacer click en las chips o en el contenedor se abre el dropdown
- Click dentro del dropdown **no lo cierra**
- Click fuera **lo cierra**

### Checkboxes
- Permiten mostrar u ocultar exámenes por módulo
- Existe una opción de **Seleccionar todos**

### Buscador
- Filtra los módulos por nombre en tiempo real
- No afecta a los exámenes visibles, solo a la lista

---

## 🏷️ Chips de filtros

- Cada módulo seleccionado genera una chip
- Cada chip incluye un botón de cierre (❌)
- Al cerrar una chip:
  - Se desmarca el checkbox
  - Se ocultan los exámenes del módulo

Al final de las chips aparece el texto:
> **Click para filtrar**

que actúa como pista visual de interacción.

---

## 📱 Vista móvil

En resoluciones pequeñas:
- El calendario pasa a vista vertical
- Se añade un título por día antes de los eventos:

```
Martes 3 de febrero
Examen 1
Examen 2

Miércoles 4 de febrero
Examen 1
Examen 2
```

---

## 🤝 Contribuciones

### Pull Requests (PR)

❗ **No es necesario hacer fork del repositorio**

Flujo recomendado:
1. Crear una rama desde `main`
2. Realizar los cambios
3. Abrir un Pull Request contra `main`

### Reglas
- Mantener JS sin dependencias externas
- No romper la compatibilidad móvil
- No introducir frameworks

---

## 📄 Licencia

Uso educativo y personal.
