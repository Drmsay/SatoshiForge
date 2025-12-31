const fs = require('fs');
const path = require('path');

// Read the built files
const distDir = path.join(__dirname, 'dist');
const htmlPath = path.join(distDir, 'index.html');
const jsPath = path.join(distDir, 'wallet-generator.js');
const imagePath = path.join(distDir, 'wallet-generator.png');

// Check if files exist
if (!fs.existsSync(htmlPath) || !fs.existsSync(jsPath)) {
  console.error('Build files not found. Please run "npm run build" first.');
  process.exit(1);
}

// Read HTML and JS
const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// Convert image to base64 if it exists
let imageDataUrl = '';
if (fs.existsSync(imagePath)) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  imageDataUrl = `data:image/png;base64,${imageBase64}`;
  
  // Replace image URL in JS with base64 data URL
  // Handle various formats Vite might use (minified code uses different patterns)
  let finalJS = js;
  
  // Replace "/wallet-generator.png" (most common in minified code)
  finalJS = finalJS.replace(
    /\/wallet-generator\.png/g,
    imageDataUrl
  );
  
  // Replace quoted paths like "/wallet-generator.png" or './wallet-generator.png'
  finalJS = finalJS.replace(
    /(["'])([^"']*wallet-generator\.png)(["'])/g,
    `$1${imageDataUrl}$3`
  );
  
  // Replace const assignments (for unminified or different builds)
  finalJS = finalJS.replace(
    /const\s+\w+\s*=\s*["'][^"']*wallet-generator\.png["']/g,
    `const walletImageUrl = '${imageDataUrl}'`
  );
  
  // Create standalone HTML
  const standaloneHTML = html
    .replace(/<script[^>]*src=["'][^"']*wallet-generator\.js["'][^>]*><\/script>/i, 
      `<script>${finalJS}</script>`)
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, ''); // Remove CSS links if any
  
  // Write standalone file
  const outputPath = path.join(distDir, 'standalone.html');
  fs.writeFileSync(outputPath, standaloneHTML);
  
  console.log('✓ Standalone HTML file created: dist/standalone.html');
  console.log(`  File size: ${(standaloneHTML.length / 1024).toFixed(2)} KB`);
} else {
  // If image doesn't exist, just combine HTML and JS
  const standaloneHTML = html
    .replace(/<script[^>]*src=["'][^"']*wallet-generator\.js["'][^>]*><\/script>/i, 
      `<script>${js}</script>`)
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  
  const outputPath = path.join(distDir, 'standalone.html');
  fs.writeFileSync(outputPath, standaloneHTML);
  
  console.log('✓ Standalone HTML file created: dist/standalone.html');
  console.log('⚠️  Note: Wallet image not found. You may need to host it separately.');
}

