# Selección y Justificación de la Arquitectura de Software — AFORO

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Documento**: `docs/02-arquitectura-software/02-seleccion-y-justificacion-arquitectonica.md`  
**Versión**: `1.1.0` | **Fecha**: `2026-10-21`  
**Referencia Normativa**: Principios I, II y IV de la [Constitution de AFORO](../../.specify/memory/constitution.md) y [Drivers Arquitectónicos](01-drivers-y-restricciones.md)

---

## 1. Introducción y Criterio Metodológico de Evaluación

El diseño arquitectónico de AFORO responde a una premisa fundamental de ingeniería: **la complejidad accidental debe minimizarse, concentrando el esfuerzo técnico en resolver la complejidad inherente del dominio de taquilla de alta demanda y control de accesos**.

Para determinar la arquitectura del sistema, se contrastaron cuatro estilos arquitectónicos reconocidos frente a los drivers y restricciones formalizados en el documento anterior:
1. **Monolito Tradicional en Capas** (Layered Monolith).
2. **Microservicios Distribuidos** (Distributed Microservices Architecture).
3. **Arquitectura Serverless Basada en Funciones** (FaaS / Event-Driven Cloud Functions).
4. **Monolito Modular con Arquitectura Hexagonal** (Modular Monolith with Ports & Adapters — **Seleccionada**).

---

## 2. Evaluación Razonada de Alternativas Arquitectónicas

```mermaid
flowchart TD
    subgraph ALT["Alternativas Evaluadas"]
        A["Alternativa A: Monolito Tradicional"]
        B["Alternativa B: Microservicios Distribuidos"]
        C["Alternativa C: Serverless (FaaS)"]
        D["Alternativa D: Monolito Modular Hexagonal"]
    end
    CRIT["Criterios Evaluados:<br>1. Integridad Transaccional y Consistencia<br>2. Simplicidad Operativa y Despliegue<br>3. Aislamiento de Dominio y Mantenibilidad<br>4. Rendimiento y Latencia<br>5. Esfuerzo de Pruebas Automatizadas<br>6. Adecuación al Alcance y Equipo"] --> ALT
    D --> SEL["SELECCIÓN OFICIAL"]
```

### 2.1 Análisis Detallado de Cada Alternativa

#### Alternativa A: Monolito Tradicional en Capas (Layered Monolith)
- **Descripción**: Aplicación única estructurada en capas horizontales genéricas (Controladores, Servicios, Repositorios, Base de Datos compartida).
- **Ventajas**: Despliegue simple, desarrollo inicial acelerado y llamadas directas en memoria.
- **Desventajas Críticas**:
  - Propensión alta a la erosión arquitectónica (*Big Ball of Mud*): la lógica de catálogo termina acoplada a pagos, inventario y tickets.
  - Dependencias circulares entre servicios y esquemas de datos compartidos sin fronteras explícitas.
  - Imposibilidad de aislar el dominio respecto a frameworks web o bibliotecas de infraestructura.
- **Veredicto**: **Rechazada**. Su falta de límites modulares viola el Principio I de la Constitution y compromete la mantenibilidad a mediano plazo.

#### Alternativa B: Microservicios Distribuidos (Microservices Architecture)
- **Descripción**: Descomposición temprana en servicios independientes (Catálogo, Reservas, Pagos, Tickets, Accesos), cada uno con su propio ciclo de despliegue y base de datos aislada.
- **Ventajas**: Escalabilidad horizontal granular, despliegues independientes por servicio y aislamiento físico de fallos.
- **Evaluación Razonada de Descarte**:
  - Aunque los microservicios *pueden* garantizar consistencia transaccional mediante patrones avanzados (SAGAs orquestadas, Transacciones Compensatorias y *Transactional Outbox*), estos mecanismos introducen una **complejidad distribuida innecesaria** para el alcance actual del proyecto.
  - Añade sobrecarga de latencia de red en cada comunicación inter-servicio, necesidad de mallas de servicios (Service Mesh), observabilidad distribuida compleja y pipelines de despliegue múltiples, lo cual resulta desproporcionado para el tamaño del equipo de desarrollo y el alcance del Sprint 01.
- **Veredicto**: **Rechazada**. Introduce complejidad operativa y costos de infraestructura prematuros sin aportar beneficios indispensables en la etapa actual.

