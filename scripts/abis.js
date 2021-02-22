require('dotenv').config();
const fs = require('fs');
const dir = process.env.APP_ABI_DIR;
const abisDir = dir + '/abis/';
const buildDir = './build/contracts/';
if (!fs.existsSync(dir)) {
	throw new Error('Graph dir not exists');
}
if (!fs.existsSync(abisDir)) {
	fs.mkdirSync(abisDir);
}
if (!fs.existsSync(buildDir)) {
	throw new Error('No truffle build/contracts directory');
}
const files = fs.readdirSync(buildDir);
for (var i = files.length - 1; i >= 0; i--) {
	var name = files[i];
	var contract = JSON.parse(fs.readFileSync(buildDir + name), 'utf8');
	var abi = JSON.stringify(contract.abi);
	fs.writeFileSync(abisDir + name, abi, 'utf8');
	console.log(name + ': Done');
}
