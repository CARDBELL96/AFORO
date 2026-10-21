# AFORO Constitution

## Core Principles

### I. Arquitectura Monolítica Modular y Hexagonal (INNEGOCIABLE)
El sistema AFORO MUST estructurarse en el backend como un **Monolito Modular** aplicando **Arquitectura Hexagonal (Puertos y Adaptadores)** para desacoplar estrictamente las capas de Dominio, Aplicación e Infraestructura en cada módulo del negocio. El ecosistema MUST contemplar tres aplicaciones cliente (**AFORO Web**, **AFORO Studio** y **AFORO Access**) que consumen una **API central compartida** respaldada por una **base de datos relacional transaccional**. Queda prohibido introducir microservicios o alterar este estilo arquitectónico sin una justificación documentada en un ADR y la aprobación explícita del responsable del proyecto.

### II. Integridad Transaccional e Invariantes de Dominio (INNEGOCIABLE)
El diseño e implementación del dominio de venta y gestión de entradas MUST garantizar desde su concepción cuatro invariantes críticos:
- **Prevención de sobreventa:** Ninguna zona o sector puede emitir ni reservar más entradas que su aforo configurado bajo concurrencia.
- **Reservas temporales (TTL):** La selección visual de entradas en el cliente NO bloquea inventario. El bloqueo temporal con expiración determinista (TTL) MUST generarse únicamente cuando el usuario solicita formalmente una reserva y el backend confirma la disponibilidad en base de datos, liberando el aforo automáticamente si no se completa el pago dentro de la ventana establecida.
- **Idempotencia de pagos:** Las operaciones de cobro, confirmación y procesamiento de notificaciones de pago MUST ser idempotentes mediante claves únicas para impedir cargos o emisiones duplicadas.
- **Validación segura de entradas QR:** Cada entrada emitida MUST poseer un identificador y firma verificable criptográficamente, garantizando validación atómica de un solo ingreso en **AFORO Access**.

### III. Coherencia Visual, Proporción Nativa y Calidad de Experiencia
Toda evolución de las aplicaciones cliente MUST preservar la identidad visual editorial aprobada de AFORO, garantizando una composición intencional, equilibrada y correctamente proporcionada de forma nativa al **100 % de zoom del navegador**, además de ser accesible y responsive en escritorio, tabletas y móviles. Los detalles específicos de rutas, tokens visuales, tipografías y componentes pertenecen a las especificaciones funcionales (`specs/`) y al sistema de diseño del proyecto.

### IV. Transparencia de Simulación y Honestidad Técnica (INNEGOCIABLE)
Queda estrictamente prohibido inventar funcionalidades implementadas, simular integraciones ocultas o fabricar resultados de pruebas. Mientras el backend o la pasarela de pagos no estén conectados a un flujo del frontend, la interfaz MUST identificar de forma explícita y visible que los datos, reservas y pases pertenecen a un **modo de demostración (`DEMO`)**, sin presentar jamás una operación simulada como una transacción financiera o reserva real en servidor.

### V. Desarrollo Guiado por Especificaciones (SDD) y Trazabilidad Académica
El desarrollo del proyecto MUST organizarse mediante **Scrum adaptado** por sprints y ejecutarse bajo **Spec-Driven Development (SDD)** utilizando las herramientas y plantillas oficiales de **GitHub Spec Kit** (`Constitution ➔ Specify ➔ Plan ➔ Tasks ➔ Implement`). Toda funcionalidad y entregable académico (Análisis del sistema, Requisitos funcionales y no funcionales, Reglas de negocio, Escenarios medibles de atributos de calidad, Principios SOLID, ADRs y Modelo C4 en sus cuatro niveles) MUST mantener trazabilidad verificable entre especificaciones, código fuente y pruebas automatizadas.

## Restricciones Operativas y Protección del Repositorio

- **Reproducibilidad SDD en el repositorio:** Las carpetas `.specify/` y `.agents/skills/` MUST conservarse versionadas en Git para garantizar que el repositorio académico incluya toda la infraestructura necesaria para reproducir y auditar el flujo SDD.
- **Preservación de activos y evolución controlada:** Las carpetas originales de referencia fuera del repositorio no deben modificarse, y los activos existentes del frontend no deben eliminarse ni reemplazarse sin que su evolución esté cubierta y verificada mediante una especificación aprobada.
- **Cambios incrementales y explicados:** Todo trabajo MUST aplicarse mediante cambios pequeños, atómicos y verificables. Antes de ejecutar cualquier modificación significativa, se MUST explicar qué archivos cambiarán y por qué.
- **Higiene del repositorio y seguridad:** Ningún commit ni publicación hacia el repositorio remoto oficial puede incluir credenciales, secretos, archivos `.env`, artefactos de compilación ni dependencias generadas.

## Flujo de Trabajo Scrum + Spec Kit y Compuertas de Calidad

1. **Especificación (`/speckit-specify`):** Definición y aprobación previa de historias de usuario priorizadas, requisitos funcionales/no funcionales, reglas de negocio y criterios de aceptación medibles en `specs/<NNN-feature>/spec.md`.
2. **Planificación Técnica (`/speckit-plan`):** Diseño técnico alineado con esta Constitution y validación de la compuerta *Constitution Check* en `specs/<NNN-feature>/plan.md`.
3. **Desglose de Tareas (`/speckit-tasks`):** Generación de tareas secuenciales, pequeñas y verificables en `specs/<NNN-feature>/tasks.md`.
4. **Implementación y Verificación (`/speckit-implement`):** Ejecución incremental validada obligatoriamente mediante la suite de verificación del proyecto (chequeo estático de tipos, pruebas automatizadas y compilación limpia) antes de cerrar cualquier tarea.

## Governance

Esta Constitution rige todas las decisiones arquitectónicas, de calidad, de implementación y de documentación académica del proyecto AFORO, prevaleciendo sobre prácticas ad-hoc.
- **Procedimiento de enmienda:** Cualquier cambio a los principios o restricciones aquí definidos requiere documentar la justificación técnica o académica, obtener la aprobación explícita del responsable del proyecto y actualizar este documento junto con su versión semántica.
- **Política de versionado:** Se aplica versionado semántico (`MAJOR.MINOR.PATCH`): `MAJOR` para cambios incompatibles o redefinición de principios arquitectónicos; `MINOR` para la adición de nuevos principios o secciones; `PATCH` para aclaraciones de redacción sin cambio normativo.
- **Revisión de cumplimiento:** Cada especificación (`spec.md`), plan técnico (`plan.md`), lista de tareas (`tasks.md`), entrega de sprint y commit hacia el repositorio oficial MUST verificar el cumplimiento estricto de esta Constitution.

**Version**: 1.0.0 | **Ratified**: 2026-10-20 | **Last Amended**: 2026-10-20
