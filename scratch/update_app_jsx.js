const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace(
  "import { ComparisonTable } from './components/landing/ComparisonTable';",
  "import { WhatsAppAccessibility } from './components/landing/WhatsAppAccessibility';\nimport { ComparisonTable } from './components/landing/ComparisonTable';"
);

// Add component render
content = content.replace(
  '<TrustAndEscrowFlow />\n            <ComparisonTable />',
  '<TrustAndEscrowFlow />\n            <WhatsAppAccessibility />\n            <ComparisonTable />'
);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx updated successfully!');
