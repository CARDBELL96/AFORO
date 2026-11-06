# Modelo C4 — Nivel 3: Diagrama de Componentes de API Core (C3)

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Contenedor Analizado**: `API Core Backend` (Monolito Modular)  
**Documento**: `docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md`  
**Versión**: `1.1.0` | **Fecha**: `2026-10-21`  
**Referencia Metodológica**: C4 Model (Simon Brown) & Guía 04 de Arquitectura de Software  
**Alineación Arquitectónica**: Conforme a la [Constitution](../../.specify/memory/constitution.md), el [Capítulo 01](../01-analisis-de-sistema/) y los [ADRs 001 al 006](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md)

---

## 1. Propósito y Alcance del Diagrama C3

El **Diagrama de Componentes (C3)** realiza un *zoom-in* sobre el contenedor central **API Core Backend**, ilustrado en el [Diagrama C2](Nivel2-DiagramadeContenedores.md). Muestra la organización interna del proceso monolítico en sus seis módulos de dominio cohesivos, detallando el flujo estricto de **Arquitectura Hexagonal (Casos de Uso $\rightarrow$ Puertos de Salida $\rightarrow$ Adaptadores $\rightarrow$ Infraestructura)**, los contratos de fachada inter-módulo, el procesamiento recuperable mediante **Transactional Outbox** y la emisión criptográfica asimétrica.

### Principios Arquitectónicos Fundamentales
1. **Monolito Modular (ADR-001)**: Los seis módulos coexisten dentro de un **único artefacto ejecutable** en Node.js/TypeScript. No existen llamadas de red inter-módulo ni microservicios.
2. **Flujo Hexagonal Estricto (ADR-002)**: Los casos de uso no se conectan directamente a bases de datos ni servicios externos; interactúan exclusivamente a través de **Puertos de Salida** (interfaces tipadas). Los adaptadores secundarios encapsulan el acceso a PostgreSQL, Redis y APIs externas.
3. **Fachadas Públicas Inter-Módulo**: Las fachadas representan contratos de servicio para comunicación entre módulos distintos, no pasos internos de sus propios casos de uso.
4. **Emisión de Tickets Resiliente con Transactional Outbox (ADR-003, ADR-004)**: El desacoplamiento entre el pago y la emisión de entradas no depende de un bus volátil en memoria. Se garantiza mediante persistencia atómica en la tabla `outbox_events` y un despachador recuperable que asegura la emisión idempotente ante reinicios del proceso.
5. **Transición Atómica de Acceso Online (ADR-005, ADR-006)**: La validación online en molinetes no realiza una simple consulta de estado, sino una mutación atómica condicional `ACTIVE → USED` en base de datos para prevenir ingresos concurrentes simultáneos.
6. **Estado de Realidad Técnica**: **`[DISEÑO PROPUESTO]`**. El backend se encuentra formalizado y especificado a nivel de diseño; no existe código backend implementado aún en el repositorio.

---

## 2. Diagramas de Componentes de API Core (C3)

Para garantizar máxima legibilidad académica y evitar la saturación visual en un único lienzo, el Nivel 3 (C3) se estructura en dos vistas complementarias:
- **Vista 2.1 (`C3-A` — Topología Intermodular y Custodia de Datos)**: Muestra la interacción entre los seis módulos del monolito a través de fachadas públicas en memoria (`I*ModuleFacade`), el flujo asíncrono mediante `OutboxProcessor` y la custodia estricta de tablas por módulo en PostgreSQL.
- **Vista 2.2 (`C3-B` — Estructura Hexagonal Interna e Inversión de Dependencias)**: Detalla los componentes internos de cada módulo (controladores, casos de uso, implementaciones de fachada, puertos de salida y adaptadores secundarios) respetando la dirección de las flechas de realización (`..|>`) del Principio de Inversión de Dependencias (DIP).

### 2.1 Vista C3-A: Topología Intermodular, Fachadas en Memoria y Custodia de Datos

![Diagrama C3-A — Topología Intermodular y Custodia de Datos](../diagramas-exportados/C3-modulos.svg)

> **Formatos exportados disponibles**: [SVG Vectorial (`C3-modulos.svg`)](../diagramas-exportados/C3-modulos.svg) | [PNG Alta Resolución (`C3-modulos.png`)](../diagramas-exportados/C3-modulos.png)

<details>
<summary><b>Ver código fuente Mermaid editable (C3-modulos)</b></summary>

