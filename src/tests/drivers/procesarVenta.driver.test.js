/**
 * EJEMPLO 4 — DRIVER + STUB (combinación real más común)
 *
 * Escenario: Se está desarrollando el motor de ventas de un supermercado.
 * El Sistema de Punto de Venta (POS) que usará procesarVenta aún no existe,
 * pero el módulo de ventas ya está listo y necesita ser probado.
 *
 * DRIVER: El test simula el rol del Sistema POS que llama a procesarVenta.
 *         → Representa el software que en producción emitiría las ventas.
 *
 * STUB:   Las dependencias reales (BD de inventario, impresora de recibos)
 *         se reemplazan con jest.fn() para que el test sea rápido y predecible.
 *         → stub de inventarioRepo (BD)
 *         → stub de cajero (impresora/generador de recibos)
 *
 * Al combinarlos, el test cubre de punta a punta el flujo de venta sin
 * necesitar ni el caller real ni las dependencias reales.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { procesarVenta } from '../../stubs-drivers/procesarVenta.js';

describe('procesarVenta — DRIVER (POS) + STUB (inventario + cajero)', () => {

  // ─── STUBs base ─────────────────────────────────────────────────────────

  let stubInventario;
  let stubCajero;

  beforeEach(() => {
    /** STUB: simula la consulta a la base de datos de inventario */
    stubInventario = {
      obtenerProducto: jest.fn().mockResolvedValue({
        id: 'PROD-001',
        nombre: 'Laptop Dell XPS',
        precio: 3_500_000,
        stock: 8,
      }),
      reducirStock: jest.fn().mockResolvedValue(true),
    };

    /** STUB: simula la impresora / generador de recibos */
    stubCajero = {
      generarRecibo: jest.fn().mockImplementation(({ producto, cantidad, total }) => ({
        reciboId: `REC-${Date.now()}`,
        descripcion: `${cantidad}x ${producto.nombre}`,
        total,
        metodo: 'EFECTIVO',
        fecha: '2026-03-17',
      })),
    };
  });

  // ─── Tests (el describe actúa como DRIVER del sistema POS) ──────────────

  test('DRIVER POS → venta exitosa de 2 unidades genera recibo con total correcto', async () => {
    // El POS emite una orden de venta de 2 unidades
    const ventaDesdePos = { productoId: 'PROD-001', cantidad: 2 };

    const recibo = await procesarVenta(ventaDesdePos, stubInventario, stubCajero);

    // El recibo debe reflejar el total: 2 × $3.500.000 = $7.000.000
    expect(recibo.total).toBe(7_000_000);
    expect(recibo.descripcion).toBe('2x Laptop Dell XPS');

    // El stock debe haber sido descontado correctamente
    expect(stubInventario.reducirStock).toHaveBeenCalledWith('PROD-001', 2);
  });

  test('DRIVER POS → lanza error cuando el stock no alcanza para la cantidad pedida', async () => {
    // Reconfiguramos stub: solo quedan 3 unidades en stock
    stubInventario.obtenerProducto.mockResolvedValue({
      id: 'PROD-001',
      nombre: 'Laptop Dell XPS',
      precio: 3_500_000,
      stock: 3,
    });

    // El POS intenta vender 5 unidades (más de las disponibles)
    const ventaDesdePos = { productoId: 'PROD-001', cantidad: 5 };

    await expect(procesarVenta(ventaDesdePos, stubInventario, stubCajero))
      .rejects.toThrow('Stock insuficiente para procesar la venta');

    // Si hay error de stock, no debe descontarse nada ni generarse recibo
    expect(stubInventario.reducirStock).not.toHaveBeenCalled();
    expect(stubCajero.generarRecibo).not.toHaveBeenCalled();
  });

  test('DRIVER POS → lanza error cuando el producto no existe en el sistema', async () => {
    // El stub devuelve null: el producto no está en la base de datos
    stubInventario.obtenerProducto.mockResolvedValue(null);

    const ventaDesdePos = { productoId: 'PROD-999', cantidad: 1 };

    await expect(procesarVenta(ventaDesdePos, stubInventario, stubCajero))
      .rejects.toThrow('Producto no encontrado');
  });

  test('DRIVER POS → los datos del recibo son pasados correctamente al cajero', async () => {
    const ventaDesdePos = { productoId: 'PROD-001', cantidad: 1 };

    await procesarVenta(ventaDesdePos, stubInventario, stubCajero);

    // Verificamos que el cajero recibió exactamente los datos correctos
    expect(stubCajero.generarRecibo).toHaveBeenCalledWith({
      producto: expect.objectContaining({ nombre: 'Laptop Dell XPS' }),
      cantidad: 1,
      total: 3_500_000,
    });
  });

});
