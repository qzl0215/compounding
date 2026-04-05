const { validateDerivedAssetContract } = require("../../shared/derived-asset-contract.ts");

const payload = validateDerivedAssetContract(process.cwd());

console.log(JSON.stringify(payload, null, 2));

if (!payload.ok) {
  process.exit(1);
}
