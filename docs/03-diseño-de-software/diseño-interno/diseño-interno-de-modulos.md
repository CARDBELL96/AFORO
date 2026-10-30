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
> - En el frontend ([AFORO Web SPA](../../../src/App.tsx)), la navegación, mapas SVG y selección visual de sectores están **`[IMPLEMENTADO EN WEB]`**, mientras que el paso de reserva, pasarela de pago y generación de pases operan actualmente como **`[DEMO / SIMULADO]`** en cliente.

---

## 2. Organización Interna de un Módulo Hexagonal (`[DISEÑO PROPUESTO]`)

Cada uno de los seis módulos del monolito (`catalog`, `reservations`, `payments`, `tickets`, `access`, `identity`) se estructura internamente siguiendo una convención uniforme de paquetes que separa la frontera pública intermodular, los adaptadores de infraestructura, la capa de aplicación y el núcleo de dominio:

```mermaid
flowchart TB
    subgraph MODULE_BOUNDARY["📦 Estructura Interna de un Módulo (ej. modules/reservations/) [DISEÑO PROPUESTO]"]
        PUBLIC_API["<b>Frontera Pública (index.ts)</b><br/>Expone únicamente <code>IReservationsModuleFacade</code> y DTOs públicos<br/><i>(Oculta entidades, casos de uso y repositorios internos)</i>"]

        subgraph ADAPTERS_IN["presentation/ (Adaptadores Inbound)"]
            CTRL["<b>Controllers / Listeners</b><br/><code>ReservationsController</code><br/><i>Validación HTTP y mapeo a Commands</i>"]
        end

        subgraph APPLICATION["application/ (Casos de Uso y Puertos)"]
            FAC_IMPL["<b>facades/</b><br/><code>ReservationsModuleFacadeImpl</code>"]
            UC["<b>use-cases/</b><br/><code>HoldTicketsUseCase</code><br/><code>ReleaseExpiredHoldsUseCase</code>"]
            PORTS_OUT["<b>ports/out/</b><br/><code>IReservationUnitOfWork</code><br/><code>ITimerNotifier</code>"]
        end

        subgraph DOMAIN["domain/ (Núcleo Puro de Negocio)"]
            ENT["<b>entities/ & aggregates/</b><br/><code>SectorInventory</code><br/><code>Reservation</code>"]
            VO["<b>value-objects/ & enums/</b><br/><code>ReservationStatus</code>"]
        end

        subgraph ADAPTERS_OUT["infrastructure/ (Adaptadores Outbound)"]
            PG_ADAPT["<b>persistence/</b><br/><code>PostgreSQLReservationAdapter</code>"]
            RD_ADAPT["<b>timers/</b><br/><code>RedisTTLTimerAdapter</code>"]
        end

        PUBLIC_API --> FAC_IMPL
        CTRL --> UC
        FAC_IMPL --> PORTS_OUT
        UC --> ENT & VO
        UC --> PORTS_OUT
        PG_ADAPT -.->|"implements"| PORTS_OUT
        RD_ADAPT -.->|"implements"| PORTS_OUT
    end
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
    Note over UOW: SELECT * FROM sector_inventory<br/>WHERE id = $1 FOR UPDATE
    UOW-->>UC: Retorna SectorInventory bloqueado
    
    UC->>UOW: txContext.countAccumulatedByHolder(sectorId, userId)
    Note over UOW: SELECT COALESCE(SUM(quantity), 0)<br/>FROM purchases_and_active_holds...
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
        Note over DOM: Invariante RN-01 validada:<br/>S + H <= Capacity
        UC->>DOM: Reservation.create(userId, sectorId, qty, ttl=600s)
        Note over DOM: Reservation { status: 'PENDING_PAYMENT',<br/>expiresAt: now() + 600s }
        
        UC->>UOW: txContext.saveHoldAndInventoryAtomic(inventory, reservation)
        Note over UOW: UPDATE sector_inventory SET active_holds_count = ...<br/>INSERT INTO reservations (id, status, expires_at, ...)
        
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

### 4.2. Explicación del Protocolo y Delimitación Transaccional
1. **Adquisición de Lock y Validación Atómica**:  
   El caso de uso no dispersa la comprobación en pasos desacoplados. La adquisición del bloqueo pesimista (`SELECT ... FOR UPDATE`), la suma de entradas acumuladas por el titular, la mutación de contadores y el alta de la reserva ocurren en **una única transacción y sobre la misma conexión dedicada de PostgreSQL**.
2. **Evaluación Estricta de Invariantes**:  
   El bloqueo pesimista serializa las solicitudes concurrentes sobre el sector pero no sustituye la lógica de dominio: dentro del bloqueo se valida que la disponibilidad neta sea suficiente ($C - (S + H) \ge \text{quantity}$) y que el titular no exceda el tope acumulado de 4 entradas ([RN-04](../../complementos/03-reglas-de-negocio.md#rn-04-tope-máximo-de-entradas-por-asistente)).
3. **Rol Auxiliar de Redis**:  
   La programación de la clave temporizada en Redis (`SET hold:ttl:... EX 600`) ocurre **estrictamente después del COMMIT** de PostgreSQL. Si Redis no está disponible o falla la red, la reserva permanece válida y segura en PostgreSQL; la expiración será gestionada por el worker de reconciliación periódica en base de datos ([ADR-003](../../complementos/adrs/ADR-003-concurrencia-integridad-inventario.md)).

---

## 5. Flujo B: Pago Confirmado y Emisión Idempotente de Tickets

### 5.1. Diagrama de Secuencia (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor ASIS as Asistente / Navegador<br/>[DEMO EN CLIENTE]
    participant GW as Pasarela Externa<br/>(Culqi / Niubiz / Stripe)
    participant WH_CTRL as WebhooksController<br/>[DISEÑO PROPUESTO]
    participant PAY_UC as HandleGatewayWebhookUseCase<br/>[DISEÑO PROPUESTO]
    participant DB as PostgreSQL (Módulo Pagos)<br/>[DISEÑO PROPUESTO]
    participant WORKER as OutboxProcessor Worker<br/>[DISEÑO PROPUESTO]
    participant TCK_SUB as TicketIssuanceListener<br/>[DISEÑO PROPUESTO]
    participant TCK_UC as IssueTicketsUseCase<br/>[DISEÑO PROPUESTO]
    participant CRYPTO as Ed25519SignatureAdapter<br/>[DISEÑO PROPUESTO]
    participant NOTIF as EmailNotificationAdapter<br/>[DISEÑO PROPUESTO]

    ASIS->>GW: Completa checkout con tarjeta (Token / 3DS)
    Note over GW: Procesa cobro con banco adquirente
    
    GW->>WH_CTRL: POST /api/v1/webhooks/payments (Payload + Firma HMAC)
    WH_CTRL->>PAY_UC: handleWebhook(payload, signature, provider)
    
    Note over PAY_UC: 1. Verificación criptográfica de firma de webhook según pasarela
    PAY_UC->>PAY_UC: verifySignature(payload, signature)
    
    alt Firma inválida o adulterada
        PAY_UC-->>WH_CTRL: Error de autenticidad
        WH_CTRL-->>GW: 401 Unauthorized (Firma rechazada)
    else Firma válida
        Note over PAY_UC,DB: 2. Transacción Atómica SQL: Pago + Outbox + Deduplicación
        PAY_UC->>DB: BEGIN TRANSACTION (READ COMMITTED)
        
        PAY_UC->>DB: INSERT INTO payment_idempotency_keys (key=gateway_event_id, status='PROCESSING')<br/>ON CONFLICT (key) DO NOTHING
        
        alt Conflicto: Evento ya procesado previamente (Idempotencia)
            PAY_UC->>DB: ROLLBACK
            PAY_UC-->>WH_CTRL: Evento duplicado ya atendido
            WH_CTRL-->>GW: 200 OK (Aceptación idempotente sin reprocesar)
        else Inserción exitosa (Primera vez que se recibe)
            PAY_UC->>DB: INSERT INTO payments (id, reservation_id, amount, status='CONFIRMED', ...)
            PAY_UC->>DB: UPDATE reservations SET status='CONFIRMED' WHERE id=$resId AND status='PENDING_PAYMENT'
            PAY_UC->>DB: INSERT INTO outbox_events (id, type='PAYMENT_CONFIRMED', payload, status='PENDING')
            PAY_UC->>DB: UPDATE payment_idempotency_keys SET status='SUCCEEDED' WHERE key=gateway_event_id
            PAY_UC->>DB: COMMIT TRANSACTION
            
            PAY_UC-->>WH_CTRL: Confirmación persistida
            WH_CTRL-->>GW: 200 OK (Recibido y asegurado)
        end
    end

    Note over WORKER,DB: 3. Despacho Asíncrono Recuperable con Lease
    loop Intervalo del Worker Outbox
        WORKER->>DB: BEGIN TRANSACTION
        WORKER->>DB: SELECT * FROM outbox_events WHERE status='PENDING' OR (status='CLAIMED' AND lease_until < NOW())<br/>FOR UPDATE SKIP LOCKED LIMIT 10
        WORKER->>DB: UPDATE outbox_events SET status='CLAIMED', lease_until=NOW() + INTERVAL '30s'
        WORKER->>DB: COMMIT (Libera conexión SQL de inmediato)
        
        Note over WORKER,TCK_SUB: Despacho en memoria fuera de transacción SQL
        WORKER->>TCK_SUB: onEvent(PAYMENT_CONFIRMED, outbox_event_id)
        TCK_SUB->>TCK_UC: execute(IssueTicketsCommand)
        
        Note over TCK_UC: Deduplicación atómica en Módulo Tickets (outbox_event_id)
        TCK_UC->>CRYPTO: signTicketPayload(ticketData, PrivateKey_Ed25519)
        CRYPTO-->>TCK_UC: Firma criptográfica asimétrica (64 bytes Base64URL)
        
        TCK_UC->>DB: INSERT INTO tickets (id, event_id, status='ACTIVE', signature, qr_payload, ...)
        TCK_UC->>NOTIF: sendTicketDeliveryEmail(userEmail, tickets)
        
        TCK_UC-->>TCK_SUB: Emisión completada satisfactoriamente
        TCK_SUB-->>WORKER: Confirmación de despacho
        
        WORKER->>DB: UPDATE outbox_events SET status='PROCESSED', processed_at=NOW() WHERE id=$outboxId
    end
```

