# Modelo C4 — Nivel 2: Diagrama de Contenedores de Software (C2)

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Documento**: `docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`  
**Versión**: `1.1.0` | **Fecha**: `2026-10-21`  
**Referencia Metodológica**: C4 Model (Simon Brown) & Guía 04 de Arquitectura de Software  
**Alineación Arquitectónica**: Conforme a la [Constitution](../../.specify/memory/constitution.md), el [Capítulo 01](../01-analisis-de-sistema/) y los [ADRs 001 al 006](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md)

---

## 1. Propósito y Alcance del Diagrama C2

El **Diagrama de Contenedores (C2)** realiza una descomposición del sistema AFORO en sus unidades ejecutables de alto nivel (aplicaciones cliente, servicios de servidor y almacenes de datos). Muestra la topología global de software, las responsabilidades de cada contenedor y los protocolos de comunicación utilizados.

### Criterio de Honestidad Técnica (Principio IV de la Constitution)
- **`[IMPLEMENTADO EN WEB]`**: [`AFORO Web`](../../frontend/src/App.tsx) desarrollada en React 19 / Vite 6 con estilos CSS nativos fluidos y 30 pruebas automatizadas en [`frontend/src/`](../../frontend/src/).
- **`[PROCESO DEMO / SIMULADO]`**: Flujo de compra y emisión de pases QR simulados localmente en navegador con estado `ACTIVA_DEMO` y persistencia en `localStorage`.
- **`[DISEÑO PROPUESTO]`**: Aplicaciones especializadas (`AFORO Studio`, `AFORO Access`), servicio de backend (`API Core`), base de datos relacional (`PostgreSQL`) y caché auxiliar (`Redis`).

---

## 2. Diagrama de Contenedores de Software (C2)

### 2.1. Vista Principal C2: Contenedores Ejecutables y Almacenes de Servidor

![Diagrama C2 — Contenedores del Sistema AFORO](../diagramas-exportados/C2-contenedores.svg)

> **Formatos exportados disponibles**: [SVG Vectorial (`C2-contenedores.svg`)](../diagramas-exportados/C2-contenedores.svg) | [PNG Alta Resolución (`C2-contenedores.png`)](../diagramas-exportados/C2-contenedores.png)
>
> **Leyenda de Colores (C2):** **Azul**: Clientes web/móvil | **Violeta**: Contenedor de aplicación de backend | **Gris sólido**: Motores de datos de servidor | **Gris punteado**: Sistemas externos.

<details>
<summary><b>Ver código fuente Mermaid editable (C2-contenedores)</b></summary>

