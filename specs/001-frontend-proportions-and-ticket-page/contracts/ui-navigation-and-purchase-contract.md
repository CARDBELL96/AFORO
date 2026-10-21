# UI Navigation & Purchase Contract: `001-frontend-proportions-and-ticket-page`

**Feature**: `001-frontend-proportions-and-ticket-page`
**Date**: 2026-10-20

## 1. Contrato de Rutas y Enlaces hacia Eventos (`FR-007`, `FR-008`, `FR-009`)

Todas las acciones hacia un concierto desde tarjetas y listados de AFORO Web MUST cumplir el siguiente contrato de navegación:

| Intención del Usuario | Ruta Destino | Atributos Obligatorios del Enlace (`<a>` / `<Link>`) | Comportamiento en Pestaña Destino |
| :--- | :--- | :--- | :--- |
| **Ver evento / Ver concierto** (consulta informativa, clic en título o póster) | `/eventos/:slug` | `href="/eventos/:slug"`<br>`target="_blank"`<br>`rel="noopener noreferrer"` | Carga la página completa del concierto posicionada al inicio (`top: 0`). |
| **Comprar / Ver entradas / Elegir sector** (intención de compra) | `/eventos/:slug#entradas` | `href="/eventos/:slug#entradas"`<br>`target="_blank"`<br>`rel="noopener noreferrer"` | Carga la página completa del concierto y, una vez resuelto el catálogo (`status === 'ready'`), desplaza y enfoca automáticamente el contenedor `#entradas`. |

### Puntos de Origen Cubiertos por este Contrato
1. **Hero (`src/pages/Home.tsx`)**: Tarjeta de próximo evento (`.hero__next`) incluye acceso al evento (`/eventos/:slug`) y acción rápida a entradas (`/eventos/:slug#entradas`) en nueva pestaña.
2. **Mosaico Editorial (`EditorialCard` en `src/components/EventCard.tsx`)**:
   - Título y botón «Ver evento / Ver concierto» → `/eventos/:slug` (`target="_blank" rel="noopener noreferrer"`).
   - Botón «Comprar / Ver entradas» (o «Ficha y plano» si está agotado) → `/eventos/:slug#entradas` (`target="_blank" rel="noopener noreferrer"`).
3. **Cronograma / Taquilla (`PulseCatalogSection.tsx`)**:
   - Enlace del título y botón «Ver evento» → `/eventos/:slug` (`target="_blank" rel="noopener noreferrer"`).
   - Botón «Comprar / Elegir sector» → `/eventos/:slug#entradas` (`target="_blank" rel="noopener noreferrer"`).
4. **Dossier Regional «Descubre el Perú» (`PeruDiscoverySection.tsx`)**:
   - Enlace del título en mini-tarjetas → `/eventos/:slug` (`target="_blank" rel="noopener noreferrer"`).
   - Botón «Ver entradas →» en mini-tarjetas → `/eventos/:slug#entradas` (`target="_blank" rel="noopener noreferrer"`).
5. **Explorador `/eventos` (`PosterCard` y `RowCard` en `src/components/EventCard.tsx`)**:
   - Enlace principal de la tarjeta («Ver evento») → `/eventos/:slug` (`target="_blank" rel="noopener noreferrer"`).
   - Acción explícita y concisa en el pie de tarjeta/fila («Ver entradas» / «Comprar») → `/eventos/:slug#entradas` (`target="_blank" rel="noopener noreferrer"`).
6. **Buscador Instantáneo (`SearchOverlay.tsx`)**:
   - Selección de un resultado abre `/eventos/:slug` en nueva pestaña segura y acción rápida abre `/eventos/:slug#entradas`.

## 2. Contrato Visual de la Primera Pantalla (`Hero` — `FR-001` a `FR-004`)

- **Alcance exclusivo:** Solo se modifican las reglas `.hero*` en `src/styles/home.css` y el marcado interno de `<Hero />` en `src/pages/Home.tsx`.
- **Prohibiciones estrictas:**
  - Prohibido usar `zoom`, `transform: scale()` o modificar el tamaño raíz `html { font-size }`.
  - Prohibido modificar `--wrap` en `src/styles/base.css` o alterar estilos de `.aforo-section`, `.aforo-catalog`, `.aforo-categories`, `.aforo-peru-section`, `.closing` o `.explore`.
- **Invariantes visuales al 100 % de zoom (`1366×768`, `1440×900`, `1920×1080`):**
  - El titular de 3 líneas (`LA NOCHE` / `NO SE CUENTA.` / `se vive.`) no sufre recorte horizontal en ningún carácter.
  - La altura total del Hero (`min-height: clamp(540px, 86svh, 780px)`) y la escala de sus elementos internos mantienen la proporción compacta y equilibrada equivalente a la vista previa al 70 % de zoom.
  - La tarjeta `.hero__next` a la derecha y el bloque editorial `.hero__inner` a la izquierda quedan alineados dentro de los márgenes del contenedor sin colisionar entre sí.

## 3. Contrato de Componentes en `/eventos/:slug` (`FR-010` a `FR-013`)

La vista `EventDetail` (`src/pages/EventDetail.tsx`) + `TicketPicker` (`src/components/TicketPicker.tsx`) MUST exponer:
1. **Cabecera del Concierto (`.detail__hero`)**: Imagen principal, estado de venta, código técnico, artista, título, frase editorial, sello de fecha y bloque de datos clave (`Cuándo`, `Apertura de puertas`, `Dónde / Recinto / Dirección / Coordenadas`, `Edad e Ingreso`, `Precio base`).
2. **Estación de Recinto y Compra (`#entradas`)**:
   - **Plano espacial interactivo (`VenueStageMap`)**: Polígonos SVG y botones rápidos por sector sincronizados con `selectedTierId`.
   - **Selector de Zonas y Cantidades (`TicketPicker`)**: Lista de sectores con precios (`S/`), notas de acceso, barra de disponibilidad referencial, `Stepper` de cantidad (`0..4`), campo de titular del pase demo, desglose dinámico de sectores seleccionados y subtotal/total estimado.
   - **Aviso Explícito de Simulación (`DEMO`)**: Texto visible que informa que los datos son simulados, que seleccionar entradas visualmente no bloquea inventario real y que la emisión de pase QR es una demostración local.
   - **Acciones Provisionales Aprobadas**:
     1. Botón **«Agregar al carrito»** (actualiza `aforo.fusion.cart.v1` y abre `CartDrawer`).
     2. Botón **«Emitir pase QR (Demo)»** (crea pase con estado `ACTIVA_DEMO` en `aforo.fusion.tickets.v1` y ofrece acceso directo a «Mis Entradas»).
3. **Conservación de Referencia**: `src/components/EventQuickModal.tsx` permanece en el proyecto sin ser eliminado.