#### Alternativa C: Arquitectura Serverless / FaaS (Cloud Functions)
- **Descripción**: Endpoints ejecutados como funciones efímeras en la nube (AWS Lambda / Google Cloud Functions) con bases de datos gestionadas.
- **Ventajas**: Autoescalado masivo y modelo de costos por demanda efectiva.
- **Evaluación Razonada de Descarte**:
  - Aunque Serverless *puede* interactuar con bases de datos transaccionales relacionales (mediante proxys de conexión como PgBouncer o AWS RDS Proxy), presenta compromisos operativos significativos:
    - *Latencia de arranque en frío (Cold Starts)*: Puede degradar la experiencia en aperturas masivas de preventa donde la respuesta al usuario debe mantenerse por debajo de los 250 ms.
    - *Gestión de pools de conexiones*: Las ráfagas súbitas de funciones concurrentes pueden saturar rápidamente el límite de conexiones de la base de datos relacional si no se gestiona una infraestructura de proxy compleja.
    - *Dificultad de pruebas locales y portabilidad*: Complica la reproducibilidad exacta en entornos de desarrollo locales y pruebas unitarias aisladas.
- **Veredicto**: **Rechazada**. Los compromisos de latencia, gestión de conexiones y dependencia del proveedor no se alinean con los drivers prioritarios de taquilla masiva.

#### Alternativa D: Monolito Modular con Arquitectura Hexagonal (Seleccionada)
- **Descripción**: Un único artefacto desplegable en backend cuyos componentes internos están organizados en **módulos de dominio verticalmente cohesivos y rígidamente delimitados**, donde cada módulo sigue la **Arquitectura Hexagonal (Puertos y Adaptadores)**.
- **Ventajas Estratégicas y Adecuación**:
  - **Simplicidad Operativa y Transacciones Locales**: Al residir en el mismo proceso, los módulos pueden coordinar transacciones ACID locales sobre una única base de datos relacional (PostgreSQL), garantizando la regla matemática de no sobreventa (`RN-01`) sin la fragilidad de redes distribuidas.
  - **Aislamiento Estricto de Dominio**: El núcleo de cada módulo (entidades y casos de uso) es JavaScript/TypeScript puro, completamente independiente de frameworks HTTP y drivers de base de datos (Principio I de la Constitution).
  - **Adecuación al Equipo y Proyecto**: Permite avanzar a alta velocidad sin sobrecarga de DevOps, manteniendo un único pipeline de integración y despliegue reproducible en Docker.
  - **Extensibilidad a Microservicios**: Al mantener módulos aislados que se comunican exclusivamente por interfaces públicas y eventos en memoria, cualquier módulo (ej. Catálogo o Accesos) puede desacoplarse hacia un microservicio independiente en el futuro si la demanda lo justifica, sin alterar la lógica de negocio.
- **Veredicto**: **SELECCIONADA COMO LA ARQUITECTURA OFICIAL DE AFORO**.

---

### 2.2 Matriz Comparativa y Sustento del Cálculo Ponderado

La evaluación se formaliza mediante una matriz multicriterio con escala de 1 a 5 (donde 1 = Deficiente, 3 = Aceptable, 5 = Excelente) y factores de ponderación que reflejan los drivers de AFORO:

$$\text{Puntuación Total} = \sum_{i=1}^{n} (\text{Calificación}_i \times \text{Peso}_i)$$

| Criterio de Decisión | Peso | A: Monolito en Capas | B: Microservicios | C: Serverless (FaaS) | D: Monolito Modular Hexagonal |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Integridad Transaccional y Consistencia de Inventario** | **25 %** | 4.0 | 3.0 | 2.5 | **5.0** |
| **2. Simplicidad Operativa, Despliegue y Costo** | **20 %** | 4.0 | 1.5 | 3.0 | **5.0** |
| **3. Aislamiento de Dominio y Mantenibilidad (SOLID)** | **20 %** | 1.5 | 4.5 | 3.0 | **5.0** |
| **4. Rendimiento, Latencia Predecible y Concurrencia** | **15 %** | 4.0 | 3.5 | 2.5 | **4.5** |
| **5. Esfuerzo y Velocidad de Pruebas Automatizadas** | **10 %** | 3.0 | 2.0 | 2.5 | **5.0** |
| **6. Adecuación al Alcance del Proyecto y Equipo** | **10 %** | 3.5 | 1.5 | 2.5 | **4.5** |
| **PUNTUACIÓN TOTAL PONDERADA** | **100 %** | **3.35 / 5.0** | **2.85 / 5.0** | **2.68 / 5.0** | **4.88 / 5.0** |