```mermaid
flowchart TD
    subgraph CLIENTS["Clientes del Ecosistema"]
        WEB["AFORO Web SPA<br>[React 19 / TypeScript]<br>[IMPLEMENTADO - MODO DEMO]"]
        STU["AFORO Studio SPA<br>[React 19 / TypeScript]<br>[DISENO PROPUESTO]"]
        ACC["AFORO Access PWA<br>[PWA / Offline-First]<br>[DISENO PROPUESTO]"]
    end

    subgraph API_CORE["Contenedor: API Core Backend [Monolito Modular - DISENO PROPUESTO]"]
        direction TB

        subgraph MODULOS_NEGOCIO["Dominio Comercial: Catalogo, Reservas y Pagos"]
            direction LR
            MOD_CAT["1. Modulo Catalog<br>[Component: Catalogo y Recintos]<br>Fachada: ICatalogModuleFacade"]
            MOD_RES["2. Modulo Reservations<br>[Component: Retencion Temporal]<br>Fachada: IReservationsModuleFacade"]
            MOD_PAY["3. Modulo Payments<br>[Component: Cobro y Transacciones]<br>Publica en Outbox"]
        end

        OUTBOX_WORKER["OutboxProcessor Worker<br>[Component Auxiliar: Despachador At-Least-Once]"]

        subgraph MODULOS_OPERATIVOS["Dominio Operativo y Transversal: Tickets, Accesos e Identidad"]
            direction LR
            MOD_TCK["4. Modulo Tickets<br>[Component: Emision y Firma QR]<br>Fachada: ITicketsModuleFacade"]
            MOD_ACC["5. Modulo Access<br>[Component: Control de Molinete]<br>Valida ingresos"]
            MOD_IDN["6. Modulo Identity<br>[Component: Autenticacion y RBAC]<br>Gestion de sesiones"]
        end
    end

    subgraph INFRA["Infraestructura Compartida y Servicios Externos (PostgreSQL, Redis, Pasarelas y Correo)"]
        PG[("PostgreSQL 16 Relacional<br>[Persistencia ACID Compartida]")]
        RD[("Redis 7 Auxiliar<br>[Cache y Temporizadores TTL]")]
        GATEWAY["Pasarelas de Pago<br>[Culqi / Niubiz / Stripe]"]
        MAILER["Proveedor de Correo<br>[Envio Transaccional]"]
    end

    %% Entradas desde Clientes hacia Modulos
    WEB -->|"Consulta y reserva"| MOD_CAT
    WEB -->|"Solicita hold"| MOD_RES
    WEB -->|"Procesa compra"| MOD_PAY
    STU -->|"Gestion de eventos"| MOD_CAT
    ACC -->|"Validacion de ingreso"| MOD_ACC
    WEB & STU & ACC -.->|"Verificacion de sesion"| MOD_IDN

    %% Comunicacion Intermodular en Memoria (Fachadas Publicas)
    MOD_RES -->|"ICatalogModuleFacade"| MOD_CAT
    MOD_PAY -->|"IReservationsModuleFacade"| MOD_RES
    MOD_ACC -->|"ITicketsModuleFacade"| MOD_TCK

    %% Procesamiento Asincrono y Recuperable con Outbox
    MOD_PAY -.->|"Persiste evento"| OUTBOX_WORKER
    OUTBOX_WORKER -->|"Polling eventos pendientes"| PG
    OUTBOX_WORKER -->|"Despacha pago confirmado"| MOD_TCK

    %% Persistencia Compartida y Servicios Externos
    MOD_CAT & MOD_RES & MOD_PAY & MOD_TCK & MOD_ACC & MOD_IDN -->|"Persistencia de modulo"| PG
    MOD_CAT & MOD_RES -->|"Cache / Alarma TTL"| RD
    MOD_PAY <-->|"Autorizacion y webhooks"| GATEWAY
    MOD_TCK -->|"Despacho de comprobantes"| MAILER

    classDef client fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef appComp fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#ffffff;
    classDef workerComp fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef infraNode fill:#1f2937,stroke:#64748b,stroke-width:2px,color:#e2e8f0;

    class WEB,STU,ACC client;
    class MOD_CAT,MOD_RES,MOD_PAY,MOD_TCK,MOD_ACC,MOD_IDN appComp;
    class OUTBOX_WORKER workerComp;
    class PG,RD,GATEWAY,MAILER infraNode;
```

</details>

---

### 2.2 Vista C3-B: Estructura Hexagonal Interna por Módulo e Inversión de Dependencias (DIP)

