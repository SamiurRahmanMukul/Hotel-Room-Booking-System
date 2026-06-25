const fs = require('fs');
const file = 'admin-panel/src/pages/Main.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Import
content = content.replace(
  "import Orders from '../components/tabs/Orders';",
  "import Orders from '../components/tabs/Orders';\nimport TapeChart from '../components/tabs/TapeChart';"
);

// 2. Add CalendarOutlined
content = content.replace(
  "DashboardOutlined",
  "CalendarOutlined, DashboardOutlined"
);

// 3. Add to Menu
content = content.replace(
  "{ key: '4', icon: <FileProtectOutlined />, label: 'Bookings' },",
  "{ key: '4', icon: <FileProtectOutlined />, label: 'Bookings' },\n                { key: '9', icon: <CalendarOutlined />, label: 'Tape Chart' },"
);

// 4. Update handleTabChange (key '9' -> navigate('/main/tape-chart'))
content = content.replace(
  "case '4': {",
  "case '9': {\n        navigate('/main/tape-chart');\n        break;\n      }\n      case '4': {"
);

// 5. Update useEffect tab mapper (tape-chart -> key 9)
content = content.replace(
  "case 'booking-orders': {\n          setSelectedKeys('4');",
  "case 'tape-chart': {\n          setSelectedKeys('9');\n          break;\n        }\n        case 'booking-orders': {\n          setSelectedKeys('4');"
);

// 6. Update useEffect title mapping (key 9 -> Tape Chart title)
content = content.replace(
  "case '4': {\n        window.document.title = 'Beach Resort — Booking Orders';",
  "case '9': {\n        window.document.title = 'Beach Resort — Tape Chart';\n        break;\n      }\n      case '4': {\n        window.document.title = 'Beach Resort — Booking Orders';"
);

// 7. Update rendering logic
content = content.replace(
  "{selectedKeys === '4' && (<Orders />)}",
  "{selectedKeys === '4' && (<Orders />)}\n          {selectedKeys === '9' && (<TapeChart />)}"
);

fs.writeFileSync(file, content);
console.log("File patched successfully!");
