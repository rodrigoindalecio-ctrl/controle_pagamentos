import http from 'http';

http.get('http://127.0.0.1:3000/api/debug-data', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log("Response from server:");
            console.log("Count:", parsed.paymentsCount);
            console.log("Latest dates:", parsed.latestPayments.map(p => p.payment_date).join(', '));
        } catch (e) {
            console.log("Raw data from server: " + data);
        }
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
