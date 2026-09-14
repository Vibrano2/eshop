const { PRODUCTS } = require('../src/data/products.js');

['reveil-lumineux-simulateur-aube', 'bouteille-eau-intelligente', 'aspirateur-bureau-compact'].forEach(id => {
  const p = PRODUCTS.find(x => x.id === id);
  console.log(JSON.stringify(p, null, 2));
});
