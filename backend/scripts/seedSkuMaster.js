
// backend/scripts/seedSkuMaster.js
// Run with: node scripts/seedSkuMaster.js
require('dotenv').config();
const mongoose = require('mongoose');
const SkuMaster = require('../models/SkuMaster');
 
// skuErpCode = numeric code used on PO & GRN
// eanCode    = FG-xxxx code used on the Invoice (alternate lookup key)
// agreedRate = taken from Invoice unitRate (so price matches by default in this sample)
// mrp        = taken from GRN mrp
const items = [
  { skuErpCode: '11423',  eanCode: 'FG-P-F-0503', name: 'Cheesy Spicy Veg Momos 24pc',            agreedRate: 220.76, mrp: 305 },
  { skuErpCode: '11797',  eanCode: 'FG-M-F-1703', name: 'Meatigo Hot Wings 250g',                 agreedRate: 126.67, mrp: 175 },
  { skuErpCode: '18003',  eanCode: 'FG-M-F-0620', name: 'Meatigo Chicken Curry Cut Skinless 450g',agreedRate: 141.14, mrp: 195 },
  { skuErpCode: '18004',  eanCode: 'FG-M-F-0619', name: 'Meatigo Chicken Boneless Breast 450g',   agreedRate: 199.05, mrp: 275 },
  { skuErpCode: '253430', eanCode: 'FG-P-F-0249', name: 'Pork Salami 200g',                       agreedRate: 188.19, mrp: 260 },
  { skuErpCode: '33387',  eanCode: 'FG-P-F-0234', name: 'Frozen Chicken Chilli Salami 200g',      agreedRate: 126.67, mrp: 175 },
  { skuErpCode: '33390',  eanCode: 'FG-P-F-0413', name: 'Chicken Seekh Kebab 500g',                agreedRate: 228.00, mrp: 315 },
  { skuErpCode: '398656', eanCode: 'FG-M-F-0602', name: 'Meatigo Chicken Drumsticks 450g',        agreedRate: 188.19, mrp: 260 },
  { skuErpCode: '414867', eanCode: 'FG-P-F-1707', name: 'Chinese Veg Spring Rolls 240g',           agreedRate: 119.43, mrp: 165 },
  { skuErpCode: '432518', eanCode: 'FG-M-F-0622', name: 'Meatigo Chicken Kheema 450g',             agreedRate: 199.05, mrp: 275 },
  { skuErpCode: '4459',   eanCode: 'FG-P-F-0505', name: 'Original Chicken Momos 24pc',             agreedRate: 220.76, mrp: 305 },
  { skuErpCode: '4460',   eanCode: 'FG-P-F-0512', name: 'Spicy Chicken Momos 24pc',                agreedRate: 220.76, mrp: 305 },
  { skuErpCode: '4461',   eanCode: 'FG-P-F-0514', name: 'Veg & Paneer Momos 24pc',                 agreedRate: 202.67, mrp: 280 },
  { skuErpCode: '453259', eanCode: 'FG-P-F-0335', name: 'Chicken Cheese & Onion Sausage 250g',     agreedRate: 144.76, mrp: 200 },
  { skuErpCode: '4694',   eanCode: 'FG-P-F-0504', name: 'Original Chicken Momos 10pc',             agreedRate: 133.90, mrp: 185 },
  { skuErpCode: '4697',   eanCode: 'FG-P-F-0513', name: 'Veg & Paneer Momos 10pc',                 agreedRate: 112.19, mrp: 155 },
  { skuErpCode: '469735', eanCode: 'FG-M-F-1728', name: 'Meatigo Everyday Chicken Breast 150g',   agreedRate: 119.43, mrp: 165 },
  { skuErpCode: '4699',   eanCode: 'FG-P-F-0323', name: 'Pork Sausage 250g',                       agreedRate: 170.10, mrp: 235 },
  { skuErpCode: '4700',   eanCode: 'FG-P-F-0236', name: 'Pork Ham 200g',                           agreedRate: 177.33, mrp: 245 },
  { skuErpCode: '470663', eanCode: 'FG-P-F-0580', name: 'Whole Wheat Momos - Veg & Paneer 330g',   agreedRate: 162.86, mrp: 225 },
  { skuErpCode: '49168',  eanCode: 'FG-P-F-0527', name: 'Peri Peri Veg Momos 15pc',                agreedRate: 88.67,  mrp: 245 },
  { skuErpCode: '498695', eanCode: 'FG-P-F-0247', name: 'Chicken Salami 200g',                     agreedRate: 137.52, mrp: 190 },
  { skuErpCode: '598770', eanCode: 'FG-P-F-0102', name: 'Pork Breakfast Bacon 150g',               agreedRate: 152.00, mrp: 210 },
  { skuErpCode: '6664',   eanCode: 'FG-P-F-0321', name: 'Chicken Sausages 250g',                   agreedRate: 130.29, mrp: 180 },
  { skuErpCode: '730016', eanCode: 'FG-P-F-0581', name: 'Whole Wheat Chicken Momos 330g',          agreedRate: 170.10, mrp: 235 },
  { skuErpCode: '750414', eanCode: 'FG-P-F-0501', name: 'Super Saver Chicken Momo Pack 1kg',       agreedRate: 247.62, mrp: 650 },
  { skuErpCode: '755774', eanCode: 'FG-P-F-0564', name: 'Chicken & Cheese Momos 540g',             agreedRate: 238.86, mrp: 330 },
  { skuErpCode: '790919', eanCode: 'FG-M-F-1729', name: 'Meatigo Everyday Fish Fillet 200g',       agreedRate: 188.19, mrp: 260 },
  { skuErpCode: '81521',  eanCode: 'FG-P-F-0542', name: 'Peri Peri Chicken Momos 250g',            agreedRate: 72.02,  mrp: 199 },
  { skuErpCode: '205950', eanCode: 'FG-P-F-0237', name: 'Frozen Pork Pepperoni Salami 100g',       agreedRate: 133.90, mrp: 185 },
  { skuErpCode: '507809', eanCode: 'FG-P-F-1911', name: 'Pizza Minis - Chicken Tikka 180g',        agreedRate: 115.09, mrp: 159 },
];
 
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');
 
  for (const item of items) {
    await SkuMaster.findOneAndUpdate(
      { skuErpCode: item.skuErpCode },
      {
        skuErpCode: item.skuErpCode,
        eanCode: item.eanCode,
        name: item.name,
        agreedRate: item.agreedRate,
        mrp: item.mrp,
        hsnCode: item.hsnCode || '',
        uom: 'PKT',
        priceTolerance: 0.05,
      },
      { upsert: true, new: true }
    );
  }
 
  console.log(`Seeded/updated ${items.length} SKU Master records.`);
  await mongoose.disconnect();
}
 
seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
 
