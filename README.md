# Bitcoin Wallet Generator

A secure, offline Bitcoin wallet generator that runs entirely in your browser.

## Project Structure

- `index.html` - Wallet generator page (uses Vite dev server)
- `src/` - TypeScript source files for wallet generator
- `dist/` - Built output files

## Development

### Running the Development Server

1. Install dependencies:
```bash
npm install
```

2. Start the Vite development server:
```bash
npm run dev
```

3. Access the wallet generator:
   - `http://localhost:3000/` or `http://localhost:3000/index.html`

### Building for Production

#### Option 1: Build standalone wallet generator (current method)
```bash
npm run build
```
This creates a standalone `index.html` with the wallet generator embedded.

#### Option 2: Build with Vite
```bash
npm run build:vite
```
This builds to the `dist/` folder.

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
   - `dist/index.html` (standalone wallet generator - can be embedded)

3. For the wallet generator page, you can either:
   - Use the standalone `dist/index.html` and embed it
   - Host the built files from `dist/` and link to them
   - Use the Vite build output

## Security Notes

- All wallet generation happens client-side
- No data is sent to any server
- Private keys never leave your device
- Always verify wallet addresses before use

## License

MIT

