# Modelo C4 — Nivel 3: Diagrama de Componentes de API Core (C3)

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Contenedor Analizado**: `API Core Backend` (Monolito Modular)  
**Documento**: `docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`  
**Versión**: `1.2.0` | **Actualización**: `2026-11-06`

**Cambios de esta revisión**: simplificación de C3, vista hexagonal representativa con dominio explícito y exportaciones con fondo claro. La versión anterior se conserva en Git.
**Referencia Metodológica**: C4 Model (Simon Brown) & Guía 04 de Arquitectura de Software  
**Alineación Arquitectónica**: Conforme a la [Constitution](../../.specify/memory/constitution.md), el [Capítulo 01](../01-analisis-de-sistema/) y los [ADRs 001 al 006](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md)

---

## 1. Propósito y Alcance del Diagrama C3

El **Diagrama de Componentes (C3)** abre el contenedor **API Core Backend** de C2 y presenta los seis módulos, sus responsabilidades y sus relaciones. La vista complementaria muestra cómo se aplica el enfoque hexagonal en `Reservations`; las clases, métodos y secuencias se desarrollan en C4 y en diseño interno.

### Principios Arquitectónicos Fundamentales
1. **Monolito Modular (ADR-001)**: Los seis módulos coexisten dentro de un **único artefacto ejecutable** en Node.js/TypeScript. No existen llamadas de red inter-módulo ni microservicios.
2. **Flujo Hexagonal Estricto (ADR-002)**: Los casos de uso no se conectan directamente a bases de datos ni servicios externos; interactúan exclusivamente a través de **Puertos de Salida** (interfaces tipadas). Los adaptadores secundarios encapsulan el acceso a PostgreSQL, Redis y APIs externas.
3. **Fachadas Públicas Inter-Módulo**: Las fachadas representan contratos de servicio para comunicación entre módulos distintos, no pasos internos de sus propios casos de uso.
4. **Emisión de Tickets Resiliente con Transactional Outbox (ADR-003, ADR-004)**: El desacoplamiento entre el pago y la emisión de entradas no depende de un bus volátil en memoria. Se garantiza mediante persistencia atómica en la tabla `outbox_events` y un despachador recuperable que asegura la emisión idempotente ante reinicios del proceso.
5. **Transición Atómica de Acceso Online (ADR-005, ADR-006)**: La validación online en molinetes no realiza una simple consulta de estado, sino una mutación atómica condicional `ACTIVE → USED` en base de datos para prevenir ingresos concurrentes simultáneos.
6. **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**. El backend se encuentra formalizado y especificado a nivel de diseño; no existe código backend implementado aún en el repositorio.

---

## 2. Diagramas de Componentes de API Core (C3)

La vista principal responde cómo se divide API Core. La vista complementaria utiliza Reservations como módulo representativo para explicar puertos, adaptadores y dominio, siguiendo la progresión de la Guía 04 docente.

### 2.1 Vista C3-A: Módulos y relaciones

![C3: módulos pares dentro de API Core](../diagramas-exportados/C3-modulos.svg)

[PNG para exposición](../diagramas-exportados/C3-modulos.png). Composición vectorial reproducible en [render-architecture.mjs](../../scripts/render-architecture.mjs).

Esta vista contiene únicamente los seis módulos de negocio dentro de API Core. OutboxProcessor se omite del gráfico; su funcionamiento auxiliar se conserva en la sección 3.3. Las relaciones de infraestructura se resumen para evitar cruces visuales: cada módulo utiliza sus propios adaptadores y tablas. La persistencia compartida no autoriza acceso a las tablas de otro módulo.

<details>
<summary>Relaciones editables en Mermaid</summary>

