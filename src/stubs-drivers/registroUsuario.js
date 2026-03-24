/**
 * Registra un usuario nuevo en el sistema y le envía un email de bienvenida.
 * db y emailService se reciben como parámetros (inyección de dependencias),
 * lo que permite reemplazarlos con STUBs en los tests.
 *
 * @param {{ nombre: string, email: string }} datosUsuario
 * @param {{ buscarPorEmail: Function, guardar: Function }} db
 * @param {{ enviarBienvenida: Function }} emailService
 */
export const registrarUsuario = async (datosUsuario, db, emailService) => {
  const usuarioExistente = await db.buscarPorEmail(datosUsuario.email);

  if (usuarioExistente) {
    throw new Error('El email ya está registrado');
  }

  const nuevoUsuario = await db.guardar({
    nombre: datosUsuario.nombre,
    email: datosUsuario.email,
    fechaRegistro: new Date().toISOString(),
  });

  await emailService.enviarBienvenida(datosUsuario.email, datosUsuario.nombre);

  return nuevoUsuario;
};
