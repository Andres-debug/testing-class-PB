import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 80 },
    { duration: '1m', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  const postRes = http.get(`${BASE_URL}/posts/1`);

  check(postRes, {
    'stress GET /posts/1 status 200': (r) => r.status === 200,
  });

  // Mantiene un ritmo realista por VU sin saturar el cliente local.
  sleep(0.5);
}
