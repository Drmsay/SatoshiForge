import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

export function standaloneHTML(): Plugin {
  return {
    name: 'standalone-html',
    apply: 'build', // Only run during build, not in dev mode
    closeBundle() {
      const distDir = join(process.cwd(), 'dist');
      const srcDir = join(process.cwd(), 'src');
      const htmlPath = join(distDir, 'index.html');
      const jsPath = join(distDir, 'wallet-generator.js');

      // Check if files exist
      if (!existsSync(htmlPath)) {
        console.error('❌ index.html not found in dist');
        return;
      }

      if (!existsSync(jsPath)) {
        console.error('❌ wallet-generator.js not found in dist');
        return;
      }

      console.log('📦 Creating standalone HTML file...\n');

      // Read HTML and JS
      let html = readFileSync(htmlPath, 'utf8');
      let js = readFileSync(jsPath, 'utf8');

      // Find and embed wallet image
      const possibleImagePaths = [
        join(distDir, 'wallet-generator.png'),
        join(distDir, 'blank wallet image.png'),
        join(srcDir, 'images', 'blank wallet image.png'),
      ];

      let imageDataUrl = '';
      let imageFound = false;

      for (const imagePath of possibleImagePaths) {
        if (existsSync(imagePath)) {
          console.log(`✓ Found wallet image at: ${imagePath.replace(process.cwd(), '.')}`);
          const imageBuffer = readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');
          imageDataUrl = `data:image/png;base64,${imageBase64}`;
          imageFound = true;
          break;
        }
      }

      if (imageFound) {
        // Replace image URL in JS with base64 data URL
        // Use matchAll instead of test() to avoid lastIndex issues
        
        // Pattern 1: Direct path references
        const pattern1 = /(["'])([^"']*wallet-generator\.png)(["'])/g;
        const matches1 = [...js.matchAll(pattern1)];
        if (matches1.length > 0) {
          for (const match of matches1) {
            js = js.replace(match[0], `${match[1]}${imageDataUrl}${match[3]}`);
          }
          console.log('✓ Replaced wallet-generator.png references');
        }

        // Pattern 2: References to "blank wallet image.png"
        const pattern2 = /(["'])([^"']*blank\s+wallet\s+image\.png)(["'])/g;
        const matches2 = [...js.matchAll(pattern2)];
        if (matches2.length > 0) {
          for (const match of matches2) {
            js = js.replace(match[0], `${match[1]}${imageDataUrl}${match[3]}`);
          }
          console.log('✓ Replaced blank wallet image.png references');
        }

        // Pattern 3: URL-encoded paths
        const pattern3 = /(["'])([^"']*blank%20wallet%20image\.png)(["'])/g;
        const matches3 = [...js.matchAll(pattern3)];
        if (matches3.length > 0) {
          for (const match of matches3) {
            js = js.replace(match[0], `${match[1]}${imageDataUrl}${match[3]}`);
          }
          console.log('✓ Replaced URL-encoded image references');
        }

        // Pattern 4: Import statements
        const pattern4 = /import\s+(\w+)\s+from\s+["']([^"']*(?:wallet-generator|blank[\s%20]*wallet[\s%20]*image)\.png)["']/g;
        const matches4 = [...js.matchAll(pattern4)];
        if (matches4.length > 0) {
          for (const match of matches4) {
            js = js.replace(match[0], `const ${match[1]} = '${imageDataUrl}'`);
          }
          console.log('✓ Replaced image import statements');
        }

        // Pattern 5: Dynamic imports
        const pattern5 = /import\(["']([^"']*(?:wallet-generator|blank[\s%20]*wallet[\s%20]*image)\.png)["']\)/g;
        const matches5 = [...js.matchAll(pattern5)];
        if (matches5.length > 0) {
          for (const match of matches5) {
            js = js.replace(match[0], `Promise.resolve('${imageDataUrl}')`);
          }
          console.log('✓ Replaced dynamic image imports');
        }

        console.log('✓ Wallet image embedded as base64 data URL');
      } else {
        console.warn('⚠️  Wallet image not found. The app may not work correctly.');
      }

      // Escape JavaScript for safe embedding in HTML
      // Use multiple passes to ensure all </script> tags are escaped
      let escapedJS = js;
      let previousLength = 0;
      let iterations = 0;
      const maxIterations = 100;
      
      while (escapedJS.length !== previousLength && iterations < maxIterations) {
        previousLength = escapedJS.length;
        escapedJS = escapedJS.replace(/<\/script>/gi, '<\\/script>');
        iterations++;
      }
      
      // Also escape other variations
      escapedJS = escapedJS.replace(/<\/SCRIPT>/g, '<\\/SCRIPT>');
      escapedJS = escapedJS.replace(/<\/Script>/g, '<\\/Script>');
      
      // Validate escaped content is still valid JavaScript
      try {
        new Function(escapedJS);
      } catch (e) {
        console.error('❌ Escaped JavaScript has syntax error:', e.message);
        return;
      }

      // Replace script tag with inline script
      if (html.includes('wallet-generator.js')) {
        const specificPattern = /<script[^>]*type=["']module["'][^>]*crossorigin[^>]*src=["'][^"']*wallet-generator\.js["'][^>]*><\/script>/gi;
        const beforeReplace = html;
        html = html.replace(specificPattern, '<script>\n' + escapedJS + '\n</script>');

        if (html === beforeReplace) {
          const generalPattern = /<script[^>]*src=["'][^"']*wallet-generator\.js["'][^>]*><\/script>/gi;
          html = html.replace(generalPattern, '<script>\n' + escapedJS + '\n</script>');
        }
        
        // Verify replacement happened
        if (html === beforeReplace) {
          console.error('❌ Failed to replace script tag. Script tag pattern not found.');
          return;
        }
      } else {
        console.warn('⚠️  wallet-generator.js not found in HTML. Skipping script replacement.');
      }

      // Remove external resources
      html = html
        // Remove external CSS links
        .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
        // Remove preconnect links
        .replace(/<link[^>]*rel=["']preconnect["'][^>]*>/gi, '')
        // Remove Google Fonts links
        .replace(/<link[^>]*href=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*>/gi, '')
        // Replace Asset font with system font fallback
        .replace(/font-family:[^;]*Asset[^;]*;/gi, 'font-family: "Courier New", monospace;');

      // Remove any existing CSP and add new one
      html = html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

      // Add CSP meta tag after viewport
      if (!html.includes('Content-Security-Policy')) {
        html = html.replace(
          /(<meta\s+name=["']viewport["'][^>]*>)/i,
          `$1\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:;">`
        );
      }

      // Validate HTML structure before writing
      const scriptOpenCount = (html.match(/<script[^>]*>/gi) || []).length;
      const scriptCloseCount = (html.match(/<\/script>/gi) || []).length;
      
      if (scriptOpenCount !== scriptCloseCount) {
        console.error(`❌ Mismatched script tags: ${scriptOpenCount} opening, ${scriptCloseCount} closing`);
        return;
      }
      
      // Final validation: Check script tags are properly formed
      const finalScriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
      if (finalScriptMatches) {
        for (const scriptTag of finalScriptMatches) {
          const content = scriptTag.replace(/<\/?script[^>]*>/gi, '');
          if (content.includes('</script>') && !content.includes('<\\/script>')) {
            console.error('❌ Script contains unescaped </script> tag');
            return;
          }
        }
      }

      // Write standalone file (overwrite index.html)
      try {
        writeFileSync(htmlPath, html, 'utf8');
        console.log(`✓ Validated HTML structure (${scriptOpenCount} script tags)`);
      } catch (err) {
        console.error('❌ Failed to write HTML file:', err);
        return;
      }

      // Delete the separate JS and image files since they're now embedded
      try {
        if (existsSync(jsPath)) {
          unlinkSync(jsPath);
          console.log('✓ Removed separate JavaScript file (now inlined)');
        }
      } catch (err) {
        console.warn('⚠️  Could not remove JavaScript file:', err);
      }

      // Remove the image file if it was embedded
      if (imageFound) {
        for (const imagePath of possibleImagePaths) {
          if (existsSync(imagePath) && imagePath.startsWith(distDir)) {
            try {
              unlinkSync(imagePath);
              console.log(`✓ Removed separate image file (now embedded): ${imagePath.replace(process.cwd(), '.')}`);
            } catch (err) {
              console.warn(`⚠️  Could not remove image file ${imagePath}:`, err);
            }
          }
        }
      }

      const fileSizeKB = (html.length / 1024).toFixed(2);
      const fileSizeMB = (html.length / (1024 * 1024)).toFixed(2);

      console.log('\n✅ Standalone HTML file created successfully!');
      console.log(`   📄 File: dist/index.html`);
      console.log(`   📊 Size: ${fileSizeKB} KB (${fileSizeMB} MB)`);
      console.log('\n   ✓ All JavaScript inlined');
      console.log('   ✓ All CSS inlined');
      if (imageFound) {
        console.log('   ✓ Wallet image embedded');
      } else {
        console.log('   ⚠️  Wallet image not embedded');
      }
      console.log('   ✓ Separate files removed (everything is in index.html)');
      console.log('\n   The file is now standalone and can be opened directly in a browser.\n');
    },
  };
}

