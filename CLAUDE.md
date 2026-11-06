# AFORO — Instrucciones de Contexto para Claude Code

Este archivo proporciona el punto de entrada para sesiones interactivas con **Claude Code CLI** en el repositorio **AFORO**.

> [!NOTE]
> Este archivo está destinado a entornos compatibles con la herramienta de línea de comandos de Claude (Claude Code). No presupone lectura automática en interfaces web no configuradas.

---

## 1. Fuentes de Verdad Innegociables

Antes de proponer o modificar cualquier archivo, consulta obligatoriamente:

1. **Reglas Operativas y Gobernanza**: Consulta [`AGENTS.md`](AGENTS.md) para conocer las políticas de idioma, Git y verificación de calidad.
2. **Constitución del Proyecto**: Consulta [`.specify/memory/constitution.md`](.specify/memory/constitution.md) para conocer los 5 principios no negociables de AFORO.
3. **Auditoría Técnica Actualizada**: Consulta [`AFORO_CONTEXTO_ACTUAL.md`](AFORO_CONTEXTO_ACTUAL.md) para conocer la realidad del proyecto (Frontend implementado, Backend propuesto).
4. **Plantilla de Arquitectura Hexagonal**: Consulta [`docs/tecnologia/boilerplate-clean-arquitectura/README.md`](docs/tecnologia/boilerplate-clean-arquitectura/README.md).

---

## 2. Comandos Principales de Verificación

```bash
# Verificación integral del frontend desde la raíz
npm run check:web
# O directamente dentro de frontend/:
cd frontend && npm run check

# Chequeo estático de tipos
npm run typecheck:web

# Suite de pruebas unitarias
npm run test:web

# Servidor de desarrollo frontend
npm run dev:web
```

---

## 3. Restricciones Críticas para Claude

- **Idioma**: Respuestas, explicaciones y documentación académica exclusivamente en **español**. Código e identificadores en **inglés**.
- **Arquitectura**: **Monolito Modular** con **Arquitectura Hexagonal**. No propongas microservicios ni desacoples el backend en servicios independientes.
- **Frontend Protegido**: No modifiques los componentes ni las proporciones de [`frontend/src/`](frontend/src/) sin que esté explicitado en una tarea aprobada.
- **Transparencia**: Toda funcionalidad sin backend real debe identificarse explícitamente como `[DEMO]`.
