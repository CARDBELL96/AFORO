# Tasks: Ajuste de Proporciones del Hero al 100 % y Página Independiente de Detalle y Compra

**Input**: Design documents from `/specs/001-frontend-proportions-and-ticket-page/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/ui-navigation-and-purchase-contract.md`, `quickstart.md`)
**Prerequisites**: `plan.md` (aprobado), `spec.md` (aprobado), `research.md`, `data-model.md`, `contracts/ui-navigation-and-purchase-contract.md`
**Tests & Evidence**: Incluye pruebas unitarias/regresión automatizadas (`node --import tsx --test`), validaciones visuales multi-resolución y multi-zoom (`100 %`, `150 %`, `200 %`), capturas de evidencia técnica (`before/` y `after/`) y mediciones cuantitativas de rendimiento.
**Organization**: Tareas descompuestas en unidades pequeñas, verificables y trazables a `FR-001`..`FR-013` y `SC-001`..`SC-007`, separando claramente:
1. Línea base y evidencia previa (Setup)
2. Enrutamiento con soporte de hash/nueva pestaña y sincronización multi-pestaña (Foundational)
3. Ajuste proporcional exclusivo del Hero y resguardo de regresión de secciones inferiores (`US1`)
4. Navegación diferenciada en nueva pestaña segura (`US2`)
5. Página completa de detalle, recinto y selección de entradas (`US3`)
6. Transparencia explícita del modo `DEMO` y regla de no-bloqueo visual de inventario (`US4`)
7. Evidencia posterior, mediciones verificables de rendimiento y validación final (Polish)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tarea paralelizable (archivos distintos, sin bloqueo mutuo).
- **[Story]**: Historia de usuario a la que pertenece (`[US1]`, `[US2]`, `[US3]`, `[US4]`).
- Cada tarea incluye la ruta exacta del archivo afectado y su trazabilidad entre corchetes (`FR-XXX`, `SC-XXX`).

---

## Phase 1: Setup & Baseline Technical Evidence (Before Changes)

**Purpose**: Verificar el estado inicial limpio del proyecto, registrar la huella (hash/métricas) de las hojas de estilo de las secciones inferiores para pruebas de no-regresión y capturar la evidencia visual **ANTES** de realizar cualquier cambio en `src/`.

