# ADR-004: Estrategia de Idempotencia en Procesamiento de Pagos y Webhooks

- **Estado**: `[PROPUESTO]`
- **Fecha**: `2026-10-21`
- **Área**: Módulo de Pagos / Finanzas / Integraciones Externas
- **Decisores**: Equipo de Arquitectura de Software AFORO
- **Estado de Realidad Técnica**: `[DISEÑO ARQUITECTÓNICO PROPUESTO]`

---

## 1. Contexto y Planteamiento del Problema

El cobro de entradas para espectáculos masivos requiere la integración con pasarelas de pago externas (como Culqi, Niubiz o Stripe). Durante preventas de alta demanda y bajo condiciones de conectividad variable, se presentan dos situaciones recurrentes:
1. **Reintentos en Cliente**: El usuario presiona varias veces el botón de pago por impaciencia ante demoras de red, o el navegador reintenta la solicitud HTTP al experimentar intermitencias.
2. **Reenvío Masivo de Webhooks**: Las pasarelas de pago reenvían automáticamente el mismo webhook de notificación de cobro exitoso ante timeouts o demoras en la respuesta HTTP de recepción.

Si el sistema no implementa un mecanismo formal de **idempotencia**, estas situaciones pueden ocasionar cobros duplicados en la tarjeta del comprador o la emisión repetida de entradas para una misma orden (`RN-05`).

---

## 2. Alternativas Evaluadas

1. **Alternativa A: Verificación Condicional Simple en Aplicación (`if (!order.isPaid)`)**:
   - *Descripción*: Consultar el estado de la orden antes de procesar el cobro.
   - *Evaluación*: Vulnerable a condiciones de carrera (*Race Conditions*). Peticiones concurrentes simultáneas que lean la orden en estado pendiente pueden disparar dos transacciones de cargo paralelas en la pasarela externa.

2. **Alternativa B: Bloqueo Volátil en Memoria (Redis Lock sin Persistencia)**:
   - *Descripción*: Adquirir una llave en Redis con el identificador de la orden durante la llamada de cobro.
   - *Evaluación*: Si el proceso o la instancia de memoria se reinicia durante la interacción externa con la pasarela, se pierde el seguimiento de la operación en curso, dificultando la reconciliación del cobro.

3. **Alternativa C: Tabla Persistente de Idempotencia con Restricción Única y Verificación Criptográfica de Webhooks**:
   - *Descripción*: Exigencia de una clave de idempotencia (`Idempotency-Key`) persistida en PostgreSQL con restricción de unicidad (`UNIQUE`), combinada con una máquina de estados de procesamiento (`PROCESSING`, `SUCCEEDED`, `FAILED`, `TIMEOUT`) y verificación de firmas provistas por los procesadores de pago para webhooks.

---

## 3. Decisión Propuesta

Se decide adoptar la **Alternativa C**:

1. **Contrato de Idempotencia en la API de Pagos**:
   - Todo endpoint que ejecute un cargo (`POST /api/v1/payments/charge`) exige obligatoriamente la cabecera HTTP:
     ```http
     Idempotency-Key: ord_{reservationId}_{attemptHash}
     ```
   - Las solicitudes sin esta cabecera son rechazadas con código HTTP 400 Bad Request.

2. **Mecanismo de Ejecución Transaccional en Base de Datos**:
   - Se crea la tabla `payment_idempotency_keys` con clave primaria `idempotency_key` y columnas para estado (`status`), respuesta serializada (`response_payload`), marcas de tiempo y expiración (`expires_at`).
   - Flujo de procesamiento:
     - **Paso 1**: La transacción intenta registrar la clave con estado `PROCESSING`. Si la clave ya existe:
       - Si su estado es `PROCESSING`: se responde con HTTP 409 Conflict o se espera brevemente la culminación del proceso en vuelo.
       - Si su estado es `SUCCEEDED`: se retorna la respuesta persistida en `response_payload` con código HTTP 200, **sin reenviar el cobro a la pasarela ni emitir boletos duplicados**.
     - **Paso 2**: Si el registro es exitoso, se invoca al procesador de pagos mediante su SDK oficial utilizando tokens seguros (PCI-DSS SAQ A).
     - **Paso 3**: Al confirmarse la respuesta de la pasarela, se actualiza atómicamente el estado a `SUCCEEDED` (o `FAILED`) junto con el payload correspondiente.

3. **Recepción y Validación de Webhooks**:
   - Cada webhook entrante se somete a validación de firma criptográfica provista por la pasarela respectiva (ej. `Stripe-Signature` o HMAC de proveedor local).
   - Se registra el `webhook_event_id` en una bitácora persistente. Si el evento ya fue procesado, se retorna HTTP 200 OK y se omite cualquier procesamiento posterior.

4. **Política de Expiración y Limpieza**:
   - Las claves de idempotencia tendrán una vigencia de 72 horas, transcurridas las cuales una tarea programada purga los registros antiguos.

---

## 4. Justificación

1. **Protección Contra Cargos Duplicados (`EAC-04`)**: La restricción de unicidad relacional previene que dos solicitudes concurrentes con la misma clave ejecuten cargos paralelos en la pasarela.
2. **Resiliencia ante Desconexiones**: Asistentes que experimenten cortes de red durante el procesamiento pueden reintentar con la misma clave y recibir de inmediato la confirmación original sin cobro adicional.
3. **Alineación con Estándares PCI-DSS**: El sistema nunca almacena datos de tarjeta de crédito (PAN/CVV), gestionando exclusivamente tokens y transacciones conforme a PCI-DSS SAQ A (`RNF-SE-04`).

---

## 5. Consecuencias

### Consecuencias Positivas
- Prevención de duplicación de cobros bajo reintentos del cliente o retransmisión de webhooks.
- Auditoría y trazabilidad completa de cada intento de pago y su respuesta asociada.
- Retorno de baja latencia al entregar respuestas cacheadas para solicitudes idempotentes ya confirmadas.

### Compromisos y Consecuencias Negativas (Trade-offs)
- Requiere mantenimiento y almacenamiento adicional para la tabla de claves de idempotencia, mitigado mediante políticas de depuración periódica tras 72 horas.

---

## 6. Riesgos y Mitigaciones

| Riesgo Identificado | Probabilidad / Impacto | Mitigación Arquitectónica |
| :--- | :---: | :--- |
| **Bloqueo Prolongado en Estado `PROCESSING`** si el servidor falla mientras espera a la pasarela. | Baja / Medio | Configuración de timeout: si un registro permanece en `PROCESSING` más de 60 segundos, se marca como `TIMEOUT` y un worker de reconciliación consulta el estado de la transacción en la pasarela antes de liberar o cerrar la orden. |

---

## 7. Trazabilidad

- **Requisitos Funcionales**: [`RF-COR-04`](../../01-analisis-de-sistema/03-requisitos-funcionales.md), [`RF-WEB-13`](../../01-analisis-de-sistema/03-requisitos-funcionales.md).
- **Requisitos No Funcionales**: [`RNF-RE-02`](../../01-analisis-de-sistema/04-atributos-de-calidad.md), [`RNF-SE-04`](../../01-analisis-de-sistema/04-atributos-de-calidad.md).
- **Reglas de Negocio**: [`RN-05`](../03-reglas-de-negocio.md).
- **Escenarios de Calidad**: [`EAC-04`](../../01-analisis-de-sistema/../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- **Constitution**: Principio II (Integridad Transaccional, Idempotencia de Pagos).
