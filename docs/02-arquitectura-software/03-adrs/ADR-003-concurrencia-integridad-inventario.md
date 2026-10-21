# ADR-003: Estrategia de Concurrencia e Integridad Transaccional de Inventario

- **Estado**: `[PROPUESTO]`
- **Fecha**: `2026-10-21`
- **Área**: Gestión de Inventario / Base de Datos / Concurrencia
- **Decisores**: Equipo de Arquitectura de Software AFORO
- **Estado de Realidad Técnica**: `[DISEÑO ARQUITECTÓNICO PROPUESTO]`

---

## 1. Contexto y Planteamiento del Problema

Durante el lanzamiento de preventas de alta demanda, múltiples compradores intentan adquirir simultáneamente cupos limitados en un mismo sector o zona de un evento. La plataforma tiene como principio fundamental la regla de negocio **`RN-01`**:
$$\text{Sold}(Z) + \text{ActiveHolds}(Z) \le \text{Capacity}(Z) \quad \forall Z \in E$$

El desafío de diseño consiste en establecer una estrategia de concurrencia sobre la base de datos que **prevenga la sobreventa de entradas de manera determinista**, evitando inconsistencias contables o bloqueos globales del sistema, clarificando el rol de PostgreSQL como única fuente de verdad y de Redis como infraestructura de apoyo.

---

## 2. Alternativas Evaluadas

1. **Alternativa A: Control de Concurrencia Optimista (Optimistic Locking con Versión)**:
   - *Descripción*: Cada sector posee una columna de versión. La actualización se condiciona a `WHERE id = :id AND version = :version`.
   - *Evaluación*: En escenarios de contención elevada sobre los últimos cupos de un sector, la tasa de abortos por colisión se incrementa considerablemente, requiriendo bucles de reintento en la aplicación que aumentan la latencia percibida por el usuario y la carga sobre la base de datos.

2. **Alternativa B: Nivel de Aislamiento `SERIALIZABLE` en PostgreSQL**:
   - *Descripción*: Ejecutar transacciones con aislamiento Serializable general.
   - *Evaluación*: PostgreSQL gestiona este nivel mediante *Serializable Snapshot Isolation (SSI)*, abortando transacciones ante dependencias de lectura/escritura concurrentes con errores de serialización (`could not serialize access`). Esto traslada la necesidad de reintentos a la capa de aplicación, generando una sobrecarga innecesaria cuando el recurso disputado es una fila puntual de sector.

3. **Alternativa C: Redis como Autoridad Primaria de Inventario (Contadores Atómicos `DECRBY`)**:
   - *Descripción*: Manejar los cupos disponibles en Redis y sincronizar asíncronamente hacia PostgreSQL.
   - *Evaluación*: Expone al sistema al riesgo de desfases contables o pérdida de sincronización ante fallos del proceso de réplica o reinicios no programados, vulnerando la condición de contar con una fuente de verdad transaccional unificada.

4. **Alternativa D: Bloqueo Pesimista a Nivel de Fila (`SELECT ... FOR UPDATE`) en PostgreSQL con Redis Auxiliar**:
   - *Descripción*: PostgreSQL opera como la única fuente de verdad. Se ejecuta un bloqueo a nivel de fila sobre el sector específico bajo aislamiento estándar `READ COMMITTED`, validando los invariantes y registrando la reserva de forma atómica dentro de la misma transacción. Redis se utiliza exclusivamente para soporte auxiliar (caché de lecturas, control de tráfico y temporizador TTL).

---

## 3. Decisión Propuesta

Se decide adoptar la **Alternativa D**:
1. **PostgreSQL como Única Fuente de Verdad (Single Source of Truth)** para aforos, disponibilidad por sector, reservas temporales y emisión definitiva de entradas.
2. **Rol Estrictamente Auxiliar de Redis**:
   - Caché de consulta pública para catálogo y disponibilidad general.
   - Mecanismo de estrangulamiento de peticiones (*rate limiting*) para mitigar ráfagas desmedidas.
   - Temporizador auxiliar de reservas mediante llaves con TTL de 10 minutos (600 s) escuchadas vía *keyspace notifications* o sincronizadas con un worker programado en base de datos (`RN-03`, `EAC-03`).
