# Inventario de Diagramas Arquitectónicos Exportados — Proyecto AFORO

**Curso**: Ingeniería de Software / Arquitectura de Software (IS-488 — UNSCH)
**Directorio**: `docs/diagramas-exportados/`
**Formatos Incluidos**: Vectorial escalable (`.svg`) y Mapa de bits de alta densidad `@2x` (`.png`)
**Fuentes**: Mermaid para relaciones editables; SVG determinista para las tres vistas rediseñadas el 2026-11-06.
**Renderizado**: las exportaciones anteriores usaron Mermaid v11.4.1 + Chromium Headless; las vistas claras se generan con `scripts/render-architecture.mjs` y Sharp para PNG.

---

## 1. Catálogo de Gráficos Exportados (9 Diagramas / 18 Archivos)

El catálogo reúne las vistas de C4 y del enfoque arquitectónico. Los documentos conservan las relaciones editables en Mermaid; las tres vistas claras tienen composición vectorial propia en el script versionado. C1, C2 y C4 mantienen sus exportaciones anteriores.

| # | Identificador | Archivo SVG | Archivo PNG (`@2x`) | Dimensiones Base (`px`) | Documento Fuente | Propósito Arquitectónico |
| :-: | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | `C1-contexto` | [`C1-contexto.svg`](C1-contexto.svg) | [`C1-contexto.png`](C1-contexto.png) | `1213 × 828` | [`docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md`](../04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md) | **C4 Nivel 1 (Contexto)**: Actores del dominio (`Fan`, `Promotor`, `Operador de Molinete`, `Admin`), sistema central `Plataforma AFORO` y sistemas externos (`Pasarela de Pagos`, `Servicio de Correo`). |
| **2** | `C2-contenedores` | [`C2-contenedores.svg`](C2-contenedores.svg) | [`C2-contenedores.png`](C2-contenedores.png) | `1869 × 1540` | [`docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`](../04-modelo-c4/Nivel2-DiagramadeContenedores.md) | **C4 Nivel 2 (Contenedores — Vista Principal)**: Aplicaciones cliente (`AFORO Web SPA`, `AFORO Studio SPA`, `AFORO Access PWA`), `API Core Backend` (Monolito Modular), `PostgreSQL 16` (única fuente de verdad) y `Redis 7` (auxiliar). |
| **3** | `C2-offline` | [`C2-offline.svg`](C2-offline.svg) | [`C2-offline.png`](C2-offline.png) | `1623 × 891` | [`docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`](../04-modelo-c4/Nivel2-DiagramadeContenedores.md) | **C4 Nivel 2 (Vista Complementaria Offline)**: Detalle interno del sandbox de navegador en `AFORO Access PWA` con `Web Crypto API` (Ed25519), `Service Worker` y los 3 *Object Stores* B-Tree en `IndexedDB` (`ADR-006`). |
| **4** | `C3-modulos` | [`C3-modulos.svg`](C3-modulos.svg) | [`C3-modulos.png`](C3-modulos.png) | `1600 × 1100` | [`docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`](../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md) | **C4 Nivel 3 (Vista C3-A — Topología Intermodular)**: Seis módulos pares, contratos públicos en memoria, worker interno recuperable e infraestructura resumida. |
| **5** | `C3-hexagonal` | [`C3-hexagonal.svg`](C3-hexagonal.svg) | [`C3-hexagonal.png`](C3-hexagonal.png) | `1600 × 1120` | [`docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`](../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md) | **C4 Nivel 3 (Vista C3-B — Estructura Hexagonal e Inversión de Dependencias)**: Vista representativa de Reservations: aplicación, dominio, puertos y adaptadores; realización hacia interfaces de aplicación. |
| **6** | `C4-clases` | [`C4-clases.svg`](C4-clases.svg) | [`C4-clases.png`](C4-clases.png) | `3712 × 1420` | [`docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) | **C4 Nivel 4 (Diagrama de Clases UML)**: Diseño estructural del módulo `Reservations` (`IReservationsModuleFacade`, `ReservationsModuleFacadeImpl`, `HoldTicketsUseCase`, `SectorInventory`, `Reservation`, `IReservationUnitOfWork`, `PostgreSQLReservationAdapter`, `RedisTTLTimerAdapter`). |
| **7** | `C4-secuencia` | [`C4-secuencia.svg`](C4-secuencia.svg) | [`C4-secuencia.png`](C4-secuencia.png) | `1558 × 910` | [`docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) | **C4 Nivel 4 (Diagrama de Secuencia)**: Delimitación de transacción única en PostgreSQL (`READ COMMITTED` + `SELECT ... FOR UPDATE`), validación de invariantes ($S + H \le C$ y tope de 4 entradas) y alarma post-commit en Redis. |
| **8** | `reservations-hexagonal` | [`reservations-hexagonal.svg`](reservations-hexagonal.svg) | [`reservations-hexagonal.png`](reservations-hexagonal.png) | `1600 × 1120` | [`docs/02-arquitectura-software/enfoque-aquitectonico.md`](../02-arquitectura-software/enfoque-aquitectonico.md) | **Arquitectura Hexagonal (Puertos y Adaptadores)**: Flujo de dependencias hacia adentro en el módulo `Reservations`, separando consumidores externos, adaptadores primarios, capa de aplicación, núcleo de dominio puro y adaptadores secundarios. |
| **9** | `aforo-enfoque-general` | [SVG con imagen incrustada](aforo-enfoque-general.svg) | [PNG original](aforo-enfoque-general.png) | `1536 × 1024` | [Enfoque arquitectónico](../02-arquitectura-software/enfoque-aquitectonico.md) | Imagen original del usuario, sin modificaciones. El SVG incrusta el PNG y no es una vectorización. |

---

## 2. Convención visual y reproducción

Las vistas C3-A, C3-B, Reservations y enfoque general utilizan fondo blanco, paneles y colores suaves: azul para entradas y catálogo, violeta para aplicación e identidad, rosa para dominio y reservas, verde para puertos y componentes auxiliares, gris para adaptadores y persistencia. Los otros diagramas conservan su paleta histórica.

Las líneas continuas indican uso o invocación; las discontinuas con triángulo hueco indican implementación de interfaces. El flujo de ejecución no debe confundirse con la dirección de dependencias de código.

Para reproducir los SVG de las tres vistas claras, desde la raíz:

```powershell
node scripts/render-architecture.mjs
```

Para generar también PNG a doble resolución, definir AFORO_SHARP_MODULE con la ruta del módulo Sharp disponible en el entorno y ejecutar el mismo comando. No se agregan dependencias al frontend.

**Revisión del 2026-11-06**: las vistas claras fueron inspeccionadas en PNG; las dimensiones base corresponden al SVG y el PNG mide el doble en cada eje. Las versiones anteriores permanecen en el historial de Git. No se modifican ADR ni decisiones de negocio.

**Corrección del 2026-11-06**: se sustituye únicamente la vista general por el PNG original solicitado por el usuario, conservado byte por byte. No se regenera mediante el script ni se aplica escalado @2x a este archivo. La versión sustituida permanece en Git.