### 5.2. Explicación de Resiliencia, Idempotencia y Resultados Inciertos
1. **Deduplicación en Tres Niveles**:  
   - A nivel de webhook mediante `gateway_event_id` con inserción condicional atómica `ON CONFLICT DO NOTHING`.
   - A nivel de reserva mediante transición condicional `WHERE status = 'PENDING_PAYMENT'`.
   - A nivel de emisión en el Módulo Tickets verificando el identificador del evento Outbox para prevenir entradas duplicadas ante reintentos del worker.
2. **Desacoplamiento Temporal mediante Outbox con Lease**:  
   El cobro queda formalmente registrado y asegurado en la tabla `payments` y en `outbox_events` en una única transacción corta. La llamada a librerías de firma criptográfica y el despacho de correos se realizan fuera de la transacción SQL principal, eliminando la retención de conexiones de base de datos.
3. **Manejo de Resultados Inciertos de Cobro**:  
   Si una solicitud de pago directa sufre un timeout de red o estado ambiguo, no se reintenta automáticamente con otra pasarela ni se cancela la reserva. Se consulta el estado del cobro mediante la API de conciliación del proveedor original o se aguarda la llegada del webhook asíncrono firmado.

---

## 6. Flujo C: Validación de Código QR en Puerta (Modos Online y Offline)

