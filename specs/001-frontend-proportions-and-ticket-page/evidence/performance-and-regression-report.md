# Reporte de Rendimiento Empírico y No-Regresión Visual (`001-frontend-proportions-and-ticket-page`)

**Fecha de captura y verificación**: `2026-10-21T05:06:58Z`  
**Rama / Feature**: `001-frontend-proportions-and-ticket-page`  
**Fuentes de datos crudas**:
- Estado **ANTES**: [`specs/001-frontend-proportions-and-ticket-page/evidence/before/metrics-before.json`](./before/metrics-before.json)
- Estado **DESPUÉS**: [`specs/001-frontend-proportions-and-ticket-page/evidence/after/metrics-after.json`](./after/metrics-after.json)
- Prueba automatizada de regresión DOM y CSS: [`src/styles/regression.test.ts`](../../../src/styles/regression.test.ts)
- Prueba de integración multi-pestaña de `StoreProvider`: [`src/lib/store.test.ts`](../../../src/lib/store.test.ts)

---

## 1. Entorno de Prueba y Metodología (`T023`)

### 1.1 Entorno de Hardware y Software
| Parámetro | Valor Verificado |
| :--- | :--- |
| **Sistema Operativo** | Windows (`win32` `10.0.26300`) |
| **Procesador (CPU)** | `Intel(R) Core(TM) i5-10300H CPU @ 2.50GHz` |
| **Runtime Node.js** | `v22.20.0` |
| **Motor de Navegador Real** | `Google Chrome 155.0.8059.86` (`HeadlessChrome/155.0.0.0`, vía Chrome DevTools Protocol WebSocket) |
| **Build de Aplicación** | Paquete de producción generado con `vite build` (`v6.4.4`, `dist/`) servido localmente por HTTP en `127.0.0.1:5179` |

### 1.2 Metodología de Medición
1. **Evidencia base (`T001`–`T003`)**: Antes de modificar cualquier archivo de `src/`, se compiló el paquete de producción original y se automatizó mediante Chrome DevTools Protocol (`Emulation.setDeviceMetricsOverride`, `Runtime.evaluate`, `Page.captureScreenshot`) la captura de las 15 combinaciones de viewport × zoom (`1366×768`, `1440×900`, `1920×1080`, `768×1024`, `390×844` al `100 %`, `150 %` y `200 %`), registrando `getBoundingClientRect()` y estilos computados en `evidence/before/metrics-before.json`.
2. **Simulación de zoom del navegador**: Para cada resolución base $(W, H)$ y factor de zoom $z \in \{1.0, 1.5, 2.0\}$, se configuró el viewport CSS efectivo como $(\text{round}(W/z), \text{round}(H/z))$ con `deviceScaleFactor: z`, replicando exactamente el reflujo de layout que aplica el zoom nativo de Chromium.
3. **Medición de posicionamiento y foco en `#entradas` (`SC-004`)**: Se navegó desde `/eventos` hacia `/eventos/wendy-sulca-20-anos-en-vivo#entradas` midiendo con `performance.now()` tanto el tiempo total desde el inicio de la navegación (`wallClockElapsedMs`, que incluye la carga simulada de `fetchEvents()` de `~220 ms`) como el tiempo transcurrido desde que `eventsState.status === 'ready'` monta `#entradas` hasta que `#entradas` tiene el foco activo (`document.activeElement`) y se encuentra posicionado dentro del viewport (`fromStatusReadyMs`).
4. **Medición de latencia real de sincronización entre contextos (`FR-011`)**: Con dos contextos `Window` del mismo origen activos simultáneamente en Chromium (ventana principal en `/eventos/:slug#entradas` y segunda ventana en `/` suscrita al evento nativo `window.addEventListener('storage', ...)` a través de `StoreProvider`), se dispararon clics reales sobre **«Agregar al carrito»** (`aforo.fusion.cart.v1`) y **«Emitir pase QR (Demo)»** (`aforo.fusion.tickets.v1`), midiendo con `performance.now()` la latencia de propagación del evento `storage` (`storagePropagationMs`) y el commit reactivo (`reactDomCommitMs`). Adicionalmente, se verificó en [`src/lib/store.test.ts`](../../../src/lib/store.test.ts) la sincronización bidireccional de dos instancias montadas de `StoreProvider`.
5. **Medición de fluidez de cuadro (`60 fps`)**: Se muestrearon 60 cuadros consecutivos mediante `requestAnimationFrame` en Chromium calculando el intervalo medio (`avgFrameMs`), el percentil 95 (`p95FrameMs`) y los cuadros por segundo equivalentes (`estimatedFps`).

---

## 2. Resultados Empíricos de Rendimiento (`T023`)