#### Desglose del Cálculo para la Alternativa Seleccionada (D):
$$\text{Puntaje}_D = (5.0 \times 0.25) + (5.0 \times 0.20) + (5.0 \times 0.20) + (4.5 \times 0.15) + (5.0 \times 0.10) + (4.5 \times 0.10)$$
$$\text{Puntaje}_D = 1.25 + 1.00 + 1.00 + 0.675 + 0.50 + 0.45 = \mathbf{4.875} \approx \mathbf{4.88 / 5.0}$$

---

## 3. Justificación de la Elección: Monolito Modular con Arquitectura Hexagonal

### 3.1 PostgreSQL como Única Fuente de Verdad y Estrategia Transaccional
- **PostgreSQL como Autoridad de Inventario**:
  Se establece de manera categórica que **PostgreSQL es la única fuente de verdad (Single Source of Truth)** para el aforo, disponibilidad, reservas temporales y emisión definitiva de entradas.
- **Rol Auxiliar de Redis**:
  Redis actúa estrictamente como **infraestructura auxiliar**:
  1. *Caché de lecturas públicas*: Almacena representaciones serializadas del catálogo público para descargar la base de datos de lecturas masivas.
  2. *Estrangulamiento de tráfico (Rate Limiting)*: Protege los endpoints transaccionales contra ataques de denegación de servicio.
  3. *Temporizador de eventos*: Provee notificaciones de expiración basadas en llaves con TTL para detonar la liberación de reservas abandonadas.
  Redis **nunca opera como autoridad decisoria ni almacén primario del inventario**.
- **Estrategia Transaccional y de Concurrencia**:
  Para prevenir la sobreventa garantizando el cumplimiento estricto de `RN-01` ($\text{Sold} + \text{ActiveHolds} \le \text{Capacity}$), se adopta la siguiente estrategia:
  - Se ejecuta una transacción en PostgreSQL bajo el nivel de aislamiento estándar `READ COMMITTED` (o alternativamente `REPEATABLE READ`), utilizando un **bloqueo pesimista a nivel de fila (`SELECT ... FOR UPDATE`)** sobre el registro del sector o zona solicitado.
  - **Comprobación y actualización atómicas dentro de la misma transacción**: El bloqueo pesimista garantiza la exclusión mutua para que ninguna otra transacción concurrentemente modifique la fila del sector, pero **no sustituye la validación de los invariantes de negocio**. La comprobación de disponibilidad libre ($\text{Capacidad} - (\text{Vendidas} + \text{ReservasActivas}) \ge \text{CantidadSolicitada}$) y la posterior inserción de la reserva o actualización de contadores deben ejecutarse obligatoriamente **dentro de la misma transacción PostgreSQL**. Si la validación falla tras adquirir el lock, la transacción emite un error de dominio `SECTOR_CAPACITY_EXCEEDED` y ejecuta rollback inmediato, liberando el lock sin alterar datos.
  - Este mecanismo serializa exclusivamente las solicitudes concurrentes que compiten por el mismo sector específico, permitiendo transacciones concurrentes simultáneas sin bloqueo sobre otros sectores o conciertos distintos.
  - Se descarta el uso simultáneo obligatorio de aislamiento `SERIALIZABLE` con `SELECT FOR UPDATE`, dado que `SERIALIZABLE` impone una verificación optimista basada en grafos de dependencias (*SSI - Serializable Snapshot Isolation*) que aborta transacciones concurrentes con errores de serialización (`could not serialize access`), obligando a reintentos costosos que resultan innecesarios cuando el bloqueo pesimista a nivel de fila ya garantiza la exclusión mutua directa sobre el recurso disputado.

---

## 4. Topología del Ecosistema AFORO (Responsabilidades de Contenedores y Clientes)

