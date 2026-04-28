# Informe Ejecutivo de Rendimiento (1 pagina)

## 1) Resumen Ejecutivo

- Proyecto/Servicio: [Nombre del sistema]
- Fecha de prueba: [AAAA-MM-DD]
- Entorno: [Local | QA | Staging | Produccion controlada]
- Version evaluada: [tag/commit/build]
- Tipo de prueba: [Carga | Estres]
- Decision ejecutiva: [APROBADO | APROBADO CON RIESGO | NO APROBADO]
- Mensaje clave (1-2 lineas):
  [Ejemplo: El sistema cumple SLO de latencia en carga normal, pero presenta degradacion en estres por encima de 140 req/s.]

## 2) Semaforo SLA/SLO

| Indicador | SLA/SLO objetivo | Resultado | Estado |
|---|---:|---:|---|
| Disponibilidad de requests (2xx/3xx) | >= 99.0% | [xx.xx%] | [VERDE/AMARILLO/ROJO] |
| Error rate HTTP | <= 1.0% | [xx.xx%] | [VERDE/AMARILLO/ROJO] |
| Latencia p95 (ms) | <= 1200 ms | [xxxx ms] | [VERDE/AMARILLO/ROJO] |
| Latencia p99 (ms) | <= 2000 ms | [xxxx ms] | [VERDE/AMARILLO/ROJO] |
| Throughput sostenido | >= [objetivo req/s] | [xx.x req/s] | [VERDE/AMARILLO/ROJO] |
| Checks funcionales | >= 98.0% | [xx.xx%] | [VERDE/AMARILLO/ROJO] |

Regla sugerida de semaforo:
- VERDE: cumple objetivo.
- AMARILLO: desviacion menor (hasta 10% fuera del objetivo).
- ROJO: desviacion mayor (mas de 10% fuera del objetivo) o riesgo alto de negocio.

## 3) Escenario Ejecutado (en 4 bullets)

- Script k6: [ruta del script]
- Duracion total: [xx min]
- Concurrencia/carga: [VUs o arrival rate por etapa]
- Endpoint(s) criticos evaluados: [lista corta]

## 4) Hallazgos Clave (maximo 3)

1. [Hallazgo #1 con impacto de negocio]
2. [Hallazgo #2 con impacto de negocio]
3. [Hallazgo #3 con impacto de negocio]

## 5) Riesgos y Recomendacion a Jefatura

- Riesgo actual: [Bajo | Medio | Alto]
- Recomendacion:
  [Ejemplo: Aprobar salida a QA ampliado con plan de mitigacion en caching y ajuste de timeouts antes de pasar a produccion.]

## 6) Plan de Accion (7-14 dias)

| Accion | Responsable | Fecha compromiso | Impacto esperado |
|---|---|---|---|
| [Accion 1] | [Equipo/Persona] | [AAAA-MM-DD] | [Bajar p95 en X%] |
| [Accion 2] | [Equipo/Persona] | [AAAA-MM-DD] | [Reducir errores a <1%] |
| [Accion 3] | [Equipo/Persona] | [AAAA-MM-DD] | [Aumentar throughput] |

## 7) Evidencia Minima Adjunta

- Summary export k6 (JSON): [ruta archivo]
- Informe tecnico detallado: [ruta archivo]
- Dashboard/captura de metricas: [link o ruta]

---

## Anexo rapido: criterio sugerido de decision

- APROBADO: todos los KPIs criticos en VERDE.
- APROBADO CON RIESGO: maximo 1 KPI critico en AMARILLO y plan de mitigacion activo.
- NO APROBADO: cualquier KPI critico en ROJO o falla funcional repetible.