- [X] T001 Verificar estado limpio de compilación y pruebas base ejecutando `npm run check` desde `package.json` y crear la estructura de evidencias en `specs/001-frontend-proportions-and-ticket-page/evidence/before/` y `specs/001-frontend-proportions-and-ticket-page/evidence/after/` [FR-004, SC-002]
- [X] T002 [P] Capturar capturas de pantalla **ANTES** del Hero al `100 %`, `150 %` y `200 %` de zoom en las resoluciones `1366×768`, `1440×900`, `1920×1080`, `768×1024` (tablet) y `390×844` (móvil) y guardarlas en `specs/001-frontend-proportions-and-ticket-page/evidence/before/` [FR-001, FR-003, SC-001, SC-006]
- [X] T003 [P] Capturar capturas de pantalla **ANTES** de las secciones inferiores («01 // Programación en pulso», «02 // Seis movimientos que mueven la escena», «03 // Descubre el Perú en vivo», cierre y explorador `/eventos`) y del flujo actual con `EventQuickModal` al `100 %` de zoom, guardándolas en `specs/001-frontend-proportions-and-ticket-page/evidence/before/` [FR-004, FR-007, FR-013, SC-002]

---

## Phase 2: Foundational — Enrutamiento y Sincronización entre Pestañas (Blocking Prerequisites)

**Purpose**: Infraestructura transversal de enrutamiento (`hash` + apertura segura en nueva pestaña) y sincronización multi-pestaña (`storage` event) necesaria antes de implementar las historias de navegación y compra.

**⚠️ CRITICAL**: Ninguna historia de usuario (`US1`..`US4`) debe darse por cerrada sin que esta fase esté completa y con sus pruebas en verde.

- [X] T004 Escribir pruebas unitarias en `src/router.test.ts` que validen la resolución de `/eventos/:slug`, la preservación de `hash` (`#entradas`) al construir/parsear URLs y el contrato de atributos de seguridad (`target="_blank"` y `rel="noopener noreferrer"`) para enlaces en nueva pestaña [FR-007, FR-008, FR-009, SC-003]
- [X] T005 Actualizar `useRoute()` y `<Link>` en `src/router.tsx` para exponer el `hash` actual (`window.location.hash`), escuchar `hashchange` y soportar la prop `newTab?: boolean` (aplicando `target="_blank" rel="noopener noreferrer"` sin interceptar el clic con `e.preventDefault()`) [FR-008, FR-009, SC-003, SC-004]
- [X] T006 [P] Implementar la sincronización reactiva entre pestañas en `src/lib/store.tsx` suscribiendo `StoreProvider` a `window.addEventListener('storage', ...)` sobre las claves `aforo.fusion.cart.v1`, `aforo.fusion.saved.v1` y `aforo.fusion.tickets.v1` [FR-011, SC-005]
- [X] T007 [P] Agregar pruebas de integración de la sincronización real de `StoreProvider` en `src/lib/store.test.ts` (además de las pruebas unitarias en `src/lib/cart.test.ts`), simulando eventos `StorageEvent` sobre `aforo.fusion.cart.v1`, `aforo.fusion.saved.v1` y `aforo.fusion.tickets.v1` y verificando que el estado expuesto por `StoreProvider` se actualiza reactivamente entre contextos sin considerar suficiente una prueba aislada de serialización de `cart.ts` [FR-011, SC-005]

**Checkpoint**: `npm run check` pasa al 100 %; el enrutador soporta `newTab` + `hash` y el store sincroniza estado entre pestañas abiertas.

---

## Phase 3: User Story 1 - Primera Pantalla (Hero) Equilibrada al 100 % de Zoom sin Alterar Secciones Posteriores (Priority: P1) 🎯 MVP

**Goal**: Ajustar exclusivamente la primera pantalla (`<Hero />` y selectores `.hero*`) para lograr de forma nativa al **100 % de zoom** la proporción compacta y equilibrada que antes se percibía al 70 %, eliminando el recorte horizontal del titular principal («LA NOCHE / NO SE CUENTA. / se vive.») y garantizando mediante pruebas de regresión que las secciones inferiores conservan intactas sus dimensiones y composición.

**Independent Test**: Ejecutar la prueba automatizada de regresión de estilos (`src/styles/regression.test.ts`) y abrir `/` al `100 %`, `150 %` y `200 %` de zoom en `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844`, comprobando que el titular se muestra completo sin recortes, el Hero está equilibrado entre izquierda y derecha, y las secciones inferiores mantienen idénticas sus dimensiones computadas.

### Tests de Regresión para User Story 1

> **NOTE**: Escribir y ejecutar primero la prueba de regresión para proteger las secciones inferiores antes de editar `src/styles/home.css`.

- [X] T008 [US1] Crear prueba automatizada de regresión de estilos en `src/styles/regression.test.ts` que verifique: (a) ausencia de `zoom:` o `transform: scale(` aplicados sobre `html`, `body`, `#root` o `.hero*` como mecanismo artificial para reducir el Hero (sin bloquear transformaciones legítimas de interacción/hover en otros componentes de la interfaz), (b) inmutabilidad de `:root`, `--wrap`, `.section`, `.aforo-section`, `.aforo-catalog`, `.aforo-categories`, `.aforo-peru-section`, `.closing` y `.explore` en `src/styles/base.css`, `src/styles/editorial.css`, `src/styles/explore.css` y la mitad inferior de `src/styles/home.css`, y (c) presencia de margen horizontal seguro en `@keyframes line-in` [FR-001, FR-002, FR-004, SC-001, SC-002]

### Implementación para User Story 1

- [X] T009 [US1] Calibrar exclusivamente los selectores `.hero*` y `@keyframes line-in` en `src/styles/home.css` (altura `min-height: clamp(540px, 86svh, 780px)`, `.hero__title` con escala fluida `clamp(2.35rem, 7.5vw, 8.4rem)` sin recorte horizontal, `clip-path: inset(-12% -4% -12% -2%)`, escala armónica de `.hero__eyebrow`, `.hero__lede`, `.hero__cta`, `.hero__next` y `.hero__strip`, y breakpoints responsive en `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844`) sin tocar ninguna regla fuera del bloque `.hero` [FR-001, FR-002, FR-003, FR-004, FR-006, SC-001, SC-002, SC-006]
- [X] T010 [US1] Ajustar el marcado interno y alineación izquierda-derecha del componente `<Hero />` en `src/pages/Home.tsx` para equilibrar el bloque editorial izquierdo con la tarjeta derecha del próximo evento (`.hero__next`), sin modificar el marcado de las secciones inferiores [FR-001, FR-002, FR-003, FR-004, SC-001, SC-002]
- [X] T011 [US1] Validar en navegador el Hero y la invariancia de las secciones inferiores al `100 %`, `150 %` y `200 %` de zoom en las resoluciones `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844`, comparando cuantitativamente las dimensiones `getBoundingClientRect()` (ancho y alto) de las secciones inferiores entre el estado **ANTES** y **DESPUÉS** utilizando exactamente el mismo viewport y el mismo nivel de zoom en cada par comparativo [FR-001, FR-003, FR-004, FR-006, SC-001, SC-002, SC-006]

**Checkpoint**: El Hero luce compacto, proporcionado y sin recortes al 100 % de zoom; `src/styles/regression.test.ts` pasa al 100 % y las secciones inferiores conservan exactamente sus dimensiones originales.

---

## Phase 4: User Story 2 - Navegación Diferenciada a Ficha del Evento y Compra en Nueva Pestaña (Priority: P1)

**Goal**: Diferenciar en todas las tarjetas, filas y listados del catálogo las acciones **«Ver evento / Ver concierto»** (`/eventos/:slug`) y **«Comprar / Ver entradas / Elegir sector»** (`/eventos/:slug#entradas`), abriendo ambas en una nueva pestaña segura (`target="_blank" rel="noopener noreferrer"`), desacoplando `EventQuickModal` del flujo del catálogo pero conservando su archivo en el repositorio como referencia.

**Independent Test**: Hacer clic en «Ver evento» y en «Comprar / Ver entradas» desde el Hero, el Mosaico Editorial, el Cronograma, el Dossier «Descubre el Perú», el Explorador (`/eventos` en vista póster y lista) y el Buscador (`SearchOverlay`), comprobando que se abren nuevas pestañas en `/eventos/:slug` y `/eventos/:slug#entradas` con `rel="noopener noreferrer"` y `0` aperturas del modal emergente.

### Implementación para User Story 2

- [X] T012 [P] [US2] Actualizar `EditorialCard`, `PosterCard` y `RowCard` en `src/components/EventCard.tsx` para ofrecer enlaces diferenciados en nueva pestaña segura (`newTab`): «Ver evento / Ver concierto» hacia `/eventos/:slug` y «Comprar / Ver entradas» hacia `/eventos/:slug#entradas` [FR-007, FR-008, FR-013, SC-003]
- [X] T013 [P] [US2] Ajustar mínimamente `.poster__price` y `.rowcard__price` en `src/styles/cards.css` para alojar de forma limpia y concisa las acciones «Ver evento» y «Entradas ↗» sin saturar ni alterar el ancho, alto o proporción de las tarjetas [FR-004, FR-005, FR-007, SC-002, SC-003]
- [X] T014 [P] [US2] Actualizar `src/components/PulseCatalogSection.tsx` para que tanto la vista Mosaico como la vista Cronograma (Ledger) abran `/eventos/:slug` («Ver concierto») y `/eventos/:slug#entradas` («Elegir sector / Ver entradas») en una nueva pestaña segura en lugar de invocar el modal [FR-007, FR-008, FR-013, SC-003]
- [X] T015 [P] [US2] Actualizar `src/components/PeruDiscoverySection.tsx` para que las mini-tarjetas regionales enlacen el título a `/eventos/:slug` y el botón «Ver entradas →» a `/eventos/:slug#entradas` en una nueva pestaña segura [FR-007, FR-008, FR-013, SC-003]
- [X] T016 [P] [US2] Actualizar `src/components/SearchOverlay.tsx` para ofrecer apertura en nueva pestaña segura hacia `/eventos/:slug` («Ver evento») y `/eventos/:slug#entradas` («Ver entradas») en cada resultado de búsqueda [FR-007, FR-008, SC-003]
- [X] T017 [US2] Actualizar la tarjeta `.hero__next` y las llamadas de secciones en `src/pages/Home.tsx` y `src/App.tsx` para que ninguna tarjeta del catálogo dispare `openTierModal`, verificando que `src/components/EventQuickModal.tsx` permanece intacto en el repositorio como referencia [FR-007, FR-008, FR-013, SC-003]

**Checkpoint**: El 100 % de las tarjetas y listados ofrecen ambas acciones diferenciadas en nueva pestaña segura (`target="_blank" rel="noopener noreferrer"`), con `0` aperturas del modal y conservando `src/components/EventQuickModal.tsx`.

---

## Phase 5: User Story 3 - Experiencia Integral de Detalle, Recinto y Selección de Entradas en Página Completa (Priority: P1)

**Goal**: Consolidar en `/eventos/:slug` (`src/pages/EventDetail.tsx`, `src/components/TicketPicker.tsx` y `src/styles/detail.css`) los mejores elementos de `EventDetail` y `EventQuickModal`, ofreciendo una página completa con cabecera editorial equilibrada, metadatos completos del concierto y recinto, plano espacial interactivo (`VenueStageMap`) sincronizado bidireccionalmente con la lista de sectores (`TicketPicker`), posicionamiento y foco automático en `#entradas` cuando se accede vía `/eventos/:slug#entradas`, resumen de selección en vivo y las dos acciones provisionales **«Agregar al carrito»** y **«Emitir pase QR (Demo)»**.

**Independent Test**: Abrir `/eventos/:slug` y `/eventos/:slug#entradas` en una nueva pestaña, comprobar el desplazamiento automático a `#entradas` en `< 1s`, alternar sectores desde el plano `VenueStageMap` y desde la lista `TicketPicker`, ajustar cantidades (`0..4`), verificar el desglose del resumen en vivo y ejecutar tanto «Agregar al carrito» como «Emitir pase QR (Demo)» comprobando que la pestaña principal se actualiza automáticamente.

### Implementación para User Story 3

- [X] T018 [US3] Enriquecer `src/components/TicketPicker.tsx` integrando los mejores elementos de `EventQuickModal`: desglose dinámico de sectores seleccionados, campo de nombre del titular para pases de prueba, cálculo en vivo de cantidades/total en `S/`, botón **«Agregar al carrito»** (que sincroniza con `CartDrawer` y `localStorage`), botón **«Emitir pase QR (Demo)»** (que emite `DemoUserTicket` con confirmación y acceso a «Mis Entradas») y manejo de eventos agotados (`sold_out`) [FR-010, FR-011, SC-005]
- [X] T019 [US3] Actualizar `src/pages/EventDetail.tsx` para consolidar la ficha completa del concierto (imagen principal, estado de venta, código técnico, artista, título, frase editorial, fecha/puertas, recinto con dirección/distrito/coordenadas, reglas de ingreso/edad, especificación acústica, sinopsis, line-up con horarios, plano `VenueStageMap` sincronizado con `TicketPicker` en `#entradas` y eventos relacionados con enlaces diferenciados en nueva pestaña) e implementar el `useEffect` que desplaza y enfoca automáticamente `#entradas` cuando `route.hash === '#entradas'` y `eventsState.status === 'ready'` [FR-009, FR-010, SC-004, SC-005]
- [X] T020 [US3] Actualizar `src/styles/detail.css` para estructurar visualmente la cabecera `.detail__hero`, la barra de metadatos del recinto, la grilla de dos columnas balanceadas en `#entradas` (plano `VenueStageMap` + `TicketPicker` sticky), el resumen de selección y los dos botones de acción bajo la identidad *Pulso Nocturno*, garantizando adaptación responsive en `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844` y con zoom al `100 %`, `150 %` y `200 %` [FR-006, FR-010, SC-005, SC-006]

**Checkpoint**: `/eventos/:slug` y `/eventos/:slug#entradas` ofrecen la experiencia completa de detalle y compra en página independiente, con sincronización mapa ⇄ sectores, scroll automático a `#entradas` y sincronización inmediata entre pestañas.

---

## Phase 6: User Story 4 - Transparencia del Modo Demostración y Regla de Reserva (Priority: P2)

**Goal**: Garantizar que en toda la experiencia de selección de entradas (`TicketPicker.tsx`, `EventDetail.tsx`), en el carrito (`CartDrawer.tsx`) y en la emisión de pases QR (`TicketsDrawer.tsx`) se distinga explícitamente el estado `DEMO` / `ACTIVA_DEMO`, informando de manera inequívoca que seleccionar entradas visualmente no bloquea inventario real y que ninguna acción actual ejecuta un cobro financiero ni reserva de backend.

**Independent Test**: Inspeccionar `/eventos/:slug#entradas`, el resumen de selección, el `CartDrawer` y «Mis Entradas» (`TicketsDrawer`), comprobando que en el 100 % de las vistas de selección/emisión aparece el aviso explícito de modo `DEMO` y de no-bloqueo visual de inventario, y que los pases emitidos muestran el estado `ACTIVA_DEMO`.

### Implementación para User Story 4

- [X] T021 [P] [US4] Incorporar en `src/components/TicketPicker.tsx` y `src/pages/EventDetail.tsx` el sello y aviso explícito de simulación (`MODO DEMO — Seleccionar entradas visualmente no bloquea inventario real. El bloqueo temporal solo ocurrirá al solicitar reserva ante el backend.`) junto al resumen de selección y al botón «Emitir pase QR (Demo)» [FR-012, SC-007]
- [X] T022 [P] [US4] Verificar y reforzar en `src/components/CartDrawer.tsx` y `src/components/TicketsModal.tsx` la visibilidad del aviso de simulación local (`DEMO` / estado `ACTIVA_DEMO`) para que ninguna acción del carrito o de «Mis Entradas» pueda confundirse con una reserva real de inventario o transacción bancaria [FR-012, SC-007]

**Checkpoint**: Todas las superficies de selección, carrito y pases emitidos cumplen estrictamente con los Principios II y IV de la Constitution de AFORO (`FR-012`, `SC-007`).

---

## Phase 7: Polish, Verifiable Performance Measurements & Post-Change Evidence

**Purpose**: Medir cuantitativamente los objetivos de rendimiento (`60 fps`, `< 1s` hacia `#entradas`, `< 100ms` en sincronización multi-pestaña), capturar las capturas de pantalla **DESPUÉS** de los cambios en todas las resoluciones y niveles de zoom, y documentar el reporte de verificación técnica.

- [X] T023 Ejecutar mediciones reales y verificables de rendimiento en navegador: (a) tiempo desde `status === 'ready'` hasta posicionamiento/foco en `#entradas` al abrir `/eventos/:slug#entradas` (`< 1000 ms`, `SC-004`), (b) latencia real de propagación del evento `storage` entre pestañas/contextos (`< 100 ms`, `FR-011`) y (c) fluidez de animación y scroll en el Hero y `/eventos/:slug` (`60 fps`), documentando mediciones reales, metodología e información del entorno de prueba (sin declarar cumplidas métricas que no hayan sido verificadas empíricamente) en `specs/001-frontend-proportions-and-ticket-page/evidence/performance-and-regression-report.md` [FR-009, FR-011, SC-004, SC-005]
- [X] T024 [P] Capturar capturas de pantalla **DESPUÉS** del Hero, de las secciones inferiores y de la nueva página `/eventos/:slug` y `/eventos/:slug#entradas` al `100 %`, `150 %` y `200 %` de zoom en las resoluciones `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844`, almacenándolas en `specs/001-frontend-proportions-and-ticket-page/evidence/after/` [FR-001, FR-003, FR-004, FR-006, SC-001, SC-002, SC-006]
- [X] T025 Ejecutar la suite final `npm run check` (`tsc --noEmit`, `node --import tsx --test "src/**/*.test.ts"` incluyendo `router.test.ts`, `cart.test.ts`, `store.test.ts` y `regression.test.ts`, y `vite build`) y completar la guía de validación `specs/001-frontend-proportions-and-ticket-page/quickstart.md` confirmando que `src/components/EventQuickModal.tsx`, `../aforo` y `../tf` permanecen intactos [FR-004, FR-013, SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-007]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup & Baseline Evidence)**: Sin dependencias previas; debe ejecutarse **antes** de tocar cualquier archivo en `src/` para preservar las capturas "antes" (`before/`).
- **Phase 2 (Foundational)**: Depende de Phase 1. Bloquea `US2`, `US3` y `US4` porque provee el soporte de `newTab` y `hash` en `src/router.tsx` y la sincronización `storage` en `src/lib/store.tsx`.
- **Phase 3 (`US1` - Ajuste exclusivo del Hero y Regresión de secciones inferiores)**: Puede ejecutarse inmediatamente después de Phase 1 (o en paralelo con Phase 2) ya que solo modifica `src/styles/home.css` (`.hero*`), `src/pages/Home.tsx` (`<Hero />`) y crea `src/styles/regression.test.ts`.
- **Phase 4 (`US2` - Navegación diferenciada en nueva pestaña)**: Depende de Phase 2 (`T004`, `T005`).
- **Phase 5 (`US3` - Página completa `/eventos/:slug` y `#entradas`)**: Depende de Phase 2 (`T004`–`T007`) y se integra con los enlaces de Phase 4 (`US2`).
- **Phase 6 (`US4` - Transparencia explícita `DEMO` y no-bloqueo de inventario)**: Depende de Phase 5 (`T018`, `T019`).
- **Phase 7 (Polish, Mediciones y Evidencia `after/`)**: Depende de que `US1`, `US2`, `US3` y `US4` estén completadas.

