/**
 * EJEMPLO 1 — STUB
 *
 * Escenario: Una tienda online necesita procesar pedidos con cobro real
 * (Stripe, PayPal, MercadoPago...). En el test NO queremos llamar a la
 * pasarela real porque:
 *   - Cobraría dinero de verdad
 *   - Depende de internet / credenciales
 *   - Es lento e impredecible
 *
 * SOLUCIÓN → STUB: reemplazamos pasarelaPago con un objeto falso controlado
 * usando jest.fn(), que devuelve exactamente lo que necesitamos para cada caso.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { procesarPedido } from '../../stubs-drivers/procesarPedido.js';

describe('procesarPedido — STUB de pasarela de pago', () => {

  // ─── Stubs reutilizables ─────────────────────────────────────────────────

  /** STUB que simula aprobación del pago */
  const stubPasarelaAprobada = {
    cobrar: jest.fn().mockResolvedValue({
      aprobado: true,
      transaccionId: 'TXN-2024-001',
    }),
  };

  /** STUB que simula rechazo del pago (fondos insuficientes, etc.) */
  const stubPasarelaRechazada = {
    cobrar: jest.fn().mockResolvedValue({
      aprobado: false,
      transaccionId: null,
    }),
  };

  beforeEach(() => {
    // Limpiamos el historial de llamadas entre cada test
    jest.clearAllMocks();
  });

  // ─── Tests ───────────────────────────────────────────────────────────────

  test('completa el pedido cuando el pago es aprobado', async () => {
    const pedido = { id: 'P-001', total: 250_000, tarjeta: '4111111111111111' };

    const resultado = await procesarPedido(pedido, stubPasarelaAprobada);

    expect(resultado.estado).toBe('completado');
    expect(resultado.transaccionId).toBe('TXN-2024-001');
    expect(resultado.pedidoId).toBe('P-001');
  });

  test('el stub verifica que se llamó con los datos correctos', async () => {
    const pedido = { id: 'P-002', total: 99_000, tarjeta: '4111111111111111' };

    await procesarPedido(pedido, stubPasarelaAprobada);

    // Verificamos que el stub fue llamado exactamente 1 vez
    expect(stubPasarelaAprobada.cobrar).toHaveBeenCalledTimes(1);

    // Y con los argumentos correctos
    expect(stubPasarelaAprobada.cobrar).toHaveBeenCalledWith({
      monto: 99_000,
      tarjeta: '4111111111111111',
    });
  });

  test('lanza error cuando la pasarela rechaza el pago', async () => {
    const pedido = { id: 'P-003', total: 500_000, tarjeta: '4000000000000002' };

    await expect(procesarPedido(pedido, stubPasarelaRechazada))
      .rejects.toThrow('Pago rechazado por la pasarela');
  });

  test('lanza error si el total del pedido es 0 o negativo', async () => {
    const pedido = { id: 'P-004', total: 0, tarjeta: '4111111111111111' };

    // El stub NI SIQUIERA debería ser llamado en este caso
    await expect(procesarPedido(pedido, stubPasarelaAprobada))
      .rejects.toThrow('El total del pedido debe ser mayor a 0');

    expect(stubPasarelaAprobada.cobrar).not.toHaveBeenCalled();
  });

});
