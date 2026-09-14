const { db } = require('../server/db.js');

console.log('==============================================');
console.log('AUTHENTICATION & ROLE SECURITY AUDIT');
console.log('==============================================');

// 1. Audit Demo User Accounts in SQLite Database
const demoUsers = db.prepare(`SELECT id, email, first_name, last_name, role FROM users WHERE email IN ('demo@eshop-store.eu', 'demo@eshopstore.shop')`).all();
console.log('1. Demo accounts in DB:');
if (demoUsers.length === 0) {
  console.log('   ✓ PASSED: No demo@ accounts exist in the database.');
} else {
  console.error('   ✗ FAILED: Found demo accounts:', demoUsers);
}

// 2. Audit Loyalty Accounts for fake 2886 points
const fakeLoyalty = db.prepare(`SELECT referral_code, email, points FROM loyalty_accounts WHERE points = 2886 OR points > 500`).all();
console.log('2. Fake / inflated loyalty points in DB:');
if (fakeLoyalty.length === 0) {
  console.log('   ✓ PASSED: No fake 2886 pts accounts exist.');
} else {
  console.error('   ✗ FAILED: Found inflated loyalty accounts:', fakeLoyalty);
}

// 3. Verify Dedicated Admin
const adminUser = db.prepare(`SELECT id, email, first_name, role FROM users WHERE email = 'admin@eshopstore.shop'`).get();
console.log('3. Dedicated Admin account:');
if (adminUser && adminUser.role === 'admin') {
  console.log(`   ✓ PASSED: Dedicated admin verified (${adminUser.email} with role '${adminUser.role}').`);
} else {
  console.error('   ✗ FAILED: Admin user missing or incorrect role:', adminUser);
}

// 4. Verify Customer Accounts Role Segregation
const customerUsers = db.prepare(`SELECT id, email, first_name, role FROM users WHERE role = 'customer'`).all();
console.log(`4. Verified customer accounts: ${customerUsers.length} active customers.`);
const invalidAdminUsers = db.prepare(`SELECT id, email, role FROM users WHERE role = 'admin' AND email NOT LIKE 'admin@%'`).all();
if (invalidAdminUsers.length === 0) {
  console.log('   ✓ PASSED: Zero customers have rogue admin privileges.');
} else {
  console.error('   ✗ FAILED: Found non-admin emails with admin role:', invalidAdminUsers);
}

console.log('==============================================');
console.log('ALL AUDIT CHECKS COMPLETED');
console.log('==============================================');
