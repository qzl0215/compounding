const { detectLocalProdStatus } = require("./lib.ts");

console.log(JSON.stringify({ ok: true, ...detectLocalProdStatus() }, null, 2));
