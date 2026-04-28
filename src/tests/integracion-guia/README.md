# Guia de Integracion con Stubs y Drivers

Esta carpeta contiene ejemplos orientados a practicas futuras donde se quiere:

- Integrar varios modulos reales del negocio en un mismo test.
- Simular el caller real con un DRIVER (el propio test).
- Aislar servicios externos con STUBS para tener pruebas rapidas y estables.

## Archivos incluidos

- `checkoutConPago.integracion.test.js`
  - Integra `calcularTotalCompra` + `procesarPedido` mediante `checkoutConPago`.
  - Usa un STUB de pasarela de pago.

- `onboardingConPrimeraCompra.integracion.test.js`
  - Integra `registrarUsuario` + `calcularTotalCompra` + `procesarPedido`.
  - Usa STUBS de base de datos, email y pasarela.

## Como reutilizar esta guia

1. Copia uno de los tests como plantilla.
2. Renombra el `describe` con tu caso real.
3. Conserva estructura AAA (Arrange, Act, Assert).
4. Mantiene modulos reales en el flujo y stubbea solo bordes externos.
5. Verifica tambien interacciones (`toHaveBeenCalledWith`) ademas de resultado final.

## Guia complementaria: rendimiento con k6

Para documentacion de instalacion y ejemplos ejecutables de pruebas de carga y estres con APIs publicas, revisa:

- `src/tests/performance-k6/README.md`
- `src/tests/performance-k6/load-jsonplaceholder.js`
- `src/tests/performance-k6/stress-jsonplaceholder.js`