
import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/public/test-ok');
        const data = await res.json();
        console.log('API Test:', data);
    } catch (e) {
        console.error('API Test Failed:', e.message);
    }
}

test();
