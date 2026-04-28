import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    rampa_estres: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 250,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '2m', target: 80 },
        { duration: '2m', target: 140 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<2500'],
    checks: ['rate>0.90'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  const id = ((__ITER % 100) + 1);

  const res = http.get(`${BASE_URL}/comments/${id}`, {
    timeout: '6s',
    tags: { tipo: 'estres' },
  });

  check(res, {
    'estres status 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
