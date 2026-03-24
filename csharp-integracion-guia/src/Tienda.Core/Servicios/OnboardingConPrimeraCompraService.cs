namespace Tienda.Core.Servicios;

public sealed class OnboardingConPrimeraCompraService
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IEmailService _emails;
    private readonly CheckoutConPagoService _checkout;

    public OnboardingConPrimeraCompraService(
        IUsuarioRepository usuarios,
        IEmailService emails,
        CheckoutConPagoService checkout)
    {
        _usuarios = usuarios;
        _emails = emails;
        _checkout = checkout;
    }

    public async Task<ResultadoOnboarding> EjecutarAsync(EntradaOnboarding entrada)
    {
        if (entrada.Carrito.Productos.Count == 0)
        {
            throw new InvalidOperationException("La primera compra requiere al menos un producto");
        }

        var existente = await _usuarios.BuscarPorEmailAsync(entrada.Email);
        if (existente is not null)
        {
            throw new InvalidOperationException("El email ya esta registrado");
        }

        var guardado = await _usuarios.GuardarAsync(entrada.Nombre, entrada.Email);
        await _emails.EnviarBienvenidaAsync(guardado.Email, guardado.Nombre);

        var checkout = await _checkout.EjecutarAsync(entrada.Carrito);

        return new ResultadoOnboarding(
            UsuarioId: guardado.Id,
            Email: guardado.Email,
            PedidoId: checkout.PedidoId,
            TransaccionId: checkout.TransaccionId,
            TotalCobrado: checkout.TotalCobrado
        );
    }
}