# Capítulo 03: Diseño de Software — Diseño Interno de Módulos

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Contenedor**: `API Core Backend` (Monolito Modular) & Clientes (`AFORO Web`, `AFORO Access`)  
**Documento**: `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md`  
**Versión**: `1.1.0` | **Fecha**: `2026-10-29`  
**Referencia Metodológica**: Guía 04 de Arquitectura de Software, Diseño Hexagonal de Módulos & Diagramas de Interacción UML  
**Alineación Arquitectónica**: Conforme a la [Constitution](../../../.specify/memory/constitution.md), las [Decisiones Arquitectónicas (ADRs 001 al 006)](../../01-analisis-de-sistema/07-decisiones-arquitectonicas.md) y el [Modelo C4](../../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md)

---

## 1. Propósito y Alcance del Diseño Interno de Módulos

El presente documento especifica la estructura interna y el comportamiento dinámico de los módulos que conforman el `API Core Backend` de **AFORO**. Articula tres dimensiones complementarias del diseño de software:
1. **Organización Interna de un Módulo Hexagonal**: La estructura canónica de paquetes, puertos, casos de uso, entidades y adaptadores que encapsula cada módulo del monolito modular.
2. **Máquinas de Estado del Dominio**: El ciclo de vida determinista de las dos entidades transaccionales críticas (`Reservation` y `Ticket`), gobernado por las reglas de negocio ([`RN-03`](../../complementos/03-reglas-de-negocio.md#rn-03-reserva-temporal-con-expiración-determinista-ttl-de-10-minutos), [`RN-07`](../../complementos/03-reglas-de-negocio.md#rn-07-máquina-de-estados-del-ticket)) y el [Diagrama C4 de Código](../../04-modelo-c4/Nivel4-DiagramadeCodigo.md).
3. **Diagramas de Secuencia de Flujos Críticos**: El intercambio temporal de mensajes, la delimitación transaccional y el control de concurrencia en:
   - **Flujo A**: Reserva Temporal Concurrente de Entradas (*Hold*).
   - **Flujo B**: Confirmación de Pago y Emisión Idempotente de Tickets.
   - **Flujo C**: Validación de Código QR en Puerta (Modos Online y Offline).

> [!IMPORTANT]
> **Declaración de Realidad Técnica**:  
> Conforme al Principio IV de la Constitución del proyecto:  
> - Los componentes de backend ([API Core](principios-de-diseño.md)), organizadores ([AFORO Studio](../../01-analisis-de-sistema/03-requisitos-funcionales.md#22-aforo-studio-aplicación-web-de-gestión-para-organizadores-y-promotores)) y control de acceso ([AFORO Access](../../01-analisis-de-sistema/03-requisitos-funcionales.md#23-aforo-access-aplicación-especializada-para-control-de-acceso-y-operadores-de-puerta)) corresponden a un **`[DISEÑO PROPUESTO — NO IMPLEMENTADO]`**.  
> - En el frontend ([AFORO Web SPA](../../../frontend/src/App.tsx)), la navegación, mapas SVG y selección visual de sectores están **`[IMPLEMENTADO EN WEB]`**, mientras que el paso de reserva, pasarela de pago y generación de pases operan actualmente como **`[DEMO / SIMULADO]`** en cliente.

---

## 2. Organización Interna de un Módulo Hexagonal (`[DISEÑO PROPUESTO]`)

Cada uno de los seis módulos del monolito (`catalog`, `reservations`, `payments`, `tickets`, `access`, `identity`) se estructura internamente siguiendo una convención uniforme de paquetes que separa la frontera pública intermodular, los adaptadores de infraestructura, la capa de aplicación y el núcleo de dominio:

```mermaid
flowchart TB
    subgraph MODULE_BOUNDARY["Estructura Interna de un Modulo (ej. modules/reservations/) [DISENO PROPUESTO]"]
        PUBLIC_API["<b>Frontera Publica (index.ts)</b><br/>Expone unicamente <code>IReservationsModuleFacade</code> y DTOs publicos<br/><i>(Oculta entidades, casos de uso, implementaciones y repositorios internos)</i>"]

        subgraph ADAPTERS_IN["presentation/ (Adaptadores Primarios Inbound)"]
            CTRL["<b>Controllers / Listeners</b><br/><code>ReservationsController</code><br/><i>Validacion HTTP y mapeo a Commands</i>"]
        end

        subgraph APPLICATION["application/ (Casos de Uso y Puertos)"]
            PORTS_IN["<b>ports/in/</b><br/><code>IReservationsModuleFacade</code>"]
            FAC_IMPL["<b>facades/</b><br/><code>ReservationsModuleFacadeImpl</code>"]
            UC["<b>use-cases/</b><br/><code>HoldTicketsUseCase</code><br/><code>ReleaseExpiredHoldsUseCase</code>"]
            PORTS_OUT["<b>ports/out/</b><br/><code>IReservationUnitOfWork</code><br/><code>ITimerNotifier</code>"]
        end

        subgraph DOMAIN["domain/ (Nucleo Puro de Negocio)"]
            ENT["<b>entities/ & aggregates/</b><br/><code>SectorInventory</code><br/><code>Reservation</code>"]
            VO["<b>value-objects/ & enums/</b><br/><code>ReservationStatus</code>"]
        end

        subgraph ADAPTERS_OUT["infrastructure/ (Adaptadores Secundarios Outbound)"]
            PG_ADAPT["<b>persistence/</b><br/><code>PostgreSQLReservationAdapter</code>"]
            RD_ADAPT["<b>timers/</b><br/><code>RedisTTLTimerAdapter</code>"]
        end

        PUBLIC_API -->|"Exporta solo interfaz"| PORTS_IN
        FAC_IMPL -.->|"implements"| PORTS_IN
        CTRL --> UC
        FAC_IMPL --> PORTS_OUT
        UC --> ENT & VO
        UC --> PORTS_OUT
        PG_ADAPT -.->|"implements"| PORTS_OUT
        RD_ADAPT -.->|"implements"| PORTS_OUT
    end

    classDef app fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#ffffff;
    classDef domain fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef infra fill:#1f2937,stroke:#64748b,stroke-width:2px,color:#ffffff;

    class PUBLIC_API,PORTS_IN,FAC_IMPL,UC,PORTS_OUT app;
    class ENT,VO domain;
    class CTRL,PG_ADAPT,RD_ADAPT infra;
```

### 2.1. Reglas de Organización Interna
- **`domain/`**: Contiene exclusivamente agregados, entidades, objetos de valor y excepciones de dominio en TypeScript puro. No importa nada de `application/`, `infrastructure/` ni `presentation/`.
- **`application/`**: Contiene los casos de uso (`*UseCase`), la implementación de la fachada pública (`*ModuleFacadeImpl`), los comandos/resultados y las interfaces de los puertos de salida (`ports/out/`). Solo depende de `domain/`.
- **`presentation/` y `infrastructure/`**: Contienen los adaptadores primarios (controladores HTTP, consumidores de eventos) y secundarios (repositorios PostgreSQL, adaptadores Redis, pasarelas de pago, criptografía Ed25519). Dependen hacia adentro de `application/`.
- **`index.ts` (Barrera de Encapsulamiento)**: Es el único punto de exportación visible para otros módulos del monolito, exponiendo exclusivamente el contrato de la fachada (`I<Modulo>ModuleFacade`) y sus DTOs inmutables.

---

## 3. Máquinas de Estado de las Entidades Críticas (`[DISEÑO PROPUESTO]`)

### 3.1. Máquina de Estados de `Reservation`
Extraída fielmente de [`RN-03`](../../complementos/03-reglas-de-negocio.md#rn-03-reserva-temporal-con-expiración-determinista-ttl-de-10-minutos), [`ADR-003`](../../complementos/adrs/ADR-003-concurrencia-integridad-inventario.md) y la enumeración `ReservationStatus` del [Diagrama C4 de Código](../../04-modelo-c4/Nivel4-DiagramadeCodigo.md):

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: HoldTicketsUseCase<br/>(Reserva creada con TTL = 600s,<br/>incrementa activeHoldsCount en SectorInventory)

    PENDING_PAYMENT --> CONFIRMED: markConfirmed() / confirmReservationSold()<br/>(Pago confirmado antes de expiresAt:<br/>H ← H - Q, S ← S + Q)

    PENDING_PAYMENT --> EXPIRED: markExpired() / ReleaseExpiredHoldsUseCase<br/>(expiresAt <= NOW() sin pago:<br/>reincorpora cupos H ← H - Q)

    PENDING_PAYMENT --> CANCELLED: markCancelled() / cancelHoldManually()<br/>(Cancelación explícita antes de expirar:<br/>reincorpora cupos H ← H - Q)

    CONFIRMED --> [*]
    EXPIRED --> [*]
    CANCELLED --> [*]
```

- **Garantía de Exclusión Mutua**: Las transiciones desde `PENDING_PAYMENT` hacia `CONFIRMED`, `EXPIRED` o `CANCELLED` son terminales y mutuamente excluyentes, ejecutadas en PostgreSQL mediante sentencias condicionales atómicas (`WHERE status = 'PENDING_PAYMENT'`).

### 3.2. Máquina de Estados de `Ticket`
Extraída fielmente de [`RN-07`](../../complementos/03-reglas-de-negocio.md#rn-07-máquina-de-estados-del-ticket), [`RN-08`](../../complementos/03-reglas-de-negocio.md#rn-08-validación-acceso-en-puerta-y-tolerancia-a-desconexión-anti-reúso), [`ADR-005`](../../complementos/adrs/ADR-005-criptografia-entradas-qr.md), [`ADR-006`](../../complementos/adrs/ADR-006-persistencia-operacion-offline-access.md) y el [Diagrama C3 de Componentes](../../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md):

```mermaid
stateDiagram-v2
    [*] --> ISSUED: Confirmación de pago exitoso<br/>(IssueTicketsUseCase + Firma Ed25519)
    ISSUED --> ACTIVE: Activación 24h antes del evento<br/>(Habilitado para control de acceso)
    ACTIVE --> USED: Escaneo exitoso en puerta<br/>(Transición atómica ACTIVE → USED)
    ACTIVE --> REVOKED: Reembolso o cancelación por promotor
    ACTIVE --> EXPIRED: Evento concluido sin asistencia
    USED --> [*]
    REVOKED --> [*]
    EXPIRED --> [*]
```

- **Invariante de No Reingreso (`RN-07`, `RN-08`)**: Un boleto que alcanza los estados terminales `USED`, `REVOKED` o `EXPIRED` no puede volver a transicionar a `ACTIVE` ni conceder un segundo ingreso. *(Nota de realidad técnica: en el flujo simulado actual de AFORO Web, los boletos locales emplean el estado de demostración `ACTIVA_DEMO`).*

---

## 4. Flujo A: Reserva Temporal Concurrente de Entradas (Hold)

### 4.1. Diagrama de Secuencia (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor CLI as Asistente (AFORO Web SPA)<br/>[IMPLEMENTADO EN WEB / DEMO EN COMPRA]
    participant CTRL as ReservationsController<br/>[DISEÑO PROPUESTO]
    participant UC as HoldTicketsUseCase<br/>[DISEÑO PROPUESTO]
    participant UOW as IReservationUnitOfWork<br/>(PostgreSQLAdapter) [DISEÑO PROPUESTO]
    participant DOM as SectorInventory / Reservation<br/>[DISEÑO PROPUESTO]
    participant REDIS as RedisTTLTimerAdapter<br/>[DISEÑO PROPUESTO]

    CLI->>CTRL: POST /api/v1/reservations/hold<br/>{eventId, sectorId, quantity, Idempotency-Key}
    CTRL->>UC: execute(HoldTicketsCommand)
    
    UC->>UOW: executeInTransaction(callback)
    activate UOW
    Note over UOW: Conexión dedicada del pool<br/>BEGIN TRANSACTION (READ COMMITTED)
    
    UOW->>UC: Inicia ejecución transaccional (txContext)
    
    UC->>UOW: txContext.findSectorInventoryWithLock(sectorId)
    Note over UOW: SELECT sector_id, event_id, capacity, sold_count, active_holds_count<br/>FROM sector_inventory WHERE sector_id = $1 FOR UPDATE
    UOW-->>UC: Retorna SectorInventory bloqueado
    
    UC->>UOW: txContext.countAccumulatedByHolder(sectorId, userId)
    Note over UOW: Evaluada bajo el lock del sector (serializa intentos concurrentes del mismo comprador)
    UOW-->>UC: Retorna total acumulado previo
    
    alt Aforo insuficiente O Cuota excedida (> 4 entradas)
        UC->>DOM: validateHolderQuota(acumulado, quantity) / canHold(quantity)
        DOM-->>UC: InvariantViolationException / QuotaExceededException
        UC-->>UOW: Propaga error de dominio
        Note over UOW: ROLLBACK TRANSACTION<br/>(Libera lock de fila)
        UOW-->>UC: Transacción abortada
        UC-->>CTRL: Error de dominio (Aforo agotado o límite superado)
        CTRL-->>CLI: 409 Conflict { errorCode: "QUOTA_EXCEEDED" | "SECTOR_SOLD_OUT" }
    else Aforo disponible Y Cuota autorizada (<= 4 entradas)
        UC->>DOM: registerHold(quantity)
        Note over DOM: Invariante RN-01 validada:<br/>sold_count + active_holds_count <= capacity
        UC->>DOM: Reservation.create(userId, sectorId, qty, ttl=600s)
        Note over DOM: Reservation { status: 'PENDING_PAYMENT',<br/>expires_at = NOW() + INTERVAL '600 seconds' (Reloj PostgreSQL) }
        
        UC->>UOW: txContext.saveHoldAndInventoryAtomic(inventory, reservation)
        Note over UOW: UPDATE sector_inventory SET active_holds_count = active_holds_count + $qty WHERE sector_id = $1<br/>INSERT INTO reservations (id, status, created_at, expires_at = NOW() + INTERVAL '600s', ...)
        
        UOW->>UOW: COMMIT TRANSACTION
        Note over UOW: Persistencia atómica completada.<br/>Se liberan bloqueos de fila de PostgreSQL.
        deactivate UOW
        UOW-->>UC: Transacción confirmada
        
        Note over UC,REDIS: Operación auxiliar asíncrona post-commit (sin bloquear DB)
        UC->>REDIS: scheduleHoldExpirationKey(reservationId, ttlSeconds=600)
        Note over REDIS: SET hold:ttl:{id} "active" EX 600<br/>(Alarma reactiva secundaria)
        
        UC-->>CTRL: HoldTicketsResult (Success, reservationId, expiresAt)
        CTRL-->>CLI: 201 Created { reservationId, expiresAt, remainingSeconds: 600 }
    end
```

### 4.2. Explicación del Protocolo, Reloj Único y Prevención de Deadlocks
1. **Adquisición de Lock Canónico (`sector_inventory` $\rightarrow$ `reservations`)**:
   En toda operación que afecte el inventario (`Hold`, `ConfirmSale` y `ReleaseExpired`), los bloqueos se adquieren siempre en el mismo orden jerárquico: primero la fila en `sector_inventory` (`ORDER BY sector_id ASC FOR UPDATE` si hay más de un sector) y luego la fila en `reservations`. Esta política única elimina interbloqueos (*deadlocks*) entre compras, confirmaciones y expiraciones concurrentes.
2. **Evaluación Concurrente de la Cuota de 4 Entradas (`RN-04`)**:
   Dado que `countAccumulatedByHolder(sectorId, userId)` se ejecuta **después** de adquirir `SELECT ... FROM sector_inventory WHERE sector_id = $1 FOR UPDATE`, múltiples peticiones simultáneas enviadas por un mismo comprador para ese sector quedan serializadas en cola esperando el bloqueo de fila del sector; cuando la primera confirma (`COMMIT`), la siguiente lee inmediatamente el nuevo acumulado bajo aislamiento `READ COMMITTED`, impidiendo superar las 4 entradas.
3. **Reloj Único Autoritativo (`NOW()` de PostgreSQL) y Liberación Idempotente**:
   Tanto el cálculo de `expires_at = NOW() + INTERVAL '600 seconds'` como las comparaciones de vigencia utilizan exclusivamente el reloj transaccional de PostgreSQL (`NOW()`), evitando derivas de reloj (*clock skew*) entre instancias de Node.js. La liberación por expiración ejecuta `UPDATE reservations SET status = 'EXPIRED' WHERE id = $1 AND status = 'PENDING_PAYMENT' AND expires_at <= NOW() RETURNING sector_id, quantity`, descontando `active_holds_count` únicamente si la transición afectó `1` fila.
4. **Rol Auxiliar de Redis**:
   La programación de la clave temporizada en Redis (`SET hold:ttl:... EX 600`) ocurre **estrictamente después del COMMIT** de PostgreSQL ([ADR-003](../../complementos/adrs/ADR-003-concurrencia-integridad-inventario.md)).

---

## 5. Flujo B: Pago Confirmado y Emisión Idempotente de Tickets

### 5.1. Diagrama de Secuencia (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor ASIS as Asistente / Navegador<br/>[DEMO EN CLIENTE]
    participant GW as Pasarela Externa<br/>(Culqi / Niubiz / Stripe)
    participant WH_CTRL as WebhooksController<br/>[DISENO PROPUESTO]
    participant PAY_UC as HandleGatewayWebhookUseCase<br/>[DISENO PROPUESTO]
    participant RES_FAC as IReservationsModuleFacade<br/>[DISENO PROPUESTO]
    participant DB as PostgreSQL (Sesion Unica txContext)<br/>[DISENO PROPUESTO]
    participant WORKER as OutboxProcessor Worker<br/>[DISENO PROPUESTO]
    participant TCK_SUB as TicketIssuanceListener<br/>[DISENO PROPUESTO]
    participant TCK_UC as IssueTicketsUseCase<br/>[DISENO PROPUESTO]
    participant CRYPTO as Ed25519SignatureAdapter<br/>[DISENO PROPUESTO]
    participant NOTIF as EmailNotificationAdapter<br/>[DISENO PROPUESTO]

    ASIS->>GW: Completa checkout con tarjeta (Token / 3DS)
    Note over GW: Procesa cobro con banco adquirente
    
    GW->>WH_CTRL: POST /api/v1/webhooks/payments (Payload + Firma HMAC)
    WH_CTRL->>PAY_UC: handleWebhook(payload, signature, provider)
    
    Note over PAY_UC: 1. Verificacion criptografica de firma de webhook segun pasarela
    PAY_UC->>PAY_UC: verifySignature(payload, signature)
    
    alt Firma invalida o adulterada
        PAY_UC-->>WH_CTRL: Error de autenticidad
        WH_CTRL-->>GW: 401 Unauthorized (Firma rechazada)
    else Firma valida
        Note over PAY_UC,DB: 2. Transaccion Compartida (txContext: ITransactionContext)
        PAY_UC->>DB: BEGIN TRANSACTION (READ COMMITTED -> crea txContext)
        
        PAY_UC->>DB: INSERT INTO payment_idempotency_keys (key=gateway_event_id, status='PROCESSING')<br/>ON CONFLICT (key) DO NOTHING
        
        alt Conflicto: Evento ya procesado previamente (Idempotencia)
            PAY_UC->>DB: ROLLBACK
            PAY_UC-->>WH_CTRL: Evento duplicado ya atendido
            WH_CTRL-->>GW: 200 OK (Aceptacion idempotente sin reprocesar)
        else Insercion exitosa (Primera vez que se recibe)
            PAY_UC->>RES_FAC: confirmReservationSold(reservationId, txContext)
            Note over RES_FAC,DB: En la MISMA conexion SQL (txContext):<br/>1. Lock sector_inventory FOR UPDATE<br/>2. UPDATE reservations SET status='CONFIRMED' WHERE status='PENDING_PAYMENT' AND expires_at > NOW()<br/>3. UPDATE sector_inventory SET active_holds_count = H - Q, sold_count = S + Q
            
            alt Retorno: CONFIRMED_NOW (Reserva vigente confirmada)
                PAY_UC->>DB: INSERT INTO payments (id, reservation_id, amount, status='CONFIRMED', ...)
                PAY_UC->>DB: INSERT INTO outbox_events (id, type='PAYMENT_CONFIRMED', payload, status='PENDING')
                PAY_UC->>DB: UPDATE payment_idempotency_keys SET status='SUCCEEDED' WHERE key=gateway_event_id
                PAY_UC->>DB: COMMIT TRANSACTION (Unico commit atomico para Payments + Reservations)
                PAY_UC-->>WH_CTRL: Confirmacion persistida
                WH_CTRL-->>GW: 200 OK (Recibido y asegurado)
            else Retorno: EXPIRED o CANCELLED (La reserva ya vencio en t >= 600s y libero su cupo)
                PAY_UC->>DB: INSERT INTO payments (id, reservation_id, amount, status='REQUIRES_REFUND', ...)
                PAY_UC->>DB: INSERT INTO outbox_events (id, type='PAYMENT_EXPIRED_REFUND_REQUIRED', payload, status='PENDING')
                PAY_UC->>DB: UPDATE payment_idempotency_keys SET status='SUCCEEDED' WHERE key=gateway_event_id
                PAY_UC->>DB: COMMIT TRANSACTION
                Note over PAY_UC,DB: No se emiten tickets (preserva invariante S + H <= C).<br/>El worker ejecutara RefundExpiredPaymentUseCase ante la pasarela.
                PAY_UC-->>WH_CTRL: Cobro tardio registrado para reembolso automatico
                WH_CTRL-->>GW: 200 OK (Webhook reconocido; reembolso encolado)
            end
        end
    end

    Note over WORKER,DB: 3. Despacho Asincrono Recuperable con Lease
    loop Intervalo del Worker Outbox
        WORKER->>DB: BEGIN TRANSACTION
        WORKER->>DB: SELECT * FROM outbox_events WHERE status='PENDING' OR (status='CLAIMED' AND lease_until < NOW())<br/>FOR UPDATE SKIP LOCKED LIMIT 10
        WORKER->>DB: UPDATE outbox_events SET status='CLAIMED', lease_until=NOW() + INTERVAL '30s'
        WORKER->>DB: COMMIT (Libera conexion SQL de inmediato)
        
        Note over WORKER,TCK_SUB: Despacho en memoria fuera de transaccion SQL
        WORKER->>TCK_SUB: onEvent(PAYMENT_CONFIRMED, outbox_event_id)
        TCK_SUB->>TCK_UC: execute(IssueTicketsCommand)
        
        Note over TCK_UC: Deduplicacion atomica en Modulo Tickets (outbox_event_id / order_id)
        TCK_UC->>CRYPTO: signTicketPayload(ticketData, PrivateKey_Ed25519)
        CRYPTO-->>TCK_UC: Firma criptografica asimetrica (64 bytes Base64URL)
        
        TCK_UC->>DB: INSERT INTO tickets (id, event_id, status='ISSUED', signature, qr_payload, ...)
        Note over TCK_UC,DB: Nace en estado ISSUED (RN-07) y pasa a ACTIVE 24h antes del evento
        TCK_UC->>NOTIF: sendTicketDeliveryEmail(userEmail, tickets)
        
        TCK_UC-->>TCK_SUB: Emision completada satisfactoriamente
        TCK_SUB-->>WORKER: Confirmacion de despacho
        
        WORKER->>DB: UPDATE outbox_events SET status='PROCESSED', processed_at=NOW() WHERE id=$outboxId
    end
```

### 5.2. Explicación de Coordinación Transaccional (`ITransactionContext`), Idempotencia y Pagos Tardíos
1. **Coordinación Transaccional mediante `ITransactionContext` (Un Solo Commit/Rollback)**:
   `HandleGatewayWebhookUseCase` inicia la unidad de trabajo transaccional en PostgreSQL obteniendo un token opaco `txContext: ITransactionContext` y lo pasa a `IReservationsModuleFacade.confirmReservationSold(reservationId, txContext)`. De este modo, tanto `PostgreSQLReservationAdapter` como `PostgreSQLPaymentAdapter` ejecutan sus sentencias SQL sobre **la misma conexión física de PostgreSQL y un único `COMMIT` o `ROLLBACK`**, sin exponer repositorios ni tablas privadas entre módulos y evitando *commits* parciales independientes.
2. **Retorno Tipado (`ReservationConfirmationStatus`) y Reembolso por Expiración**:
   `confirmReservationSold` retorna `'CONFIRMED_NOW' | 'ALREADY_CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'NOT_FOUND'`. Si retorna `'EXPIRED'` o `'CANCELLED'` (webhook tardío recibido en $t \ge 600\text{ s}$ tras la liberación del hold), jamás se emiten entradas; en la misma transacción se registra el pago como `REQUIRES_REFUND` y se inserta `PAYMENT_EXPIRED_REFUND_REQUIRED` en `outbox_events` para que `RefundExpiredPaymentUseCase` ejecute el reembolso automático con la pasarela.
3. **Consumidores Outbox Idempotentes**:
   Tanto `IssueTicketsUseCase` (`order_id` / `outbox_event_id` único en `tickets`) como `RefundExpiredPaymentUseCase` son estrictamente idempotentes frente a entregas repetidas (*at-least-once*) del `OutboxProcessor Worker`.

---

## 6. Flujo C: Validación de Código QR en Puerta (Modos Online y Offline)

### 6.1. Diagrama de Secuencia (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor OPER as Operador de Puerta / Molinete
    participant APP as AFORO Access PWA<br/>[DISENO PROPUESTO]
    participant IDB as Almacenamiento IndexedDB Local<br/>[DISENO PROPUESTO]
    participant API as API Core (Modulo Access)<br/>[DISENO PROPUESTO]
    participant TCK_FAC as ITicketsModuleFacade<br/>(Modulo Tickets) [DISENO PROPUESTO]
    participant DB as PostgreSQL Central (txContext)<br/>[DISENO PROPUESTO]

    OPER->>APP: Escaneo optico de QR en pantalla de asistente
    Note over APP: Decodifica payload JSON: {tId, eId, sId, exp, sig}<br/>Genera o reutiliza attemptId idempotente del escaneo
    
    Note over APP: 1. Verificacion Criptografica Local Inmediata (Ambos Modos)
    APP->>APP: verifySignature(payload, sig, PublicKey_Ed25519)
    
    alt Firma asimetrica invalida o clave no reconocida
        APP-->>OPER: ACCESO DENEGADO (Firma digital corrupta o fraudulenta - Molinete cerrado)
    else Firma asimetrica valida
        alt Modo A: Operacion Online Conectada (Conectividad Estable)
            APP->>API: POST /api/v1/access/validate-entry {attemptId, ticketId, gateId, operatorId}
            API->>DB: BEGIN TRANSACTION (READ COMMITTED -> crea txContext)
            API->>DB: SELECT result, sector_name FROM access_logs WHERE attempt_id = $attemptId
            
            alt Reintento de un attemptId cuyo COMMIT previo tuvo exito pero se perdio la respuesta HTTP
                DB-->>API: Retorna resultado previo asentado (GRANTED)
                API->>DB: COMMIT TRANSACTION
                API-->>APP: 200 OK { result: "GRANTED", idempotentReplay: true }
                APP-->>OPER: ACCESO CONCEDIDO (Recuperado sin re-consumir ticket)
            else Primer procesamiento de este attemptId
                API->>TCK_FAC: consumeTicketAtomically(ticketId, gateId, operatorId, txContext)
                Note over TCK_FAC,DB: En la MISMA transaccion SQL (txContext):<br/>UPDATE tickets SET status='USED', used_at=NOW()<br/>WHERE id=$1 AND status='ISSUED' RETURNING *

                alt Cero filas afectadas (Rechazo de Negocio: USED, REVOKED, EXPIRED o sector invalido)
                    TCK_FAC-->>API: TicketConsumptionResultDTO { success: false, reason, usedAt }
                    API->>DB: INSERT INTO access_logs (attempt_id, ticket_id, gate_id, result='REJECTED', reason, mode='ONLINE')
                    API->>DB: COMMIT TRANSACTION (Persiste auditoria del rechazo)
                    API-->>APP: 409 Conflict { status: "ALREADY_USED" | "REVOKED", usedAt }
                    APP-->>OPER: ACCESO DENEGADO (Molinete permanece cerrado)
                else Una fila actualizada (Transicion atomica ISSUED -> USED exitosa)
                    TCK_FAC-->>API: TicketConsumptionResultDTO { success: true, sectorName }
                    API->>DB: INSERT INTO access_logs (attempt_id, ticket_id, gate_id, result='GRANTED', mode='ONLINE')
                    API->>DB: COMMIT TRANSACTION (Unico commit: tickets.USED + access_logs.GRANTED)
                    API-->>APP: 200 OK { result: "GRANTED", attemptId, sector: "Campo A" }
                    Note over APP,OPER: Solo tras recibir confirmacion 200 OK post-commit:<br/>Se habilita la apertura fisica del molinete
                    APP-->>OPER: ACCESO CONCEDIDO (Molinete Habilitado)
                end
            end
            
        else Modo B: Operacion Offline Desconectada (Caida de Red Verificada en Puerta)
            Note over APP,IDB: Verificacion y marcado en base de datos local de la terminal
            APP->>IDB: getTicketStatus(ticketId)
            
            alt Ticket ya figura como 'USED' en el IndexedDB de ESTA terminal
                APP-->>OPER: ACCESO DENEGADO LOCAL (Reuso detectado en esta puerta)
            else Ticket no registrado como usado localmente
                APP->>IDB: markTicketUsedLocal(ticketId, gateId, timestamp)
                APP->>IDB: enqueuePendingReconciliation({attemptId, ticketId, gateId, timestamp, sig})
                APP-->>OPER: ACCESO CONCEDIDO OFFLINE (Valido localmente bajo riesgo particionado CAP)
            end
        end
    end

    Note over APP,API: 2. Fase de Reconciliacion Asincrona Posterior (Al Recuperar Conectividad)
    loop Al detectar reconexion de red
        APP->>IDB: getPendingReconciliationQueue()
        IDB-->>APP: Retorna lista de accesos validados fuera de linea
        APP->>API: POST /api/v1/access/reconcile-offline-batch {events: [...]}
        
        loop Por cada ingreso registrado fuera de linea (en transaccion con txContext)
            API->>TCK_FAC: consumeTicketAtomically(ticketId, gateId, operatorId, txContext)
            alt Ingreso legitimo unico (Transicion ACTIVE -> USED exitosa)
                API->>DB: INSERT INTO access_logs (attempt_id, ticket_id, gate_id, result='RECONCILED_SUCCESS', mode='OFFLINE')
            else Colision detectada: El mismo ticket fue usado en otra terminal durante el corte
                API->>DB: INSERT INTO access_audit_collisions (ticket_id, first_gate, second_gate, timestamps)
                Note over DB: Registro forense de fraude para sancion / investigacion
            end
        end
        API-->>APP: 200 OK (Lote de reconciliacion asentado)
        APP->>IDB: clearReconciledQueue()
    end
```

### 6.2. Coherencia Transaccional `Tickets` $\leftrightarrow$ `Access`, Idempotencia de Escaneo y Hardware de Molinete
1. **Atomicidad entre Consumo de Ticket y Auditoría (`ITransactionContext`)**:
   `ValidateTicketOnlineUseCase` inicia una transacción SQL (`txContext`) y la propaga a `ITicketsModuleFacade.consumeTicketAtomically(ticketId, gateId, operatorId, txContext)`. Tanto el `UPDATE tickets SET status = 'USED'` (en `Tickets`) como el `INSERT INTO access_logs` (en `Access`) se confirman en **un único `COMMIT`**. Si ocurre un fallo técnico de base de datos, se ejecuta `ROLLBACK` de ambos cambios y el boleto conserva su estado `ACTIVE`.
2. **Diferenciación entre Rechazo de Negocio y Error Técnico (Regla de Apertura Segura)**:
   - **Rechazo de Negocio (`409 Conflict` / `403 Forbidden`):** El boleto ya fue usado, está revocado o no pertenece al sector. No se modifica `tickets`, pero **sí se hace `COMMIT` del intento rechazado en `access_logs`** para auditoría de seguridad. El molinete jamás se abre.
   - **Fallo Técnico (`5xx` / Error SQL):** Se revierte la transacción (`ROLLBACK`). **Jamás se abre físicamente una puerta antes de tener confirmación suficiente de la operación** (confirmación `200 OK` online o validación criptográfica + commit local en `IndexedDB` cuando la terminal opera en modo de contingencia offline).
3. **Resolución del Caso de Commit Exitoso con Respuesta HTTP Perdida (`attemptId`)**:
   Cada lectura de código QR genera un identificador determinista o UUID de intento (`attemptId`) que viaja en la solicitud. Si PostgreSQL ejecuta el `COMMIT` (`tickets.USED` + `access_logs.GRANTED`) pero la respuesta HTTP se pierde por microcorte Wi-Fi/4G en el estadio, el reintento automático de la terminal envía el **mismo `attemptId`**. `ValidateTicketOnlineUseCase` consulta primero `access_logs` por `attempt_id` (`UNIQUE`), detecta que ese intento específico ya fue concedido y devuelve `200 OK (GRANTED)` sin intentar consumir el ticket por segunda vez.
4. **Frontera entre Transacción SQL y Accionamiento Físico del Molinete**:
   El destrabe electromecánico del molinete físico ocurre en el mundo real **después** del `COMMIT` de la transacción SQL y no forma parte del ámbito ACID de PostgreSQL. Si el hardware del torniquete reporta atasco mecánico tras el `200 OK`, la aplicación del operador registra la incidencia operativa local vinculada al `attemptId` para permitir el paso supervisado por el operador de puerta sin requerir un nuevo consumo en base de datos.
5. **Reconocimiento Explícito del Límite del Modo Offline (Teorema CAP)**:
   Dos o más terminales desconectadas simultáneamente entre sí no pueden garantizar la unicidad global del ingreso en tiempo real ([ADR-006](../../complementos/adrs/ADR-006-persistencia-operacion-offline-access.md)); cualquier uso duplicado inter-puerta durante un apagón de red se detecta de forma determinista en la reconciliación posterior y se registra en `access_audit_collisions`.

---

## 7. Matriz de Trazabilidad del Diseño Interno y Secuencias

| Artefacto de Diseño Interno | Requisitos Funcionales Asociados | Reglas de Negocio / Escenarios | Decisiones Arquitectónicas |
| :--- | :--- | :--- | :--- |
| **Organización Interna de Módulo** | Todos los RF de `API Core` | Separación de capas y fronteras modulares | **ADR-001** (Monolito Modular)<br/>**ADR-002** (Arquitectura Hexagonal) |
| **Máquina de Estados: `Reservation`** | **RF-WEB-12, RF-COR-02, RF-COR-03** | **RN-01** ($S + H \le C$)<br/>**RN-03** (TTL 600 s) | **ADR-003** (Vigencia determinista en PostgreSQL) |
| **Máquina de Estados: `Ticket`** | **RF-COR-05, RF-ACC-04, RF-ACC-05** | **RN-06, RN-07, RN-08** (`ISSUED → ACTIVE → USED / REVOKED / EXPIRED`) | **ADR-005** (Ed25519)<br/>**ADR-006** (Reconciliación de estados) |
| **Flujo A: Reserva Concurrente** | **RF-WEB-08, RF-WEB-12, RF-COR-01, RF-COR-02, RF-COR-03** | **RN-01** (Aforo Nominal $S + H \le C$)<br/>**RN-03** (TTL 600 s)<br/>**RN-04** (Tope 4 entradas)<br/>**EAC-01, EAC-02** | **ADR-001** (Monolito)<br/>**ADR-002** (Hexagonal)<br/>**ADR-003** (Persistencia y Bloqueo Pesimista en PostgreSQL) |
| **Flujo B: Pago y Emisión** | **RF-WEB-13, RF-COR-04, RF-COR-05, RF-COR-06** | **RN-05** (Idempotencia y Emisión)<br/>**EAC-03** (Recuperación de eventos) | **ADR-001** (Outbox sin broker externo)<br/>**ADR-004** (Idempotencia en Pagos)<br/>**ADR-005** (Firma Asimétrica Ed25519) |
| **Flujo C: Validación en Puerta** | **RF-ACC-01, RF-ACC-02, RF-ACC-03, RF-ACC-04, RF-ACC-05, RF-ACC-06, RF-COR-07** | **RN-06, RN-07, RN-08** (Validación de Acceso y Prevención de Reúso)<br/>**EAC-04, EAC-05** | **ADR-005** (Firma Asimétrica Ed25519)<br/>**ADR-006** (Operación Offline y Reconciliación en IndexedDB) |
