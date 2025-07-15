const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env')));

const envContents = `
// THIS FILE IS AUTO-GENERATED DURING BUILD
module.exports = {
  SSH_USER: "${env.SSH_USER}",
  SSH_HOST: "${env.SSH_HOST}",
  LOCAL_HOST: "${env.LOCAL_HOST}",
  LOCAL_PORT: "${env.LOCAL_PORT}",
  REMOTE_BIND: "${env.REMOTE_BIND}",
  REMOTE_PORT: "${env.REMOTE_PORT}"
};
`;

fs.writeFileSync(path.resolve(__dirname, 'env.js'), envContents);
console.log('✅ env.js generated from .env');