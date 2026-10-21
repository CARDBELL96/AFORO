# ADR-005: Mecanismo Criptográfico para Emisión y Validación de Entradas QR

- **Estado**: `[PROPUESTO]`
- **Fecha**: `2026-10-21`
- **Área**: Seguridad Criptográfica / Módulo de Tickets / Control de Accesos
- **Decisores**: Equipo de Arquitectura de Software AFORO
- **Estado de Realidad Técnica**: `[DISEÑO ARQUITECTÓNICO PROPUESTO]`

---

## 1. Contexto y Planteamiento del Problema

Cada entrada emitida por AFORO se materializa en un código QR digital que el asistente presenta en las puertas y molinetes del recinto. Este mecanismo debe satisfacer tres requisitos esenciales:
1. **Autenticidad e Integridad del Payload**: Debe ser matemáticamente comprobable que los datos del ticket (evento, zona, titular, timestamp) fueron emitidos por AFORO y no han sido alterados (`RN-06`).
2. **Capacidad de Verificación Fuera de Línea (Offline)**: Las terminales de **AFORO Access** deben ser capaces de validar la integridad del código QR de manera autónoma ante una pérdida total de conectividad en el recinto (`EAC-05`, `RNF-RE-03`).
3. **Resistencia a la Vulneración de Dispositivos Físicos**: Si una terminal lectora móvil es extraviada, sustraída o manipulada físicamente en el recinto, no debe contener secretos criptográficos que permitan a un atacante generar entradas legítimas fuera del sistema.

### Distinción Fundamental: Firma Válida vs Entrada Habilitada
Es imperativo diferenciar conceptual y operativamente entre la **validez criptográfica de la firma** y la **habilitación efectiva de la entrada para ingresar**:
- **Firma Criptográfica Válida**: Demuestra exclusivamente que el payload del código QR proviene de una fuente autorizada (AFORO) y que sus campos no han sido manipulados.
- **Habilitación Efectiva de Acceso**: Es una decisión de negocio que requiere verificar, además de la firma válida:
  1. Que el identificador de evento coincida con el concierto en curso.
  2. Que la zona o sector autorizado corresponda a la puerta física donde se ubica el molinete.
  3. Que el ticket no se encuentre en estado `REVOKED` (por cancelación o devolución) ni `EXPIRED`.
  4. Que el ticket no figure ya en estado `USED` (en la base local del molinete o en el servidor central).
Una firma válida es **condición necesaria, pero no suficiente**, para conceder el ingreso físico.

---

## 2. Alternativas Evaluadas

1. **Alternativa A: Código de Autenticación de Mensajes Simétrico (HMAC-SHA256)**:
   - *Descripción*: El backend genera un código HMAC empleando una clave secreta compartida $K_E$. Cada terminal lectora almacena dicha clave para verificar los códigos QR.
   - *Evaluación*: Presenta un riesgo significativo de seguridad. Dado que el esquema es simétrico, quien tiene la clave para verificar también tiene la clave para firmar. Si un atacante extrae la clave $K_E$ de un dispositivo de puerta vulnerado, obtiene la capacidad de generar entradas falsificadas indetectables fuera de línea para ese evento.

2. **Alternativa B: Firma Digital Asimétrica Tradicional (RSA-2048)**:
   - *Descripción*: El servidor firma con clave privada y las terminales verifican con clave pública.
   - *Evaluación*: La firma RSA-2048 mide 256 bytes. Este tamaño incrementa sustancialmente la densidad de módulos del código QR, dificultando su lectura óptica rápida en condiciones de baja luminosidad o cámaras en movimiento en los molinetes.

3. **Alternativa C: Firma Digital Asimétrica sobre Curvas de Edwards (Ed25519 / EdDSA)**:
   - *Descripción*: Esquema asimétrico moderno basado en la curva Twisted Edwards 25519. El backend central custodia la clave privada (que jamás abandona el servidor seguro) y las terminales lectoras precargan exclusivamente la **clave pública** del evento (32 bytes).

---

## 3. Decisión Propuesta

Se decide adoptar la **Alternativa C: Firma Digital Asimétrica Ed25519** como el estándar criptográfico para la emisión y verificación de entradas QR en AFORO.