> **Convención Arquitectónica de Flechas (Inversión de Dependencias y Tiempo de Ejecución)**:
> - `A --> B` (línea continua): **Llamada o invocación en tiempo de ejecución** (`A` invoca a `B`).
>   - El controlador primario invoca al caso de uso de aplicación (`Controller --> UseCase`).
>   - El caso de uso invoca el puerto de salida tipado (`UseCase --> OutboundPort`).
>   - Un módulo consume la fachada en memoria de otro módulo (`UseCase_A --> InboundPort_B`).
> - `A -.-> B` (línea discontinua): **Realización de interfaces e Inversión de Dependencias (DIP)** (`A` implementa o realiza el contrato definido en `B`).
>   - **Inversión de Dependencias (DIP)**: Los adaptadores secundarios de infraestructura implementan los puertos de salida definidos por el núcleo de la aplicación (`Adapter -.->|realiza (DIP)| OutboundPort`). La flecha apunta hacia el puerto en la capa de aplicación, demostrando que la infraestructura depende del dominio.
>   - **Realización de Contrato Público**: El servicio de aplicación realiza la interfaz del puerto de entrada (`ApplicationService -.->|realiza contrato| InboundPort`).

![Diagrama C3-B — Estructura Hexagonal Interna por Módulo](../diagramas-exportados/C3-hexagonal.svg)

> **Formatos exportados disponibles**: [SVG Vectorial (`C3-hexagonal.svg`)](../diagramas-exportados/C3-hexagonal.svg) | [PNG Alta Resolución (`C3-hexagonal.png`)](../diagramas-exportados/C3-hexagonal.png)

<details>
<summary><b>Ver código fuente Mermaid editable (C3-hexagonal)</b></summary>

