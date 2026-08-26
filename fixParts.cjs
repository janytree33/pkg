const fs = require('fs');
const path = 'src/constants/kecoSchemas.js';
let content = fs.readFileSync(path, 'utf8');

let start = content.indexOf("'07': {");
let end = content.indexOf("'02': {", start);

let block07 = content.substring(start, end);
block07 = block07.replace(/name: '몸체',\s*parts: \[/, "name: '몸체',\n      categories: [");
block07 = block07.replace(/name: '라벨',\s*parts: \[/, "name: '라벨',\n      categories: [");
block07 = block07.replace(/name: '마개 및 잡자재',\s*parts: \[/, "name: '마개 및 잡자재',\n      categories: [");

content = content.substring(0, start) + block07 + content.substring(end);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed parts to categories in 07 schema');
