# Phase 0 Research: Ajuste de Proporciones del Hero al 100 % y Página Independiente de Detalle y Compra

**Feature**: `001-frontend-proportions-and-ticket-page`
**Date**: 2026-10-20

## 1. Calibración proporcional exclusiva del Hero al 100 % de zoom

- **Decision**: Ajustar exclusivamente las reglas CSS de `.hero` y sus sub-elementos (`.hero__inner`, `.hero__eyebrow`, `.hero__title`, `.hero__line`, `.hero__lede`, `.hero__cta`, `.hero__next`, `.hero__strip`) en `src/styles/home.css` (y la disposición interna de `<Hero />` en `src/pages/Home.tsx`) aplicando un factor de escala fluido equivalente al ~70 %–74 % de sus dimensiones actuales en escritorio, corrigiendo el `clip-path` de la animación `line-in` y alineando `.hero__next` dentro del contenedor del Hero para equilibrar los hemisferios izquierdo y derecho.
- **Rationale**:
  1. Actualmente en `src/styles/home.css`, `.hero__title` tiene `font-size: clamp(2.9rem, 11vw, 12.5rem)` (`200px` en pantallas grandes) y `@keyframes line-in` aplica `clip-path: inset(-12% 0 -12% 0)`. El valor `0` en los bordes izquierdo y derecho recorta el extremo derecho de la segunda línea (`"NO SE CUENTA."`) y los remates en cursiva cuando el ancho de línea se aproxima al contenedor.
  2. Reducir la escala tipográfica del titular a un rango fluido proporcionado (aprox. `clamp(2.35rem, 7.5vw, 8.4rem)`), ampliar el margen horizontal del `clip-path` (`inset(-12% -4% -12% -2%)`), calibrar la altura mínima del Hero (`min-height: clamp(540px, 86svh, 780px)`), compactar `.hero__lede`, los botones del Hero y la franja `.hero__strip`, y posicionar la tarjeta `.hero__next` alineada con el margen derecho del contenedor logra al **100 % de zoom** la misma proporción visual que antes se percibía al 70 %, sin tocar `base.css` ni ninguna sección inferior.
- **Alternatives considered**:
  - *Aplicar `zoom: 0.7` o `transform: scale(0.7)` al contenedor raíz o al Hero*: Rechazado explícitamente por el usuario y por degradar la nitidez tipográfica, el cálculo de coordenadas de scroll y la accesibilidad.
  - *Modificar `--wrap` o `html { font-size }` en `src/styles/base.css`*: Rechazado porque alteraría globalmente todas las secciones inferiores («Programación en pulso», «Seis movimientos», «Descubre el Perú» y catálogo), las cuales deben permanecer intactas (`FR-004`).

## 2. Preservación estricta de las secciones inferiores del catálogo

- **Decision**: Mantener sin modificaciones las reglas de tamaño, grilla, espaciado y tipografía de `.aforo-section`, `.aforo-catalog`, `.aforo-categories`, `.aforo-peru-section`, `.closing` y `.explore`. Únicamente se actualizarán en los componentes TSX los enlaces de acción de eventos para diferenciar «Ver evento» (`/eventos/:slug`) y «Comprar / Ver entradas» (`/eventos/:slug#entradas`) en nueva pestaña.
- **Rationale**: Garantiza riesgo cero de regresión visual en las secciones posteriores que el usuario ya aprobó (`SC-002`).
- **Alternatives considered**:
  - *Reestructurar las grillas o filtros de las secciones inferiores*: Rechazado tras la aclaración del usuario en la Etapa 2.

## 3. Enrutamiento diferenciado en nueva pestaña segura y soporte de ancla `#entradas`

- **Decision**:
  1. Extender el componente `Link` en `src/router.tsx` con una propiedad opcional `newTab?: boolean` (o detección de `target="_blank"`) que agregue automáticamente `target="_blank" rel="noopener noreferrer"` y permita al navegador abrir la pestaña de forma nativa sin interceptar el evento con `e.preventDefault()`.
  2. Incorporar en `src/router.tsx` la exposición del `hash` actual (`window.location.hash`) dentro de `useRoute()` y gestionar en `src/pages/EventDetail.tsx` el desplazamiento automático y foco hacia `#entradas` cuando los datos del evento terminen de cargarse (`eventsState.status === 'ready'`).
