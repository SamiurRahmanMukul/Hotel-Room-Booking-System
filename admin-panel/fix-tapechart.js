const fs = require('fs');
const file = 'src/components/tabs/TapeChart.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("ApiService.get('/api/v1/room/get-all-rooms')", "ApiService.get('/api/v1/all-rooms-list?limit=100')");
content = content.replace("ApiService.get('/api/v1/booking/get-all-booking-orders')", "ApiService.get('/api/v1/get-all-booking-orders?limit=1000')");

fs.writeFileSync(file, content);
console.log("TapeChart routes patched successfully!");
