# AFORO
### Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo

**AFORO** es un proyecto de Ingeniería de Software orientado al diseño de una plataforma integral de ticketing para conciertos, festivales y eventos culturales en el Perú.

Su propuesta combina una experiencia digital editorial con una arquitectura diseñada para afrontar desafíos como la alta concurrencia de compradores, la integridad del inventario, la prevención de sobreventa y la validación segura de entradas.

> **Estado actual:** Sprint 01 — Análisis, arquitectura y diseño de software. AFORO Web cuenta con un frontend DEMO funcional. Los demás componentes corresponden al diseño arquitectónico propuesto.

---

## 01. Problemática

Las plataformas de venta de entradas deben afrontar desafíos técnicos importantes durante eventos de alta demanda:

- Acceso simultáneo de numerosos compradores.
- Riesgo de sobreventa por operaciones concurrentes.
- Reservas abandonadas que retienen temporalmente el inventario.
- Duplicación de operaciones durante la confirmación de pagos.
- Necesidad de validar entradas y gestionar escenarios de conectividad limitada.

AFORO plantea una solución que aborda estos problemas desde el diseño de su arquitectura de software.

## 02. Ecosistema AFORO

La plataforma contempla tres aplicaciones especializadas y un backend compartido.

| Aplicación | Descripción | Estado |
|---|---|---|
| AFORO Web | Descubrimiento de eventos, selección de entradas y experiencia de compra. | Frontend DEMO |
| AFORO Studio | Administración de eventos, recintos, sectores, precios y ventas. | Propuesto |
| AFORO Access | Validación de entradas mediante códigos QR, con contingencia offline. | Propuesto |
| AFORO API Core | Backend compartido responsable de las reglas de negocio y operaciones transaccionales. | Propuesto |

### AFORO Web

El frontend implementa el concepto visual **Pulso Nocturno**, inspirado en una composición editorial contemporánea y en la diversidad musical y cultural peruana.

Incluye:

- Página principal con eventos destacados.
- Explorador y buscador de eventos.
- Filtros por género y ubicación.
- Fichas individuales de conciertos.
- Mapa SVG interactivo de sectores.
- Selección de entradas y carrito lateral.
- Flujo de compra simulado.
- Visualización DEMO de entradas mediante QR.
- Sincronización del estado de compra entre pestañas.

**Importante:** las compras y entradas actuales son demostrativas. No existe integración con una pasarela de pagos real ni emisión criptográfica de tickets desde un backend implementado.

---

## 03. Arquitectura de software

AFORO propone una arquitectura basada en un **monolito modular con principios de arquitectura hexagonal**.

Esta decisión busca mantener límites claros entre responsabilidades, facilitar las pruebas y controlar las operaciones críticas de inventario.

### Módulos del backend propuesto

1. Catalogue — Gestión y consulta de eventos.
2. Reservations — Inventario y reservas temporales.
3. Payments — Procesamiento y confirmación de pagos.
4. Tickets — Emisión y administración de entradas.
5. Access — Validación y control de accesos.
6. Identity — Identidad y autorización.

### Tecnologías consideradas

| Tecnología | Responsabilidad |
|---|---|
| React + TypeScript + Vite | Frontend implementado |
| PostgreSQL | Fuente de verdad del inventario (propuesto) |
| Redis | Soporte auxiliar para caché y notificaciones (propuesto) |
| IndexedDB | Persistencia local de AFORO Access (propuesto) |
| Ed25519 | Firma digital de entradas QR (propuesto) |

### Decisiones arquitectónicas principales

- Control transaccional del inventario mediante PostgreSQL.
- Bloqueo de filas para evitar conflictos entre reservas concurrentes.
- Reservas temporales con expiración de 600 segundos.
- Operaciones de pago idempotentes.
- Patrón Transactional Outbox para procesamiento recuperable de eventos.
- Emisión de entradas únicamente después de confirmar el pago.
- Validación online de uso único.
- Contingencia offline con posterior reconciliación.

Estas características forman parte del diseño propuesto y no representan funcionalidades backend actualmente desplegadas.

---

## 04. Modelo C4

La arquitectura se documenta mediante cuatro niveles de abstracción:

| Nivel | Descripción |
|---|---|
| C1 — Contexto | Usuarios, plataforma y sistemas externos. |
| C2 — Contenedores | Aplicaciones, API y almacenamiento. |
| C3 — Componentes | Organización interna del backend. |
| C4 — Código | Diseño detallado del módulo de reservas e inventario. |

Los diagramas permiten comprender progresivamente la estructura del sistema y sus decisiones técnicas.

---

## 05. Documentación técnica

La documentación del Sprint 01 se encuentra organizada en el directorio `docs/`.

| Directorio | Contenido |
|---|---|
| `docs/01-analisis-de-sistema/` | Requisitos funcionales y no funcionales, reglas de negocio, escenarios de calidad y trazabilidad. |
| `docs/02-arquitectura-software/` | Drivers, restricciones, selección arquitectónica y registros de decisiones (ADR). |
| `docs/03-diseno-de-software/` | Principios SOLID, diseño modular, patrones y diagramas de secuencia. |
| `docs/04-modelo-c4/` | Diagramas de contexto, contenedores, componentes y código. |

La documentación distingue entre funcionalidades implementadas, simuladas y propuestas.

---

## 06. Instalación y ejecución

### Requisitos

- Node.js
- npm

Desde el directorio del frontend:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Verificación del proyecto

```bash
npm run check
```

El comando ejecuta las verificaciones configuradas en el proyecto, incluyendo TypeScript, pruebas automatizadas y compilación de producción.

---

## 07. Metodología de desarrollo

El proyecto utiliza **Spec-Driven Development (SDD)**, tomando como referencia GitHub Spec Kit.

El proceso contempla:

1. Definición de principios del proyecto.
2. Especificación de funcionalidades.
3. Clarificación de requisitos.
4. Planificación técnica.
5. Descomposición de tareas.
6. Implementación.
7. Verificación y validación.

La documentación arquitectónica complementa este proceso mediante requisitos trazables, diagramas C4 y registros de decisiones.

---

## 08. Alcance y estado actual

| Elemento | Estado |
|---|---|
| Interfaz de AFORO Web | Implementada |
| Exploración y búsqueda de eventos | DEMO funcional |
| Selección de sectores y carrito | DEMO funcional |
| Checkout y entradas QR | Simulados |
| Documentación arquitectónica | Desarrollada durante Sprint 01 |
| AFORO Studio | Diseño propuesto |
| AFORO Access | Diseño propuesto |
| API Core | Diseño propuesto |
| Pagos reales | No implementados |
| Reservas transaccionales backend | No implementadas |

El propósito del Sprint 01 es establecer una base técnica coherente para la evolución del sistema.

---

## 09. Contexto académico

**Universidad Nacional de San Cristóbal de Huamanga**

Escuela Profesional de Ingeniería de Sistemas

**Curso:** Arquitectura de Software (IS-488)

**Docente:** Ing. Lizbeth Jaico

**Proyecto:** AFORO — Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo.

---

**AFORO — La noche no se cuenta. Se vive.**
