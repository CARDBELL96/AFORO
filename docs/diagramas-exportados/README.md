# Inventario de Diagramas Arquitectónicos Exportados — Proyecto AFORO

**Curso**: Ingeniería de Software / Arquitectura de Software (IS-488 — UNSCH)
**Directorio**: `docs/diagramas-exportados/`
**Formatos Incluidos**: Vectorial escalable (`.svg`) y Mapa de bits de alta densidad `@2x` (`.png`)
**Herramienta de Renderizado**: Mermaid v11.4.1 + Chromium Headless (Playwright)

---

## 1. Catálogo de Gráficos Exportados (8 Diagramas / 16 Archivos)

Todos los bloques Mermaid de los cuatro niveles del Modelo C4 y del documento de Enfoque Arquitectónico Hexagonal han sido renderizados, verificados visualmente e integrados en sus respectivos documentos fuente:

| # | Identificador | Archivo SVG | Archivo PNG (`@2x`) | Dimensiones Base (`px`) | Documento Fuente | Propósito Arquitectónico |
| :-: | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | `C1-contexto` | [`C1-contexto.svg`](C1-contexto.svg) | [`C1-contexto.png`](C1-contexto.png) | `1213 × 828` | [`docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md`](../04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md) | **C4 Nivel 1 (Contexto)**: Actores del dominio (`Fan`, `Promotor`, `Operador de Molinete`, `Admin`), sistema central `Plataforma AFORO` y sistemas externos (`Pasarela de Pagos`, `Servicio de Correo`). |
| **2** | `C2-contenedores` | [`C2-contenedores.svg`](C2-contenedores.svg) | [`C2-contenedores.png`](C2-contenedores.png) | `1869 × 1540` | [`docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`](../04-modelo-c4/Nivel2-DiagramadeContenedores.md) | **C4 Nivel 2 (Contenedores — Vista Principal)**: Aplicaciones cliente (`AFORO Web SPA`, `AFORO Studio SPA`, `AFORO Access PWA`), `API Core Backend` (Monolito Modular), `PostgreSQL 16` (única fuente de verdad) y `Redis 7` (auxiliar). |
| **3** | `C2-offline` | [`C2-offline.svg`](C2-offline.svg) | [`C2-offline.png`](C2-offline.png) | `1624 × 891` | [`docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`](../04-modelo-c4/Nivel2-DiagramadeContenedores.md) | **C4 Nivel 2 (Vista Complementaria Offline)**: Detalle interno del sandbox de navegador en `AFORO Access PWA` con `Web Crypto API` (Ed25519), `Service Worker` y los 3 *Object Stores* B-Tree en `IndexedDB` (`ADR-006`). |
| **4** | `C3-modulos` | [`C3-modulos.svg`](C3-modulos.svg) | [`C3-modulos.png`](C3-modulos.png) | `2822 × 1268` | [`docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`](../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md) | **C4 Nivel 3 (Vista C3-A — Topología Intermodular)**: Interacción limpia entre los 6 módulos pares dentro de API Core mediante fachadas públicas en memoria (`I*ModuleFacade`), componente auxiliar `OutboxProcessor` e infraestructura compartida. |
| **5** | `C3-hexagonal` | [`C3-hexagonal.svg`](C3-hexagonal.svg) | [`C3-hexagonal.png`](C3-hexagonal.png) | `2068 × 2356` | [`docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`](../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md) | **C4 Nivel 3 (Vista C3-B — Estructura Hexagonal e Inversión de Dependencias)**: Estructura hexagonal de los 6 módulos con distinción rigurosa de flechas: llamadas en tiempo de ejecución (`-->`) y realización de interfaces con Inversión de Dependencias (`-.->|realiza (DIP)|`). |
| **6** | `C4-clases` | [`C4-clases.svg`](C4-clases.svg) | [`C4-clases.png`](C4-clases.png) | `3712 × 1420` | [`docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) | **C4 Nivel 4 (Diagrama de Clases UML)**: Diseño estructural del módulo `Reservations` (`IReservationsModuleFacade`, `ReservationsModuleFacadeImpl`, `HoldTicketsUseCase`, `SectorInventory`, `Reservation`, `IReservationUnitOfWork`, `PostgreSQLReservationAdapter`, `RedisTTLTimerAdapter`). |
| **7** | `C4-secuencia` | [`C4-secuencia.svg`](C4-secuencia.svg) | [`C4-secuencia.png`](C4-secuencia.png) | `1558 × 910` | [`docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) | **C4 Nivel 4 (Diagrama de Secuencia)**: Delimitación de transacción única en PostgreSQL (`READ COMMITTED` + `SELECT ... FOR UPDATE`), validación de invariantes ($S + H \le C$ y tope de 4 entradas) y alarma post-commit en Redis. |
| **8** | `reservations-hexagonal` | [`reservations-hexagonal.svg`](reservations-hexagonal.svg) | [`reservations-hexagonal.png`](reservations-hexagonal.png) | `2472 × 1704` | [`docs/02-arquitectura-software/enfoque-aquitectonico.md`](../02-arquitectura-software/enfoque-aquitectonico.md) | **Arquitectura Hexagonal (Puertos y Adaptadores)**: Flujo de dependencias hacia adentro en el módulo `Reservations`, separando consumidores externos, adaptadores primarios, capa de aplicación, núcleo de dominio puro y adaptadores secundarios. |

---

## 2. Convención Cromática Estandarizada

Todos los diagramas de flujo C1, C2, C3 y Hexagonal comparten una paleta oscura de alto contraste (`#0b1120`) con significado semántico consistente:

- **Azul (`#1e3a8a` / borde `#3b82f6`)**: Actores externos, aplicaciones cliente (`SPA` / `PWA`) y adaptadores primarios de entrada (`Inbound Adapters`).
- **Violeta (`#3b0764` / borde `#a855f7`)**: Contenedor `API Core Backend`, módulos de aplicación y casos de uso (`Use Cases`).
- **Verde Esmeralda (`#064e3b` / borde `#10b981`)**: Núcleo de dominio puro (`Aggregate Roots`, `Entities`), contratos de puertos (`Inbound/Outbound Ports`) y despachador `OutboxProcessor`.
- **Gris Pizarra (`#1f2937` / borde `#64748b`)**: Adaptadores secundarios de infraestructura (`PostgreSQL*Adapter`, `Redis*Adapter`), motores de persistencia y sistemas externos (borde discontinuo).
