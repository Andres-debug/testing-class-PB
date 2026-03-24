namespace Tienda.Core;

public interface IPasarelaPago
{
    Task<ResultadoCobro> CobrarAsync(decimal monto, string tarjeta);
}

public interface IUsuarioRepository
{
    Task<Usuario?> BuscarPorEmailAsync(string email);
    Task<Usuario> GuardarAsync(string nombre, string email);
}

public interface IEmailService
{
    Task EnviarBienvenidaAsync(string email, string nombre);
}