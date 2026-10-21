# Phase 1 Data Model: Ajuste de Proporciones del Hero al 100 % y Página Independiente de Detalle y Compra

**Feature**: `001-frontend-proportions-and-ticket-page`
**Date**: 2026-10-20

> Esta funcionalidad reutiliza íntegramente las entidades existentes en `src/data/events.ts`, `src/data/editorial.ts`, `src/lib/cart.ts` y `src/lib/store.tsx`, sin introducir cambios incompatibles en el esquema de datos ni en `localStorage`.

## 1. Entidades de Dominio en el Cliente

### 1.1 `AforoEvent` (`src/data/events.ts`)
Representa un concierto o evento cultural dentro del catálogo de AFORO Web.

| Campo | Tipo | Descripción / Regla de Validación |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único del evento (`ev-01`..`ev-20`). |
| `slug` | `string` | Identificador amigable en URL (`/eventos/:slug`, `[a-z0-9-]+`). |
| `code` | `string` | Código técnico editorial (ej. `AFR-2026-LIM-01`). |
| `title` | `string` | Nombre oficial del concierto o festival. |
| `artist` | `string` | Artista principal o colectivo encabezando el cartel. |
| `kicker` | `string` | Frase editorial breve en cursiva. |
| `genre` | `GenreId` | Categoría musical (`chicha`, `electronica`, `salsa`, `rock`, `carnaval`, `festivales`). |
| `city` | `string` | Ciudad del Perú donde se realiza el evento. |
| `district` | `string` | Distrito o zona específica dentro de la ciudad. |
| `venue` | `string` | Nombre del recinto o escenario. |
| `address` | `string` | Dirección física del recinto. |
| `coordinates` | `string` | Coordenadas geográficas de referencia del recinto. |
| `startsAt` | `string` | Fecha y hora de inicio en formato ISO 8601 con zona horaria `-05:00` (Lima). |
| `endsAt` | `string?` | Fecha/hora de cierre opcional para festivales de varios días. |
| `doors` | `string` | Horario de apertura de puertas (ej. `Puertas 20:00 h`). |
| `ageRule` | `string` | Condición de edad e ingreso (ej. `Mayores de 18 años con DNI`). |
| `acoustic` | `string` | Especificación técnica y acústica de la sala o recinto. |
| `sale` | `'preventa' \| 'venta' \| 'ultimos' \| 'agotado'` | Estado comercial general del evento. |
| `saleLabel` | `string` | Etiqueta legible del estado de venta. |
| `editorialTag` | `string` | Sello curatorial del formato del concierto. |
| `accent` | `Accent` | Token de color de acento del evento (`orange`, `lime`, `magenta`, `blue`, `amber`, `teal`, `cyan`, `cream`). |
| `image` | `EventImage` | Objeto con ruta de imagen (`src`), texto alternativo (`alt`) y silueta/escena. |
| `description` | `string[]` | Párrafos de reseña editorial del concierto. |
| `lineup` | `LineupAct[]` | Lista ordenada de artistas del cartel (`name`, `time?`, `headliner?`). |
| `tiers` | `TicketTier[]` | Lista de zonas/sectores de entradas del recinto. |

### 1.2 `TicketTier` (`src/data/events.ts`)
Representa cada sector o localidad disponible dentro del recinto del evento.

| Campo | Tipo | Descripción / Regla de Validación |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único del sector dentro del evento. |
| `name` | `string` | Nombre de la zona (ej. `Pista Pulso`, `Campo General`, `Mezzanine`). |
| `price` | `number` | Precio unitario en soles peruanos (`S/`, entero `> 0`). |
| `note` | `string` | Descripción de ubicación frente al escenario y beneficios de acceso. |
| `remaining` | `number` | Porcentaje referencial de aforo disponible (`0` a `100`). |
| `status` | `'available' \| 'few' \| 'sold_out'` | Estado de disponibilidad del sector. Si es `'sold_out'`, `remaining === 0` y no admite selección. |

