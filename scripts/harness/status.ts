#!/usr/bin/env node

const { syncHarnessSnapshot } = require("./lib.ts");

const snapshot = syncHarnessSnapshot();
console.log(JSON.stringify(snapshot, null, 2));
