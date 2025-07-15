const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;

// Write version to public/version.txt
const versionPath = path.join(__dirname, 'public', 'version.txt');
fs.writeFileSync(versionPath, currentVersion);

console.log(`Version ${currentVersion} written to public/version.txt`);

// Also update the version in index.html meta tag
const indexPath = path.join(__dirname, 'public', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Update or add version meta tag
const versionMetaTag = `<meta name="version" content="${currentVersion}" />`;
if (indexContent.includes('<meta name="version"')) {
  indexContent = indexContent.replace(
    /<meta name="version" content="[^"]*" \/>/,
    versionMetaTag
  );
} else {
  // Add after the first meta tag
  indexContent = indexContent.replace(
    /<meta name="theme-color" content="#000000" \/>/,
    `<meta name="theme-color" content="#000000" />\n    ${versionMetaTag}`
  );
}

fs.writeFileSync(indexPath, indexContent);
console.log(`Version ${currentVersion} updated in index.html`); 