const fs = require('fs');
const path = require('path');

class WebpackInlinePlugin {
  constructor(options = {}) {
    this.options = {
      outputFile: options.outputFile || 'index.html',
      ...options,
    };
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('WebpackInlinePlugin', (compilation, callback) => {
      const distDir = compiler.options.output.path;
      const htmlPath = path.join(distDir, 'index.html');
      const jsPath = path.join(distDir, 'bundle.js');
      const cssPath = path.join(distDir, 'main.css');

      // Read HTML
      if (!fs.existsSync(htmlPath)) {
        console.error('❌ index.html not found in dist');
        callback();
        return;
      }

      let html = fs.readFileSync(htmlPath, 'utf8');

      // Inline font as base64 and inject @font-face into HTML head
      const srcDir = path.join(compiler.options.context || process.cwd(), 'src', 'assets');
      const fontPath = path.join(srcDir, 'asset-font.ttf');
      
      if (fs.existsSync(fontPath)) {
        const fontBuffer = fs.readFileSync(fontPath);
        const fontBase64 = fontBuffer.toString('base64');
        const fontDataUrl = `data:font/truetype;charset=utf-8;base64,${fontBase64}`;
        
        const fontCSS = `@font-face {
  font-family: 'Asset';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${fontDataUrl}') format('truetype');
}`;
        
        if (html.includes('</head>')) {
          html = html.replace('</head>', `<style>${fontCSS}</style></head>`);
          console.log('✓ Inlined font as base64');
        }
      }

      // Inline JavaScript
      if (fs.existsSync(jsPath)) {
        let js = fs.readFileSync(jsPath, 'utf8');
        
        // Remove source map references
        js = js.replace(/\/\/# sourceMappingURL=.*$/gm, '');
        // Escape </script> tags (multi-pass to catch all)
        let escapedJS = js;
        let iterations = 0;
        while (escapedJS.includes('</script>') && iterations < 10) {
          escapedJS = escapedJS.replace(/<\/script>/gi, '<\\/script>');
          iterations++;
        }
        // Replace script tag with inline script
        html = html.replace(
          /<script[^>]*src=["'][^"']*bundle\.js["'][^>]*><\/script>/gi,
          `<script>${escapedJS}</script>`
        );
        console.log('✓ Inlined JavaScript');
      }

      // Inline CSS
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, 'utf8');
        // Find and replace link tag or add style tag
        if (html.includes('</head>')) {
          html = html.replace('</head>', `<style>${css}</style></head>`);
        }
        // Remove CSS link if exists
        html = html.replace(/<link[^>]*href=["'][^"']*main\.css["'][^>]*>/gi, '');
        console.log('✓ Inlined CSS');
      }

      // Remove external font links (fonts are now inlined)
      html = html.replace(/<link[^>]*href=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]*rel=["']preconnect["'][^>]*>/gi, '');

      // Write the inlined HTML
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log('✓ Created standalone HTML file');

      // Clean up separate files
      try {
        if (fs.existsSync(jsPath)) {
          fs.unlinkSync(jsPath);
        }
        if (fs.existsSync(cssPath)) {
          fs.unlinkSync(cssPath);
        }
        console.log('✓ Removed separate bundle files');
      } catch (err) {
        console.warn('⚠️  Could not remove bundle files:', err.message);
      }

      callback();
    });
  }
}

module.exports = WebpackInlinePlugin;

