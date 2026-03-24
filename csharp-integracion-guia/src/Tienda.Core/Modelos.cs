namespace Tienda.Core;

public sealed record Producto(decimal Precio, string Categoria);

public sealed record Carrito(string Id, string Tarjeta, IReadOnlyList<Producto> Productos);

public sealed record Usuario(string Id, string Nombre, string Email);

public sealed record ResultadoCobro(bool Aprobado, string? TransaccionId);

public sealed record ResultadoCheckout(string PedidoId, string Estado, string? TransaccionId, decimal TotalCobrado, int CantidadItems);

public sealed record EntradaOnboarding(string Nombre, string Email, Carrito Carrito);

public sealed record ResultadoOnboarding(string UsuarioId, string Email, string PedidoId, string? TransaccionId, decimal TotalCobrado);