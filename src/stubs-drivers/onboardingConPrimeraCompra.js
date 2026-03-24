import { registrarUsuario } from './registroUsuario.js';
import { calcularTotalCompra } from '../calcularTotalCompra.js';
import { procesarPedido } from './procesarPedido.js';

/**
 * Flujo de onboarding de e-commerce:
 * - registra al usuario,
 * - calcula el total de su primera compra,
 * - procesa el pago.
 *
 * La idea didactica es mostrar una prueba de integracion donde se conectan
 * varios modulos reales del dominio y se stubbean solo los bordes externos.
 *
 * @param {{ usuario: { nombre: string, email: string }, carrito: { id: string, tarjeta: string, productos: Array<{ precio: number, categoria: string }> } }} entrada
 * @param {{ db: { buscarPorEmail: Function, guardar: Function }, emailService: { enviarBienvenida: Function }, pasarelaPago: { cobrar: Function } }} deps
 */
export const onboardingConPrimeraCompra = async (entrada, deps) => {
  const { usuario, carrito } = entrada;
  const { db, emailService, pasarelaPago } = deps;

  if (!Array.isArray(carrito.productos) || carrito.productos.length === 0) {
    throw new Error('La primera compra requiere al menos un producto');
  }

  const usuarioRegistrado = await registrarUsuario(usuario, db, emailService);

  const totalCalculado = calcularTotalCompra(carrito.productos);

  const pedidoProcesado = await procesarPedido(
    {
      id: carrito.id,
      total: totalCalculado,
      tarjeta: carrito.tarjeta,
    },
    pasarelaPago
  );

  return {
    usuarioId: usuarioRegistrado.id,
    email: usuarioRegistrado.email,
    pedidoId: pedidoProcesado.pedidoId,
    transaccionId: pedidoProcesado.transaccionId,
    totalCobrado: totalCalculado,
  };
};