3. **Estrategia Transaccional y Bloqueo de Fila**:
   - La reserva se procesa en PostgreSQL dentro de una transacción bajo el nivel de aislamiento `READ COMMITTED` (o alternativamente `REPEATABLE READ`).
   - Se obtiene un bloqueo pesimista exclusivo sobre la fila del sector requerido:
     ```sql
     SELECT id, capacity, sold_count, held_count 
     FROM sectors 
     WHERE id = :sectorId 
     FOR UPDATE;
     ```
   - **Comprobación y Actualización Atómicas en la Misma Transacción**:
     El bloqueo pesimista garantiza la exclusión mutua para que ninguna otra transacción concurrentemente modifique la fila del sector, pero **no sustituye la comprobación de los invariantes de dominio**. Inmediatamente tras adquirir el lock y dentro de la misma transacción, se valida:
     $$\text{Capacity} - (\text{Sold} + \text{ActiveHolds}) \ge \text{RequestedQty}$$
     - Si la validación es satisfactoria: se actualiza el contador de reservas activas, se inserta la reserva temporal con timestamp y se confirma la transacción (`COMMIT`).
     - Si la capacidad restante es insuficiente: la transacción emite el error controlado `SECTOR_CAPACITY_EXCEEDED` y ejecuta rollback inmediato (`ROLLBACK`), liberando el lock sin alterar datos.

---

## 4. Justificación

1. **Prevención Determinista de Sobreventa**: Al serializar las transacciones sobre el sector en disputa mediante el bloqueo a nivel de fila, se asegura que las verificaciones de disponibilidad se evalúen secuencialmente, impidiendo reservas que excedan el aforo.
2. **Granularidad y Aislamiento por Sector**: El bloqueo se limita exclusivamente a la fila del sector solicitado (`sectorId`). Las reservas concurrentes sobre otros sectores o eventos continúan procesándose en paralelo sin interferencia.
3. **Simplicidad Transaccional**: Evita la complejidad de gestionar reintentos por colisiones optimistas o abortos de serialización SSI, manteniendo la duración de la transacción acotada a operaciones esenciales en base de datos.

---

## 5. Consecuencias

### Consecuencias Positivas
- Cumplimiento verificable del invariante de no sobreventa (`EAC-02`).
- Robustez contable respaldada por el motor relacional ACID de PostgreSQL.
- Redis puede reiniciarse o invalidar su caché sin afectar la consistencia del inventario.

### Compromisos y Consecuencias Negativas (Trade-offs)
- Durante ráfagas de compra sobre un mismo sector, las transacciones concurrentes deben esperar brevemente en cola por el bloqueo de fila. Por diseño, las transacciones deben ser breves (solo lectura con lock, cálculo y registro de reserva), prohibiendo estrictamente llamadas a pasarelas externas o tareas pesadas dentro de esta transacción.

---

## 6. Riesgos y Mitigaciones

| Riesgo Identificado | Probabilidad / Impacto | Mitigación Arquitectónica |
| :--- | :---: | :--- |
| **Bloqueos Mutuos (Deadlocks)** si una orden abarca más de un sector. | Baja / Alto | Ordenamiento determinista: si una transacción requiere bloquear más de un sector, las filas se adquieren siempre ordenadas ascendentemente por `sector_id` (`ORDER BY id ASC FOR UPDATE`). |
| **Reservas Abandonadas que Retienen Inventario** (carritos con reserva iniciada sin completar pago). | Alta / Medio | Liberación determinista automática al cumplirse los 10 minutos (TTL de 600 s) mediante listener de eventos o tarea programada (`RN-03`, `EAC-03`). |

---

## 7. Trazabilidad

- **Requisitos Funcionales**: [`RF-COR-02`](../01-analisis-de-sistema/01-requisitos-funcionales.md), [`RF-COR-03`](../01-analisis-de-sistema/01-requisitos-funcionales.md), [`RF-WEB-08`](../01-analisis-de-sistema/01-requisitos-funcionales.md).
- **Requisitos No Funcionales**: [`RNF-PE-05`](../01-analisis-de-sistema/02-requisitos-no-funcionales.md), [`RNF-RE-01`](../01-analisis-de-sistema/02-requisitos-no-funcionales.md).
- **Reglas de Negocio**: [`RN-01`](../01-analisis-de-sistema/03-reglas-de-negocio.md), [`RN-02`](../01-analisis-de-sistema/03-reglas-de-negocio.md), [`RN-03`](../01-analisis-de-sistema/03-reglas-de-negocio.md), [`RN-04`](../01-analisis-de-sistema/03-reglas-de-negocio.md).
- **Escenarios de Calidad**: [`EAC-02`](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md), [`EAC-03`](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- **Constitution**: Principio II (Integridad Transaccional, No Sobreventa y Modelo de Dominio).
