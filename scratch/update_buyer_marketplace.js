const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\buyer\\BuyerMarketplace.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace(
  "import { BuyerAnalytics } from './BuyerAnalytics';",
  "import { BuyerAnalytics } from './BuyerAnalytics';\nimport { ByproductExchange } from './ByproductExchange';"
);

// Update view switcher buttons
const switcherButtons = `        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-teal-900/60 p-1.5 rounded-2xl border border-teal-700 shrink-0">
          <button
            onClick={() => setActiveTab('browse')}
            className={"px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer " + (
              activeTab === 'browse'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-teal-200 hover:text-white'
            )}
          >
            📦 Produce Lots ({filteredLots.length})
          </button>
          <button
            onClick={() => setActiveTab('byproducts')}
            className={"px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer " + (
              activeTab === 'byproducts'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-teal-200 hover:text-white'
            )}
          >
            🌾 Byproduct Exchange
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={"px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer " + (
              activeTab === 'analytics'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-teal-200 hover:text-white'
            )}
          >
            📊 Sourcing Desk
          </button>
        </div>`;

content = content.replace(
  /\{\/\* View Switcher \*\/\}[\s\S]*?<\/div>\s*<\/div>/,
  switcherButtons + '\n      </div>'
);

// Update tab render
content = content.replace(
  "{activeTab === 'analytics' ? (",
  "{activeTab === 'analytics' ? (\n        <BuyerAnalytics />\n      ) : activeTab === 'byproducts' ? (\n        <ByproductExchange />\n      ) : ("
);

// Update lot card to show Insured badge if lot.isInsured
content = content.replace(
  '<GradeBadge grade={lot.aiGrading.grade} confidence={lot.aiGrading.confidence} size="sm" />',
  `<div className="flex items-center gap-1.5">
                          <GradeBadge grade={lot.aiGrading.grade} confidence={lot.aiGrading.confidence} size="sm" />
                          {lot.isInsured && (
                            <span className="text-[10px] font-bold bg-emerald-900/90 text-amber-300 px-2 py-0.5 rounded-full border border-emerald-600/80 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                              🛡️ Insured
                            </span>
                          )}
                        </div>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('BuyerMarketplace.jsx updated successfully!');