```mermaid
flowchart TD
    %% Actores
    FAN["<b>Asistente al Evento</b><br/><i>[Persona]</i>"]
    PROM["<b>Promotor / Organizador</b><br/><i>[Persona]</i>"]
    GATE["<b>Operador de Molinete</b><br/><i>[Persona]</i>"]

    %% Limite de la Plataforma AFORO
    subgraph AFORO_SYSTEM["Frontera del Sistema AFORO"]

        %% Clientes Frontend
        subgraph APPS["Aplicaciones Cliente (Frontend)"]
            WEB_SPA["<b>AFORO Web (SPA)</b><br/><i>[React 19 / TypeScript / Vite 6]</i><br/>Catalogo editorial, mapa SVG propio<br/>y seleccion de entradas no bloqueante.<br/><b>[IMPLEMENTADO EN WEB / COMPRA DEMO]</b>"]

            STU_SPA["<b>AFORO Studio (SPA)</b><br/><i>[React / TypeScript]</i><br/>Configuracion de conciertos, recintos,<br/>sectores y monitoreo de aforos.<br/><b>[DISENO PROPUESTO]</b>"]

            ACC_PWA["<b>AFORO Access (PWA)</b><br/><i>[PWA Offline-First / TypeScript]</i><br/>Escaneo optico QR, verificacion Ed25519<br/>y persistencia local en navegador (IndexedDB).<br/><b>[DISENO PROPUESTO - Ver Vista 2.2]</b>"]
        end

        %% Backend Central Monolitico Modular
        subgraph BACKEND_BOX["Servicios Centrales"]
            API_CORE["<b>API Core Backend</b><br/><i>[Monolito Modular - Node.js / Fastify / TypeScript]</i><br/>Seis modulos independientes con Arquitectura Hexagonal:<br/>Catalog, Reservations, Payments, Tickets, Access, Identity.<br/><b>[DISENO PROPUESTO - ADR-001, ADR-002]</b>"]
        end

        %% Almacenamiento Central de Servidor
        subgraph STORAGE_BOX["Persistencia y Cache Central de Servidor"]
            PG_DB[("<b>PostgreSQL 16</b><br/><i>[Base de Datos Relacional]</i><br/><b>Unica Fuente de Verdad</b> transaccional:<br/>sector_inventory, reservations, payments,<br/>outbox_events, tickets y access_logs.<br/><b>[DISENO PROPUESTO - ADR-003]</b>")]

            REDIS_AUX[("<b>Redis 7 Auxiliar</b><br/><i>[Almacen En Memoria Volatil]</i><br/>Cache de cartelera publica, rate limiting<br/>y timers auxiliares TTL (600s).<br/><i>(No autoritativo para inventario)</i><br/><b>[DISENO PROPUESTO - ADR-003]</b>")]
        end

    end

    %% Sistemas Externos
    subgraph EXT["Sistemas Externos"]
        PAY_EXT["<b>Pasarela de Pagos</b><br/><i>[Culqi / Niubiz / Stripe]</i><br/>Cobros tokenizados, reembolsos y webhooks.<br/><b>[DISENO PROPUESTO - ADR-004]</b>"]
        MAIL_EXT["<b>Servicio de Correo</b><br/><i>[Proveedor Transaccional]</i><br/>Entrega de boletos y comprobantes.<br/><b>[DISENO PROPUESTO]</b>"]
    end

    %% Flujos de Actores a Clientes
    FAN -->|"HTTPS"| WEB_SPA
    PROM -->|"HTTPS"| STU_SPA
    GATE -->|"Camara Movil / HTTPS"| ACC_PWA

    %% Interacciones Clientes -> Backend
    WEB_SPA -->|"Consulta cartelera y solicita hold<br/>[HTTPS / REST JSON]"| API_CORE
    STU_SPA -->|"Administra eventos y capacidades<br/>[HTTPS / REST JSON]"| API_CORE
    ACC_PWA -->|"Valida ingreso online y reconcilia lotes<br/>[HTTPS / REST JSON]"| API_CORE

    %% Backend -> Persistencia
    API_CORE <-->|"Transacciones ACID y SELECT FOR UPDATE<br/>[TCP / SQL]"| PG_DB
    API_CORE <-->|"Cache publica y alarmas TTL 600s<br/>[TCP / RESP]"| REDIS_AUX

    %% Backend -> Sistemas Externos
    API_CORE <-->|"Cargos con Idempotency-Key y Webhooks<br/>[HTTPS / REST]"| PAY_EXT
    API_CORE -->|"Despacho de entradas emitidas<br/>[HTTPS / REST]"| MAIL_EXT

    %% Paleta Sobria Estandarizada (Sin emojis)
    classDef client fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef backend fill:#3b0764,stroke:#a855f7,stroke-width:3px,color:#ffffff;
    classDef infra fill:#1f2937,stroke:#64748b,stroke-width:2px,color:#ffffff;
    classDef external fill:#1f2937,stroke:#64748b,stroke-width:2px,stroke-dasharray: 5 5,color:#e2e8f0;

    class WEB_SPA,STU_SPA,ACC_PWA client;
    class API_CORE backend;
    class PG_DB,REDIS_AUX infra;
    class PAY_EXT,MAIL_EXT external;
```

