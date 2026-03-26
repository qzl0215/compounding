const { validateOperatorContract } = require("./lib/operator-contract.ts");

const payload = validateOperatorContract(process.cwd());

console.log(JSON.stringify(payload, null, 2));

if (!payload.ok) {
  process.exit(1);
}
