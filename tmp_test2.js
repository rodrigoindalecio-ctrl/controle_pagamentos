import fetch from 'node-fetch'; // if available

async function run() {
    try {
        const res = await fetch('http://localhost:3000/api/dashboard/stats?year=2026&month=2');
        const data = await res.json();
        console.log("Stats Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
