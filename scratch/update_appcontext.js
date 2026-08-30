const fs = require('fs');

const targetPath = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\context\\AppContext.jsx';
let content = fs.readFileSync(targetPath, 'utf8');

// Update imports
content = content.replace(
  `  INITIAL_BUYER_OFFERS,
  INITIAL_GRIEVANCES,
} from '../data/mockData';`,
  `  INITIAL_BUYER_OFFERS,
  INITIAL_GRIEVANCES,
  MOCK_TALUKA_POOLS,
  MOCK_BYPRODUCTS,
} from '../data/mockData';`
);

// Add states inside AppProvider
const statesToAdd = `
  const [talukaPools, setTalukaPools] = useState(MOCK_TALUKA_POOLS);
  const [byproductLots, setByproductLots] = useState(MOCK_BYPRODUCTS);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [activePoolId, setActivePoolId] = useState('POOL-NSK-NIPHAD-01');
  const [isByproductModalOpen, setIsByproductModalOpen] = useState(false);
`;

content = content.replace(
  'const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);',
  'const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);' + statesToAdd
);

// Add methods
const methodsToAdd = `
  // Digital Mandi Pooling Actions
  const joinPool = (poolId, farmerQuantity = 15) => {
    setTalukaPools((prev) =>
      prev.map((pool) => {
        if (pool.id === poolId) {
          const alreadyJoined = pool.participatingFarmers.some((f) => f.isCurrentUser);
          if (alreadyJoined) return pool;
          const updatedFarmers = [
            { id: 'F-ME', name: 'Raghunath', village: 'Niphad', quantity: farmerQuantity, avatar: '👨‍🌾', isCurrentUser: true },
            ...pool.participatingFarmers,
          ];
          return {
            ...pool,
            combinedQuantity: pool.combinedQuantity + farmerQuantity,
            participatingFarmers: updatedFarmers,
          };
        }
        return pool;
      })
    );
    addToast(\`Joined Taluka Mandi Pool (\${farmerQuantity} Qtl)! Live Reverse Auction active.\`, 'success');
    triggerConfetti();
  };

  const acceptPoolBid = (poolId) => {
    const targetPool = talukaPools.find((p) => p.id === poolId);
    if (!targetPool) return;

    setTalukaPools((prev) =>
      prev.map((p) => (p.id === poolId ? { ...p, status: 'LOCKED_IN_ESCROW' } : p))
    );

    addToast(\`🎉 Best Pool Bid ₹\${targetPool.currentWinningBid}/qtl accepted! ₹\${targetPool.totalEscrowLocked.toLocaleString()} locked in State Escrow for all \${targetPool.participatingFarmers.length} farmers.\`, 'success');
    triggerConfetti();

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: \`Pooled Lot Escrow Locked (\${targetPool.taluka} Taluka)\`,
        time: 'Just now',
        desc: \`Deal locked with \${targetPool.bids.find(b => b.isWinning)?.buyerName || 'Winning Buyer'} at ₹\${targetPool.currentWinningBid}/qtl (+₹\${targetPool.bulkPremiumPerQtl}/qtl bulk premium).\`,
        type: 'escrow',
        unread: true,
      },
      ...prev,
    ]);
  };

  // Crop Residue / Byproduct Listing Actions
  const addByproductLot = (newLot) => {
    const byproductId = \`BYP-\${newLot.district.substring(0, 3).toUpperCase()}-\${Math.floor(100 + Math.random() * 900)}\`;
    const fullByproduct = {
      ...newLot,
      id: byproductId,
      farmer: {
        name: 'Raghunath Kisan Patil',
        village: 'Niphad',
        district: newLot.district || 'Nashik',
        trustTier: 'GOVT_VERIFIED',
        trustScore: 98,
      },
      co2SavedTonnes: Math.round(Number(newLot.quantity) * 1.5 * 10) / 10,
      burnPreventionBadge: '100% Stubble-Burn Averted',
      image: newLot.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
      availableImmediate: true,
    };

    setByproductLots((prev) => [fullByproduct, ...prev]);
    addToast(\`Residue lot #\${byproductId} listed on Byproduct Exchange! Prevents ~\${fullByproduct.co2SavedTonnes}T CO2.\`, 'success');
    triggerConfetti();

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: \`Byproduct Lot #\${byproductId} Listed\`,
        time: 'Just now',
        desc: \`\${fullByproduct.name} (\${fullByproduct.quantity} \${fullByproduct.unit}) active for Cattle Feed & Biomass buyers.\`,
        type: 'lot',
        unread: true,
      },
      ...prev,
    ]);

    setIsByproductModalOpen(false);
  };

  const buyByproductLot = (byproduct, offerRate) => {
    const totalVal = (offerRate || byproduct.pricePerUnit) * byproduct.quantity;
    addToast(\`Escrow locked for \${byproduct.quantity} \${byproduct.unit} of \${byproduct.name} (₹\${totalVal.toLocaleString()})!\`, 'success');
    triggerConfetti();

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: \`Byproduct Purchase Secured: #\${byproduct.id}\`,
        time: 'Just now',
        desc: \`100% Escrow deposit locked for \${byproduct.name}. Direct dispatch from \${byproduct.location}.\`,
        type: 'escrow',
        unread: true,
      },
      ...prev,
    ]);
  };
`;

content = content.replace(
  'const selectedCrop = CROPS_DATA.find((c) => c.id === selectedCropId) || CROPS_DATA[0];',
  methodsToAdd + '\n  const selectedCrop = CROPS_DATA.find((c) => c.id === selectedCropId) || CROPS_DATA[0];'
);

// Add to Provider value
const valuesToAdd = `
        talukaPools,
        setTalukaPools,
        activePoolId,
        setActivePoolId,
        isPoolModalOpen,
        setIsPoolModalOpen,
        joinPool,
        acceptPoolBid,
        byproductLots,
        setByproductLots,
        isByproductModalOpen,
        setIsByproductModalOpen,
        addByproductLot,
        buyByproductLot,
`;

content = content.replace(
  'bookWarehouse,',
  'bookWarehouse,' + valuesToAdd
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('AppContext.jsx successfully updated!');
