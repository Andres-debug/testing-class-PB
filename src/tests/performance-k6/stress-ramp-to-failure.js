import http from 'k6/http';
import { check, sleep } from 'k6';

// Escenario de estres avanzado: rampa de llegada para encontrar punto de quiebre.
export const options = {
  scenarios: {
    rampa_estres: {
      // Controla requests por segundo en lugar de VUs fijos.
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 250,
      // Aumenta carga gradualmente y luego desescala para cierre limpio.
      stages: [
        { duration: '1m', target: 30 },
        { duration: '2m', target: 80 },
        { duration: '2m', target: 140 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  // Umbrales de referencia para identificar degradacion aceptable/no aceptable.
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<2500'],
    checks: ['rate>0.90'],
  },
};

// Base URL configurable por entorno para evitar cambios de codigo.
const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  // Rota ids para no golpear siempre el mismo recurso.
  const id = ((__ITER % 100) + 1);

  const res = http.get(`${BASE_URL}/comments/${id}`, {
    timeout: '6s',
    tags: { tipo: 'estres' },
  });

  // Verificacion funcional minima del endpoint durante la rampa.
  check(res, {
    'estres status 200': (r) => r.status === 200,
  });

  // Pausa breve para evitar que el cliente local sesgue la medicion.
  sleep(0.1);
}
