const fs = require('fs');
const path = require('path');

const apiKey = process.env.POSTHOG_API_KEY || 'YOUR_POSTHOG_API_KEY';
const apiHost = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

const configContent = `// Auto-generated configuration file on deploy
window.ENV = {
  POSTHOG_API_KEY: "${apiKey}",
  POSTHOG_HOST: "${apiHost}"
};
`;

const dir = path.join(__dirname, 'js');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'config.js'), configContent);
console.log('Successfully generated js/config.js with environment variables.');