### Grafo de Dependencias entre Tareas

```text
T001 ──┬──► T002 [P] (Capturas ANTES Hero 100%/150%/200%)
       ├──► T003 [P] (Capturas ANTES secciones inferiores + modal)
       │
       ├──► T004 ──► T005 (Router: hash + newTab) ──┬──► T012 [P], T013 [P], T014 [P], T015 [P], T016 [P] ──► T017 (US2 completa)
       ├──► T006 [P] ──► T007 [P] (Store sync)      └──► T018 ──► T019 ──► T020 (US3 completa) ──► T021 [P], T022 [P] (US4 completa)
       │                                                                                                     │
       └──► T008 (Test regresión CSS) ──► T009 ──► T010 ──► T011 (US1 completa) ─────────────────────────────┴──► T023, T024 [P] ──► T025
```

### Parallel Opportunities

- **En Phase 1**: `T002` y `T003` pueden ejecutarse en paralelo.
- **En Phase 2**: `T004`–`T005` (`src/router.tsx`) y `T006`–`T007` (`src/lib/store.tsx`) afectan archivos distintos y pueden ejecutarse en paralelo.
- **En Phase 4 (`US2`)**: `T012` (`EventCard.tsx`), `T013` (`cards.css`), `T014` (`PulseCatalogSection.tsx`), `T015` (`PeruDiscoverySection.tsx`) y `T016` (`SearchOverlay.tsx`) modifican componentes independientes y pueden ejecutarse en paralelo antes de `T017`.
- **En Phase 6 (`US4`)**: `T021` (`TicketPicker.tsx` / `EventDetail.tsx`) y `T022` (`CartDrawer.tsx` / `TicketsDrawer.tsx`) pueden verificarse en paralelo.

