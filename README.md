# Bitcoin Wallet Generator

A secure, offline Bitcoin wallet generator that runs entirely in your browser.

## Project Structure

- `index.html` - Wallet generator page (uses Webpack dev server)
- `src/` - TypeScript source files for wallet generator
- `dist/` - Built output files

## Development

### Running the Development Server

1. Install dependencies:
```bash
npm install
```

2. Start the Webpack development server:
```bash
npm run dev
```

3. Access the wallet generator:
   - `http://localhost:3000/` or `http://localhost:3000/index.html`

### Building for Production

Build the standalone wallet generator:
```bash
npm run build
```
This creates a standalone `index.html` with all JavaScript and assets inlined into a single file.

## Features

- Generate single or multiple Bitcoin wallets
- Display wallet information with QR codes
- Print functionality for physical backup cards
- All processing happens client-side (no server required)

## Deployment

For Sitejet or other static hosting:

1. Build the wallet generator:
```bash
npm run build
```

2. Upload the standalone file:
   - `dist/index.html` (standalone wallet generator - all assets inlined, ready to deploy)

## Security Notes

- All wallet generation happens client-side
- No data is sent to any server
- Private keys never leave your device
- Always verify wallet addresses before use

## License

MIT

