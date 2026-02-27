
import axios from 'axios';

async function testAPI() {
    try {
        const resAll = await axios.get('http://localhost:3000/api/dashboard/stats?year=2026&month=all');
        console.log("Year 2026, Month All:");
        console.log("Cancellations:", resAll.data.cancellations);

        const resFeb = await axios.get('http://localhost:3000/api/dashboard/stats?year=2026&month=2');
        console.log("\nYear 2026, Month Feb (2):");
        console.log("Cancellations:", resFeb.data.cancellations);
    } catch (e) {
        console.error("API test failed (is server running?):", e.message);
    }
}

testAPI();
