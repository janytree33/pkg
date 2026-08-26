const fs = require('fs');
const lines = fs.readFileSync('src/constants/kecoSchemas.js', 'utf8').split('\n');
let start = lines.findIndex(l => l.includes("'02': {"));
let end = lines.findIndex((l, i) => i > start && l.includes("'10': {"));
console.log(lines.slice(start, end).join('\n'));
