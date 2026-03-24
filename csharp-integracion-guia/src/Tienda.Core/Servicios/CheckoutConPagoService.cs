namespace Tienda.Core.Servicios;

public sealed class CheckoutConPagoService
{
    private readonly IPasarelaPago _pasarelaPago;

    public CheckoutConPagoService(IPasarelaPago pasarelaPago)
    {
        _pasarelaPago = pasarelaPago;
    }

    public async Task<ResultadoCheckout> EjecutarAsync(Carrito carrito)
    {
        if (carrito.Productos.Count == 0)
        {
            throw new InvalidOperationException("El carrito debe contener al menos un producto");
        }

        // Reglas de negocio reales para total:
        // - tecnologia suma 15% de descuento
        // - hogar suma 5% de descuento
        // - total bruto > 1000 suma 10% adicional
        // - descuento maximo 30%
        var totalBruto = carrito.Productos.Sum(p => p.Precio);

        decimal descuento = 0m;
        foreach (var producto in carrito.Productos)
        {
            if (producto.Categoria == "tecnologia") descuento += 0.15m;
            if (producto.Categoria == "hogar") descuento += 0.05m;
        }

        if (totalBruto > 1000m) descuento += 0.10m;
        if (descuento > 0.30m) descuento = 0.30m;

        var totalCobrado = decimal.Round(totalBruto * (1 - descuento), 2);

        var cobro = await _pasarelaPago.CobrarAsync(totalCobrado, carrito.Tarjeta);
        if (!cobro.Aprobado)
        {
            throw new InvalidOperationException("Pago rechazado por la pasarela");
        }

        return new ResultadoCheckout(
            PedidoId: carrito.Id,
            Estado: "completado",
            TransaccionId: cobro.TransaccionId,
            TotalCobrado: totalCobrado,
            CantidadItems: carrito.Productos.Count
        );
    }
}