### Especificación y Gestión de Claves:
1. **Ciclo de Vida de Claves por Evento**:
   - Por cada concierto se genera un par de claves Ed25519 ($SK_E$ privada, $PK_E$ pública).
   - La clave privada $SK_E$ se almacena exclusivamente en el backend bajo variables de entorno cifradas o servicio de gestión de claves (KMS/Vault).
   - La clave pública $PK_E$ (32 bytes) se distribuye de manera segura a las terminales autorizadas de **AFORO Access** durante la sincronización preliminar del evento (`RF-ACC-02`).
2. **Estructura del Payload Firmado**:
   - El código QR contiene un payload estructurado en formato compacto o Base64URL:
     ```json
     {
       "tid": "AFR-TK-2026-X892",
       "eid": "evt_pulso_01",
       "zid": "tier_campo_a",
       "hid": "usr_doc_72849102",
       "iat": 1776739200,
       "sig": "Base64URL(Ed25519_Sign(SK_E, tid || eid || zid || hid || iat))"
     }
     ```
   - La firma Ed25519 mide exactamente **64 bytes**, permitiendo mantener el código QR en una versión de baja densidad para facilitar el enfoque óptico en molinetes.
3. **Protocolo de Validación en Terminales de Puerta**:
   - La terminal ejecuta la verificación criptográfica local `Ed25519_Verify(PK_E, payload, sig)`.
   - Si la firma es inválida, se rechaza de inmediato el ticket como adulterado o falsificado (`EAC-06`).
   - Si la firma es válida, la terminal procede con las validaciones de negocio complementarias (coincidencia de zona, comprobación de estado y prevención de reúso en base local).

---

## 4. Justificación

1. **Aislamiento de Secretos de Firma**: Los dispositivos de acceso únicamente requieren la clave pública para verificar la autenticidad. La sustracción o desmontaje físico de una terminal no compromete la capacidad de emitir tickets legítimos.
2. **Eficiencia Computacional en Dispositivos Móviles**: Ed25519 está diseñado para ofrecer operaciones de verificación rápidas en procesadores móviles, permitiendo su ejecución sin retardos perceptibles en la interfaz de escaneo.
3. **Legibilidad Óptica del QR**: El tamaño de 64 bytes de la firma permite generar códigos QR más despejados y con mayor tolerancia a errores que con firmas RSA, optimizando la captura visual bajo iluminación deficiente.

---

## 5. Consecuencias

### Consecuencias Positivas
- Resistencia robusta contra falsificación ante la pérdida o manipulación de terminales en puerta.
- Autonomía para verificación criptográfica local sin dependencia de conectividad constante (`RNF-RE-03`).
- Estandarización sobre algoritmos criptográficos modernos de curva elíptica.

### Compromisos y Consecuencias Negativas (Trade-offs)
- Requiere un protocolo de sincronización previa para precargar las claves públicas vigentes en las terminales antes de la apertura de puertas.
- Una firma válida no garantiza por sí sola que la entrada esté habilitada; exige consultar la base local para descartar entradas ya utilizadas o revocadas.

---

## 6. Riesgos y Mitigaciones

| Riesgo Identificado | Probabilidad / Impacto | Mitigación Arquitectónica |
| :--- | :---: | :--- |
| **Compromiso de la Clave Privada en el Servidor Central**. | Baja / Crítico | Rotación y aislamiento estricto de claves por evento individual. Una clave comprometida solo impacta al evento específico. Custodia en KMS seguro. |
| **Reingreso con Copia de QR Legítimo en la Misma Puerta**. | Alta / Medio | Resuelto mediante la máquina de estados local de AFORO Access: el primer escaneo marca el ticket como `USED` localmente; cualquier intento posterior en esa terminal es rechazado (`RN-08`). |

---

## 7. Trazabilidad

- **Requisitos Funcionales**: [`RF-ACC-04`](../01-analisis-de-sistema/01-requisitos-funcionales.md), [`RF-COR-05`](../01-analisis-de-sistema/01-requisitos-funcionales.md).
- **Requisitos No Funcionales**: [`RNF-SE-01`](../01-analisis-de-sistema/02-requisitos-no-funcionales.md), [`RNF-PE-06`](../01-analisis-de-sistema/02-requisitos-no-funcionales.md).
- **Reglas de Negocio**: [`RN-06`](../01-analisis-de-sistema/03-reglas-de-negocio.md), [`RN-08`](../01-analisis-de-sistema/03-reglas-de-negocio.md).
- **Escenarios de Calidad**: [`EAC-05`](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md), [`EAC-06`](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- **Constitution**: Principio II (Integridad Transaccional y Autenticidad Criptográfica).