</details>

### 2.2. Vista Complementaria C2-Offline: Detalle Interno de Contingencia en `AFORO Access (PWA)`

Dado que `IndexedDB` reside en el *sandbox* del navegador del dispositivo móvil del operador y **no es un servidor de base de datos central**, su estructura interna para operación fuera de línea ([ADR-006](../complementos/adrs/ADR-006-persistencia-operacion-offline-access.md)) se desglosa en esta vista específica del contenedor `AFORO Access (PWA)`:

![Diagrama C2-Offline — Contingencia Offline en AFORO Access PWA](../diagramas-exportados/C2-offline.svg)

> **Formatos exportados disponibles**: [SVG Vectorial (`C2-offline.svg`)](../diagramas-exportados/C2-offline.svg) | [PNG Alta Resolución (`C2-offline.png`)](../diagramas-exportados/C2-offline.png)

<details>
<summary><b>Ver código fuente Mermaid editable (C2-offline)</b></summary>

```mermaid
flowchart LR
    subgraph DEVICE["Dispositivo Movil en Puerta: Contenedor AFORO Access (PWA) [DISENO PROPUESTO]"]
        UI_SCAN["<b>Lector Optico QR & UI</b><br/>Captura de camara y<br/>generacion de attemptId"]
        CRYPTO_V["<b>Verificador Web Crypto API</b><br/>Comprobacion asimetrica local<br/>Ed25519 con clave publica PK_E"]
        SW_SYNC["<b>Service Worker de Sincronizacion</b><br/>Conmutacion Online/Offline y<br/>reconciliacion por lotes"]

        subgraph IDB_SANDBOX["IndexedDB Local del Navegador (B-Tree O(log N))"]
            ST_KEYS[("<b>event_crypto_keys</b><br/>Clave publica Ed25519 (PK_E)")]
            ST_PRE[("<b>preloaded_tickets</b><br/>Padron de entradas del sector")]
            ST_LOG[("<b>gate_access_log</b><br/>Ingresos locales y cola PENDING")]
        end

        UI_SCAN --> CRYPTO_V
        CRYPTO_V -->|"Lee PK_E"| ST_KEYS
        CRYPTO_V -->|"Firma valida"| SW_SYNC
        SW_SYNC <-->|"Sin red: verifica y marca USED local"| ST_PRE & ST_LOG
    end

    API_ACC["<b>API Core Backend (Modulo Access)</b><br/><code>POST /validate-entry</code> (Online)<br/><code>POST /reconcile-offline-batch</code> (Reconexion)"]

    SW_SYNC <-->|"Con red: validacion atomica o envio de lote"| API_ACC

    classDef client fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef backend fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#ffffff;
    classDef localdb fill:#1f2937,stroke:#64748b,stroke-width:2px,color:#ffffff;

    class UI_SCAN,CRYPTO_V,SW_SYNC client;
    class ST_KEYS,ST_PRE,ST_LOG localdb;
    class API_ACC backend;
```

</details>

---

## 3. Especificación Técnica de los Contenedores

### 3.1 Contenedores de Clientes (Frontend)

#### C2-01: AFORO Web (SPA)
- **Tecnología**: React 19, TypeScript 5.7, Vite 6, CSS nativo modular con Cascade Layers y Container Queries (`cqi`), React Context API (`StoreProvider`).
- **Responsabilidades**:
  - Catálogo editorial multicriterio (`RF-WEB-01`) y conmutación Mosaico / Ledger (`RF-WEB-02`).
  - Búsqueda modal con atajo `/` (`RF-WEB-03`).
  - Navegación segura con apertura diferenciada en nueva pestaña (`target="_blank" rel="noopener noreferrer"`, `RF-WEB-04`).
  - Desplazamiento y foco automático sobre `#entradas` (`RF-WEB-07`, medido en `33.64 ms`).
  - Mapa interactivo SVG propio ([`VenueStageMap.tsx`](../../frontend/src/components/VenueStageMap.tsx)) sincronizado con la lista de sectores ([`TicketPicker.tsx`](../../frontend/src/components/TicketPicker.tsx), `RF-WEB-06`).
  - Selección visual no bloqueante (`RN-02`, [`CartDrawer.tsx`](../../frontend/src/components/CartDrawer.tsx)) con tope de 4 entradas por zona (`RN-04`).
  - Sincronización multi-pestaña mediante eventos nativos `storage` (`RNF-PE-03`, medido en `36.2 ms`).
