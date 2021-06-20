const { upgrade } = require('./upgrade');

// The DAO steps for upgrading to ERC20 compatible versions, these must be done with Governor access control privileges
async function main() {
  await upgrade(true);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
