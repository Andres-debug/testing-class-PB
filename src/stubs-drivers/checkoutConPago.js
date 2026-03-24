import { calcularTotalCompra } from '../calcularTotalCompra.js';
import { procesarPedido } from './procesarPedido.js';

/**
 * Orquesta el checkout de un carrito:
 * 1) calcula el total con reglas de descuento internas,
 * 2) procesa el cobro con la pasarela de pago inyectada.
 *
 * En pruebas de integracion, este modulo permite integrar logica real
 * de negocio (calcularTotalCompra + procesarPedido) y aislar solo la
 * dependencia externa (pasarelaPago) con un STUB.
 *
 * @param {{ id: string, tarjeta: string, productos: Array<{ precio: number, categoria: string }> }} carrito
 * @param {{ cobrar: Function }} pasarelaPago
 */
export const checkoutConPago = async (carrito, pasarelaPago) => {
  if (!Array.isArray(carrito.productos) || carrito.productos.length === 0) {
    throw new Error('El carrito debe contener al menos un producto');
  }

  const totalCalculado = calcularTotalCompra(carrito.productos);

  const resultadoPedido = await procesarPedido(
    {
      id: carrito.id,
      total: totalCalculado,
      tarjeta: carrito.tarjeta,
    },
    pasarelaPago
  );

  return {
    ...resultadoPedido,
    totalCobrado: totalCalculado,
    cantidadItems: carrito.productos.length,
  };
};