const report = require('./audit_report.json');

const imgCount = {};
report.forEach(p => {
  imgCount[p.image] = (imgCount[p.image] || 0) + 1;
});

let duplicatesFound = 0;
for (const [img, count] of Object.entries(imgCount)) {
  if (count > 1) {
    duplicatesFound++;
    const using = report.filter(p => p.image === img).map(p => p.id + ' (' + p.name + ')');
    console.log(count + 'x: ' + img);
    console.log('   Used by: ' + using.join(', '));
  }
}
if (duplicatesFound === 0) {
  console.log('PERFECT! ZERO DUPLICATE IMAGES across all 110 products!');
} else {
  console.log(`Still found ${duplicatesFound} duplicate images.`);
}
