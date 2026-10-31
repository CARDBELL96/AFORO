# AFORO — Guía Universal de Instrucciones para Agentes de Desarrollo

Este documento establece las reglas operativas, arquitectónicas y de gobernanza obligatorias para cualquier agente de inteligencia artificial (Antigravity, Claude Code, GitHub Copilot, ChatGPT u otros) que opere en el repositorio **AFORO**.

---

## 1. Identidad y Alcance del Proyecto

- **Sistema**: AFORO — Plataforma integral de descubrimiento, compra, emisión y validación de entradas para eventos y conciertos en vivo en el Perú.
- **Contexto**: Proyecto del curso de Arquitectura de Software (Universidad Nacional de San Cristóbal de Huamanga).
- **Estado Actual**:
  - **AFORO Web SPA**: Implementado y verificado en Sprint 01 ([`src/`](src/)). Opera en modo `[DEMO / SIMULADO]` con datos locales en [`src/data/repository.ts`](src/data/repository.ts).
  - **API Core Backend**: Arquitectura formalmente especificada y aprobada en `docs/`; código pendiente de implementación.
  - **Base de Datos y Servicios Externos**: Diseñados formalmente; no conectados en producción.

---

## 2. Política de Idioma (Innegociable)

1. **Español (Obligatorio)**:
   - Toda la documentación académica y técnica ([`docs/`](docs/)).
   - Especificaciones funcionales y requisitos ([`specs/`](specs/)).
   - Constitución del proyecto ([`.specify/memory/constitution.md`](.specify/memory/constitution.md)).
   - Reglas, instrucciones, explicaciones y respuestas al usuario en chats y PRs.
   - Contenido de las skills personalizadas en [`.agents/skills/`](.agents/skills/).
2. **Inglés (Técnico)**:
   - Código fuente, nombres de clases, interfaces, tipos, variables, tablas de base de datos y métodos (`HoldTicketsUseCase`, `IReservationRepository`, `reservations`, etc.).
   - Prefijos semánticos de Git (`feat:`, `fix:`, `docs:`, `chore:`).