### 6.1. Diagrama de Secuencia (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor OPER as Operador de Puerta / Molinete
    participant APP as AFORO Access PWA<br/>[DISEÑO PROPUESTO]
    participant IDB as Almacenamiento IndexedDB Local<br/>[DISEÑO PROPUESTO]
    participant API as API Core (Módulo Accesos)<br/>[DISEÑO PROPUESTO]
    participant DB as PostgreSQL Central<br/>[DISEÑO PROPUESTO]

    OPER->>APP: Escaneo óptico de QR en pantalla de asistente
    Note over APP: Decodifica payload JSON: {tId, eId, sId, exp, sig}
    
    Note over APP: 1. Verificación Criptográfica Local Inmediata (Ambos Modos)
    APP->>APP: verifySignature(payload, sig, PublicKey_Ed25519)
    
    alt Firma asimétrica inválida o clave no reconocida
        APP-->>OPER: 🔴 ACCESO DENEGADO (Firma digital corrupta o fraudulenta)
    else Firma asimétrica válida
        alt Modo A: Operación Online Conectada (Conectividad Estable)
            APP->>API: POST /api/v1/access/validate-entry {ticketId, gateId, operatorId}
            API->>DB: BEGIN TRANSACTION (READ COMMITTED)
            API->>DB: SELECT * FROM tickets WHERE id = $1 FOR UPDATE
            
            alt Ticket ya figura como 'USED' o 'REVOKED'
                API->>DB: ROLLBACK
                API-->>APP: 409 Conflict { status: "ALREADY_USED", usedAt: timestamp }
                APP-->>OPER: 🔴 ACCESO DENEGADO (Entrada ya utilizada anteriormente)
            else Ticket figura como 'ACTIVE' y sector/evento coinciden
                API->>DB: UPDATE tickets SET status = 'USED', used_at = NOW(), gate_id = $gateId
                API->>DB: INSERT INTO access_logs (ticket_id, gate_id, result='GRANTED', mode='ONLINE')
                API->>DB: COMMIT TRANSACTION
                API-->>APP: 200 OK { result: "GRANTED", sector: "Campo A" }
                APP-->>OPER: 🟢 ACCESO CONCEDIDO (Molinete Habilitado)
            end
            
        else Modo B: Operación Offline Desconectada (Red Caída en Puerta)
            Note over APP,IDB: Verificación y marcado en base de datos local de la terminal
            APP->>IDB: getTicketStatus(ticketId)
            
            alt Ticket ya figura como 'USED' en el IndexedDB de ESTA terminal
                APP-->>OPER: 🔴 ACCESO DENEGADO LOCAL (Reúso detectado en esta puerta)
            else Ticket no registrado como usado localmente
                APP->>IDB: markTicketUsedLocal(ticketId, gateId, timestamp)
                APP->>IDB: enqueuePendingReconciliation({ticketId, gateId, timestamp, sig})
                APP-->>OPER: 🟡 ACCESO CONCEDIDO OFFLINE (Válido localmente bajo riesgo particionado)
            end
        end
    end

    Note over APP,API: 2. Fase de Reconciliación Asíncrona Posterior (Al Recuperar Conectividad)
    loop Al detectar reconexión de red
        APP->>IDB: getPendingReconciliationQueue()
        IDB-->>APP: Retorna lista de accesos validados fuera de línea
        APP->>API: POST /api/v1/access/reconcile-offline-batch {events: [...]}
        
        loop Por cada ingreso registrado fuera de línea
            API->>DB: Transición condicional o detección de colisiones
            alt Ingreso legítimo único
                API->>DB: UPDATE tickets SET status = 'USED', synced_at = NOW()
                API->>DB: INSERT INTO access_logs (status='RECONCILED_SUCCESS')
            else Colisión detectada: El mismo ticket fue usado en otra terminal durante el corte
                API->>DB: INSERT INTO access_audit_collisions (ticket_id, first_gate, second_gate, timestamps)
                Note over DB: Registro forense de fraude para sanción / investigación
            end
        end
        API-->>APP: 200 OK (Lote de reconciliación asentado)
        APP->>IDB: clearReconciledQueue()
    end
