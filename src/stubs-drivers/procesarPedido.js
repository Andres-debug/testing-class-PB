/**
 * Procesa un pedido y lo cobra a través de una pasarela de pago.
 * La pasarelaPago se recibe como parámetro (inyección de dependencias),
 * lo que permite reemplazarla con un STUB en los tests.
 *
 * @param {{ id: string, total: number, tarjeta: string }} pedido
 * @param {{ cobrar: Function }} pasarelaPago  - puede ser real o un stub
 */
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

  return {
    pedidoId: pedido.id,
    estado: 'completado',
    transaccionId: resultado.transaccionId,
  };
};
