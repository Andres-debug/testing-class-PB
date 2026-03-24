/**
 * EJEMPLO 2 — STUB
 *
 * Escenario: Al registrar un usuario, el sistema necesita:
 *   1. Consultar la base de datos (para verificar que el email no exista)
 *   2. Guardar el usuario en la base de datos
 *   3. Enviar un email de bienvenida
 *
 * En el test NO queremos:
 *   - Conectarnos a una base de datos real (lento, requiere setup)
 *   - Enviar emails reales (costaría dinero, llenaría bandejas de prueba)
 *
 * SOLUCIÓN → DOS STUBs: uno para la db y otro para el servicio de email.
 * Cada stub devuelve respuestas controladas según el caso de prueba.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { registrarUsuario } from '../../stubs-drivers/registroUsuario.js';

describe('registrarUsuario — STUB de DB y EmailService', () => {

  // ─── Stubs recreados antes de cada test para evitar contaminación ────────

  let stubDb;
  let stubEmailService;

  beforeEach(() => {
    /**
     * STUB de base de datos:
     * - buscarPorEmail → por defecto retorna null (usuario no existe)
     * - guardar       → retorna el usuario "guardado" con id generado
     */
    stubDb = {
      buscarPorEmail: jest.fn().mockResolvedValue(null),
      guardar: jest.fn().mockResolvedValue({
        id: 'USR-777',
        nombre: 'Carlos López',
        email: 'carlos@tienda.com',
      }),
    };

    /**
     * STUB del servicio de email:
     * - enviarBienvenida → simula envío exitoso sin hacer nada real
     */
    stubEmailService = {
      enviarBienvenida: jest.fn().mockResolvedValue({ enviado: true }),
    };
  });

  // ─── Tests ───────────────────────────────────────────────────────────────

  test('registra el usuario y envía email de bienvenida', async () => {
    const datos = { nombre: 'Carlos López', email: 'carlos@tienda.com' };

    const usuario = await registrarUsuario(datos, stubDb, stubEmailService);

    // El usuario retornado es el que devolvió el stub de db
    expect(usuario.id).toBe('USR-777');
    expect(usuario.nombre).toBe('Carlos López');

    // Se consultó la DB una vez para verificar si el email existe
    expect(stubDb.buscarPorEmail).toHaveBeenCalledWith('carlos@tienda.com');

    // Se guardó el usuario una vez
    expect(stubDb.guardar).toHaveBeenCalledTimes(1);

    // Se envió el email de bienvenida con los datos correctos
    expect(stubEmailService.enviarBienvenida).toHaveBeenCalledWith(
      'carlos@tienda.com',
      'Carlos López'
    );
  });

  test('lanza error si el email ya existe y NO guarda ni envía email', async () => {
    // Reconfiguramos el stub para simular que el email ya está en la DB
    stubDb.buscarPorEmail.mockResolvedValue({
      id: 'USR-001',
      email: 'carlos@tienda.com',
    });

    const datos = { nombre: 'Carlos López', email: 'carlos@tienda.com' };

    await expect(registrarUsuario(datos, stubDb, stubEmailService))
      .rejects.toThrow('El email ya está registrado');

    // No debe intentar guardar ni mandar email si el usuario ya existe
    expect(stubDb.guardar).not.toHaveBeenCalled();
    expect(stubEmailService.enviarBienvenida).not.toHaveBeenCalled();
  });

  test('propaga el error si la DB falla al guardar', async () => {
    // Reconfiguramos el stub para simular falla de base de datos
    stubDb.guardar.mockRejectedValue(new Error('Conexión a la base de datos perdida'));

    const datos = { nombre: 'María Torres', email: 'maria@tienda.com' };

    await expect(registrarUsuario(datos, stubDb, stubEmailService))
      .rejects.toThrow('Conexión a la base de datos perdida');

    // Si la DB falla, no debe intentar enviar el email
    expect(stubEmailService.enviarBienvenida).not.toHaveBeenCalled();
  });

});
