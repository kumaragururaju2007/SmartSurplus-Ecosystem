const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\buyer\\BuyerMarketplace.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `      {activeTab === 'analytics' ? (
        <BuyerAnalytics />
      ) : activeTab === 'byproducts' ? (
        <ByproductExchange />
      ) : (
        <BuyerAnalytics />
      ) : (`,
  `      {activeTab === 'analytics' ? (
        <BuyerAnalytics />
      ) : activeTab === 'byproducts' ? (
        <ByproductExchange />
      ) : (`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed BuyerMarketplace.jsx ternary!');
