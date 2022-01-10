// Proving that every module is wrapped when imported
// console.log(arguments);
// console.log(require("module").wrapper);

// module.exports = Calculator;
const Cal = require("./test-module-1");
const calculator1 = new Cal();
console.log(calculator1.add(1, 2));

// exports.add and exports.multiply
const { add, multiply } = require("./test-module-2");
console.log(add(1, 2));

// Caching (Proving that module is cached so that top level code will only be executed once)
require("./test-module-3")();
require("./test-module-3")();
require("./test-module-3")();