```mermaid
flowchart TB
    subgraph ROW_COMERCIAL["Dominio Comercial: Catalogo, Reservas y Pagos"]
        direction LR

        subgraph MOD_CAT["1. Modulo Catalog"]
            direction TB
            CTRL_CAT["CatalogController<br>[Inbound Adapter]"]
            FAC_CAT["[Inbound Port]<br>ICatalogModuleFacade"]
            UC_CAT["GetCatalogUseCase /<br>CatalogFacadeImpl"]
            PORT_CAT["[Outbound Port]<br>ICatalogRepository / Cache"]
            ADAPT_CAT["CatalogAdapters<br>[PostgreSQL / Redis]"]

            CTRL_CAT -->|"invoca"| UC_CAT
            UC_CAT -.-> FAC_CAT
            UC_CAT -->|"invoca puerto"| PORT_CAT
            PORT_CAT ~~~ ADAPT_CAT
            ADAPT_CAT -.->|"realiza (DIP)"| PORT_CAT
        end

        subgraph MOD_RES["2. Modulo Reservations"]
            direction TB
            CTRL_RES["ReservationsController<br>[Inbound Adapter]"]
            FAC_RES["[Inbound Port]<br>IReservationsModuleFacade"]
            UC_RES["HoldTicketsUseCase /<br>ReservationsFacadeImpl"]
            PORT_RES["[Outbound Port]<br>IReservationUnitOfWork / Timer"]
            ADAPT_RES["ReservationAdapters<br>[PostgreSQL / Redis]"]

            CTRL_RES -->|"invoca"| UC_RES
            UC_RES -.-> FAC_RES
            UC_RES -->|"invoca puerto"| PORT_RES
            PORT_RES ~~~ ADAPT_RES
            ADAPT_RES -.->|"realiza (DIP)"| PORT_RES
        end

        subgraph MOD_PAY["3. Modulo Payments"]
            direction TB
            CTRL_PAY["PaymentsController /<br>WebhooksController"]
            UC_PAY["ProcessPaymentUseCase /<br>HandleGatewayWebhookUseCase"]
            PORT_PAY["[Outbound Port]<br>IPaymentRepository / Gateway"]
            ADAPT_PAY["PaymentAdapters<br>[PostgreSQL / Pasarelas]"]

            CTRL_PAY -->|"invoca"| UC_PAY
            UC_PAY -->|"invoca puerto"| PORT_PAY
            PORT_PAY ~~~ ADAPT_PAY
            ADAPT_PAY -.->|"realiza (DIP)"| PORT_PAY
        end
    end

    subgraph ROW_OPERATIVO["Dominio Operativo y Transversal: Tickets, Accesos e Identidad"]
        direction LR

        subgraph MOD_TCK["4. Modulo Tickets"]
            direction TB
            SUB_TCK["TicketIssuanceListener /<br>TicketsController"]
            FAC_TCK["[Inbound Port]<br>ITicketsModuleFacade"]
            UC_TCK["IssueTicketsUseCase /<br>TicketsFacadeImpl"]
            PORT_TCK["[Outbound Port]<br>ITicketRepository / Signature"]
            ADAPT_TCK["TicketAdapters<br>[PostgreSQL / Ed25519]"]

            SUB_TCK -->|"invoca"| UC_TCK
            UC_TCK -.->|"realiza contrato"| FAC_TCK
            UC_TCK -->|"invoca puerto"| PORT_TCK
            PORT_TCK ~~~ ADAPT_TCK
            ADAPT_TCK -.->|"realiza (DIP)"| PORT_TCK
        end

        subgraph MOD_ACC["5. Modulo Access"]
            direction TB
            CTRL_ACC["AccessGateController<br>[Inbound Adapter]"]
            UC_ACC["ValidateTicketOnlineUseCase /<br>ReconcileGateLogsUseCase"]
            PORT_ACC["[Outbound Port]<br>IAccessAuditRepository"]
            ADAPT_ACC["PostgreSQLAccessAdapter<br>[Outbound Adapter]"]

            CTRL_ACC -->|"invoca"| UC_ACC
            UC_ACC -->|"invoca puerto"| PORT_ACC
            PORT_ACC ~~~ ADAPT_ACC
            ADAPT_ACC -.->|"realiza (DIP)"| PORT_ACC
        end

        subgraph MOD_IDN["6. Modulo Identity"]
            direction TB
            CTRL_IDN["AuthController<br>[Inbound Adapter]"]
            FAC_IDN["[Inbound Port]<br>IIdentityModuleFacade"]
            UC_IDN["AuthenticateUserUseCase /<br>IdentityFacadeImpl"]
            PORT_IDN["[Outbound Port]<br>IUserRepository / TokenProvider"]
            ADAPT_IDN["IdentityAdapters<br>[PostgreSQL / JWT]"]

            CTRL_IDN -->|"invoca"| UC_IDN
            UC_IDN -.->|"realiza contrato"| FAC_IDN
            UC_IDN -->|"invoca puerto"| PORT_IDN
            PORT_IDN ~~~ ADAPT_IDN
            ADAPT_IDN -.->|"realiza (DIP)"| PORT_IDN
        end
    end

    %% Disposicion en dos niveles estables
    ROW_COMERCIAL -->|"invocaciones intermodulares"| ROW_OPERATIVO

    %% Invocaciones entre fachadas en memoria
    UC_RES -->|"invoca en memoria"| FAC_CAT
    UC_PAY -->|"invoca en memoria"| FAC_RES
    UC_ACC -->|"invoca en memoria"| FAC_TCK

    classDef inboundAdapter fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef appLayer fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#ffffff;
    classDef domainPort fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef outboundAdapter fill:#1f2937,stroke:#64748b,stroke-width:2px,color:#e2e8f0;

    class CTRL_CAT,CTRL_RES,CTRL_PAY,SUB_TCK,CTRL_ACC,CTRL_IDN inboundAdapter;
    class UC_CAT,UC_RES,UC_PAY,UC_TCK,UC_ACC,UC_IDN appLayer;
    class FAC_CAT,FAC_RES,FAC_TCK,FAC_IDN,PORT_CAT,PORT_RES,PORT_PAY,PORT_TCK,PORT_ACC,PORT_IDN domainPort;
    class ADAPT_CAT,ADAPT_RES,ADAPT_PAY,ADAPT_TCK,ADAPT_ACC,ADAPT_IDN outboundAdapter;
```

</details>

---

## 3. Especificación Arquitectónica y Flujos de Dominio

### 3.1 Flujo Hexagonal Estricto por Módulo
Cada módulo implementa de forma rigurosa la separación en tres planos concéntricos:
1. **Adaptadores de Entrada (Inbound)**: Controladores HTTP REST (`*Controller`) y suscriptores de eventos que reciben las peticiones de clientes o tareas programadas y las traducen a DTOs de comando para la capa de aplicación.
2. **Capa de Aplicación y Dominio Puro**: Casos de uso (`*UseCase`) y servicios de fachada (`*ModuleFacadeImpl`) que orquestan las políticas e invariantes de negocio. **No contienen imports de clientes de base de datos ni SDKs de pasarelas**. Toda dependencia externa se modela como un **Puerto de Salida (Outbound Port)** mediante una interfaz TypeScript pura.
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