3. **Preservación de Formatos**:
   - Conservar nombres obligatorios de archivos técnicos (`SKILL.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `tsconfig.json`).
   - No traducir ni eliminar archivos de metadatos ni scripts generados por herramientas de soporte.

---

## 3. Arquitectura y Decisiones Aprobadas

Cualquier propuesta o implementación debe adherirse estrictamente a las decisiones arquitectónicas ya ratificadas:

1. **Estilo Arquitectónico**: **Monolito Modular** ([ADR-001](docs/complementos/adrs/ADR-001-seleccion-estilo-monolito-modular.md), [`docs/02-arquitectura-software/estilo-arquitectonico.md`](docs/02-arquitectura-software/estilo-arquitectonico.md)). Queda terminantemente prohibido proponer o introducir microservicios.
2. **Enfoque Interno**: **Arquitectura Hexagonal (Puertos y Adaptadores)** ([ADR-002](docs/complementos/adrs/ADR-002-adopcion-arquitectura-hexagonal.md), [`docs/02-arquitectura-software/enfoque-aquitectonico.md`](docs/02-arquitectura-software/enfoque-aquitectonico.md)).
   - Capa de Dominio: Entidades puras y objetos de valor independientes de frameworks, ORMs o librerías externas.
   - Capa de Aplicación: Casos de uso y puertos (`in` para fachadas, `out` para repositorios/adaptadores).
   - Capa de Infraestructura: Adaptadores primarios (controladores REST) y secundarios (PostgreSQL, Redis, Pasarelas).
3. **Módulos del Sistema (6 delimitados)**:
   - `Catalog`: Eventos, recintos, sectores, fechas y aforos.
   - `Reservations`: Bloqueo temporal (*Hold*) con TTL de 600 segundos, invariante de aforo y cuota máxima de 4 entradas.
   - `Payments`: Procesamiento idempotente de transacciones con pasarelas (Culqi/Niubiz) y recepción de webhooks.
   - `Tickets`: Emisión de pases y firma criptográfica asimétrica Ed25519 para códigos QR.
   - `Access`: Validación atómica en molinete de entrada (online con PostgreSQL y offline con IndexedDB).
   - `Identity`: Autenticación, JWT y control de acceso basado en roles (RBAC).
4. **Fronteras y Comunicación Inter-Modular**:
   - Prohibido acoplamiento directo entre bases de datos o adaptadores secundarios de módulos distintos.
   - Toda interacción entre módulos se realiza en memoria mediante contratos públicos explícitos (`I<Module>Facade`).
5. **Persistencia e Infraestructura**:
   - **PostgreSQL 16**: Única fuente de verdad transaccional autoritativa ([ADR-003](docs/complementos/adrs/ADR-003-concurrencia-integridad-inventario.md)).
   - **Redis 7**: Componente auxiliar exclusivamente para temporizadores de reserva (TTL) e invalidación de caché.
   - **Transactional Outbox**: Despacho garantizado *at-least-once* para eventos de integración ([`docs/02-arquitectura-software/componentes-arquitectonicos.md`](docs/02-arquitectura-software/componentes-arquitectonicos.md)).

---

## 4. Honestidad Técnica y Simulación (Innegociable)

1. **Principio de Transparencia**: Principio IV de la [Constitución](.specify/memory/constitution.md). Queda prohibido inventar código implementado, simular integraciones de pasarelas o afirmar que existen endpoints operativos cuando no lo están.
2. **Modo DEMO**: Mientras el backend no esté conectado al frontend, la interfaz debe explicitar que opera con datos de demostración (`DEMO`).
3. **Prohibición de Datos Falsos**: No generar métricas de rendimiento, latencias ni resultados de pruebas que no hayan sido efectivamente medidos mediante herramientas automatizadas.

---

## 5. Metodología: Spec-Driven Development (SDD) con Spec Kit

El repositorio utiliza **GitHub Spec Kit** como metodología oficial de desarrollo:

- Flujo obligatorio: `Constitution ➔ /speckit-specify ➔ /speckit-plan ➔ /speckit-tasks ➔ /speckit-implement ➔ /speckit-converge`.
- Las carpetas [`.specify/`](.specify/) y [`.agents/skills/`](.agents/skills/) son parte integral del repositorio versionado y deben conservarse intactas.
- Las skills personalizadas de AFORO (`aforo-*`) complementan y enriquecen a GitHub Spec Kit; no reemplazan sus comandos oficiales.

---

## 6. Seguridad de Git y Gobernanza del Código

1. **Ramas**: No trabajar directamente sobre `main`. Todo cambio funcional o refactorización debe realizarse en ramas semánticas (`feat/*`, `fix/*`, `chore/*`).
2. **No Destructividad**: Prohibido el uso de `git reset --hard`, `git clean -fd` o cualquier comando que elimine trabajo sin confirmación explícita del usuario.
3. **Commits y Pushes**: No realizar commits ni pushes remotos sin la debida revisión y autorización del usuario.
4. **Protección de la Documentación**: La estructura de carpetas de [`docs/`](docs/) es oficial e inmutable. No renombrar carpetas ni alterar la jerarquía de los 4 niveles C4 ni de los documentos académicos.

---

## 7. Verificación de Calidad y Pruebas

Antes de dar por concluida cualquier tarea técnica de código:
1. Ejecutar la suite de comprobación oficial del proyecto:
   ```bash
   npm run check
   ```
   (Incluye chequeo estático con `tsc --noEmit`, pruebas unitarias con `node --test` y compilación de producción con Vite).
2. Reportar con precisión: número de pruebas ejecutadas, pruebas pasando y pruebas fallidas. Nunca declarar una tarea como completada si `npm run check` arroja errores.

---

## 8. Política de Preservación Histórica y Trazabilidad (Innegociable)

AFORO es un proyecto académico cuya evolución debe ser verificable. Los documentos, especificaciones, decisiones arquitectónicas, skills e instrucciones de agentes forman parte de la evidencia del proceso de desarrollo. **No se permite eliminar, sobrescribir sin trazabilidad ni reescribir silenciosamente versiones históricas.**

### Reglas Obligatorias de Trazabilidad:
1. **Historial de Git Sagrado**: Preservar el historial de Git de todos los documentos, especificaciones, skills, ADR y configuraciones.
2. **Inspección Previa de Cambios**: Antes de modificar un archivo existente, comprobar su estado en Git y distinguir los cambios ya registrados de los cambios locales pendientes.
3. **Respeto a Modificaciones Locales**: Nunca descartar modificaciones locales de otra persona o agente.
4. **Modificaciones Incrementales**: Realizar cambios incrementales y justificados. No sustituir documentos completos cuando una edición localizada sea suficiente.
5. **Preservación de Nombres y Rutas**: Mantener los nombres y rutas requeridos por GitHub Spec Kit y los agentes, evitando crear copias que puedan confundirse con la versión activa.
6. **Supersesión de Decisiones Arquitectónicas**: Cuando una decisión arquitectónica cambie sustancialmente, conservar la decisión anterior y documentar su sustitución mediante un nuevo ADR o un mecanismo explícito de supersesión (`SUPERSEDED BY ADR-XXX`).
7. **Control de Versiones y Fechas**: En documentos académicos importantes, registrar versión, fecha y resumen de cambios cuando corresponda, sin alterar retrospectivamente fechas históricas.
8. **Prohibición de Alteración Retrospectiva**: No modificar fechas de creación, aprobación o ratificación anteriores para aparentar continuidad.
9. **Ciclo de Vida de Versiones y Skills**: No borrar versiones antiguas, especificaciones o skills sin autorización explícita. Si una versión queda obsoleta, marcarla como reemplazada y enlazar su sucesora.
10. **Análisis de Impacto en Enlaces**: Antes de eliminar o renombrar archivos, analizar exhaustivamente referencias entrantes y efectos sobre herramientas y documentación.
11. **Prohibición de Carpetas Ad-hoc**: No crear carpetas `backup`, `old` o `v2` indiscriminadamente. Confiar en el historial de Git para versionado y utilizar archivos históricos explícitos únicamente cuando exista una justificación académica o técnica.
12. **Gobernanza de Commits**: Registrar los cambios con commits descriptivos una vez autorizados por el usuario. No hacer commits, pushes ni merges automáticamente.
13. **Informe de Balance en Cierre de Tareas**: En el informe final de cada tarea, especificar obligatoriamente los archivos creados, modificados, conservados y, si aplica, propuestos para sustitución.


