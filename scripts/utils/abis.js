require('dotenv').config();
const fs = require('fs');

const abisDir = process.env.ABI_DIR;
const buildDir = './artifacts/';
if (!fs.existsSync(abisDir)) {
  throw new Error('ABI directory not exists');
}
if (!fs.existsSync(buildDir)) {
  throw new Error('No truffle build/contracts directory');
}
const files = fs.readdirSync(buildDir);
for (let i = files.length - 1; i >= 0; i = -1) {
  const name = files[i];
  const contract = JSON.parse(fs.readFileSync(buildDir + name), 'utf8');
  const abi = JSON.stringify(contract.abi);
  fs.writeFileSync(abisDir + name.toLocaleLowerCase(), abi, 'utf8');
  console.log(`${name}: Done`);
}
