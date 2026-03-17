# Stubs y Drivers en Jest

> Guía práctica con ejemplos reales para entender cuándo y cómo usar cada técnica de testing.

---

## ¿Qué son los Test Doubles?

Cuando probamos un módulo, ese módulo casi siempre depende de otras cosas: una base de datos, una API externa, un servicio de email, etc. Conectarnos a esas cosas reales en un test es lento, costoso e impredecible.

Los **Test Doubles** son "dobles de actuación" que reemplazan esas dependencias reales con versiones falsas y controladas. Los dos más importantes son:

---

## Stub

Un **Stub** reemplaza una **dependencia** del módulo bajo prueba.

Cuando el módulo que estás probando necesita *llamar a algo externo* (una DB, una API, un servicio de email), el Stub devuelve respuestas predefinidas y controladas, sin ejecutar el código real.

```
Módulo bajo prueba  →  llama a  →  [STUB en lugar de la dependencia real]
```

### ¿Cuándo usar un Stub?

| Situación | Usa Stub |
|-----------|----------|
| El módulo llama a una API externa | ✅ |
| El módulo consulta una base de datos | ✅ |
| El módulo envía emails o SMS | ✅ |
| Quieres simular un error de red o DB | ✅ |
| Quieres controlar el resultado de una dependencia | ✅ |

### Cómo se ve un Stub en Jest

```js
// En lugar de usar el servicio de email real, creamos un stub con jest.fn()
const stubEmailService = {
  enviarBienvenida: jest.fn().mockResolvedValue({ enviado: true }),
};
```

---

## Driver

Un **Driver** es código de prueba que actúa como el **llamador** del módulo bajo prueba.

Cuando el módulo ya está listo pero el sistema que lo va a invocar aún no existe (desarrollo de abajo hacia arriba / *bottom-up*), el Driver simula ese llamador para poder probar el módulo de forma aislada.

```
[DRIVER actuando como el caller que aún no existe]  →  llama a  →  Módulo bajo prueba
```

### ¿Cuándo usar un Driver?

| Situación | Usa Driver |
|-----------|------------|
| El módulo de bajo nivel está listo pero su caller no | ✅ |
| Quieres probar un módulo de forma aislada (bottom-up) | ✅ |
| Necesitas simular múltiples escenarios de uso | ✅ |
| El módulo es puro (sin dependencias externas) | ✅ |

> En la práctica, **el test mismo es el Driver**. No es un archivo separado, es la forma en que estructuras las llamadas al módulo.

---

## Comparación rápida

| | Stub | Driver |
|---|---|---|
| **¿Qué reemplaza?** | Una dependencia del módulo | El llamador del módulo |
| **¿En qué dirección va?** | El módulo llama al stub | El driver llama al módulo |
| **¿Para qué sirve?** | Controlar respuestas externas | Probar módulos sin su caller real |
| **Herramienta en Jest** | `jest.fn().mockReturnValue(...)` | El `describe`/`test` mismo |
| **Uso más frecuente** | Desarrollo top-down | Desarrollo bottom-up |

---

## Estructura del proyecto

```
src/
├── stubs-drivers/           ← Módulos fuente de los ejemplos
│   ├── procesarPedido.js    (Ejemplo 1)
│   ├── registroUsuario.js   (Ejemplo 2)
│   ├── calcularImpuesto.js  (Ejemplo 3)
│   └── procesarVenta.js     (Ejemplo 4)
│
└── tests/
    ├── stubs/
    │   ├── procesarPedido.stub.test.js    (Ejemplo 1 — STUB)
    │   └── registroUsuario.stub.test.js   (Ejemplo 2 — STUB)
    └── drivers/
        ├── calcularImpuesto.driver.test.js  (Ejemplo 3 — DRIVER)
        └── procesarVenta.driver.test.js     (Ejemplo 4 — DRIVER + STUB)
```

---

## Ejemplo 1 — STUB: Pasarela de Pago

**Contexto real:** Una tienda online procesa pedidos a través de Stripe o MercadoPago. En los tests no queremos cobrar dinero de verdad ni depender de una API externa.

**Módulo:** `procesarPedido.js`  
**Dependencia stubbeada:** `pasarelaPago` (Stripe, PayPal, etc.)

```js
// src/stubs-drivers/procesarPedido.js
export const procesarPedido = async (pedido, pasarelaPago) => {
  if (!pedido.total || pedido.total <= 0) {
    throw new Error('El total del pedido debe ser mayor a 0');
  }

  const resultado = await pasarelaPago.cobrar({
    monto: pedido.total,
    tarjeta: pedido.tarjeta,
  });

  if (!resultado.aprobado) {
    throw new Error('Pago rechazado por la pasarela');
  }

  return { pedidoId: pedido.id, estado: 'completado', transaccionId: resultado.transaccionId };
};
```

