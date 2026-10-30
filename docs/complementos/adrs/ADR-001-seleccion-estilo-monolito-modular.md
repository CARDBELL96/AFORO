# ADR-001: Selección del Estilo Arquitectónico Global — Monolito Modular

- **Estado**: `[PROPUESTO]`
- **Fecha**: `2026-10-21`
- **Área**: Arquitectura del Sistema / Backend Core
- **Decisores**: Equipo de Arquitectura de Software AFORO
- **Estado de Realidad Técnica**: `[DISEÑO ARQUITECTÓNICO PROPUESTO]`

---

## 1. Contexto y Planteamiento del Problema

La plataforma AFORO gestiona la comercialización y validación de entradas para espectáculos masivos en vivo. El sistema tiene como meta de diseño soportar ráfagas concurrentes durante preventas exclusivas (meta arquitectónica de diseño: $2500\text{ req/s}$), garantizando de forma estricta que no se produzca sobreventa de aforo (`RN-01`). Al mismo tiempo, la solución debe ser desarrollada, mantenida y evolucionada por un equipo de ingeniería ágil bajo la metodología Spec-Driven Development (SDD), manteniendo control sobre la complejidad operativa, costos de infraestructura y reproducibilidad en entornos de desarrollo y pruebas.

El problema arquitectónico radica en seleccionar un estilo que concilie la **integridad transaccional del inventario** con el **aislamiento de dominio y mantenibilidad**, evitando tanto el acoplamiento caótico de un monolito no estructurado como la sobrecarga operativa prematura de una infraestructura distribuida compleja.

---

## 2. Alternativas Evaluadas

1. **Alternativa A: Monolito Tradicional en Capas (Layered Monolith)**:
   - *Descripción*: Aplicación única dividida horizontalmente en controladores, servicios y repositorios que acceden a una base de datos común sin fronteras de dominio.
   - *Evaluación*: Facilita el desarrollo inicial, pero presenta un riesgo elevado de acoplamiento descontrolado entre módulos (catálogo, reservas, pagos y accesos mezclados), dependencias circulares y erosión arquitectónica a mediano plazo, contraviniendo el Principio I de la Constitution.

2. **Alternativa B: Arquitectura de Microservicios Distribuidos**:
   - *Descripción*: Descomposición en servicios autónomos independientes (Servicio Catálogo, Reservas, Pagos, Tickets, Accesos), cada uno con base de datos propia y despliegue desacoplado.
   - *Evaluación*: Aunque los microservicios permiten aislar fallos y pueden coordinar consistencia mediante patrones distribuidos (SAGAs orquestadas, Transacciones Compensatorias y *Transactional Outbox*), introducen sobrecargas de red, complejidad de observabilidad distribuida, gestión de múltiples pipelines y costos de infraestructura desproporcionados para el alcance actual del proyecto y tamaño del equipo.

3. **Alternativa C: Arquitectura Serverless Basada en Funciones (FaaS)**:
   - *Descripción*: Endpoints implementados como funciones efímeras en la nube gestionadas por demanda.
   - *Evaluación*: Permite autoescalado elástico, pero presenta compromisos operativos significativos: penalizaciones de latencia por arranque en frío (*cold starts*) durante preventas masivas, sobrecarga en la administración de pools de conexiones hacia bases de datos relacionales bajo tráfico pico y menor portabilidad y reproducibilidad para pruebas locales.

4. **Alternativa D: Monolito Modular con Arquitectura Hexagonal**:
   - *Descripción*: Un único artefacto desplegable estructurado internamente en módulos verticales de dominio autónomos, con límites de comunicación estrictos basados en interfaces públicas y eventos en memoria.

---

## 3. Decisión Propuesta

Se decide adoptar el estilo de **Monolito Modular con Arquitectura Hexagonal (Puertos y Adaptadores)** como la arquitectura global del backend (`API Core`).

