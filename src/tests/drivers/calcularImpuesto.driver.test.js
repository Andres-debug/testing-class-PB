/**
 * EJEMPLO 3 — DRIVER
 *
 * Escenario: El equipo de backend terminó calcularImpuesto.js pero el módulo
 * de facturación que lo va a usar (facturacion.js) aún no está desarrollado.
 *
 * Con desarrollo de abajo hacia arriba (bottom-up), primero probamos los
 * módulos de bajo nivel antes de que existan sus callers.
 *
 * SOLUCIÓN → DRIVER: el test mismo actúa como el "llamador" que aún no existe.
 * Simula las distintas formas en que los módulos superiores invocarían
 * a calcularImpuesto, asegurándonos de que funciona correctamente.
 *
 * Módulos superiores simulados por el driver:
 *   • Sistema de facturación electrónica (electrónicos)
 *   • Plataforma de supermercado online (alimentos)
 *   • Tienda virtual de moda (ropa)
 *   • Módulo de validación de entrada
 */

import { describe, test, expect } from '@jest/globals';
import { calcularImpuesto } from '../../stubs-drivers/calcularImpuesto.js';

// ─── Driver A: simula el módulo de Facturación Electrónica ────────────────────
describe('DRIVER — Facturación Electrónica [electrónicos]', () => {

  test('calcula IVA 19% para laptop nacional de $2.000.000', () => {
    // El módulo de facturación llamaría esto al generar una factura
    const impuesto = calcularImpuesto(2_000_000, 'electronico', 'nacional');
    expect(impuesto).toBe(380_000);
  });

  test('calcula arancel 32% para celular importado de $1.500.000', () => {
    const impuesto = calcularImpuesto(1_500_000, 'electronico', 'importado');
    expect(impuesto).toBe(480_000);
  });

});

// ─── Driver B: simula el módulo de Supermercado Online ───────────────────────
describe('DRIVER — Supermercado Online [alimentos]', () => {

  test('calcula IVA 5% para arroz nacional de $8.000', () => {
    // El carrito de compras calcularía esto en el checkout
    const impuesto = calcularImpuesto(8_000, 'alimento', 'nacional');
    expect(impuesto).toBe(400);
  });

  test('calcula arancel 12% para vino importado de $120.000', () => {
    const impuesto = calcularImpuesto(120_000, 'alimento', 'importado');
    expect(impuesto).toBe(14_400);
  });

});

// ─── Driver C: simula el módulo de Tienda de Moda ────────────────────────────
describe('DRIVER — Tienda de Moda [ropa]', () => {

  test('calcula IVA 16% para camiseta nacional de $50.000', () => {
    const impuesto = calcularImpuesto(50_000, 'ropa', 'nacional');
    expect(impuesto).toBe(8_000);
  });

  test('calcula arancel 25% para zapatillas importadas de $300.000', () => {
    const impuesto = calcularImpuesto(300_000, 'ropa', 'importado');
    expect(impuesto).toBe(75_000);
  });

});

// ─── Driver D: simula el módulo de Validación de Entradas ────────────────────
describe('DRIVER — Módulo de validación de tipos de producto', () => {

  test('lanza error para tipo de producto desconocido', () => {
    // El validador de entrada usaría esto para detectar categorías inválidas
    expect(() => calcularImpuesto(100_000, 'vehiculo', 'nacional'))
      .toThrow('Configuración no soportada');
  });

  test('lanza error para región desconocida', () => {
    expect(() => calcularImpuesto(100_000, 'electronico', 'europa'))
      .toThrow('Configuración no soportada');
  });

});