```mermaid
flowchart LR
    subgraph API["API Core · Monolito modular · DISEÑO PROPUESTO"]
        CAT["Catalog · Eventos y sectores"]
        RES["Reservations · Hold 600 s y cuota 4"]
        PAY["Payments · Cobros idempotentes"]
        TCK["Tickets · Emisión y firma QR"]
        ACC["Access · Validación y auditoría"]
        IDN["Identity · JWT y RBAC transversal"]
        RES -->|ICatalogModuleFacade| CAT
        PAY -->|IReservationsModuleFacade| RES
        ACC -->|ITicketsModuleFacade| TCK
    end
    PG[("PostgreSQL 16 · Tablas privadas por módulo")]
    RD[("Redis 7 · Caché y señal TTL auxiliar")]
    GW["Pasarela de pago"]
    MAIL["Correo"]
    PAY -->|"Pago y evento en la misma transacción"| PG
    CAT & RES & TCK & ACC & IDN -->|"Adaptadores de cada módulo"| PG
    CAT & RES -->|"Caché / señal de expiración"| RD
    PAY <-->|"Cobros y webhooks"| GW
    TCK -->|"Envío de entradas"| MAIL
```

</details>

### 2.2 Vista C3-B: Enfoque hexagonal del módulo Reservations

![Vista representativa de puertos, aplicación, dominio y adaptadores](../diagramas-exportados/C3-hexagonal.svg)

[PNG para exposición](../diagramas-exportados/C3-hexagonal.png). Esta vista complementa C3; no sustituye el diagrama de clases de C4 ni pretende detallar los seis módulos a la vez.

- Las flechas continuas indican uso o invocación.
- Las flechas discontinuas con triángulo hueco indican realización: la implementación apunta al contrato que implementa.
- Los puertos pertenecen a aplicación; el dominio permanece independiente de aplicación e infraestructura.
- Los adaptadores primarios pueden organizarse en una carpeta presentation/; arquitectónicamente pertenecen a infraestructura, igual que los adaptadores secundarios.

<details>
<summary>Relaciones editables en Mermaid</summary>

```mermaid
flowchart LR
    CTRL["ReservationsController · Adaptador primario"]
    SWEEP["ExpirationSweepTrigger · Adaptador primario"]
    PAY["Payments · Consumidor en memoria"]
    subgraph RES["Reservations · DISEÑO PROPUESTO"]
        FAC["IReservationsModuleFacade · Puerto de entrada"]
        IMPL["ReservationsModuleFacadeImpl · Aplicación"]
        HOLD["HoldTicketsUseCase · Aplicación"]
        REL["ReleaseExpiredHoldsUseCase · Aplicación"]
        DOMAIN["SectorInventory / Reservation · Dominio puro"]
        UOW["IReservationUnitOfWork · Puerto de salida"]
        TIMER["ITimerNotifier · Puerto de salida"]
        IMPL -.->|implementa| FAC
        HOLD & REL --> DOMAIN
        HOLD & REL & IMPL --> UOW
        HOLD & IMPL --> TIMER
    end
    CTRL --> HOLD
    SWEEP --> REL
    PAY --> FAC
    PG["PostgreSQLReservationAdapter"] -.->|implementa| UOW
    RD["RedisTTLTimerAdapter"] -.->|implementa| TIMER
```

</details>

### 2.3 Contratos y trazabilidad

| Módulo | Responsabilidad / requisito | Contratos y mecanismos principales |
|---|---|---|
| Catalog | Consulta de eventos, recintos y sectores | ICatalogModuleFacade |
| Reservations | RN-01, RN-03 y RN-04: aforo, TTL y cuota | IReservationsModuleFacade, IReservationUnitOfWork, ITimerNotifier |
| Payments | RN-05: cobros idempotentes | IPaymentRepository, IPaymentGateway, IOutboxRepository |
| Tickets | RN-06 y RN-07: emisión y estados | ITicketsModuleFacade, ITicketRepository, ISignatureService, INotificationService |
| Access | RN-08: validación y reconciliación | ITicketsModuleFacade como consumidor; repositorio de auditoría propio |
| Identity | Autenticación y permisos de operaciones protegidas | IIdentityModuleFacade, IUserRepository, ITokenProvider, IPasswordHasher |

