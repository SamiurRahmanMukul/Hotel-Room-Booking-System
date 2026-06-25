const fs = require('fs');
const file = 'src/pages/Main.jsx';
let content = fs.readFileSync(file, 'utf8');

// Insert Tape Chart right below Booking Orders
const targetBlock = "            {\n              key: '4',\n              icon: <FileProtectOutlined />,\n              label: 'Booking Orders'\n            },";
const injection = `            {
              key: '4',
              icon: <FileProtectOutlined />,
              label: 'Booking Orders'
            },
            {
              key: '9',
              icon: <CalendarOutlined />,
              label: 'Tape Chart'
            },`;

content = content.replace(targetBlock, injection);
fs.writeFileSync(file, content);
console.log("File patched successfully!");