- **Estado de Realidad Técnica**: **`[IMPLEMENTADO EN WEB]`** (30 pruebas automatizadas en [`frontend/src/`](../../frontend/src/)). El flujo de compra y la billetera operan con pases de demostración (`ACTIVA_DEMO`) en `localStorage`.

#### C2-02: AFORO Studio (SPA de Promotores)
- **Tecnología Planificada**: React, TypeScript, CSS modular y visualización de métricas.
- **Responsabilidades**:
  - Autenticación y roles de promotor (`RF-STU-01`).
  - Creación y edición de eventos (`RF-STU-02`).
  - Configuración espacial de recintos y fijación de aforos máximos (`RF-STU-03`).
  - Programación de fases de venta y precios (`RF-STU-04`).
  - Tablero de control de ocupación en vivo (`RF-STU-05`).
  - *Visión Conceptual Futura (AFORO Creative AI)*: Generación asistida de configuraciones estéticas declarativas (paletas y estilos de cartelera) para su renderizado seguro en AFORO Web, sin ejecución de código arbitrario ni alteración de reglas financieras (`../01-analisis-de-sistema/06-driver-arquitectonicos.md`).
- **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**.

#### C2-03: AFORO Access (PWA para Control de Accesos)
- **Tecnología Planificada**: Progressive Web App (PWA) con Service Workers, TypeScript, Web Crypto API.
- **Responsabilidades y Persistencia Local**:
  - Descarga preliminar de listas de entradas autorizadas y clave pública del evento (`RF-ACC-02`, `ADR-005`).
  - Escaneo óptico de códigos QR en molinetes (`RF-ACC-03`).
  - Verificación criptográfica local con clave pública Ed25519 en modo offline (`RF-ACC-04`, `RN-06`).
  - Validación de estado y prevención de reingreso local en esa misma puerta (`RF-ACC-05`, `RN-08`).
  - **Almacenamiento Local (IndexedDB)**: Integrado como parte del cliente en el navegador/dispositivo. Aloja la lista precargada y la bitácora local de accesos concedidos (`gate_access_log`), con consultas indexadas mediante B-Trees en complejidad logarítmica $O(\log N)$ (`ADR-006`).
  - Cola de reconciliación asíncrona hacia la API Core al recuperar conectividad (`RF-ACC-06`).
- **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**.

---

### 3.2 Contenedor de Backend Central

#### C2-04: API Core Backend (Monolito Modular)
- **Tecnología Planificada**: Node.js, TypeScript, contenedor Docker.
- **Estructura Interna ([`ADR-001`](../complementos/adrs/ADR-001-seleccion-estilo-monolito-modular.md), [`ADR-002`](../complementos/adrs/ADR-002-adopcion-arquitectura-hexagonal.md))**:
  Un único proceso monolítico modular organizado en seis módulos bajo Arquitectura Hexagonal:
  1. `modules/catalog`: Gestión editorial de conciertos y recintos (`RF-COR-01`).
  2. `modules/reservations`: Bloqueo transaccional de aforo e inserción atómica de reserva con TTL de 10 minutos (`RF-COR-02`, `RN-01`, `RN-03`, `ADR-003`).
  3. `modules/payments`: Procesamiento de pagos con cabecera `Idempotency-Key` y adaptadores dedicados para la recepción de webhooks según cada pasarela (`RF-COR-04`, `RN-05`, `ADR-004`).
  4. `modules/tickets`: Emisión de entradas con firma digital asimétrica Ed25519 (`RF-COR-05`, `RN-06`, `ADR-005`) y máquina de estados (`RN-07`).
  5. `modules/access`: API de validación en tiempo real y reconciliación de bitácoras de molinetes (`RF-COR-07`, `RN-08`).
  6. `modules/identity`: Autenticación JWT y roles RBAC (`RF-STU-01`).
