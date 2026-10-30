# Boilerplate Clean Architecture — AFORO API Core

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Contenedor**: `API Core Backend` (Monolito Modular)  
**Ubicación**: `docs/tecnologia/boilerplate-clean-arquitectura/README.md`  
**Estado**: `[DISEÑO PROPUESTO — PLANTILLA DE ARQUITECTURA LIMPIA]`

---

## 1. Estructura de Capas por Módulo (Clean Architecture / Hexagonal)

Cada uno de los seis módulos de API Core Backend sigue la siguiente estructura canónica de carpetas:

```text
src/modules/<nombre-modulo>/
├── domain/                    # 1. Capa de Dominio (Hexágono Interior Puro)
│   ├── entities/              # Entidades ricas de negocio con invariantes
│   ├── value-objects/         # Objetos de valor inmutables (Money, Status, etc.)
│   ├── events/                # Eventos de dominio generados
│   └── exceptions/            # Excepciones semánticas de dominio
│
├── application/               # 2. Capa de Aplicación (Casos de Uso)
│   ├── use-cases/             # Servicios de orquestación (HoldTicketsUseCase, etc.)
│   ├── ports/                 # Puertos abstractos (interfaces tipadas de salida)
│   │   ├── in/                # Fachada pública inter-módulo (IModuleFacade)
│   │   └── out/               # Repositorios y adaptadores (IRepository, ITimer)
│   └── dtos/                  # Objetos de transferencia de datos inmutables
│
└── infrastructure/            # 3. Capa de Infraestructura (Adaptadores)
    ├── adapters/
    │   ├── primary/           # Controladores REST, receptores de Webhooks
    │   └── secondary/         # PostgreSQL, Redis, SDKs de pasarelas, Crypto
    └── mappers/               # Traductores de base de datos relacional a dominio
```

---

## 2. Reglas de Acoplamiento y Dependencias
1. **El Dominio es Inmutable a la Tecnología**: No importa librerías externas, decoradores de ORM ni frameworks.
2. **La Aplicación Orquesta sin Conocer la Infraestructura**: Los casos de uso dependen exclusivamente de interfaces de puertos.
3. **Invocación Inter-Modular en Memoria**: La comunicación entre módulos se realiza exclusivamente a través de los contratos `I<Nombre>ModuleFacade`, sin llamadas de red internas.

