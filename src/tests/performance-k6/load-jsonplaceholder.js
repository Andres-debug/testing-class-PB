import http from 'k6/http';
import { check, sleep } from 'k6';

// Escenario base de carga: concurrencia fija durante una ventana corta.
export const options = {
  vus: 20,
  duration: '1m',
  // Criterios de aceptacion para errores, latencia y checks funcionales.
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.99'],
  },
};

// Permite redirigir la prueba a otro endpoint usando BASE_URL.
const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  // Flujo representativo: consulta de un recurso y su lista relacionada.
  const postRes = http.get(`${BASE_URL}/posts/1`);
  const commentsRes = http.get(`${BASE_URL}/comments?postId=1`);

  // Valida disponibilidad y consistencia del recurso principal.
  check(postRes, {
    'GET /posts/1 status 200': (r) => r.status === 200,
    'GET /posts/1 tiene id=1': (r) => {
      const body = JSON.parse(r.body || '{}');
      return body.id === 1;
    },
  });

  // Verifica que la coleccion relacionada responda correctamente.
  check(commentsRes, {
    'GET /comments status 200': (r) => r.status === 200,
    'GET /comments devuelve arreglo': (r) => {
      const body = JSON.parse(r.body || '[]');
      return Array.isArray(body) && body.length > 0;
    },
  });

  // Pausa para modelar tiempo real de uso por usuario virtual.
  sleep(1);
}
