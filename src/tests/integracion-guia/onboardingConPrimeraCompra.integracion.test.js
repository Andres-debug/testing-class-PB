/**
 * GUIA DE INTEGRACION #2
 *
 * Objetivo pedagogico:
 * - Mostrar una integracion de varios modulos reales en un flujo de negocio.
 * - Usar stubs para bordes externos (DB, email, pasarela) manteniendo el
 *   comportamiento deterministico del test.
 *
 * Flujo integrado en este test:
 * 1) registrar usuario
 * 2) calcular total del carrito
 * 3) procesar pago del primer pedido
 *
 * DRIVER:
 * - El test simula al caller real (por ejemplo, endpoint /onboarding).
 * STUBS:
 * - db, emailService y pasarelaPago.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { onboardingConPrimeraCompra } from '../../stubs-drivers/onboardingConPrimeraCompra.js';

describe('Integracion guiada: onboarding + primera compra (DRIVER + STUBS)', () => {
  let stubDb;
  let stubEmailService;
  let stubPasarelaPago;

  beforeEach(() => {
    // STUB de DB: modela consultas/guardado sin base de datos real.
    stubDb = {
      buscarPorEmail: jest.fn().mockResolvedValue(null),
      guardar: jest.fn().mockResolvedValue({
        id: 'USR-900',
        nombre: 'Laura Torres',
        email: 'laura@correo.com',
      }),
    };

    // STUB de email: evita envio real y permite verificar invocaciones.
    stubEmailService = {
      enviarBienvenida: jest.fn().mockResolvedValue({ enviado: true }),
    };

    // STUB de pasarela: evita cobros reales.
    stubPasarelaPago = {
      cobrar: jest.fn().mockResolvedValue({
        aprobado: true,
        transaccionId: 'TRX-ONB-001',
      }),
    };
  });

  test('flujo completo exitoso: registra usuario, envia bienvenida y cobra pedido', async () => {
    const entradaDriver = {
      usuario: { nombre: 'Laura Torres', email: 'laura@correo.com' },
      carrito: {
        id: 'PED-ONB-01',
        tarjeta: '4111111111111111',
        productos: [
          { precio: 500, categoria: 'tecnologia' },
          { precio: 300, categoria: 'hogar' },
        ],
      },
    };

    const salida = await onboardingConPrimeraCompra(entradaDriver, {
      db: stubDb,
      emailService: stubEmailService,
      pasarelaPago: stubPasarelaPago,
    });

    // Total esperado:
    // 500 + 300 = 800
    // descuento: tecnologia 15% + hogar 5% = 20%
    // total final = 800 * 0.80 = 640
    expect(salida.totalCobrado).toBe(640);
    expect(salida.usuarioId).toBe('USR-900');
    expect(salida.pedidoId).toBe('PED-ONB-01');
    expect(salida.transaccionId).toBe('TRX-ONB-001');

    // Validamos que cada borde externo fue invocado con datos correctos.
    expect(stubDb.buscarPorEmail).toHaveBeenCalledWith('laura@correo.com');
    expect(stubEmailService.enviarBienvenida).toHaveBeenCalledWith('laura@correo.com', 'Laura Torres');
    expect(stubPasarelaPago.cobrar).toHaveBeenCalledWith({
      monto: 640,
      tarjeta: '4111111111111111',
    });
  });

  test('si el email ya existe, corta el flujo y no intenta cobrar', async () => {
    stubDb.buscarPorEmail.mockResolvedValue({ id: 'USR-EXISTE' });

    const entradaDriver = {
      usuario: { nombre: 'Laura Torres', email: 'laura@correo.com' },
      carrito: {
        id: 'PED-ONB-02',
        tarjeta: '4111111111111111',
        productos: [{ precio: 500, categoria: 'tecnologia' }],
      },
    };

    await expect(onboardingConPrimeraCompra(entradaDriver, {
      db: stubDb,
      emailService: stubEmailService,
      pasarelaPago: stubPasarelaPago,
    })).rejects.toThrow('El email ya está registrado');

    // No debe continuar con efectos posteriores al fallo de registro.
    expect(stubDb.guardar).not.toHaveBeenCalled();
    expect(stubEmailService.enviarBienvenida).not.toHaveBeenCalled();
    expect(stubPasarelaPago.cobrar).not.toHaveBeenCalled();
  });

  test('si el carrito llega vacio, falla antes de tocar dependencias externas', async () => {
    const entradaDriver = {
      usuario: { nombre: 'Laura Torres', email: 'laura@correo.com' },
      carrito: {
        id: 'PED-ONB-03',
        tarjeta: '4111111111111111',
        productos: [],
      },
    };

    await expect(onboardingConPrimeraCompra(entradaDriver, {
      db: stubDb,
      emailService: stubEmailService,
      pasarelaPago: stubPasarelaPago,
    })).rejects.toThrow('La primera compra requiere al menos un producto');

    expect(stubDb.buscarPorEmail).not.toHaveBeenCalled();
    expect(stubEmailService.enviarBienvenida).not.toHaveBeenCalled();
    expect(stubPasarelaPago.cobrar).not.toHaveBeenCalled();
  });
});