### 1.3 `CartLine` (`src/lib/cart.ts`)
Representa una línea de selección en el carrito de compras persistido en `localStorage` (`aforo.fusion.cart.v1`).

| Campo | Tipo | Descripción / Regla de Validación |
| :--- | :--- | :--- |
| `eventId` | `string` | Referencia a `AforoEvent.id`. |
| `tierId` | `string` | Referencia a `TicketTier.id`. |
| `qty` | `number` | Cantidad entera entre `1` y `MAX_PER_TIER` (`4`). Si se ajusta a `<= 0`, la línea se elimina. |

### 1.4 `DemoUserTicket` (`src/data/editorial.ts`)
Representa un pase digital emitido localmente en modo demostración y persistido en `localStorage` (`aforo.fusion.tickets.v1`).

| Campo | Tipo | Descripción / Regla de Validación |
| :--- | :--- | :--- |
| `ticketId` | `string` | Identificador de pase demo (`AFR-TK-XXXX`). |
| `eventId` | `string` | Referencia a `AforoEvent.id`. |
| `eventSlug` | `string` | Slug para enlazar de vuelta a `/eventos/:slug`. |
| `eventTitle` | `string` | Título del concierto. |
| `artist` | `string` | Artista principal. |
| `city` | `string` | Ciudad del evento. |
| `venue` | `string` | Recinto del evento. |
| `dateFormatted` | `string` | Fecha y hora formateadas en zona horaria de Lima. |
| `doorsTime` | `string` | Horario de apertura de puertas. |
| `zoneName` | `string` | Nombre del sector seleccionado. |
| `seatOrAccess` | `string` | Resumen de cantidad y localidad (`Nx LOCALIDAD DEMO · ZONA`). |
| `holderName` | `string` | Nombre del titular del pase de demostración. |
| `pricePaid` | `number` | Monto total estimado referencial (`price * qty`). |
| `status` | `'ACTIVA_DEMO'` | Estado fijo que identifica explícitamente que se trata de una simulación local. |
| `pulseHash` | `string` | Semilla alfanumérica para renderizar el código QR simulado. |
| `createdAt` | `string` | Fecha ISO (`YYYY-MM-DD`) de generación del pase demo. |

## 2. Transiciones de Estado en la Página de Detalle y Compra (`/eventos/:slug`)

1. **Carga inicial (`eventsState.status === 'loading'`)**: Se muestra `DetailSkeleton`.
2. **Evento resuelto (`eventsState.status === 'ready'`)**:
   - Se selecciona por defecto el primer `TicketTier` con `status !== 'sold_out'` y cantidad inicial `1` en el selector local de `TicketPicker`.
   - Si la URL contiene el hash `#entradas`, la vista realiza desplazamiento hacia el contenedor `#entradas` y enfoca la estación de selección.
3. **Sincronización Mapa ⇄ Selector (`selectedTierId`)**:
   - Hacer clic en una zona activa de `VenueStageMap` actualiza `selectedTierId` y garantiza al menos `1` entrada seleccionada en `TicketPicker` para esa zona.
   - Hacer clic o ajustar cantidad en una fila de `TicketPicker` actualiza `selectedTierId` resaltando el polígono correspondiente en `VenueStageMap`.
4. **Acciones del Resumen de Selección (Modo DEMO)**:
   - **«Agregar al carrito»**: Agrega las líneas seleccionadas (`qty > 0`) a `aforo.fusion.cart.v1`, abre el `CartDrawer` lateral y dispara implícitamente el evento `storage` en las demás pestañas abiertas.
   - **«Emitir pase QR (Demo)»**: Crea un registro `DemoUserTicket` con `status: 'ACTIVA_DEMO'` por cada sector seleccionado en `aforo.fusion.tickets.v1`, muestra el banner de confirmación con enlace directo para abrir «Mis Entradas» y sincroniza con las demás pestañas abiertas.

