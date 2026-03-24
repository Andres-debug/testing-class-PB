/**
 * GUIA DE INTEGRACION #1
 *
 * Objetivo pedagogico:
 * - Entender como combinar DRIVER + STUB en una prueba de integracion.
 * - Integrar modulos reales de negocio sin depender de servicios externos.
 *
 * Que se integra realmente:
 * - checkoutConPago (orquestador)
 * - calcularTotalCompra (reglas de descuentos)
 * - procesarPedido (flujo de cobro)
 *
 * Que se aisla con STUB:
 * - pasarelaPago (servicio externo de cobro)
 *
 * Rol del DRIVER en este archivo:
 * - Cada test simula el caller real (por ejemplo, frontend checkout o API).
 * - Es decir, el test "maneja" entradas/salidas del flujo completo.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { checkoutConPago } from '../../stubs-drivers/checkoutConPago.js';

describe('Integracion guiada: checkoutConPago (DRIVER + STUB)', () => {
  let stubPasarelaPago;

  beforeEach(() => {
    // STUB controlado: evita llamadas reales a Stripe/MercadoPago.
    stubPasarelaPago = {
      cobrar: jest.fn().mockResolvedValue({
        aprobado: true,
        transaccionId: 'TRX-INTEG-001',
      }),
    };
  });

  test('flujo feliz: calcula descuentos, cobra y responde resumen de checkout', async () => {
    // DRIVER: simulamos el payload que enviaria un modulo superior.
    const carritoDesdeFrontend = {
      id: 'PED-1001',
      tarjeta: '4111111111111111',
      productos: [
        { precio: 800, categoria: 'tecnologia' },
        { precio: 300, categoria: 'hogar' },
      ],
    };

    const salida = await checkoutConPago(carritoDesdeFrontend, stubPasarelaPago);

    // El total esperado integra reglas reales:
    // 800 + 300 = 1100
    // descuentos: tecnologia 15% + hogar 5% + por superar 1000 (10%) = 30%
    // total final = 1100 * 0.70 = 770
    expect(salida.totalCobrado).toBe(770);
    expect(salida.pedidoId).toBe('PED-1001');
    expect(salida.estado).toBe('completado');
    expect(salida.transaccionId).toBe('TRX-INTEG-001');
    expect(salida.cantidadItems).toBe(2);

    // Afirmamos integracion correcta hacia la dependencia stubbeada.
    expect(stubPasarelaPago.cobrar).toHaveBeenCalledTimes(1);
    expect(stubPasarelaPago.cobrar).toHaveBeenCalledWith({
      monto: 770,
      tarjeta: '4111111111111111',
    });
  });

  test('si la pasarela rechaza, el flujo integrado propaga error de negocio', async () => {
    stubPasarelaPago.cobrar.mockResolvedValue({ aprobado: false, transaccionId: null });

    const carritoDesdeFrontend = {
      id: 'PED-1002',
      tarjeta: '4000000000000002',
      productos: [{ precio: 1200, categoria: 'tecnologia' }],
    };

    await expect(checkoutConPago(carritoDesdeFrontend, stubPasarelaPago))
      .rejects.toThrow('Pago rechazado por la pasarela');
  });

  test('si no hay productos, falla antes de intentar cobrar', async () => {
    const carritoSinProductos = {
      id: 'PED-1003',
      tarjeta: '4111111111111111',
      productos: [],
    };

    await expect(checkoutConPago(carritoSinProductos, stubPasarelaPago))
      .rejects.toThrow('El carrito debe contener al menos un producto');

    // Buena practica de integracion: asegurar que no hubo side effects.
    expect(stubPasarelaPago.cobrar).not.toHaveBeenCalled();
  });
});