```

### 6.2. Explicación de Consistencia Asimétrica y Límite Offline
1. **Verificación Criptográfica sin Conexión**:  
   Gracias al uso de firmas asimétricas Ed25519 ([ADR-005](../../complementos/adrs/ADR-005-criptografia-entradas-qr.md)), cualquier terminal AFORO Access que cuente con la clave pública del evento ($PK_E$) puede comprobar matemáticamente la autenticidad del boleto sin necesidad de consultar al servidor central ni exponer claves maestras secretas.
2. **Diferencia Fundamental entre Validación Criptográfica y Derecho de Admisión**:  
   Una firma criptográfica válida únicamente certifica que el boleto fue emitido legítimamente por AFORO; **no garantiza por sí sola que el portador deba ingresar**. La admisión efectiva exige verificar que el evento sea el correcto, la puerta autorizada, que el ticket no haya sido revocado y que no haya sido utilizado con anterioridad.
3. **Reconocimiento Explícito del Límite del Modo Offline (CAP Theorem)**:  
   **Dos o más terminales desconectadas entre sí no pueden garantizar la unicidad global del ingreso**. Si dos asistentes presentan copias idénticas del mismo código QR en puertas desconectadas simultáneamente, ambas terminales validarán la firma y marcarán el ingreso local como exitoso. Esta limitación se documenta como un compromiso arquitectónico inevitable ([ADR-006](../../complementos/adrs/ADR-006-persistencia-operacion-offline-access.md)), resolviéndose mediante bitácora de auditoría forense y reconciliación posterior para detectar incidentes de duplicación.

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
