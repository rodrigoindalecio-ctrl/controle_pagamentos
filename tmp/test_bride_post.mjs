import fetch from 'node-fetch';

async function test() {
  const payload = {
    name: "Test Bride",
    email: "test@example.com",
    event_date: "2026-10-10",
    service_type: "Assessoria Completa",
    contract_value: 1000,
    original_value: 1200,
    created_at: new Date().toISOString()
  };

  try {
    const res = await fetch('http://127.0.0.1:3000/api/brides', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We need a token. Let's see if we can bypass or if there's a test token.
        // Actually, requireAuth is on.
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