```mermaid
flowchart TD
    subgraph CLIENTS["Clientes Frontend"]
        WEB["AFORO Web (SPA React/Vite)<br>[IMPLEMENTADO]<br>Público / Asistentes"]
        STU["AFORO Studio (SPA React/Vite)<br>[DISEÑO PROPUESTO]<br>Promotores / Productores"]
        ACC["AFORO Access (PWA Offline-First)<br>[DISEÑO PROPUESTO]<br>Operadores de Puerta"]
    end

    subgraph BACKEND["API Core Backend (Monolito Modular Node.js / TypeScript) [DISEÑO PROPUESTO]"]
        MOD_CAT["Módulo Catálogo & Eventos"]
        MOD_RES["Módulo Reservas & Inventario"]
        MOD_PAY["Módulo Pagos & Facturación"]
        MOD_TCK["Módulo Tickets & Emisión"]
        MOD_ACC["Módulo Accesos & Control"]
        MOD_IDN["Módulo Identidad & Seguridad"]
    end

    subgraph INFRA["Infraestructura y Persistencia [DISEÑO PROPUESTO]"]
        PG[("PostgreSQL Relacional<br>(Fuente de Verdad)")]
        RD[("Redis Auxiliar<br>(Caché / Rate Limit / TTL)")]
        GW["Pasarela de Pagos Externa"]
    end

    WEB -->|HTTPS / REST / JSON| MOD_CAT
    WEB -->|Crear Reserva Temporal| MOD_RES
    STU -->|HTTPS / REST / JWT| MOD_CAT
    STU -->|Monitoreo en Tiempo Real| MOD_RES
    ACC -->|HTTPS / REST / Sync| MOD_ACC

    MOD_RES -->|SELECT FOR UPDATE / ACID| PG
    MOD_RES -.->|Notificaciones TTL / Cache| RD
    MOD_PAY --> GW
    MOD_TCK --> PG
    MOD_ACC --> PG
```

### 4.1 Responsabilidades por Componente

1. **AFORO Web (SPA React/Vite) — `[IMPLEMENTADO]`**:
   - Descubrimiento de cartelera, navegación en pestaña segura (`target="_blank" rel="noopener noreferrer"`), selección visual no bloqueante de entradas en el navegador, cálculo de totales y billetera digital local (`TicketsModal`).
2. **AFORO Studio (SPA React/Vite) — `[DISEÑO PROPUESTO]`**:
   - Plataforma web para organizadores: configuración de recintos, límites numéricos de aforo por zona, asignación de etapas de venta, métricas en vivo y liquidación financiera.
3. **AFORO Access (PWA Offline-First) — `[DISEÑO PROPUESTO]`**:
   - Terminal para personal de puerta: escaneo óptico veloz, validación criptográfica autónoma, prevención de reutilización local en terminal desconectada, marcado atómico online y cola de reconciliación asíncrona post-evento.
4. **API Core Backend (Monolito Modular Node.js / TypeScript) — `[DISEÑO PROPUESTO]`**:
   - Concentra la lógica de negocio y las transacciones relacionales, estructurado en seis módulos con arquitectura hexagonal:
     - *Catálogo*: Gestión editorial de conciertos y recintos.
     - *Reservas*: Bloqueo transaccional de aforo en PostgreSQL y gestión del TTL de 10 minutos.
     - *Pagos*: Procesamiento idempotente de cargos (`Idempotency-Key`) y gestión de webhooks.
     - *Tickets*: Emisión de entradas criptográficas y máquina de estados finita.
     - *Accesos*: Validación en línea y reconciliación de bitácoras de molinetes.
     - *Identidad*: Autenticación y control de acceso basado en roles (RBAC).

---

## 5. Límites entre Módulos y Principios de Comunicación

En apego estricto al **Principio I (Modularidad y Desacoplamiento)** de la Constitution:

1. **Aislamiento Eferente**: La capa de dominio de un módulo jamás importa clases ni entidades de otro módulo.
2. **Comunicación Síncrona mediante Fachadas Públicas**: Cuando un módulo requiere datos de otro, consume exclusivamente una **Interfaz Pública Tipada** (Contrato de Fachada) expuesta por el módulo proveedor.
3. **Comunicación Asíncrona mediante Bus de Eventos en Memoria (`In-Process Event Bus`)**: Para efectos colaterales entre módulos (ej. `PagoConfirmado` detonando `EmitirTickets`), se emplean eventos de dominio asíncronos en memoria (`EventEmitter` tipado).
4. **Prohibición de Dependencias Circulares**: La arquitectura inter-módulo debe satisfacer la condición de Grafo Acíclico Dirigido (DAG).

---

## 6. Índice Maestro de Architectural Decision Records (ADRs)

