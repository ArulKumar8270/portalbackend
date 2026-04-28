const fs = require('fs');
const path = require('path');

const normalizedPath = __dirname;
const data = {};

fs.readdirSync(normalizedPath).forEach((file) => {
    if (file !== 'index.js') {
        const module = require(path.join(__dirname, file));
        data[file.split('.')[0]] = module.default || module;
    }
});

module.exports = data;
