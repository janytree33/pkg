const fs = require('fs');
const content = fs.readFileSync('src/constants/kecoSchemas.js', 'utf8');
const start = content.indexOf(`id: 'lc_composite',`);
console.log(content.substring(start - 20, start + 600));