El sistema se diseñará como un único servicio en Node.js/TypeScript orquestado en contenedores Docker, organizado en seis módulos verticales independientes:
1. `modules/catalog` (Catálogo y Eventos)
2. `modules/reservations` (Inventario y Reservas con TTL)
3. `modules/payments` (Pagos e Idempotencia)
4. `modules/tickets` (Emisión y Ciclo de Vida del Boleto)
5. `modules/access` (Control de Entradas y Reconciliación)
6. `modules/identity` (Autenticación y Roles RBAC)

---

## 4. Justificación

1. **Integridad Transaccional Relacional (`RN-01`)**: Permite que las operaciones críticas de verificación de disponibilidad y bloqueo de reservas se resuelvan dentro de transacciones locales ACID sobre PostgreSQL, evitando la sobrecarga y fragilidad de protocolos de consenso o transacciones distribuidas sobre la red.
2. **Simplicidad Operativa y Eficiencia de Recursos**: Un solo proceso para desplegar, monitorear y registrar trazas, reduciendo sustancialmente los costos de DevOps y facilitando la reproducibilidad en entornos locales de desarrollo.
3. **Aislamiento de Dominio y Mantenibilidad**: La lógica de negocio permanece delimitada dentro de cada módulo, favoreciendo la cohesión y permitiendo pruebas unitarias rápidas de los casos de uso.
4. **Vía de Evolución Hacia Microservicios (Microservices-Ready)**: Si en etapas futuras un módulo en particular (por ejemplo, Catálogo para lecturas masivas o Accesos para validación perimetral) requiere escalado independiente, podrá extraerse como servicio autónomo reemplazando sus adaptadores en memoria por adaptadores de red o mensajería, preservando intacta la lógica de dominio.

---

## 5. Consecuencias

### Consecuencias Positivas
- Comunicación inter-módulo sin latencia de red añadida (llamadas en memoria o bus interno de eventos).
- Facilidad de orquestación y despliegue mediante Docker y Docker Compose.
- Delimitación clara de responsabilidades por módulo de negocio.

### Compromisos y Consecuencias Negativas (Trade-offs)
- **Dominio Único de Proceso**: Un fallo crítico no recuperado o consumo anómalo de memoria en un módulo puede comprometer la estabilidad del proceso global.
- **Disciplina Estricta de Código**: El monolito modular no previene por sí solo el acoplamiento indebido; exige herramientas de análisis estático (ej. `dependency-cruiser`) y revisiones de código para evitar importaciones directas entre dominios.

---

## 6. Riesgos y Mitigaciones

| Riesgo Identificado | Probabilidad / Impacto | Mitigación Arquitectónica |
| :--- | :---: | :--- |
| **Erosión de Límites Modulares** (acoplamiento cruzado accidental entre módulos). | Media / Alto | Reglas automatizadas de linting y pruebas de arquitectura estática en el pipeline de integración continua que bloqueen imports no autorizados. |
| **Sobrecarga de Base de Datos Relacional** en picos de consulta pública. | Media / Medio | Uso de Redis como infraestructura auxiliar de caché de lecturas públicas y CDN perimetral para activos y respuestas frecuentes. |

---

## 7. Trazabilidad

- **Requisitos Funcionales**: [`RF-COR-01` al `RF-COR-07`](../../01-analisis-de-sistema/03-requisitos-funcionales.md).
- **Requisitos No Funcionales**: [`RNF-MA-01`](../../01-analisis-de-sistema/04-atributos-de-calidad.md), [`RNF-MA-02`](../../01-analisis-de-sistema/04-atributos-de-calidad.md), [`RNF-PE-04`](../../01-analisis-de-sistema/04-atributos-de-calidad.md), [`RNF-PE-05`](../../01-analisis-de-sistema/04-atributos-de-calidad.md).
- **Reglas de Negocio**: [`RN-01`](../03-reglas-de-negocio.md), [`RN-03`](../03-reglas-de-negocio.md).
- **Escenarios de Calidad**: [`EAC-01`](../../01-analisis-de-sistema/../01-analisis-de-sistema/08-escenarios-atributos-calidad.md), [`EAC-02`](../../01-analisis-de-sistema/../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- **Constitution**: Principio I (Modularidad y Desacoplamiento Arquitectónico).
