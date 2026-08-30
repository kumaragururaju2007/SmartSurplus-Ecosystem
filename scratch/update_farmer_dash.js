const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\farmer\\FarmerDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace(
  "import { GrievanceTracker } from './GrievanceTracker';",
  "import { GrievanceTracker } from './GrievanceTracker';\nimport { DigitalMandiPooling } from './DigitalMandiPooling';"
);

// Add tab button in sub-navigation
const newTabButton = `        <button
          onClick={() => setActiveFarmerTab('pooling')}
          className={"flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer " + (
            activeFarmerTab === 'pooling'
              ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          )}
        >
          🤝 Taluka Mandi Pooling
        </button>`;

content = content.replace(
  '        <button\n          onClick={() => setActiveFarmerTab(\'listings\')}',
  newTabButton + '\n        <button\n          onClick={() => setActiveFarmerTab(\'listings\')}'
);

// Add prompt banner inside overview tab and add the tab render
const promptBanner = `          {/* Smart Taluka Mandi Pooling Prompt Card */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-emerald-900/10 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                🤝
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-900 text-amber-300">
                    Smart Taluka Aggregation
                  </span>
                  <span className="text-xs font-bold text-emerald-900">Niphad, Nashik</span>
                </div>
                <h4 className="text-sm font-extrabold text-stone-900">
                  4 nearby farmers in your taluka are also listing onion this week — pool your lot for better bulk pricing?
                </h4>
                <p className="text-xs text-stone-600">
                  Combined 185 Quintal pool unlocks institutional buyer reverse auction (+₹265/qtl bulk premium).
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveFarmerTab('pooling')}
              className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Join Taluka Pool</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
`;

content = content.replace(
  '{/* AI Sell Now vs Store Card */}',
  promptBanner + '\n          {/* AI Sell Now vs Store Card */}'
);

// Render pooling tab content
content = content.replace(
  "{activeFarmerTab === 'listings' && <MyListings />}",
  "{activeFarmerTab === 'pooling' && <DigitalMandiPooling />}\n\n      {activeFarmerTab === 'listings' && <MyListings />}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('FarmerDashboard.jsx updated successfully!');