```js
// src/tests/stubs/procesarPedido.stub.test.js
import { procesarPedido } from '../../stubs-drivers/procesarPedido.js';

describe('procesarPedido — STUB de pasarela de pago', () => {

  // STUB: reemplaza a Stripe/MercadoPago con una respuesta controlada
  const stubPasarelaAprobada = {
    cobrar: jest.fn().mockResolvedValue({ aprobado: true, transaccionId: 'TXN-001' }),
  };

  const stubPasarelaRechazada = {
    cobrar: jest.fn().mockResolvedValue({ aprobado: false, transaccionId: null }),
  };

  beforeEach(() => jest.clearAllMocks());

  test('completa el pedido cuando el pago es aprobado', async () => {
    const pedido = { id: 'P-001', total: 250_000, tarjeta: '4111111111111111' };
    const resultado = await procesarPedido(pedido, stubPasarelaAprobada);

    expect(resultado.estado).toBe('completado');
    expect(resultado.transaccionId).toBe('TXN-001');
  });

  test('lanza error cuando la pasarela rechaza el pago', async () => {
    const pedido = { id: 'P-002', total: 500_000, tarjeta: '4000000000000002' };

    await expect(procesarPedido(pedido, stubPasarelaRechazada))
      .rejects.toThrow('Pago rechazado por la pasarela');
  });
});
```

**¿Por qué Stub aquí?** `procesarPedido` *llama* a la pasarela. La pasarela es su dependencia. El stub la reemplaza con respuestas seguras y controladas.

---

## Ejemplo 2 — STUB: Registro de Usuario con DB y Email

**Contexto real:** Al registrar un usuario, el sistema consulta una base de datos y envía un email de bienvenida. En los tests no queremos conectarnos a la DB real ni enviar correos.

**Módulo:** `registroUsuario.js`  
**Dependencias stubbeadas:** `db` (PostgreSQL, MongoDB...) y `emailService` (SendGrid, SES...)

```js
// src/stubs-drivers/registroUsuario.js
export const registrarUsuario = async (datosUsuario, db, emailService) => {
  const usuarioExistente = await db.buscarPorEmail(datosUsuario.email);
  if (usuarioExistente) throw new Error('El email ya está registrado');

  const nuevoUsuario = await db.guardar({
    nombre: datosUsuario.nombre,
    email: datosUsuario.email,
    fechaRegistro: new Date().toISOString(),
  });

  await emailService.enviarBienvenida(datosUsuario.email, datosUsuario.nombre);
  return nuevoUsuario;
};
```

```js
// src/tests/stubs/registroUsuario.stub.test.js
import { registrarUsuario } from '../../stubs-drivers/registroUsuario.js';

describe('registrarUsuario — STUB de DB y EmailService', () => {

  let stubDb;
  let stubEmailService;

  beforeEach(() => {
    // STUB de base de datos
    stubDb = {
      buscarPorEmail: jest.fn().mockResolvedValue(null), // email libre por defecto
      guardar: jest.fn().mockResolvedValue({ id: 'USR-777', nombre: 'Carlos López' }),
    };
    // STUB del servicio de email
    stubEmailService = {
      enviarBienvenida: jest.fn().mockResolvedValue({ enviado: true }),
    };
  });

  test('registra el usuario y envía email de bienvenida', async () => {
    const datos = { nombre: 'Carlos López', email: 'carlos@tienda.com' };
    const usuario = await registrarUsuario(datos, stubDb, stubEmailService);

    expect(usuario.id).toBe('USR-777');
    expect(stubEmailService.enviarBienvenida)
      .toHaveBeenCalledWith('carlos@tienda.com', 'Carlos López');
  });

  test('lanza error si el email ya existe y NO guarda ni manda email', async () => {
    stubDb.buscarPorEmail.mockResolvedValue({ id: 'USR-001' }); // email ocupado

    await expect(registrarUsuario(
      { nombre: 'Carlos', email: 'carlos@tienda.com' },
      stubDb, stubEmailService
    )).rejects.toThrow('El email ya está registrado');

    expect(stubDb.guardar).not.toHaveBeenCalled();
    expect(stubEmailService.enviarBienvenida).not.toHaveBeenCalled();
  });
});
```

**¿Por qué dos Stubs?** `registrarUsuario` depende de dos servicios externos. Se crea un stub por cada dependencia, cada uno con su comportamiento configurado.

---

## Ejemplo 3 — DRIVER: Calculadora de Impuestos

**Contexto real:** El módulo `calcularImpuesto.js` fue desarrollado por el equipo de backend. El módulo de facturación que lo va a usar aún no está listo. Se necesita probar el cálculo ahora usando desarrollo *bottom-up*.

**Módulo probado:** `calcularImpuesto.js` (módulo puro, sin dependencias)  
**Driver:** Los tests simulan los distintos módulos que llamarían a esta función.

