import fs from 'node:fs';
import path from 'node:path';

const [, , inputPath, outputPath, tituloArg, entornoArg] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Uso: node generar-informe-k6.mjs <entrada-summary.json> <salida.md> [titulo] [entorno]');
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf-8');
const summary = JSON.parse(raw);

const metrics = summary.metrics || {};

const getValue = (metricName, valueKey, fallback = 'N/A') => {
  const metric = metrics[metricName];
  if (!metric) return fallback;

  // k6 summary-export puede traer el valor directo o dentro de metric.values
  if (Object.prototype.hasOwnProperty.call(metric, valueKey)) {
    const directValue = metric[valueKey];
    return directValue === undefined || directValue === null ? fallback : directValue;
  }

  if (metric.values && Object.prototype.hasOwnProperty.call(metric.values, valueKey)) {
    const nestedValue = metric.values[valueKey];
    return nestedValue === undefined || nestedValue === null ? fallback : nestedValue;
  }

  return fallback;
};

const fmtMs = (value) => {
  if (value === 'N/A') return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `${num.toFixed(2)} ms`;
};

const fmtPct = (value) => {
  if (value === 'N/A') return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
};

const fmtNum = (value) => {
  if (value === 'N/A') return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return num.toLocaleString('es-ES');
};

const checksRate = (() => {
  const rate = getValue('checks', 'rate');
  return rate === 'N/A' ? getValue('checks', 'value') : rate;
})();
const checksPasses = getValue('checks', 'passes');
const checksFails = getValue('checks', 'fails');
const httpFailedRate = (() => {
  const rate = getValue('http_req_failed', 'rate');
  return rate === 'N/A' ? getValue('http_req_failed', 'value') : rate;
})();
const p95 = getValue('http_req_duration', 'p(95)');
const p90 = getValue('http_req_duration', 'p(90)');
const avg = getValue('http_req_duration', 'avg');
const reqs = getValue('http_reqs', 'count');
const iterations = getValue('iterations', 'count');
const vusMax = getValue('vus_max', 'value');

const titulo = tituloArg || 'Informe de resultados k6';
const entorno = entornoArg || 'No especificado';
const fecha = new Date().toLocaleString('es-ES');

const recomendaciones = [];
if (httpFailedRate !== 'N/A' && Number(httpFailedRate) > 0.01) {
  recomendaciones.push('- Revisar errores HTTP y categorizar por tipo (4xx vs 5xx).');
}
if (p95 !== 'N/A' && Number(p95) > 1200) {
  recomendaciones.push('- El p95 esta alto; analizar endpoints mas lentos y dependencias externas.');
}
if (checksRate !== 'N/A' && Number(checksRate) < 0.98) {
  recomendaciones.push('- Hay checks funcionales fallando; revisar validez de respuestas y datos de prueba.');
}
if (recomendaciones.length === 0) {
  recomendaciones.push('- El resultado cumple criterios base; ejecutar una corrida de confirmacion y guardar baseline.');
}

const markdown = `# ${titulo}

## 1. Resumen Ejecutivo

- Fecha de ejecucion: ${fecha}
- Entorno: ${entorno}
- Requests totales: ${fmtNum(reqs)}
- Iteraciones: ${fmtNum(iterations)}
- VUs maximos observados: ${fmtNum(vusMax)}
- Error rate HTTP: ${fmtPct(httpFailedRate)}
- Checks exitosos: ${fmtPct(checksRate)}

## 2. KPIs Principales

- Latencia promedio (avg): ${fmtMs(avg)}
- Latencia p90: ${fmtMs(p90)}
- Latencia p95: ${fmtMs(p95)}
- Checks OK: ${fmtNum(checksPasses)}
- Checks FAIL: ${fmtNum(checksFails)}

## 3. Criterios de Aceptacion (ejemplo)

- Error rate HTTP < 1%
- Checks > 98%
- p95 < 1,200 ms

## 4. Hallazgos

- Registrar aqui los endpoints con mayor latencia y cualquier error repetitivo detectado.
- Comparar con baseline anterior para identificar regresiones.

## 5. Recomendaciones

${recomendaciones.join('\n')}

## 6. Evidencias

- Archivo fuente summary: ${path.resolve(inputPath)}
- Este informe: ${path.resolve(outputPath)}
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown, 'utf-8');

console.log(`Informe generado en: ${outputPath}`);
