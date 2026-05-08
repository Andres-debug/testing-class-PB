import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Configuracion general de la prueba: mezcla trafico de lectura y escritura.
export const options = {
  scenarios: {
    // Simula trafico de catalogo con una tasa constante de llegadas.
    catalogo: {
      executor: 'constant-arrival-rate',
      exec: 'escenarioCatalogo',
      rate: 20,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 80,
    },
    // Simula consultas de detalle por id con una tasa menor que catalogo.
    detalle: {
      executor: 'constant-arrival-rate',
      exec: 'escenarioDetalle',
      rate: 12,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 12,
      maxVUs: 40,
    },
    // Simula operaciones de escritura con usuarios virtuales fijos.
    escritura: {
      executor: 'constant-vus',
      exec: 'escenarioEscritura',
      vus: 5,
      duration: '2m',
    },
  },
  // Umbrales globales y por tipo para validar salud y latencia.
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200'],
    'http_req_duration{tipo:catalogo}': ['p(95)<900'],
    'http_req_duration{tipo:detalle}': ['p(95)<900'],
    'http_req_duration{tipo:escritura}': ['p(95)<1500'],
    checks: ['rate>0.98'],
  },
};

// Permite cambiar API por variable de entorno sin editar el script.
const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

// Escenario de catalogo: obtiene listado de posts y valida respuesta basica.
export function escenarioCatalogo() {
  group('catalogo', () => {
    const res = http.get(`${BASE_URL}/posts`, {
      tags: { tipo: 'catalogo' },
      timeout: '5s',
    });

    check(res, {
      'catalogo status 200': (r) => r.status === 200,
      'catalogo respuesta no vacia': (r) => {
        const body = JSON.parse(r.body || '[]');
        return Array.isArray(body) && body.length > 0;
      },
    });
  });

  // Simula tiempo de usuario entre acciones.
  sleep(0.2);
}

// Escenario de detalle: consulta un id rotativo para distribuir carga.
export function escenarioDetalle() {
  const id = ((__ITER % 10) + 1);

  group('detalle', () => {
    const res = http.get(`${BASE_URL}/posts/${id}`, {
      tags: { tipo: 'detalle' },
      timeout: '5s',
    });

    check(res, {
      'detalle status 200': (r) => r.status === 200,
      'detalle id valido': (r) => {
        const body = JSON.parse(r.body || '{}');
        return body.id === id;
      },
    });
  });

  // Pausa corta para representar navegacion normal.
  sleep(0.3);
}

// Escenario de escritura: crea registros para medir endpoint de POST.
export function escenarioEscritura() {
  group('escritura', () => {
    // Payload dinamico para evitar datos identicos en cada iteracion.
    const payload = JSON.stringify({
      title: `titulo-${__VU}-${__ITER}`,
      body: 'contenido de prueba de carga',
      userId: 1,
    });

    const res = http.post(`${BASE_URL}/posts`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { tipo: 'escritura' },
      timeout: '5s',
    });

    check(res, {
      'escritura status 201 o 200': (r) => r.status === 201 || r.status === 200,
    });
  });

  // Pausa mayor para no saturar artificialmente el flujo de escritura.
  sleep(0.5);
}
