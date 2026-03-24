/**
 * Procesa una venta: verifica stock, lo descuenta y genera un recibo.
 * inventarioRepo y cajero se reciben como parámetros (inyección de dependencias).
 * En los tests, el test actúa como DRIVER y usa STUBs para las dependencias.
 *
 * @param {{ productoId: string, cantidad: number }} venta
 * @param {{ obtenerProducto: Function, reducirStock: Function }} inventarioRepo
 * @param {{ generarRecibo: Function }} cajero
 */
export const procesarVenta = async (venta, inventarioRepo, cajero) => {
  const producto = await inventarioRepo.obtenerProducto(venta.productoId);

  if (!producto) {
    throw new Error('Producto no encontrado');
  }

  if (producto.stock < venta.cantidad) {
    throw new Error('Stock insuficiente para procesar la venta');
  }

  await inventarioRepo.reducirStock(venta.productoId, venta.cantidad);

  const total = producto.precio * venta.cantidad;

  const recibo = cajero.generarRecibo({
    producto,
    cantidad: venta.cantidad,
    total,
  });

  return recibo;
};