Para garantizar la gobernanza del diseño y preservar la trazabilidad de las decisiones técnicas fundamentales, se formaliza el siguiente **Índice Maestro de ADRs**, cuyos documentos detallados se ubican en la carpeta [`03-adrs/`](03-adrs/):

| ID | Título de la Decisión Arquitectónica | Estado | Documento de Decisión | Módulo / Componente Afectado |
| :---: | :--- | :---: | :--- | :--- |
| **ADR-001** | **Selección del Estilo Arquitectónico General: Monolito Modular vs Microservicios vs Serverless** | `[PROPUESTO]` | [`ADR-001-seleccion-estilo-monolito-modular.md`](03-adrs/ADR-001-seleccion-estilo-monolito-modular.md) | Arquitectura Global del Backend (API Core) |
| **ADR-002** | **Adopción del Patrón Arquitectura Hexagonal (Puertos y Adaptadores) para Módulos Internos** | `[PROPUESTO]` | [`ADR-002-adopcion-arquitectura-hexagonal.md`](03-adrs/ADR-002-adopcion-arquitectura-hexagonal.md) | Estructura Interna de Módulos del Backend |
| **ADR-003** | **Estrategia de Concurrencia e Integridad Transaccional de Inventario: PostgreSQL como Fuente de Verdad y Mecanismo de Locking** | `[PROPUESTO]` | [`ADR-003-concurrencia-integridad-inventario.md`](03-adrs/ADR-003-concurrencia-integridad-inventario.md) | Módulo de Reservas & Inventario / PostgreSQL |
| **ADR-004** | **Estrategia de Idempotencia en Procesamiento de Pagos y Consumo de Webhooks** | `[PROPUESTO]` | [`ADR-004-idempotencia-pagos-webhooks.md`](03-adrs/ADR-004-idempotencia-pagos-webhooks.md) | Módulo de Pagos & Facturación |
| **ADR-005** | **Mecanismo Criptográfico para Emisión y Validación de Entradas QR: Firma Digital Asimétrica (Ed25519) vs Simétrica (HMAC-SHA256)** | `[PROPUESTO]` | [`ADR-005-criptografia-entradas-qr.md`](03-adrs/ADR-005-criptografia-entradas-qr.md) | Módulo de Tickets / Módulo de Accesos / AFORO Access |
| **ADR-006** | **Estrategia de Persistencia Local y Operación Fuera de Línea en Terminales de Puerta (AFORO Access)** | `[PROPUESTO]` | [`ADR-006-persistencia-operacion-offline-access.md`](03-adrs/ADR-006-persistencia-operacion-offline-access.md) | Cliente AFORO Access (IndexedDB vs SQLite WASM) |

> *Nota*: El presente índice establece la numeración oficial y enlaces directos a los seis ADRs del sistema elaborados en `docs/02-arquitectura-software/03-adrs/`.

---

## 7. Riesgos Arquitectónicos y Compromisos de Diseño (Trade-offs)

| Compromiso / Trade-off | Decisión Adoptada | Justificación y Mitigación |
| :--- | :--- | :--- |
| **Consistencia Transaccional vs Escalabilidad Distribuida** | Se prioriza la **consistencia ACID en PostgreSQL** (`READ COMMITTED` con `SELECT ... FOR UPDATE` por sector) sobre bases distribuidas multimaestro. | El negocio no tolera sobreventas (`RN-01`). Un pool transaccional de PostgreSQL con transacciones breves y caché auxiliar está proyectado para satisfacer la meta arquitectónica de concurrencia sin incurrir en la fragilidad de redes distribuidas. |
| **Disponibilidad Offline en Puertas vs Riesgo de Doble Ingreso Inter-Puerta** | Se prioriza la **disponibilidad local continua (AP)** en molinetes sobre la consistencia global inmediata (Teorema CAP). | Detener el flujo físico de ingreso en recintos genera avalanchas y riesgos de seguridad civil graves. El riesgo de doble ingreso cruzado durante particiones simultáneas se asume operativamente y se mitiga mediante zonificación física y reconciliación forense posterior. |
| **Selección Visual Local vs Bloqueo Previo de Inventario** | La navegación y el carrito web son estrictamente **locales y no bloqueantes** (`RN-02`). | Previene ataques de denegación de servicio por carritos abandonados. El bloqueo de inventario únicamente opera cuando el asistente inicia la reserva formal. |
