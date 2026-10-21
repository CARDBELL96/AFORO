# Implementation Plan: Ajuste de Proporciones del Hero al 100 % y Página Independiente de Detalle y Compra

**Branch**: `001-frontend-proportions-and-ticket-page` | **Date**: 2026-10-20 | **Spec**: [spec.md](file:///g:/2026%20400%20Par/Arquitectura%20de%20Software/AFORO-TF/AFORO-Fusion/specs/001-frontend-proportions-and-ticket-page/spec.md)

**Input**: Feature specification from `/specs/001-frontend-proportions-and-ticket-page/spec.md`

## Summary

Esta funcionalidad aborda dos objetivos principales dentro de **AFORO Web** respetando estrictamente la identidad visual *Brutalismo Editorial Peruano ("Pulso Nocturno")*:
1. **Calibración proporcional exclusiva de la primera pantalla (`Hero`) al 100 % de zoom:** Ajustar únicamente las dimensiones tipográficas, alturas, `clip-path`, espaciados y alineación izquierda-derecha del componente `<Hero />` (`src/pages/Home.tsx` y `.hero*` en `src/styles/home.css`) para lograr de forma nativa al **100 % de zoom** la proporción compacta y equilibrada que antes se percibía al 70 % de zoom y eliminar el recorte horizontal del titular principal, **conservando intactas las dimensiones, distribución y estilos de todas las secciones inferiores**.
2. **Nueva experiencia de detalle y compra en página completa abierta en pestaña independiente:** Diferenciar en todas las tarjetas y listados las acciones **«Ver evento»** (`/eventos/:slug`) y **«Comprar / Ver entradas»** (`/eventos/:slug#entradas`), abriendo ambas en una nueva pestaña segura (`target="_blank" rel="noopener noreferrer"`). Consolidar en `/eventos/:slug` (`EventDetail.tsx` + `TicketPicker.tsx`) los mejores elementos de `EventDetail` y `EventQuickModal` (imagen principal, datos del concierto, recinto/coordenadas, line-up, plano espacial interactivo `VenueStageMap` sincronizado con los sectores, selector de cantidades, resumen en vivo, aviso explícito `DEMO` de no-bloqueo visual de inventario y acciones provisionales «Agregar al carrito» y «Emitir pase QR (Demo)» sincronizadas entre pestañas vía evento `storage`), conservando temporalmente `src/components/EventQuickModal.tsx` como referencia.

## Technical Context

**Language/Version**: TypeScript 5.7.2 + React 19.0.0 (strict mode)

**Primary Dependencies**: `react@^19.0.0`, `react-dom@^19.0.0`, `vite@^6.0.0`, `@vitejs/plugin-react@^4.3.4`, `tsx@^4.19.2` (cero dependencias nuevas)

**Storage**: `window.localStorage` (`aforo.fusion.cart.v1`, `aforo.fusion.saved.v1`, `aforo.fusion.tickets.v1`) con sincronización multi-pestaña mediante el evento estándar `window.addEventListener('storage', ...)`

**Testing**: Node.js built-in test runner ejecutado vía `node --import tsx --test "src/**/*.test.ts"` + chequeo estático `tsc --noEmit` + compilación `vite build` (`npm run check`)

**Target Platform**: Navegadores web modernos en escritorio (`1366×768`, `1440×900`, `1920×1080`), tabletas (`768×1024`) y móviles (`390×844`), con soporte de zoom accesible (`100 %` nativo hasta `200 %`)

**Project Type**: Single-Page Web Application (`AFORO Web` — primera aplicación cliente del ecosistema AFORO)

**Performance Goals**: Renderizado instantáneo (`60 fps`), posicionamiento en `#entradas` en `< 1s` tras carga del catálogo local y sincronización entre pestañas en `< 100ms`

**Constraints**:
- Prohibido aplicar `zoom: 0.7`, `transform: scale()` o modificar globalmente el tamaño raíz de fuente o el contenedor `--wrap`.
- Prohibido redimensionar o alterar la composición de las secciones inferiores al Hero («Programación en pulso», «Seis movimientos», «Descubre el Perú» y catálogo).
- Prohibido eliminar `src/components/EventQuickModal.tsx` hasta que la nueva experiencia haya sido verificada.
- Prohibido agregar dependencias externas a `package.json`.

**Scale/Scope**: 20 eventos de demostración en el circuito peruano; modificación focalizada en 10 archivos existentes de `src/` sin alterar la estructura de carpetas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Regla de la Constitution | Evaluación Pre-Diseño | Evaluación Post-Diseño | Justificación de Cumplimiento |
| :--- | :---: | :---: | :--- |
| **I. Arquitectura Monolítica Modular y Hexagonal** | ✅ PASS | ✅ PASS | Los cambios se circunscriben al cliente **AFORO Web** manteniendo desacoplado el acceso a datos (`src/data/repository.ts`) y el estado de dominio (`src/lib/cart.ts`, `src/lib/store.tsx`). |
| **II. Integridad Transaccional e Invariantes de Dominio** | ✅ PASS | ✅ PASS | La interfaz explicita que la selección visual de entradas en el cliente NO bloquea inventario y que el bloqueo temporal (TTL) ocurrirá cuando el usuario solicite formalmente la reserva ante el backend. |
| **III. Coherencia Visual, Proporción Nativa y Calidad de Experiencia** | ✅ PASS | ✅ PASS | El Hero se calibra nativamente al **100 % de zoom** con unidades fluidas reales, sin trucos de `zoom`/`scale` y sin alterar las secciones inferiores ya aprobadas. |
| **IV. Transparencia de Simulación y Honestidad Técnica** | ✅ PASS | ✅ PASS | La página `/eventos/:slug#entradas`, el resumen de selección y la opción «Emitir pase QR (Demo)» incluyen identificación visible de modo `DEMO` / `ACTIVA_DEMO`. |
| **V. Desarrollo Guiado por Especificaciones (SDD) y Trazabilidad** | ✅ PASS | ✅ PASS | Se sigue el flujo oficial `/speckit-specify` ➔ `/speckit-plan` generando `research.md`, `data-model.md`, `contracts/` y `quickstart.md` trazados a `FR-001`..`FR-013` y `SC-001`..`SC-007`. |
| **Restricciones Operativas (Preservación de activos y cero dependencias nuevas)** | ✅ PASS | ✅ PASS | `aforo/` y `tf/` no se tocan; `EventQuickModal.tsx` se conserva como referencia; no se instalan paquetes adicionales. |

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-proportions-and-ticket-page/
├── spec.md                                           # Especificación funcional aprobada (/speckit-specify)
├── plan.md                                           # Este plan de implementación (/speckit-plan)
├── research.md                                       # Investigación y decisiones técnicas (Phase 0)
├── data-model.md                                     # Modelo de entidades y estado (Phase 1)
├── quickstart.md                                     # Guía de validación visual y funcional (Phase 1)
├── contracts/
│   └── ui-navigation-and-purchase-contract.md        # Contrato de rutas, enlaces y componentes UI (Phase 1)
└── checklists/
    └── requirements.md                               # Checklist de calidad de especificación
```

### Source Code & Archivos a Modificar (repository root)

```text
src/
├── router.tsx                        # [MODIFICAR] Soporte de hash en useRoute() y apertura segura en nueva pestaña (newTab / target="_blank") en <Link>
├── router.test.ts                    # [MODIFICAR] Pruebas unitarias de resolución de rutas y preservación de hash/query
├── lib/
│   └── store.tsx                     # [MODIFICAR] Sincronización multi-pestaña mediante listener de evento 'storage' para carrito, guardados y pases demo
├── pages/
│   ├── Home.tsx                      # [MODIFICAR] Estructura interna equilibrada de <Hero /> con enlaces diferenciados en nueva pestaña hacia el próximo evento
│   └── EventDetail.tsx               # [MODIFICAR] Fusión de los mejores elementos de EventDetail + EventQuickModal y scroll/foco automático a #entradas
├── components/
│   ├── TicketPicker.tsx              # [MODIFICAR] Resumen de selección enriquecido, titular de pase demo, aviso explícito DEMO y botones «Agregar al carrito» + «Emitir pase QR (Demo)»
│   ├── EventCard.tsx                 # [MODIFICAR] Acciones diferenciadas «Ver evento» (/eventos/:slug) y «Comprar / Ver entradas» (/eventos/:slug#entradas) en nueva pestaña en EditorialCard, PosterCard y RowCard
│   ├── PulseCatalogSection.tsx       # [MODIFICAR] Enlaces en nueva pestaña para «Elegir sector / Ver entradas» y «Ver concierto» en el Cronograma (Ledger) y Mosaico
│   ├── PeruDiscoverySection.tsx      # [MODIFICAR] Enlaces en nueva pestaña para título (/eventos/:slug) y «Ver entradas →» (/eventos/:slug#entradas) en mini-tarjetas regionales
│   ├── SearchOverlay.tsx             # [MODIFICAR] Apertura en nueva pestaña hacia /eventos/:slug y /eventos/:slug#entradas desde resultados de búsqueda
│   └── EventQuickModal.tsx           # [CONSERVAR SIN ELIMINAR] Se mantiene intacto como referencia hasta verificar la nueva experiencia
└── styles/
    ├── home.css                      # [MODIFICAR EXCLUSIVAMENTE BLOQUE .hero*] Calibración proporcional del Hero al 100 % de zoom y corrección de clip-path del titular
    ├── detail.css                    # [MODIFICAR] Estilos de la estación de compra en página completa (/eventos/:slug), resumen de selección y banner DEMO
    └── cards.css                     # [MODIFICAR MÍNIMAMENTE] Integración limpia del enlace secundario «Ver entradas» en PosterCard y RowCard sin alterar dimensiones de tarjetas
```

**Structure Decision**: Se mantiene intacta la estructura actual de `src/` en la raíz del proyecto, aplicando modificaciones quirúrgicas únicamente sobre los archivos listados arriba y respetando la prohibición de tocar los estilos o proporciones de las secciones inferiores (`src/styles/base.css`, `src/styles/editorial.css` y `src/styles/explore.css` no alteran dimensiones ni grillas del catálogo).

## Análisis de Riesgos de Regresión y Estrategia de Mitigación

| Riesgo Identificado | Impacto Potencial | Mitigación Técnica en el Plan |
| :--- | :--- | :--- |
| **1. Alteración accidental de las secciones inferiores al ajustar el Hero** | Que «Programación en pulso», «Seis movimientos» o «Descubre el Perú» cambien de tamaño o espaciado (`SC-002`). | No modificar `:root`, `--wrap`, `.section` ni `.aforo-*` en `base.css` o `editorial.css`. Restringir el ajuste de proporciones de portada exclusivamente a selectores con prefijo `.hero` en `src/styles/home.css`. |
| **2. Recorte horizontal del titular del Hero en `1366×768` o durante la animación `line-in`** | Que la línea `"NO SE CUENTA."` o `"se vive."` se corte a la derecha (`SC-001`). | Reducir el `clamp()` de `.hero__title` de `clamp(2.9rem, 11vw, 12.5rem)` a `clamp(2.35rem, 7.5vw, 8.4rem)`, ajustar `word-spacing` y cambiar `@keyframes line-in` a `clip-path: inset(-12% -4% -12% -2%)` para no guillotinar glifos en los extremos horizontales. |
| **3. Saturación visual de `PosterCard` y `RowCard` al añadir la distinción «Ver evento» vs «Ver entradas»** | Que las tarjetas del explorador `/eventos` pierdan limpieza o cambien de altura (`FR-004`, `FR-007`). | Reutilizar la fila inferior existente (`.poster__price` y `.rowcard__price`) para alojar de forma compacta el precio junto con los dos enlaces («Ver evento» y «Entradas ↗») sin añadir filas nuevas ni aumentar el alto de la tarjeta. |
| **4. Fallo del scroll automático a `#entradas` al abrir `/eventos/:slug#entradas` en nueva pestaña** | Que el navegador intente hacer scroll al ancla antes de que `fetchEvents()` termine de cargar y deje al usuario arriba (`SC-004`). | Añadir un `useEffect` en `EventDetail.tsx` dependiente de `eventsState.status === 'ready'` y del hash de la ruta para ejecutar `document.getElementById('entradas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })` en cuanto el DOM del evento esté montado. |
| **5. Desincronización del carrito o «Mis Entradas» entre la nueva pestaña y la pestaña original** | Que el usuario agregue entradas en la pestaña del concierto y no las vea reflejadas al volver a la pestaña de cartelera (`FR-011`). | Suscribir `StoreProvider` (`src/lib/store.tsx`) al evento `window.addEventListener('storage', ...)` para recargar en memoria `lines`, `saved` y `tickets` cuando otra pestaña modifique `localStorage`. |

## Estrategia de Verificación Visual y Funcional

1. **Verificación Automatizada (`npm run check`)**:
   - Chequeo estático de tipos (`tsc --noEmit`).
   - Pruebas unitarias en `src/**/*.test.ts` (ampliando `src/router.test.ts` para validar rutas y soporte de hash).
   - Build de producción con Vite (`vite build`).
2. **Verificación Visual del Hero al 100 % de Zoom (`SC-001`, `SC-002`, `SC-006`)**:
   - Inspección en viewports `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844` al **100 % de zoom**, comprobando la ausencia total de recortes en «LA NOCHE / NO SE CUENTA. / se vive.», el equilibrio entre el bloque izquierdo y la tarjeta derecha del próximo evento, y la preservación intacta de las secciones inferiores.
   - Prueba de zoom aumentado (`150 %` y `200 %`) verificando reflujo limpio sin solapamientos.
3. **Verificación Funcional de Compra en Nueva Pestaña (`SC-003`, `SC-004`, `SC-005`, `SC-007`)**:
   - Verificación de que todos los puntos de entrada abren `/eventos/:slug` o `/eventos/:slug#entradas` en una pestaña nueva con `target="_blank" rel="noopener noreferrer"` y `0` invocaciones al modal.
   - Prueba de extremo a extremo en `/eventos/:slug#entradas`: selección bidireccional en `VenueStageMap` ⇄ `TicketPicker`, ajuste de cantidades, verificación del aviso explícito `DEMO` (sin bloqueo real de inventario), prueba de «Agregar al carrito» y «Emitir pase QR (Demo)», y confirmación de sincronización inmediata en la pestaña principal.

## Complexity Tracking

> **Constitution Check passed with 0 violations.** No complexity exceptions required.
