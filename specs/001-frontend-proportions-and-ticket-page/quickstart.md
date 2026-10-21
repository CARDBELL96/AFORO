# Quickstart & Validation Guide: `001-frontend-proportions-and-ticket-page`

**Feature**: `001-frontend-proportions-and-ticket-page`
**Date**: 2026-10-20
**Validation Status**: ✅ **VERIFICADO (`30/30` pruebas automatizadas aprobadas, `0` errores TypeScript, build limpia en `dist/`, evidencia visual y métricas empíricas completadas)**

## 1. Requisitos Previos

- Node.js `v22+` y `npm 10+`
- Dependencias instaladas en la raíz del repositorio (`npm install`, `0` dependencias nuevas añadidas)

## 2. Ejecución de Verificación Automatizada

Ejecutar la suite completa de validación estática, pruebas unitarias/integración/regresión y compilación de producción:

```powershell
npm run check
```

**Resultado verificado:**
- `tsc --noEmit`: `0` errores de tipos.
- `node --import tsx --test "src/**/*.test.ts"`: **`30/30` pruebas aprobadas (`100 %`)**, incluyendo:
  - [`src/lib/cart.test.ts`](../../src/lib/cart.test.ts) (6 pruebas)
  - [`src/lib/filters.test.ts`](../../src/lib/filters.test.ts) (11 pruebas)
  - [`src/lib/format.test.ts`](../../src/lib/format.test.ts) (4 pruebas)
  - [`src/lib/store.test.ts`](../../src/lib/store.test.ts) (1 prueba de integración real multi-pestaña de `StoreProvider` sincronizando `aforo.fusion.cart.v1`, `aforo.fusion.saved.v1` y `aforo.fusion.tickets.v1` en `~11.18 ms`)
  - [`src/router.test.ts`](../../src/router.test.ts) (4 pruebas de rutas, `parseRouteLocation` con `#entradas` y `resolveLinkAttrs` con `target="_blank" rel="noopener noreferrer"`)
  - [`src/styles/regression.test.ts`](../../src/styles/regression.test.ts) (4 pruebas de regresión CSS y comparación DOM `metrics-before.json` vs `metrics-after.json`)
- `vite build`: compilación limpia en `dist/`.

## 3. Escenarios de Validación Visual y Funcional en Navegador

Iniciar el servidor de desarrollo:

```powershell
npm run dev
```

### Escenario A — Proporciones del Hero al 100 % de zoom y preservación de secciones inferiores (`SC-001`, `SC-002`, `SC-006`)
1. Abrir `http://localhost:5173/` con el zoom del navegador al **100 %**.
2. Probar en las dimensiones de viewport `1366×768`, `1440×900`, `1920×1080`, `768×1024` (tablet) y `390×844` (móvil):
   - ✅ Verificado: Las tres líneas del titular («LA NOCHE / NO SE CUENTA. / se vive.») se muestran completas sin ningún recorte horizontal (`clipsRight: false`, `scrollWidthExceedsClient: false` en las 15 combinaciones).
   - ✅ Verificado: El Hero luce compacto (`645.11 px` en `1366×768`, `756.00 px` en `1440×900`, `760.00 px` en `1920×1080`), proporcionado y con equilibrio visual entre el bloque izquierdo y la tarjeta derecha del próximo evento (`.hero__next`).
3. Desplazarse hacia abajo («01 // Programación en pulso», «02 // Seis movimientos», «03 // Descubre el Perú», cierre):
   - ✅ Verificado: Todas las secciones inferiores mantienen intactas sus dimensiones (`0.00 px` de diferencia en ancho, alto de cabeceras/secciones, paddings y tipografía), grillas y espaciados originales.
4. Aumentar el zoom del navegador a **150 %** y **200 %**:
   - ✅ Verificado: Todos los textos y botones siguen siendo legibles y operativos sin solapamientos ni recortes.

### Escenario B — Acciones diferenciadas en nueva pestaña segura (`SC-003`, `SC-004`)
1. En la cartelera principal, cronograma, dossier regional, buscador y explorador (`/eventos`):
   - ✅ Verificado: **«Ver evento / Ver el evento»** abre `/eventos/:slug` en una nueva pestaña segura (`target="_blank" rel="noopener noreferrer"`).
   - ✅ Verificado: **«Comprar entradas / Ver entradas / Elegir sector»** abre `/eventos/:slug#entradas` en una nueva pestaña segura posicionándose y enfocando `#entradas` en **`33.64 ms`** tras `status === 'ready'` (`705.42 ms` tiempo total desde inicio de navegación, `< 1000 ms`).
2. ✅ Verificado: La pestaña original conserva sus filtros y posición de scroll, con `0` aperturas del modal emergente.

### Escenario C — Experiencia completa de compra, modo DEMO y sincronización entre pestañas (`SC-005`, `SC-007`)
1. En la nueva pestaña abierta en `/eventos/:slug#entradas`:
   - ✅ Verificado: Sincronización bidireccional entre el plano interactivo (`VenueStageMap`) y la lista de sectores (`TicketPicker`).
   - ✅ Verificado: Desglose dinámico del resumen de selección en vivo, campo de titular y aviso explícito de simulación (`SIMULACIÓN LOCAL (DEMO): Seleccionar entradas visualmente no bloquea inventario real`).
   - ✅ Verificado: Acciones **«Agregar al carrito»** (`36.20 ms` de propagación entre contextos) y **«Emitir pase QR (Demo)»** (`23.50 ms` de propagación entre contextos) actualizan reactivamente el estado de las demás pestañas abiertas en `< 100 ms`.

## 4. Preservación de Archivos y Carpetas de Referencia (`FR-013`)

- ✅ [`src/components/EventQuickModal.tsx`](../../src/components/EventQuickModal.tsx): conservado intacto sin modificaciones en el repositorio como referencia técnica.
- ✅ Carpetas externas `../aforo` y `../tf`: conservadas intactas sin modificaciones.
