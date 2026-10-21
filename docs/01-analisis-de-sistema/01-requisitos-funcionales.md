# Catálogo de Requisitos Funcionales — AFORO

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Documento**: `docs/01-analisis-de-sistema/01-requisitos-funcionales.md`  
**Versión**: `1.1.0` | **Fecha**: `2026-10-21`  
**Estado del Sistema**: Frontend web verificado y consolidado ([`AFORO Web`](../../src/App.tsx)); aplicaciones especializadas ([`AFORO Studio`](#22-aforo-studio-aplicación-web-de-gestión-para-organizadores-y-promotores), [`AFORO Access`](#23-aforo-access-aplicación-especializada-para-control-de-acceso-y-operadores-de-puerta)) y [`API Core Backend`](#24-api-core-backend-servicios-centrales-del-monolito-modular) en estado de diseño arquitectónico propuesto.

---

## 1. Convenciones y Estados de Realidad Técnica

En estricto apego al **Principio IV (Transparencia de Simulación y Honestidad Técnica)** de la [Constitution de AFORO](../../.specify/memory/constitution.md), cada requisito funcional se clasifica de forma rigurosa y verificable en una de las siguientes tres categorías:

- `[IMPLEMENTADO]`: Requisito programado, probado y verificado en el código fuente actual del repositorio con pruebas automatizadas o evidencias registradas en `src/`.
- `[DEMO / SIMULADO]`: Requisito disponible en la interfaz de usuario pero ejecutado localmente mediante datos estáticos o almacenamiento de navegador (`localStorage`), sin persistencia transaccional ni conexión con backend real.
- `[DISEÑO ARQUITECTÓNICO]`: Requisito diseñado y formalizado a nivel de especificación técnica, modelos de dominio y contratos, cuya implementación en backend o clientes especializados está planificada para fases posteriores del proyecto (`[DISEÑO PROPUESTO]`).

---

## 2. Requisitos Funcionales por Aplicación y Contenedor

### 2.1 AFORO Web (Aplicación de Descubrimiento, Compra y Billetera para Asistentes)

| ID | Nombre del Requisito | Descripción | Estado de Realidad | Trazabilidad Código / Spec |
| :--- | :--- | :--- | :--- | :--- |
| **RF-WEB-01** | **Exploración y Filtrado Multicriterio de Eventos** | El asistente puede explorar el catálogo de conciertos filtrando por ciudad (Lima, Cusco, Arequipa, etc.), género musical y mes de la temporada, con actualización reactiva instantánea. | `[IMPLEMENTADO]` | [`src/components/PulseCatalogSection.tsx`](../../src/components/PulseCatalogSection.tsx), [`src/lib/filters.ts`](../../src/lib/filters.ts) |
| **RF-WEB-02** | **Conmutación Dual de Vistas de Cartelera** | La interfaz permite alternar entre vista de «Mosaico Editorial Asimétrico» y vista de «Cronograma / Taquilla (Ledger)» sin recargas de página. | `[IMPLEMENTADO]` | [`src/components/PulseCatalogSection.tsx`](../../src/components/PulseCatalogSection.tsx) |
| **RF-WEB-03** | **Búsqueda Instantánea con Atajo de Teclado** | Búsqueda modal superpuesta activable mediante clic o atajo `/`, con coincidencia insensible a mayúsculas y diacríticos sobre título, artista, recinto y ciudad. | `[IMPLEMENTADO]` | [`src/components/SearchOverlay.tsx`](../../src/components/SearchOverlay.tsx), [`src/lib/filters.ts`](../../src/lib/filters.ts) |
| **RF-WEB-04** | **Navegación Diferenciada en Pestaña Segura** | Cada tarjeta o fila de evento diferencia las acciones «Ver evento» (`/evento/:slug`) y «Comprar entradas» (`/evento/:slug#entradas`), abriendo ambas en una nueva pestaña segura (`target="_blank" rel="noopener noreferrer"`). | `[IMPLEMENTADO]` | [`src/components/EventCard.tsx`](../../src/components/EventCard.tsx), [`src/router.tsx`](../../src/router.tsx), [`src/router.test.ts`](../../src/router.test.ts) |
| **RF-WEB-05** | **Ficha Técnica y Editorial del Concierto** | Página dedicada por evento con metadatos completos: artista, fecha, apertura de puertas, sinopsis, recinto con coordenadas, acústica, restricciones de edad y line-up con horarios. | `[IMPLEMENTADO]` | [`src/pages/EventDetail.tsx`](../../src/pages/EventDetail.tsx) |
| **RF-WEB-06** | **Interacción Espacial de Sectores (Mapa ⇄ Lista)** | Mapa interactivo SVG del recinto sincronizado bidireccionalmente con el selector de sectores y precios, resaltando la zona activa y su disponibilidad visual. | `[IMPLEMENTADO]` | [`src/components/VenueStageMap.tsx`](../../src/components/VenueStageMap.tsx), [`src/components/TicketPicker.tsx`](../../src/components/TicketPicker.tsx), [`src/pages/EventDetail.tsx`](../../src/pages/EventDetail.tsx) |
| **RF-WEB-07** | **Desplazamiento y Foco Automático a Entradas** | Al acceder con el ancla `#entradas`, la página ejecuta desplazamiento suave y posiciona el foco accesible sobre el selector de sectores en menos de 1000 ms (medido experimentalmente en 33.64 ms). | `[IMPLEMENTADO]` | [`src/pages/EventDetail.tsx`](../../src/pages/EventDetail.tsx), [`performance-and-regression-report.md`](../../specs/001-frontend-proportions-and-ticket-page/evidence/performance-and-regression-report.md) |
| **RF-WEB-08** | **Selección Visual de Entradas y Topes por Sector** | El usuario selecciona cantidades de entradas por sector respetando el tope estricto de 4 entradas por zona, con cálculo dinámico de subtotal y desglose detallado. | `[IMPLEMENTADO]` | [`src/components/TicketPicker.tsx`](../../src/components/TicketPicker.tsx), [`src/components/Stepper.tsx`](../../src/components/Stepper.tsx), [`src/lib/cart.ts`](../../src/lib/cart.ts) |
| **RF-WEB-09** | **Carrito Lateral con Sincronización Multi-Pestaña** | Drawer lateral que consolida las entradas seleccionadas, persistido localmente y sincronizado entre múltiples pestañas abiertas mediante eventos `storage` nativos. | `[IMPLEMENTADO]` | [`src/components/CartDrawer.tsx`](../../src/components/CartDrawer.tsx), [`src/lib/store.tsx`](../../src/lib/store.tsx), [`src/lib/store.test.ts`](../../src/lib/store.test.ts) |
| **RF-WEB-10** | **Billetera Digital Local «Mis Entradas»** | Consulta de pases digitales con código QR visual, token simulado de pulso (`pulseHash`), datos de acceso y opción de eliminación local. | `[DEMO / SIMULADO]` | [`src/components/TicketsModal.tsx`](../../src/components/TicketsModal.tsx), estado `ACTIVA_DEMO` |
| **RF-WEB-11** | **Transparencia Explícita de Modo Demostración** | En todas las superficies de compra, carrito y pases se muestra de forma visible e inequívoca el estado `MODO DEMO` y la advertencia de que la selección visual no bloquea inventario de servidor. | `[IMPLEMENTADO]` | [`src/components/TicketPicker.tsx`](../../src/components/TicketPicker.tsx), [`src/components/CartDrawer.tsx`](../../src/components/CartDrawer.tsx) |
| **RF-WEB-12** | **Solicitud Formal de Reserva Temporal (Checkout Real)** | El asistente envía la solicitud formal de reserva al backend, iniciando una ventana de pago con bloqueo temporal transaccional (TTL de 10 minutos). | `[DISEÑO ARQUITECTÓNICO]` | Diseñado para API Core (`[DISEÑO PROPUESTO]`); actualmente simulado en cliente. |
| **RF-WEB-13** | **Procesamiento de Pago con Pasarela y Confirmación** | Integración con pasarela externa (Culqi, Niubiz o Stripe) con soporte de 3D Secure, captura de pago y emisión de comprobante. | `[DISEÑO ARQUITECTÓNICO]` | Diseñado para API Core (`[DISEÑO PROPUESTO]`); actualmente simulado con emisión directa `ACTIVA_DEMO`. |

---

### 2.2 AFORO Studio (Aplicación Web de Gestión para Organizadores y Promotores)
> *Nota de Realidad Técnica: AFORO Studio corresponde a un componente de diseño propuesto cuya construcción está planificada para fases posteriores.*

| ID | Nombre del Requisito | Descripción | Estado de Realidad | Trazabilidad Arquitectónica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-STU-01** | **Autenticación y Gestión de Roles de Promotor** | Inicio de sesión seguro para promotores y administradores mediante JWT y control de acceso basado en roles (RBAC: `ORGANIZER`, `VENUE_ADMIN`, `SUPPORT`). | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Identidad (`src/modules/identity`) |
| **RF-STU-02** | **Creación y Edición Editorial de Eventos** | Formulario de alta de conciertos: título, artista principal, line-up con horarios, fechas, sinopsis, imagen de cartel, etiquetas de género y ciudad. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Catálogo (`src/modules/catalog`) |
| **RF-STU-03** | **Configuración de Recintos y Distribución de Sectores** | Definición del plano del recinto, creación de zonas (ej. Campo A, VIP, Tribuna), establecimiento de capacidad máxima numérica por zona y precios en PEN. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Catálogo & Inventario |
| **RF-STU-04** | **Definición de Etapas de Venta (Fases)** | Programación de ventanas temporales de comercialización: Preventa Exclusiva, Venta Regular y Últimos Lotes, con cupos asignados por fase. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Inventario |
| **RF-STU-05** | **Tablero de Control de Taquilla en Tiempo Real** | Visualización de métricas de ocupación: entradas vendidas, reservas temporales en curso (TTL activo), aforo libre y recaudación bruta por sector. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Reportes / Dashboard |
| **RF-STU-06** | **Cierre de Venta y Liquidación Financiera** | Declaración de evento agotado (`sold_out`), cierre manual de taquilla y generación de reporte de liquidación de comisiones e impuestos. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Facturación & Cobros |

---

### 2.3 AFORO Access (Aplicación Especializada para Control de Acceso y Operadores de Puerta)
> *Nota de Realidad Técnica: AFORO Access corresponde a un cliente móvil/PWA de diseño propuesto cuya construcción está planificada para fases posteriores.*

| ID | Nombre del Requisito | Descripción | Estado de Realidad | Trazabilidad Arquitectónica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-ACC-01** | **Autenticación de Dispositivo y Operador de Puerta** | Enlace de terminal lectora mediante token de estación asignado a una puerta y recinto específico (`GATE_OPERATOR`). | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Accesos (`src/modules/access`) |
| **RF-ACC-02** | **Sincronización Previa de Lista de Entradas (Cache Local)** | Descarga cifrada del listado de entradas autorizadas y sus claves/hashes de validación previo a la apertura de puertas para permitir operatividad sin conexión constante. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Accesos (SQLite / IndexedDB local) |
| **RF-ACC-03** | **Lectura Óptica de Código QR** | Captura bidimensional de alta velocidad mediante cámara del dispositivo orientada a una meta de escaneo veloz en molinete. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Cliente PWA AFORO Access |
| **RF-ACC-04** | **Verificación Criptográfica y Estado del Ticket** | Desencriptación del payload del QR y comprobación de firma criptográfica. Como alternativa preferida para modo offline se plantea firma asimétrica verificable mediante clave pública (o alternativamente HMAC con clave compartida), dejando la decisión final sujeta a su correspondiente ADR de arquitectura. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Accesos (Decisión criptográfica sujeta a ADR en Cap. 02) |
| **RF-ACC-05** | **Marcado de Ingreso y Prevención de Reúso Local** | Transición del ticket a estado `USED` registrando timestamp, operador y puerta. En modo online, la unicidad es atómica y global; en modo offline, la prevención de reúso es local a la terminal, registrando el riesgo inherente de doble ingreso si dos puertas desconectadas validan copias del mismo ticket simultáneamente. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Accesos |
| **RF-ACC-06** | **Sincronización Bidireccional Asíncrona y Reconciliación** | Al operar fuera de línea, almacena ingresos en bitácora local protegida y despacha la cola de sincronización hacia el backend central al recuperar conectividad para reconciliación y auditoría forense posterior. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Módulo de Accesos (Cola de reconciliación) |

---

### 2.4 API Core Backend (Servicios Centrales del Monolito Modular)
> *Nota de Realidad Técnica: La API Core Backend corresponde a un diseño arquitectónico modular propuesto; actualmente no existe código de backend implementado en el repositorio.*

| ID | Nombre del Requisito | Descripción | Estado de Realidad | Trazabilidad Arquitectónica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-COR-01** | **Consulta Pública de Catálogo y Disponibilidad** | Endpoint REST de alto rendimiento para listar eventos y consultar capacidad disponible por zona con soporte de caché HTTP. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Adaptador Primario REST / Módulo Catálogo |
| **RF-COR-02** | **Bloqueo Transaccional de Inventario con TTL** | Endpoint transaccional que verifica aforo libre con bloqueo pesimista (`SELECT ... FOR UPDATE`), descuenta cupos y genera una reserva temporal con expiración determinista (10 min). | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Caso de Uso `HoldTicketsUseCase` / Módulo Reservas |
| **RF-COR-03** | **Liberación Automática de Reservas Vencidas** | Tarea programada o listener de eventos de expiración (Redis keyspace notifications) que reincorpora al inventario disponible las entradas no abonadas al expirar el TTL de 10 minutos. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Adaptador Secundario Timer / Módulo Reservas |
| **RF-COR-04** | **Recepción Idempotente de Cobros y Webhooks** | Procesamiento de solicitudes de pago con validación de cabecera `Idempotency-Key` y receptor de webhooks de pasarela con firma criptográfica. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Caso de Uso `ProcessPaymentUseCase` / Módulo Pagos |
| **RF-COR-05** | **Emisión Criptográfica y Generación de Entradas** | Al confirmarse el pago, genera los registros definitivos de tickets en estado `ACTIVE`, emitiendo el código QR con firma criptográfica (mecanismo definitivo: firma asimétrica con clave privada vs HMAC sujeto a ADR de arquitectura). | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Caso de Uso `IssueTicketsUseCase` / Módulo Tickets |
| **RF-COR-06** | **Despacho de Confirmación y Notificación al Asistente** | Envío de correo electrónico transaccional con resumen de compra, desglose de montos y enlace seguro para visualizar las entradas en la billetera web. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Adaptador Secundario Notificaciones (Email Port) |
| **RF-COR-07** | **API de Validación y Reconciliación para AFORO Access** | Endpoints para validación en línea de tickets en puerta y reconciliación de bitácoras generadas en modo fuera de línea con detección de colisiones. | `[DISEÑO ARQUITECTÓNICO]` | Propuesto: Adaptador Primario REST / Módulo Accesos |
