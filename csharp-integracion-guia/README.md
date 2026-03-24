# Guia C# de Integracion con Stubs y Drivers

Esta carpeta contiene ejemplos en C# que replican la misma idea del proyecto JS:

- DRIVER: el test simula al caller real del modulo.
- STUB: se reemplazan dependencias externas (DB, email, pasarela) con dobles controlados.

## Estructura

```text
csharp-integracion-guia/
├── src/
│   └── Tienda.Core/
│       ├── Tienda.Core.csproj
│       ├── Contratos.cs
│       ├── Modelos.cs
│       └── Servicios/
│           ├── CheckoutConPagoService.cs
│           └── OnboardingConPrimeraCompraService.cs
└── tests/
    └── Tienda.Core.Tests/
        ├── Tienda.Core.Tests.csproj
        ├── CheckoutConPagoService.IntegracionGuia.Tests.cs
        └── OnboardingConPrimeraCompraService.IntegracionGuia.Tests.cs
```

## Requisitos para ejecutar

1. Instalar .NET SDK 8 o superior.
2. Abrir terminal en esta carpeta.
3. Ejecutar:

```bash
dotnet test
```

## Que aprender con estos ejemplos

1. Integrar modulos reales del dominio en pruebas de integracion.
2. Aislar bordes externos con STUBS para que la prueba sea estable.
3. Verificar resultado final y tambien las llamadas a dependencias.

## Nota importante

En este workspace no existe el runtime de .NET, por eso los archivos se entregan listos para usar pero no fueron ejecutados localmente aqui.