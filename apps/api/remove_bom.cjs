const fs=require('fs');
const p='prisma/migrations/20261024000001_module_1_schema/migration.sql';
let b=fs.readFileSync(p);
if(b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF){
  fs.writeFileSync(p,b.slice(3));
  console.log('bom removed');
}else{
  console.log('no bom');
}