Las implementaciones de fachada conservan el nombre canónico *ModuleFacadeImpl. El detalle completo se mantiene en [enfoque arquitectónico](../02-arquitectura-software/enfoque-aquitectonico.md), [componentes](../02-arquitectura-software/componentes-arquitectonicos.md) y [C4](Nivel4-DiagramadeCodigo.md).

---

## 3. Especificación Arquitectónica y Flujos de Dominio

### 3.1 Flujo Hexagonal Estricto por Módulo
Cada módulo separa el núcleo de dominio, la aplicación y los adaptadores externos:
1. **Infraestructura — Adaptadores de Entrada (Inbound)**: Controladores HTTP REST (`*Controller`) y suscriptores de eventos que reciben las peticiones de clientes o tareas programadas y las traducen a DTOs de comando para la capa de aplicación.
2. **Aplicación y Dominio**: La aplicación contiene casos de uso (`*UseCase`) y servicios de fachada (`*ModuleFacadeImpl`) que orquestan operaciones sobre entidades y objetos de valor del dominio, donde residen las invariantes de negocio. **No contienen imports de clientes de base de datos ni SDKs de pasarelas**. Toda dependencia externa se modela como un **Puerto de Salida (Outbound Port)** mediante una interfaz TypeScript pura.
3. **Adaptadores de Salida (Outbound)**: Implementaciones concretas de los puertos (`PostgreSQL*Adapter`, `Redis*Adapter`) que realizan las interfaces de salida (`..|>`) conforme al Principio de Inversión de Dependencias (DIP).

---

### 3.2 Fachadas Públicas de Comunicación Inter-Módulo y Contexto Transaccional (`ITransactionContext`)
En concordancia con el principio de aislamiento eferente (Principio I de la Constitution y [`ADR-001`](../complementos/adrs/ADR-001-seleccion-estilo-monolito-modular.md)):
- Las capas de dominio de los módulos **tienen terminantemente prohibido importar entidades, tablas o adaptadores de otros módulos**.
- Cuando un módulo requiere consultar o coordinar cambios de estado con otro módulo dentro de la misma operación atómica, consume exclusivamente una **Fachada Pública Tipada** pasando un token opaco `txContext?: ITransactionContext` gestionado por `PostgreSQLTransactionManager`:
  - `ICatalogModuleFacade`: Expuesta por `Catalog`; consumida por `HoldTicketsUseCase` (`Reservations`) para consultar metadatos de evento/sector sin acceder a las tablas de catálogo.
  - `IReservationsModuleFacade`: Expuesta por `Reservations`; consumida por `ProcessPaymentUseCase` y `HandleGatewayWebhookUseCase` (`Payments`) mediante `confirmReservationSold(reservationId, txContext): Promise<ReservationConfirmationStatus>`, ejecutando la transición de `reservations` y `sector_inventory` en la misma transacción SQL del pago.
  - `ITicketsModuleFacade`: Expuesta por `Tickets`; consumida por `ValidateTicketOnlineUseCase` (`Access`) mediante `consumeTicketAtomically(ticketId, gateId, operatorId, txContext)`, garantizando que solo el módulo `Tickets` ejecute `UPDATE` sobre la tabla `tickets`.

---

### 3.3 Procesamiento de Pagos, Pagos Tardíos y Emisión con Transactional Outbox
Para garantizar que jamás se cobre a un asistente sin emitir sus entradas ni se produzca sobreventa ante webhooks tardíos:
1. **Confirmación del Proveedor de Pagos**: La pasarela externa confirma el cobro (vía respuesta sincrónica tokenizada o webhook firmado).
2. **Coordinación Transaccional Atómica (`Payments` + `Reservations`)**: Dentro de una **única transacción PostgreSQL (`txContext`)** iniciada por `Payments`:
   - Invoca `reservationsFacade.confirmReservationSold(reservationId, txContext)`.
   - **Caso A (`CONFIRMED`)**: La reserva estaba en `PENDING_PAYMENT` con `expires_at > NOW()`. `Reservations` actualiza `reservations.status = 'CONFIRMED'` y transiciona `sector_inventory` (`active_holds_count - Q`, `sold_count + Q`). `Payments` registra la orden como `PAID`, marca `payment_idempotency_keys = 'SUCCEEDED'` e inserta el evento `PAYMENT_CONFIRMED` en `outbox_events`.
   - **Caso B (`EXPIRED` — Pago tardío tras vencimiento del hold)**: Si el hold ya había expirado y su aforo fue liberado, `confirmReservationSold` retorna `'EXPIRED'`. `Payments` **jamás fuerza la venta ni emite entradas**; en la misma transacción registra el pago con estado `REQUIRES_REFUND` e inserta en `outbox_events` el evento `PAYMENT_EXPIRED_REFUND_REQUIRED` para que el worker ejecute el extorno automático ante la pasarela.
