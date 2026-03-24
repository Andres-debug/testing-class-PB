using Moq;
using Tienda.Core;
using Tienda.Core.Servicios;

namespace Tienda.Core.Tests;

public sealed class CheckoutConPagoServiceIntegracionGuiaTests
{
    [Fact]
    public async Task FlujoFeliz_CalculaTotalYCobra_ConStubDePasarela()
    {
        // DRIVER: el test simula el caller real (API/Frontend) que envia el carrito.
        var carrito = new Carrito(
            Id: "PED-CS-1001",
            Tarjeta: "4111111111111111",
            Productos:
            [
                new Producto(800m, "tecnologia"),
                new Producto(300m, "hogar")
            ]
        );

        // STUB: reemplaza una pasarela externa con respuesta controlada.
        var pasarela = new Mock<IPasarelaPago>(MockBehavior.Strict);
        pasarela
            .Setup(p => p.CobrarAsync(770m, "4111111111111111"))
            .ReturnsAsync(new ResultadoCobro(true, "TRX-CS-001"));

        var service = new CheckoutConPagoService(pasarela.Object);

        var salida = await service.EjecutarAsync(carrito);

        // 800 + 300 = 1100
        // descuento: 15% + 5% + 10% = 30%
        // total = 1100 * 0.70 = 770
        Assert.Equal(770m, salida.TotalCobrado);
        Assert.Equal("completado", salida.Estado);
        Assert.Equal("TRX-CS-001", salida.TransaccionId);

        // Verificamos integracion hacia el borde externo.
        pasarela.Verify(p => p.CobrarAsync(770m, "4111111111111111"), Times.Once);
    }

    [Fact]
    public async Task SiPasarelaRechaza_PropagaErrorDeNegocio()
    {
        var carrito = new Carrito(
            Id: "PED-CS-1002",
            Tarjeta: "4000000000000002",
            Productos: [new Producto(1200m, "tecnologia")]
        );

        var pasarela = new Mock<IPasarelaPago>(MockBehavior.Strict);
        pasarela
            .Setup(p => p.CobrarAsync(It.IsAny<decimal>(), "4000000000000002"))
            .ReturnsAsync(new ResultadoCobro(false, null));

        var service = new CheckoutConPagoService(pasarela.Object);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.EjecutarAsync(carrito));
        Assert.Equal("Pago rechazado por la pasarela", ex.Message);
    }

    [Fact]
    public async Task SiCarritoVacio_FallaAntesDeCobrar()
    {
        var carrito = new Carrito("PED-CS-1003", "4111111111111111", []);

        var pasarela = new Mock<IPasarelaPago>(MockBehavior.Strict);
        var service = new CheckoutConPagoService(pasarela.Object);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.EjecutarAsync(carrito));
        Assert.Equal("El carrito debe contener al menos un producto", ex.Message);

        pasarela.Verify(p => p.CobrarAsync(It.IsAny<decimal>(), It.IsAny<string>()), Times.Never);
    }
}