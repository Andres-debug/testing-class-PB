# Guia k6: instalacion y uso (carga + estres)

Esta carpeta contiene ejemplos listos para ejecutar con k6 usando una API publica de internet:

- API por defecto: https://jsonplaceholder.typicode.com
- Script de carga: load-jsonplaceholder.js
- Script de estres: stress-jsonplaceholder.js
- Script de carga realista (workload mixto): load-mixed-workload.js
- Script de estres realista (rampa a falla): stress-ramp-to-failure.js
- Generador de informe en Markdown: generar-informe-k6.mjs
- Plantilla ejecutiva (1 pagina, semaforo SLA/SLO): plantilla-informe-ejecutivo-sla-slo.md

## 1) Instalacion de k6 en Windows

Instalar CLI de k6:

```powershell
winget install --id GrafanaLabs.k6
```

Instalar k6 Studio (opcional, interfaz grafica):

```powershell
winget install --id GrafanaLabs.k6Studio
```

Validar instalacion:

```powershell
k6 version
```

Si PowerShell muestra "k6 no se reconoce", abre una terminal nueva y prueba otra vez.
Si persiste, usa la ruta completa del ejecutable:

```powershell
& "C:\Program Files\k6\k6.exe" version
```

En ese caso, tambien puedes ejecutar los scripts con ruta completa:

```powershell
& "C:\Program Files\k6\k6.exe" run src/tests/performance-k6/load-jsonplaceholder.js
```

## 2) Diferencia entre prueba de carga y de estres

Prueba de carga:
- Simula trafico esperado en condiciones normales.
- Verifica estabilidad, latencia y errores bajos.

Prueba de estres:
- Aumenta la concurrencia por encima del uso normal.
- Busca punto de quiebre y degradacion del servicio.

## 3) Ejecutar prueba de carga

Desde la raiz del repo:

```powershell
k6 run src/tests/performance-k6/load-jsonplaceholder.js
```

## 4) Ejecutar prueba de estres

Desde la raiz del repo:

```powershell
k6 run src/tests/performance-k6/stress-jsonplaceholder.js
```

## 5) Ejemplos mas cercanos a un ambiente real

### 5.1 Carga con workload mixto (lectura + detalle + escritura)

Este escenario simula 3 tipos de trafico al mismo tiempo:

- catalogo (listados),
- detalle de recurso,
- escritura de registros.

Comando:

```powershell
k6 run src/tests/performance-k6/load-mixed-workload.js
```

### 5.2 Estres con rampa progresiva hasta degradacion

Este escenario incrementa la llegada de requests por etapas para detectar:

- punto de quiebre,
- aumento de latencia,
- crecimiento de errores.

Comando:

```powershell
k6 run src/tests/performance-k6/stress-ramp-to-failure.js
```

## 6) Ejecutar contra otra API (opcional)

Los scripts permiten cambiar la base URL con variable de entorno BASE_URL:

```powershell
k6 run -e BASE_URL=https://test-api.k6.io src/tests/performance-k6/load-jsonplaceholder.js
```

```powershell
k6 run -e BASE_URL=https://test-api.k6.io src/tests/performance-k6/stress-jsonplaceholder.js
```

Tambien aplica para los escenarios realistas:

```powershell
k6 run -e BASE_URL=https://test-api.k6.io src/tests/performance-k6/load-mixed-workload.js
```

```powershell
k6 run -e BASE_URL=https://test-api.k6.io src/tests/performance-k6/stress-ramp-to-failure.js
```

## 7) Metricas clave para interpretar resultados

- http_req_duration (p95): latencia de la mayoria de requests.
- http_req_failed: porcentaje de fallos HTTP.
- checks: porcentaje de validaciones funcionales exitosas.

Objetivo inicial sugerido:
- Carga: p95 < 800 ms y errores < 1%.
- Estres: detectar el punto donde aumenta latencia y error rate.

## 8) Como generar informes reales para presentar

### 8.1 Exportar resumen JSON de k6

Ejemplo para carga realista:

```powershell
k6 run src/tests/performance-k6/load-mixed-workload.js --summary-export src/tests/performance-k6/results/load-mixed-summary.json
```

Ejemplo para estres realista:

```powershell
k6 run src/tests/performance-k6/stress-ramp-to-failure.js --summary-export src/tests/performance-k6/results/stress-ramp-summary.json
```

### 8.2 Generar informe Markdown automatico

Con el resumen JSON, generar informe listo para compartir:

```powershell
node src/tests/performance-k6/generar-informe-k6.mjs src/tests/performance-k6/results/load-mixed-summary.json src/tests/performance-k6/results/informe-load-mixed.md "Informe Carga Mixta" "Local Windows"
```

```powershell
node src/tests/performance-k6/generar-informe-k6.mjs src/tests/performance-k6/results/stress-ramp-summary.json src/tests/performance-k6/results/informe-stress-ramp.md "Informe Estres Rampa" "Local Windows"
```

### 8.3 Estructura minima del informe que se presenta

1. Resumen ejecutivo (resultado general y decision: cumple/no cumple).
2. Configuracion de prueba (escenario, duracion, VUs, endpoint, entorno).
3. KPIs (p95, error rate, checks, throughput).
4. Hallazgos tecnicos (cuellos de botella y patrones observados).
5. Riesgos y plan de accion (priorizado por impacto).
6. Evidencias (archivos JSON y scripts usados).

## 9) Recomendaciones de uso

1. Ejecuta primero la prueba de carga para baseline.
2. Luego corre estres para conocer limite operativo.
3. Repite pruebas tras cambios relevantes para comparar regresiones.
4. Guarda resultados por fecha para seguimiento historico.