```js
// src/stubs-drivers/calcularImpuesto.js
export const calcularImpuesto = (precio, tipoProducto, region) => {
  const tasas = {
    electronico: { nacional: 0.19, importado: 0.32 },
    alimento:    { nacional: 0.05, importado: 0.12 },
    ropa:        { nacional: 0.16, importado: 0.25 },
  };

  const tasa = tasas[tipoProducto]?.[region];
  if (tasa === undefined) throw new Error(`Configuración no soportada: tipo="${tipoProducto}", region="${region}"`);

  return Number((precio * tasa).toFixed(2));
};
```

```js
// src/tests/drivers/calcularImpuesto.driver.test.js
import { calcularImpuesto } from '../../stubs-drivers/calcularImpuesto.js';

// DRIVER A: simula el módulo de Facturación Electrónica (aún no existe)
describe('DRIVER — Facturación Electrónica', () => {
  test('IVA 19% para laptop nacional de $2.000.000', () => {
    expect(calcularImpuesto(2_000_000, 'electronico', 'nacional')).toBe(380_000);
  });
  test('Arancel 32% para celular importado de $1.500.000', () => {
    expect(calcularImpuesto(1_500_000, 'electronico', 'importado')).toBe(480_000);
  });
});

// DRIVER B: simula el módulo de Supermercado Online (aún no existe)
describe('DRIVER — Supermercado Online', () => {
  test('IVA 5% para arroz nacional de $8.000', () => {
    expect(calcularImpuesto(8_000, 'alimento', 'nacional')).toBe(400);
  });
  test('Arancel 12% para vino importado de $120.000', () => {
    expect(calcularImpuesto(120_000, 'alimento', 'importado')).toBe(14_400);
  });
});
```

**¿Por qué Driver aquí?** `calcularImpuesto` no tiene dependencias externas. El test actúa como los distintos módulos superiores que en producción la invocarían, permitiendo probarla antes de que esos módulos existan.

---

## Ejemplo 4 — DRIVER + STUB: Sistema de Punto de Venta

**Contexto real:** El motor de ventas de un supermercado implementa `procesarVenta.js`. El Sistema POS (caja registradora) que lo llamará aún no está listo, y la base de datos de inventario es externa.

**Driver:** El test simula el Sistema POS que emite las ventas.  
**Stubs:** Reemplazan la base de datos de inventario y la impresora de recibos.

> Esta combinación es la más común en proyectos reales.

```js
// src/tests/drivers/procesarVenta.driver.test.js
import { procesarVenta } from '../../stubs-drivers/procesarVenta.js';

describe('procesarVenta — DRIVER (POS) + STUB (inventario + cajero)', () => {

  let stubInventario;
  let stubCajero;

  beforeEach(() => {
    // STUB: base de datos de inventario
    stubInventario = {
      obtenerProducto: jest.fn().mockResolvedValue({
        id: 'PROD-001', nombre: 'Laptop Dell XPS', precio: 3_500_000, stock: 8,
      }),
      reducirStock: jest.fn().mockResolvedValue(true),
    };

    // STUB: generador/impresora de recibos
    stubCajero = {
      generarRecibo: jest.fn().mockImplementation(({ producto, cantidad, total }) => ({
        reciboId: 'REC-001',
        descripcion: `${cantidad}x ${producto.nombre}`,
        total,
      })),
    };
  });

  // DRIVER: el POS emite una venta exitosa
  test('DRIVER POS → venta de 2 unidades genera recibo con total correcto', async () => {
    const recibo = await procesarVenta(
      { productoId: 'PROD-001', cantidad: 2 },
      stubInventario,
      stubCajero
    );

    expect(recibo.total).toBe(7_000_000); // 2 × $3.500.000
    expect(stubInventario.reducirStock).toHaveBeenCalledWith('PROD-001', 2);
  });

  // DRIVER: el POS intenta vender más de lo disponible
  test('DRIVER POS → error por stock insuficiente', async () => {
    stubInventario.obtenerProducto.mockResolvedValue({
      id: 'PROD-001', nombre: 'Laptop', precio: 3_500_000, stock: 1,
    });

    await expect(procesarVenta({ productoId: 'PROD-001', cantidad: 5 }, stubInventario, stubCajero))
      .rejects.toThrow('Stock insuficiente para procesar la venta');

    expect(stubInventario.reducirStock).not.toHaveBeenCalled();
  });
});
```

**¿Por qué Driver Y Stub?**
- **Driver:** El test *actúa como* el POS, emitiendo ventas en distintos escenarios (venta exitosa, falta de stock, producto no encontrado).
- **Stubs:** La DB de inventario y la impresora de recibos son dependencias externas que se controlan con `jest.fn()`.

---

## Receta rápida

```
¿El módulo que pruebo LLAMA a algo externo?   → usa STUB para esa dependencia
¿Nadie llama todavía a mi módulo?             → usa DRIVER (el test mismo llama)
¿Ambas cosas a la vez?                        → combínalos (Ejemplo 4)
```

---

## Ejecutar los tests

```bash
npm test
```

Para ver solo los ejemplos de esta guía:

```bash
# Solo stubs
npm test -- --testPathPattern="stubs"

# Solo drivers
npm test -- --testPathPattern="drivers"
```