| Métrica | Criterio Objetivo (`spec.md` / `plan.md`) | Resultado Empírico Medido | Estado |
| :--- | :--- | :--- | :--- |
| **Tiempo desde `status === 'ready'` hasta foco y posicionamiento en `#entradas`** (`SC-004`) | `< 1000 ms` | **`33.64 ms`** (`wallClockElapsedMs` total desde inicio de navegación incluyendo fetch simulado: **`705.42 ms`**; `domContentLoaded`: **`43.20 ms`**) | **CUMPLIDO** |
| **Latencia de sincronización multi-pestaña — Carrito (`aforo.fusion.cart.v1`)** (`FR-011`) | `< 100 ms` | **`36.20 ms`** propagación `storage` / **`36.30 ms`** commit reactivo en navegador (`11.18 ms` para suite completa en `store.test.ts`) | **CUMPLIDO** |
| **Latencia de sincronización multi-pestaña — Pases QR Demo (`aforo.fusion.tickets.v1`)** (`FR-011`) | `< 100 ms` | **`23.50 ms`** propagación `storage` / **`23.50 ms`** commit reactivo en navegador | **CUMPLIDO** |
| **Fluidez de animación y scroll (`requestAnimationFrame`)** | `60 fps` (`~16.67 ms`/frame) | **`60.0 fps`** (`avgFrameMs`: **`16.67 ms`**, `p95FrameMs`: **`16.70 ms`** sobre `59` intervalos muestreados) | **CUMPLIDO** |

---

## 3. Comparación Cuantitativa del Hero: ANTES vs DESPUÉS (`T009`, `T010`, `T011`)

### 3.1 Dimensiones del Hero y Titular Principal al `100 %` de Zoom
| Viewport (`zoom_100`) | Métrica | ANTES (`metrics-before.json`) | DESPUÉS (`metrics-after.json`) | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| **`1366×768`** | Alto de `.hero` (`height`) | `901.53 px` *(desborda los `768 px` del viewport)* | **`645.11 px`** *(cabe íntegramente en la 1.ª pantalla)* | Compacto y proporcionado (`-256.42 px`) |
| **`1366×768`** | Tamaño de `.hero__title` (`fontSize`) | `150.26 px` (`width: 1241.75 px`) | **`84.44 px`** (`width: 865.75 px`) | Equilibrio izquierda/derecha con `.hero__next` |
| **`1440×900`** | Alto de `.hero` (`height`) | `926.41 px` *(desborda los `900 px` del viewport)* | **`756.00 px`** *(cabe íntegramente en la 1.ª pantalla)* | Compacto y proporcionado (`-170.41 px`) |
| **`1440×900`** | Tamaño de `.hero__title` (`fontSize`) | `158.40 px` (`width: 1288.00 px`) | **`87.58 px`** (`width: 912.00 px`) | Equilibrio editorial nativo al 100 % |
| **`1920×1080`** | Alto de `.hero` (`height`) | `1080.00 px` | **`760.00 px`** | Compacto y proporcionado (`-320.00 px`) |
| **`1920×1080`** | Tamaño de `.hero__title` (`fontSize`) | `200.00 px` (`scrollWidthExceedsClient: true` en `"NO SE CUENTA."`) | **`87.58 px`** (`scrollWidthExceedsClient: false`, `clipsRight: false`) | **Recorte horizontal eliminado** |
| **`768×1024`** | Alto de `.hero` / `.hero__title` | `1024.00 px` / `84.48 px` | **`760.00 px`** / **`47.03 px`** | Adaptado en tablet sin desborde |
| **`390×844`** | Alto de `.hero` / `.hero__title` | `844.00 px` / `46.40 px` (`clipsRight: true` al `150 %` de zoom) | **`708.95 px`** / **`35.88 px`** (`clipsRight: false` en `100 %`, `150 %` y `200 %`) | **Desborde móvil en zoom eliminado** |

### 3.2 Verificación de Recorte Horizontal (`clipsRight` y `scrollWidthExceedsClient`) en las 15 Combinaciones
En `metrics-after.json`, para las 5 resoluciones (`1366×768`, `1440×900`, `1920×1080`, `768×1024`, `390×844`) y los 3 niveles de zoom (`100 %`, `150 %`, `200 %`):
- `"LA NOCHE"`: `clipsRight = false`, `scrollWidthExceedsClient = false` (15/15 combinaciones).
- `"NO SE CUENTA."`: `clipsRight = false`, `scrollWidthExceedsClient = false` (15/15 combinaciones).
- `"se vive."`: `clipsRight = false`, `scrollWidthExceedsClient = false` (15/15 combinaciones).

---

## 4. Prueba de No-Regresión de las Secciones Inferiores (`T011`, `SC-002`)

Comparación exacta `getBoundingClientRect()` (`width × height`, `paddingTop`, `paddingBottom`, `fontSize`) entre `metrics-before.json` y `metrics-after.json` utilizando exactamente el mismo viewport y el mismo nivel de zoom:

