using Moq;
using Tienda.Core;
using Tienda.Core.Servicios;

namespace Tienda.Core.Tests;

public sealed class OnboardingConPrimeraCompraServiceIntegracionGuiaTests
{
    [Fact]
    public async Task FlujoCompleto_RegistroBienvenidaYCobro_ConStubsControlados()
    {
        // DRIVER: simulamos el endpoint de onboarding enviando entrada completa.
        var entrada = new EntradaOnboarding(
            Nombre: "Laura Torres",
            Email: "laura@correo.com",
            Carrito: new Carrito(
                Id: "PED-ONB-CS-01",
                Tarjeta: "4111111111111111",
                Productos:
                [
                    new Producto(500m, "tecnologia"),
                    new Producto(300m, "hogar")
                ])
        );

        // STUB DB
        var usuarios = new Mock<IUsuarioRepository>(MockBehavior.Strict);
        usuarios.Setup(r => r.BuscarPorEmailAsync("laura@correo.com")).ReturnsAsync((Usuario?)null);
        usuarios.Setup(r => r.GuardarAsync("Laura Torres", "laura@correo.com"))
            .ReturnsAsync(new Usuario("USR-CS-900", "Laura Torres", "laura@correo.com"));

        // STUB Email
        var emails = new Mock<IEmailService>(MockBehavior.Strict);
        emails.Setup(e => e.EnviarBienvenidaAsync("laura@correo.com", "Laura Torres")).Returns(Task.CompletedTask);

        // STUB Pasarela
        var pasarela = new Mock<IPasarelaPago>(MockBehavior.Strict);
        pasarela
            .Setup(p => p.CobrarAsync(640m, "4111111111111111"))
            .ReturnsAsync(new ResultadoCobro(true, "TRX-ONB-CS-001"));

        var checkout = new CheckoutConPagoService(pasarela.Object);
        var service = new OnboardingConPrimeraCompraService(usuarios.Object, emails.Object, checkout);

        var salida = await service.EjecutarAsync(entrada);

        // 500 + 300 = 800
        // descuento: 15% + 5% = 20%
        // total = 800 * 0.80 = 640
        Assert.Equal("USR-CS-900", salida.UsuarioId);
        Assert.Equal("PED-ONB-CS-01", salida.PedidoId);
        Assert.Equal(640m, salida.TotalCobrado);

        usuarios.VerifyAll();
        emails.VerifyAll();
        pasarela.VerifyAll();
    }

    [Fact]
    public async Task SiEmailExiste_CortaFlujoYNoIntentaCobrar()
    {
        var entrada = new EntradaOnboarding(
            Nombre: "Laura Torres",
            Email: "laura@correo.com",
            Carrito: new Carrito(
                Id: "PED-ONB-CS-02",
                Tarjeta: "4111111111111111",
                Productos: [new Producto(500m, "tecnologia")])
        );

        var usuarios = new Mock<IUsuarioRepository>(MockBehavior.Strict);
        usuarios.Setup(r => r.BuscarPorEmailAsync("laura@correo.com"))
            .ReturnsAsync(new Usuario("USR-EXISTE", "Laura", "laura@correo.com"));

        var emails = new Mock<IEmailService>(MockBehavior.Strict);
        var pasarela = new Mock<IPasarelaPago>(MockBehavior.Strict);

        var checkout = new CheckoutConPagoService(pasarela.Object);
        var service = new OnboardingConPrimeraCompraService(usuarios.Object, emails.Object, checkout);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.EjecutarAsync(entrada));
        Assert.Equal("El email ya esta registrado", ex.Message);

        usuarios.Verify(r => r.BuscarPorEmailAsync("laura@correo.com"), Times.Once);
        usuarios.Verify(r => r.GuardarAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        emails.Verify(e => e.EnviarBienvenidaAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        pasarela.Verify(p => p.CobrarAsync(It.IsAny<decimal>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SiCarritoVacio_FallaAntesDeTocarDependenciasExternas()
    {
        var entrada = new EntradaOnboarding(
            Nombre: "Laura Torres",
            Email: "laura@correo.com",
            Carrito: new Carrito("PED-ONB-CS-03", "4111111111111111", [])
        );

        var usuarios = new Mock<IUsuarioRepository>(MockBehavior.Strict);
        var emails = new Mock<IEmailService>(MockBehavior.Strict);
        var pasarela = new Mock<IPasarelaPago>(MockBehavior.Strict);

        var checkout = new CheckoutConPagoService(pasarela.Object);
        var service = new OnboardingConPrimeraCompraService(usuarios.Object, emails.Object, checkout);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.EjecutarAsync(entrada));
        Assert.Equal("La primera compra requiere al menos un producto", ex.Message);

        usuarios.Verify(r => r.BuscarPorEmailAsync(It.IsAny<string>()), Times.Never);
        emails.Verify(e => e.EnviarBienvenidaAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        pasarela.Verify(p => p.CobrarAsync(It.IsAny<decimal>(), It.IsAny<string>()), Times.Never);
    }
}