- **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**.

---

### 3.3 Contenedores de Persistencia y Caché Central

#### C2-05: Base de Datos Relacional (PostgreSQL)
- **Tecnología**: PostgreSQL.
- **Rol Crítico**: **Única Fuente de Verdad** para aforos, disponibilidad por sector, vigencia efectiva de reservas y emisión de boletos (`../02-arquitectura-software/estilo-arquitectonico.md`).
- **Estrategia Transaccional ([`ADR-003`](../complementos/adrs/ADR-003-concurrencia-integridad-inventario.md))**:
  - Transacciones bajo `READ COMMITTED` con bloqueo pesimista a nivel de fila (`SELECT ... FOR UPDATE`) sobre el sector solicitado.
  - Comprobación del invariante de capacidad ($\text{Sold} + \text{ActiveHolds} + \text{Qty} \le \text{Capacity}$) e inserción de la reserva **dentro de la misma transacción atómica**.
  - La vigencia efectiva de las reservas temporales la determina la base de datos comparando las marcas de tiempo transaccionales.
- **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**.

#### C2-06: Caché y Temporizador Auxiliar (Redis)
- **Tecnología**: Redis.
- **Rol de Soporte**: **Infraestructura estrictamente auxiliar** (no autoridad de inventario):
  1. Caché de consultas públicas de cartelera para mitigar carga en lecturas (`RF-COR-01`, `EAC-01`).
  2. Limitador de tasa de peticiones (*rate limiting*) contra abusos o tráfico desmedido.
  3. Temporizador auxiliar de reservas mediante llaves con TTL de 10 minutos (600 s) para notificar al worker de fondo la conveniencia de liberar reservas abandonadas (`RN-03`, `EAC-03`).
- **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**.

---

## 4. Trazabilidad con los Seis ADRs Aprobados

| ADR Aprobado | Principio / Decisión Formalizada | Reflejo Técnico en el Diagrama C2 |
| :---: | :--- | :--- |
| **ADR-001** | **Monolito Modular** | Un único contenedor ejecutable (`API_CORE`) en lugar de servicios distribuidos. |
| **ADR-002** | **Arquitectura Hexagonal** | Estructuración modular de `API_CORE` con puertos de entrada (REST/Webhooks) y adaptadores hacia PostgreSQL, Redis y Pasarelas. |
| **ADR-003** | **PostgreSQL como Fuente de Verdad y Locking Pesimista** | Conexión atómica de `API_CORE` con `PG_DB` mediante `SELECT ... FOR UPDATE`, manteniendo a `REDIS_AUX` exclusivamente como caché y timer de expiración TTL. |
| **ADR-004** | **Idempotencia de Pagos y Webhooks** | Flujo con cabecera `Idempotency-Key` y adaptadores desacoplados para la verificación específica de firmas de webhook según el proveedor (Culqi, Niubiz, Stripe). |
| **ADR-005** | **Criptografía Ed25519 para Entradas QR** | `API_CORE` custodia la clave privada para firmar boletos; `ACC_PWA` almacena la clave pública en `ACC_IDB` para validación local offline. |
| **ADR-006** | **Persistencia e IndexedDB Offline en Access** | `ACC_IDB` modelado como almacenamiento local integrado dentro del cliente móvil `ACC_PWA`, con búsquedas B-Tree en $O(\log N)$. |