- **Rationale**:
  - El `Link` actual intercepta todo clic izquierdo normal (`e.button === 0`) y ejecuta `window.history.pushState` en la misma pestaña. Soportar `newTab` / `target="_blank"` en `Link` mantiene un único componente semántico `<a>` con protección `rel="noopener noreferrer"` (`FR-008`).
  - Dado que `fetchEvents()` resuelve de forma asíncrona tras el montaje inicial, cuando se abre `/eventos/:slug#entradas` en una pestaña nueva el elemento `#entradas` aún no existe en el DOM durante el estado `loading` (`DetailSkeleton`). Ejecutar `scrollIntoView` + `focus` en un `useEffect` al pasar a `status === 'ready'` garantiza que el usuario aterrice siempre en la sección de compra (`FR-009`, `SC-004`).
- **Alternatives considered**:
  - *Usar `window.open()` en manejadores `onClick` de `<button>`*: Rechazado porque impide abrir con clic central, no muestra la URL destino en la barra de estado del navegador y es menos accesible que un `<a href="..." target="_blank" rel="noopener noreferrer">` real.

## 4. Consolidación de `EventDetail` + `EventQuickModal` en página completa

- **Decision**: Enriquecer `src/pages/EventDetail.tsx`, `src/components/TicketPicker.tsx` y `src/styles/detail.css` reutilizando los componentes y bloques ya probados en `EventQuickModal.tsx`:
  - Cabecera editorial de altura equilibrada (`min-height: clamp(420px, 58svh, 620px)`) con imagen principal, estado de venta, código técnico, artista, título, frase editorial, sello de fecha y barra de datos clave (fecha, apertura de puertas, recinto, dirección, coordenadas y edad/ingreso).
  - Cuerpo principal a dos columnas balanceadas en escritorio: a la izquierda el plano espacial interactivo (`VenueStageMap`), especificación acústica, descripción y line-up; a la derecha (sticky) la estación de entradas (`#entradas` / `TicketPicker`) sincronizada bidireccionalmente con `VenueStageMap`.
  - Integración en `TicketPicker.tsx` del desglose en vivo de sectores seleccionados, campo de nombre del titular para pruebas, aviso explícito de modo `DEMO` (aclarando que seleccionar entradas visualmente no bloquea inventario) y los dos botones provisionales aprobados: **«Agregar al carrito»** y **«Emitir pase QR (Demo)»** (con confirmación y acceso directo a «Mis Entradas»).
  - Conservación intacta del archivo `src/components/EventQuickModal.tsx` en el repositorio sin invocarlo desde los botones de compra del catálogo (`FR-013`).
- **Rationale**: Aprovecha el 100 % de la lógica existente en `store.tsx`, `VenueStageMap.tsx`, `TicketPicker.tsx` y `EventQuickModal.tsx` sin duplicar estado ni añadir dependencias externas.
- **Alternatives considered**:
  - *Crear una tercera página desde cero y borrar `EventQuickModal.tsx` inmediatamente*: Rechazado porque infringe la regla de trabajo de conservar temporalmente `EventQuickModal.tsx` como referencia hasta verificar la nueva experiencia.

## 5. Sincronización de estado entre pestañas abiertas (`storage` event)

- **Decision**: Suscribir `StoreProvider` en `src/lib/store.tsx` al evento nativo `window.addEventListener('storage', ...)` escuchando cambios en `aforo.fusion.cart.v1`, `aforo.fusion.saved.v1` y `aforo.fusion.tickets.v1`.
- **Rationale**: Como cada evento se abre en una nueva pestaña del navegador (`target="_blank"`), el usuario puede agregar entradas al carrito, guardar un evento o emitir un pase QR (Demo) en la pestaña secundaria y luego volver a la pestaña principal. El evento estándar `storage` de Web Storage API sincroniza instantáneamente ambas pestañas sin ninguna librería adicional (`FR-011`).
- **Alternatives considered**:
  - *Usar `BroadcastChannel` o polling*: `storage` event es nativo, se dispara automáticamente cuando otra pestaña escribe en `localStorage` y ya utiliza exactamente las mismas claves persistidas por `store.tsx`.

