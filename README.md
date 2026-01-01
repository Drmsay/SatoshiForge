# Paper Wallet Generator

A Bitcoin wallet generator that runs entirely in your web browser. Generates printable paper wallets with QR codes for use in areas with limited technology infrastructure.

## Overview

Creates Bitcoin wallets that can be printed on paper. Users generate wallets in their browser and print them for physical use. The entire process happens on the user's device - nothing gets sent to a server.

The project targets regions where traditional banking isn't available but people have smartphones and basic internet access.

## Functionality

### Wallet Generation
Creates Bitcoin wallets using BIP39 and BIP84 standards. Generates 12-word recovery phrases, SegWit addresses, and private keys in WIF format.

### User Features
Generate one or multiple wallets (up to 20). View wallet information with QR codes for easy scanning. Print wallet cards with all information embedded.

### Security
All wallet generation happens client-side. Private keys never leave the device. No network calls after initial page load. Security headers prevent common web attacks.

## Technical Implementation

Built with TypeScript and Webpack. Bundles everything into a single HTML file with all assets inlined. Uses polyfills to make Node.js-based Bitcoin libraries work in browsers. Implements Content Security Policy headers and stores wallet data in module scope.

## Security Considerations

Browser extensions may access page content - disable extensions when generating wallets. Always deploy over HTTPS. Verify generated addresses on the blockchain before sending funds. Physical security of paper wallets is critical.

## License

MIT
