/**
 * Calcula el impuesto de un producto según su tipo y origen.
 * Módulo puro (sin efectos secundarios) — ideal para pruebas con DRIVER.
 *
 * @param {number} precio - Precio base del producto
 * @param {'electronico' | 'alimento' | 'ropa'} tipoProducto
 * @param {'nacional' | 'importado'} region
 * @returns {number} Valor del impuesto
 */
export const calcularImpuesto = (precio, tipoProducto, region) => {
  const tasas = {
    electronico: { nacional: 0.19, importado: 0.32 },
    alimento:    { nacional: 0.05, importado: 0.12 },
    ropa:        { nacional: 0.16, importado: 0.25 },
  };

  const tasa = tasas[tipoProducto]?.[region];

  if (tasa === undefined) {
    throw new Error(
      `Configuración no soportada: tipo="${tipoProducto}", region="${region}"`
    );
  }

  return Number((precio * tasa).toFixed(2));
};