3. **Procesamiento Recuperable (`OutboxProcessor`)**: Un worker en segundo plano dentro del mismo proceso del monolito extrae los eventos pendientes de `outbox_events` mediante `SELECT ... FOR UPDATE SKIP LOCKED`.
4. **Emisión Idempotente en `Tickets` y Ciclo de Vida (`RN-07`)**: Para eventos `PAYMENT_CONFIRMED`, el despachador invoca `TicketIssuanceListener` $\rightarrow$ `IssueTicketsUseCase`, el cual verifica la unicidad por `order_id`, genera las entradas con estado inicial `ISSUED` y las firma con `Ed25519SignatureAdapter`. Conforme a [`RN-07`](../complementos/03-reglas-de-negocio.md#rn-07-máquina-de-estados-del-ticket), las entradas emitidas transicionan de `ISSUED` a `ACTIVE` 24 horas antes del concierto (habilitando su descarga en el padrón de puertas `RF-ACC-02`).
5. **Cierre del Outbox**: El evento en `outbox_events` transiciona a `PROCESSED`.

---

### 3.4 Control de Accesos: Transición Atómica `ACTIVE → USED`, Idempotencia de Escaneo y Separación de Auditoría
Para prevenir el doble ingreso concurrente en molinetes online, respetar las fronteras modulares, cumplir la máquina de estados `ISSUED → ACTIVE → USED` ([`RN-07`](../complementos/03-reglas-de-negocio.md#rn-07-máquina-de-estados-del-ticket)) y tolerar pérdidas de respuesta HTTP en la red del recinto:
1. **Idempotencia por Intento de Escaneo (`attemptId`)**: Cada lectura en el molinete envía un `attemptId` (UUIDv4) único por intento físico. Dentro de una transacción `txContext` iniciada por `ValidateTicketOnlineUseCase` (`Access`), `PostgreSQLAccessAdapter` verifica primero si `attempt_id` ya existe en `access_logs`. Si existe (reintento automático de la PWA porque se perdió la respuesta HTTP tras un commit previo), retorna inmediatamente el resultado original (`GRANTED` o el motivo de rechazo) sin re-ejecutar el consumo del ticket.
2. **Consumo Atómico Delegado al Módulo `Tickets`**:
   Si el `attemptId` es nuevo, `ValidateTicketOnlineUseCase` invoca `ticketsFacade.consumeTicketAtomically(ticketId, gateId, operatorId, txContext)`. El adaptador `PostgreSQLTicketAdapter` (único propietario de la tabla `tickets`) ejecuta en la misma transacción `txContext` la transición desde `ACTIVE` hacia `USED`:
   ```sql
   UPDATE tickets 
   SET status = 'USED', 
       used_at = NOW(), 
       used_gate = :gateId, 
       used_operator = :operatorId
   WHERE id = :ticketId 
     AND status = 'ACTIVE'
   RETURNING id, event_id, sector_id, holder_dni;
   ```
3. **Registro de Auditoría y Regla de Actuación Física del Molinete**:
   - **Éxito (`CONSUMED`)**: Si `UPDATE tickets` afecta 1 fila, `PostgreSQLAccessAdapter` inserta en `access_logs` el registro con `result = 'GRANTED'` y `attempt_id`, ejecuta `COMMIT` de la transacción `txContext` y retorna `HTTP 200 OK (GRANTED)`. **Regla física innegociable**: el relé del molinete solo se destraba tras recibir confirmación de `COMMIT` exitoso.
   - **Rechazo de Negocio (`ALREADY_USED`, `REVOKED`, `NOT_FOUND`)**: Si `UPDATE tickets` afecta 0 filas, `Tickets` consulta el estado actual del boleto en la misma transacción y lo devuelve a `Access`. `PostgreSQLAccessAdapter` inserta el intento fallido en `access_logs` (`DENIED_DUPLICATE` o `DENIED_INVALID`) y ejecuta **`COMMIT`** (para preservar la evidencia forense del intento de fraude), retornando `HTTP 409 Conflict` / `403 Forbidden`. El molinete permanece bloqueado y muestra la alerta roja con los metadatos del primer ingreso.
   - **Fallo Técnico de Infraestructura**: Si ocurre un error de base de datos o timeout antes del `COMMIT`, la transacción ejecuta `ROLLBACK` total (ni el ticket queda como `USED` ni se escribe un falso `GRANTED`), devolviendo `HTTP 503` y manteniendo el molinete cerrado.
4. **Limitación de la Operación Fuera de Línea (Teorema CAP)**:
   Si la terminal física pierde conectividad con `API Core Backend`, valida la firma Ed25519 localmente con WebCrypto y consulta su lista negra local en IndexedDB (`ADR-006`), previniendo el reingreso en la misma puerta física y encolando el evento en `offline_PendingSyncQueue` para reconciliación ulterior mediante `ReconcileGateLogsUseCase`.

---

### 3.5 Criptografía: Puerto de Firma y Custodia en Backend
En cumplimiento estricto de [`ADR-005`](../complementos/adrs/ADR-005-criptografia-entradas-qr.md):
- El módulo de tickets interactúa con la criptografía a través del puerto de salida `ISignatureService`.
- La implementación `Ed25519SignatureAdapter` custodia la clave privada por evento ($SK_E$), almacenada en variables de entorno cifradas o servicio KMS seguro en la infraestructura confiable del backend.
- La clave privada **jamás sale del servidor ni se transmite a clientes frontend**. Las terminales móviles de molinete en AFORO Access reciben únicamente la clave pública ($PK_E$, 32 bytes) para verificación local.

---

## 4. Trazabilidad con los Seis ADRs Aprobados

| ADR Aprobado | Principio Arquitectónico | Reflejo en Componentes C3 |
| :---: | :--- | :--- |
| **ADR-001** | **Monolito Modular** | Los 6 módulos residen en el mismo contenedor `API_CORE`. La comunicación inter-módulo se produce en memoria mediante contratos de fachada o el patrón Outbox. |
| **ADR-002** | **Arquitectura Hexagonal** | Casos de uso desacoplados de infraestructura mediante puertos de salida (`IReservationRepository`, `IPaymentGateway`, `ISignatureService`). |
| **ADR-003** | **PostgreSQL como Fuente de Verdad** | `HoldTicketsUseCase` adquiere `SELECT ... FOR UPDATE` sobre la fila del sector y valida capacidad en la misma transacción atómica en `PostgreSQLReservationAdapter`. `RedisTTLTimerAdapter` actúa como soporte auxiliar. |
| **ADR-004** | **Idempotencia de Pagos** | `PaymentsController` exige `Idempotency-Key` y persiste estados en PostgreSQL. El flujo de emisión desacoplado se protege mediante Transactional Outbox. |
| **ADR-005** | **Criptografía Ed25519** | Puerto `ISignatureService` implementado por `Ed25519SignatureAdapter`, custodiando la clave privada en backend y publicando claves públicas hacia `AccessGateController`. |
| **ADR-006** | **Persistencia Offline y Reconciliación** | `AccessGateController` y `ReconcileGateLogsUseCase` procesan bitácoras de molinete con auditoría forense para reconciliación post-evento. |
