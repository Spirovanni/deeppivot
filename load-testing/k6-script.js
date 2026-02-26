import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
        { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
        { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
    ],
    thresholds: {
        // 95% of requests must complete below 200ms
        http_req_duration: ['p(95)<200'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    // Test the landing page
    const res1 = http.get(`${BASE_URL}/`);
    check(res1, {
        'landing page status is 200': (r) => r.status === 200,
    });

    // Small delay between page requests to simulate think time
    sleep(1);

    // Test the alt-ed API (paginated, unauthenticated)
    const res2 = http.get(`${BASE_URL}/api/alt-ed?page=1&limit=10`);
    check(res2, {
        'alt-ed api status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // Test the jobs API (paginated, unauthenticated)
    const res3 = http.get(`${BASE_URL}/api/jobs?page=1&limit=10`);
    check(res3, {
        'jobs api status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
