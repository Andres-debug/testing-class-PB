import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  const postRes = http.get(`${BASE_URL}/posts/1`);
  const commentsRes = http.get(`${BASE_URL}/comments?postId=1`);

  check(postRes, {
    'GET /posts/1 status 200': (r) => r.status === 200,
    'GET /posts/1 tiene id=1': (r) => {
      const body = JSON.parse(r.body || '{}');
      return body.id === 1;
    },
  });

  check(commentsRes, {
    'GET /comments status 200': (r) => r.status === 200,
    'GET /comments devuelve arreglo': (r) => {
      const body = JSON.parse(r.body || '[]');
      return Array.isArray(body) && body.length > 0;
    },
  });

  sleep(1);
}
