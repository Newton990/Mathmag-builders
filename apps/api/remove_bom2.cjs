const fs = require('fs');
const p = 'prisma/migrations/20261029000001_module2_planning_design/migration.sql';
const b = fs.readFileSync(p);
if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) {
  fs.writeFileSync(p, b.slice(3));
  console.log('bom removed');
} else {
  console.log('no bom');
}