---

## Matriz de Trazabilidad (`spec.md` ➔ `tasks.md`)

| Requisito / Criterio | Descripción Resumida | Tareas Asociadas |
| :--- | :--- | :--- |
| **FR-001, FR-002, FR-003 / SC-001** | Ajuste exclusivo del Hero al 100 % de zoom, sin `zoom`/`scale` global y sin recorte horizontal del titular en escritorio, tablet y móvil. | `T002`, `T008`, `T009`, `T010`, `T011`, `T024` |
| **FR-004, FR-005 / SC-002** | Preservación intacta de dimensiones, grillas y composición de las secciones inferiores al Hero. | `T001`, `T003`, `T008`, `T009`, `T010`, `T011`, `T013`, `T024`, `T025` |
| **FR-006 / SC-006** | Comportamiento responsive en `1366×768`, `1440×900`, `1920×1080`, `768×1024`, `390×844` y zoom `100 %`, `150 %` y `200 %`. | `T002`, `T009`, `T011`, `T020`, `T024` |
| **FR-007, FR-008, FR-013 / SC-003** | Acciones diferenciadas «Ver evento» (`/eventos/:slug`) y «Comprar / Ver entradas» (`/eventos/:slug#entradas`) en nueva pestaña segura; conservación de `EventQuickModal.tsx`. | `T003`, `T004`, `T005`, `T012`–`T017`, `T025` |
| **FR-009 / SC-004** | Desplazamiento y foco automático en `#entradas` en `< 1s` tras cargar el evento. | `T004`, `T005`, `T019`, `T023` |
| **FR-010, FR-011 / SC-005** | Página completa `/eventos/:slug` fusionando `EventDetail` + `EventQuickModal`, sincronización `VenueStageMap` ⇄ `TicketPicker`, acciones «Agregar al carrito» y «Emitir pase QR (Demo)» y sincronización multi-pestaña en `< 100ms`. | `T006`, `T007`, `T018`, `T019`, `T020`, `T023` |
| **FR-012 / SC-007** | Identificación explícita de modo `DEMO` / `ACTIVA_DEMO` y aclaración de que la selección visual no bloquea inventario real. | `T021`, `T022`, `T025` |