| Viewport | Zoom | `#catalogo` (ANTES vs DESPUÉS) | `.aforo-categories` (ANTES vs DESPUÉS) | `#peru` (ANTES vs DESPUÉS) | `.closing` (ANTES vs DESPUÉS) | Diferencia |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`1366×768`** | `100 %` | `1351 × 6339.45` vs `1351 × 6339.45` | `1351 × 857.56` vs `1351 × 857.56` | `1351 × 857.56` vs `1351 × 857.56` | `1351 × 759.33` vs `1351 × 759.33` | **`0.00 px`** |
| **`1366×768`** | `150 %` | `896 × 7717.06` *(header `823.13 × 211.28` idéntico)* | `896 × 798.41` vs `896 × 798.41` | `896 × 798.41` vs `896 × 798.41` | `896 × 530.17` vs `896 × 530.17` | **`0.00 px`** |
| **`1366×768`** | `200 %` | `668 × 8247.81` vs `668 × 8247.81` | `668 × 792.00` vs `668 × 792.00` | `668 × 792.00` vs `668 × 792.00` | `668 × 412.64` vs `668 × 412.64` | **`0.00 px`** |
| **`1440×900`** | `100 %` | `1425 × 6404.84` *(header `1288 × 197.77` idéntico)* | `1425 × 867.19` vs `1425 × 867.19` | `1425 × 867.19` vs `1425 × 867.19` | `1425 × 794.73` vs `1425 × 794.73` | **`0.00 px`** |
| **`1440×900`** | `150 %` | `945 × 7282.52` *(header `868.22 × 213.48` idéntico)* | `945 × 804.78` vs `945 × 804.78` | `945 × 804.78` vs `945 × 804.78` | `945 × 555.53` vs `945 × 555.53` | **`0.00 px`** |
| **`1440×900`** | `200 %` | `705 × 8211.03` *(header `647.41 × 255.34` idéntico)* | `705 × 792.00` vs `705 × 792.00` | `705 × 792.00` vs `705 × 792.00` | `705 × 431.16` vs `705 × 431.16` | **`0.00 px`** |
| **`1920×1080`** | `100 %` | `1905 × 6469.75` *(header `1288 × 197.77` idéntico)* | `1905 × 872.00` vs `1905 × 872.00` | `1905 × 872.00` vs `1905 × 872.00` | `1905 × 865.67` vs `1905 × 865.67` | **`0.00 px`** |
| **`1920×1080`** | `150 %` | `1265 × 6289.92` *(header `1162.63 × 197.77` idéntico)* | `1265 × 846.38` vs `1265 × 846.38` | `1265 × 846.38` vs `1265 × 846.38` | `1265 × 718.20` vs `1265 × 718.20` | **`0.00 px`** |
| **`1920×1080`** | `200 %` | `945 × 7282.52` *(header `868.22 × 213.48` idéntico)* | `945 × 804.78` vs `945 × 804.78` | `945 × 804.78` vs `945 × 804.78` | `945 × 555.53` vs `945 × 555.53` | **`0.00 px`** |
| **`768×1024`** | `100 %` | `753 × 8045.27` *(header `691.56 × 207.77` idéntico)* | `753 × 792.00` vs `753 × 792.00` | `753 × 792.00` vs `753 × 792.00` | `753 × 456.00` vs `753 × 456.00` | **`0.00 px`** |
| **`768×1024`** | `150 %` | `497 × 14185.91` vs `497 × 14185.91` | `497 × 792.00` vs `497 × 792.00` | `497 × 792.00` vs `497 × 792.00` | `497 × 346.22` vs `497 × 346.22` | **`0.00 px`** |
| **`768×1024`** | `200 %` | `369 × 15321.81` *(header `337 × 357.80` idéntico)* | `369 × 792.00` vs `369 × 792.00` | `369 × 792.00` vs `369 × 792.00` | `369 × 452.31` vs `369 × 452.31` | **`0.00 px`** |
| **`390×844`** | `100 %` | `390 × 14892.83` vs `390 × 14892.83` | `390 × 792.00` vs `390 × 792.00` | `390 × 792.00` vs `390 × 792.00` | `390 × 411.48` vs `390 × 411.48` | **`0.00 px`** |
| **`390×844`** | `150 %` | `260 × 16282.11` *(header `228 × 429.13` idéntico)* | `260 × 792.00` vs `260 × 792.00` | `260 × 792.00` vs `260 × 792.00` | `260 × 493.14` vs `260 × 493.14` | **`0.00 px`** |
| **`390×844`** | `200 %` | `195 × 16449.83` *(header `163 × 429.13` idéntico)* | `195 × 792.00` vs `195 × 792.00` | `195 × 792.00` vs `195 × 792.00` | `195 × 493.14` vs `195 × 493.14` | **`0.00 px`** |

Adicionalmente, [`src/styles/regression.test.ts`](../../../src/styles/regression.test.ts) verifica mediante hash criptográfico `SHA-256` que [`src/styles/base.css`](../../../src/styles/base.css), [`src/styles/editorial.css`](../../../src/styles/editorial.css), [`src/styles/explore.css`](../../../src/styles/explore.css) y la mitad inferior de [`src/styles/home.css`](../../../src/styles/home.css) permanecen 100 % intactos byte por byte.

