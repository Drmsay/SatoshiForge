/**
 * UI management module
 * Handles DOM manipulation, wallet display, and user interactions
 */
import type { Wallet } from '../types/types';
import { displayQRCode } from './qr-code';
import { generateCompositeImage, generateMultiWalletCompositeImage } from './image-composition';
import { setupPrintButton } from './print';
import { generateBitcoinWallet } from './wallet';

const getDOMElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id "${id}" not found`);
  return element as T;
};

export const DOM = {
  generateBtn: () => getDOMElement<HTMLButtonElement>('generateBtn'),
  walletInfo: () => getDOMElement<HTMLDivElement>('walletInfo'),
  loading: () => getDOMElement<HTMLDivElement>('loading'),
  walletCountInput: () => getDOMElement<HTMLInputElement>('walletCountInput'),
  satoshisInput: () => getDOMElement<HTMLInputElement>('satoshisInput'),
  address: () => getDOMElement<HTMLDivElement>('address'),
  privateKey: () => getDOMElement<HTMLDivElement>('privateKey'),
  mnemonic: () => getDOMElement<HTMLDivElement>('mnemonic'),
  addressQR: () => getDOMElement<HTMLDivElement>('addressQR'),
  privateKeyQR: () => getDOMElement<HTMLDivElement>('privateKeyQR'),
  walletPreview: () => getDOMElement<HTMLDivElement>('walletPreview')
};

export const showLoading = (message: string = 'Generating wallet...'): void => {
  const loadingEl = DOM.loading();
  loadingEl.textContent = message;
  loadingEl.classList.add('show');
  DOM.walletInfo().classList.remove('show');
  DOM.generateBtn().disabled = true;
};

export const hideLoading = (): void => {
  DOM.loading().classList.remove('show');
  DOM.walletInfo().classList.add('show');
  DOM.generateBtn().disabled = false;
};

export const displayWalletInfo = (wallet: Wallet): void => {
  DOM.address().textContent = wallet.address;
  DOM.privateKey().textContent = wallet.privateKey;
  DOM.mnemonic().textContent = wallet.mnemonic;
};

/**
 * Displays multiple wallets in the UI
 * Creates separate sections for each wallet with QR codes and copy buttons
 */
export const displayAllWalletsInfo = async (wallets: Wallet[]): Promise<void> => {
  const walletInfoContainer = DOM.walletInfo();
  
  // Store preview section and print button before clearing
  const previewSection = walletInfoContainer.querySelector('#walletPreview')?.parentElement;
  const printButton = walletInfoContainer.querySelector('#printBtn');
  
  // Clear existing content
  walletInfoContainer.innerHTML = '';
  
  // Add all wallet sections
  for (const [index, wallet] of wallets.entries()) {
    const walletSection = document.createElement('div');
    walletSection.className = 'wallet-section';
    walletSection.style.marginBottom = '30px';
    walletSection.style.border = '2px solid #e0e0e0';
    walletSection.style.borderRadius = '0';
    walletSection.style.padding = '20px';
    walletSection.style.backgroundColor = '#f8f9fa';
    
    const walletTitle = document.createElement('h3');
    walletTitle.textContent = `Wallet ${index + 1}${wallet.satoshis ? ` - ${wallet.satoshis.toLocaleString()} Satoshis` : ''}`;
    walletTitle.style.color = 'white';
    walletTitle.style.marginBottom = '20px';
    walletTitle.style.fontSize = '1.2em';
    walletSection.appendChild(walletTitle);
    
    // Address section
    const addressSection = document.createElement('div');
    addressSection.className = 'info-section';
    addressSection.innerHTML = `
      <div class="info-label">Bitcoin Address (Segwit)</div>
      <div class="info-content">
        <div class="info-value" id="address-${index}">${wallet.address}</div>
        <div class="qr-container">
          <div class="qr-code-wrapper">
            <div class="qr-label">Address QR Code</div>
            <div class="qr-code" id="addressQR-${index}"></div>
          </div>
        </div>
        <button class="copy-btn" data-copy="address-${index}">Copy</button>
      </div>
    `;
    walletSection.appendChild(addressSection);
    
    // Private Key section
    const privateKeySection = document.createElement('div');
    privateKeySection.className = 'info-section';
    privateKeySection.innerHTML = `
      <div class="info-label">Private Key (WIF)</div>
      <div class="info-content">
        <div class="info-value" id="privateKey-${index}">${wallet.privateKey}</div>
        <div class="qr-container">
          <div class="qr-code-wrapper">
            <div class="qr-label">Private Key QR Code</div>
            <div class="qr-code" id="privateKeyQR-${index}"></div>
          </div>
        </div>
        <button class="copy-btn" data-copy="privateKey-${index}">Copy</button>
      </div>
    `;
    walletSection.appendChild(privateKeySection);
    
    // Mnemonic section
    const mnemonicSection = document.createElement('div');
    mnemonicSection.className = 'info-section';
    mnemonicSection.innerHTML = `
      <div class="info-label">Mnemonic Phrase (12 words)</div>
      <div class="info-value" id="mnemonic-${index}">${wallet.mnemonic}</div>
      <button class="copy-btn" data-copy="mnemonic-${index}">Copy</button>
    `;
    walletSection.appendChild(mnemonicSection);
    
    walletInfoContainer.appendChild(walletSection);
    
    // Display QR codes for this wallet
    await Promise.all([
      displayQRCode(wallet.address, getDOMElement<HTMLDivElement>(`addressQR-${index}`)),
      displayQRCode(wallet.privateKey, getDOMElement<HTMLDivElement>(`privateKeyQR-${index}`))
    ]);
  }
  
  // Re-add preview section
  if (previewSection) {
    walletInfoContainer.appendChild(previewSection.cloneNode(true) as Element);
  }
  
  // Re-add print button (recreate it to ensure proper functionality)
  if (printButton) {
    const newPrintButton = document.createElement('button');
    newPrintButton.id = 'printBtn';
    newPrintButton.className = 'generate-btn';
    newPrintButton.textContent = 'Print';
    newPrintButton.style.marginTop = '20px';
    newPrintButton.style.background = '#ff8e19';
    walletInfoContainer.appendChild(newPrintButton);
  }
};

export const displayQRCodes = async (wallet: Wallet): Promise<void> => {
  await Promise.all([
    displayQRCode(wallet.address, DOM.addressQR()),
    displayQRCode(wallet.privateKey, DOM.privateKeyQR())
  ]);
};

export const displayCompositeImage = (imageDataURL: string): void => {
  const img = new Image();
  img.onload = () => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Get container width (accounting for padding)
    const container = DOM.walletPreview();
    const containerWidth = container.clientWidth - 40; // Subtract padding (20px on each side)
    
    // Calculate scale to fit width while maintaining aspect ratio
    const scale = containerWidth / naturalWidth;
    const displayWidth = naturalWidth * scale;
    const displayHeight = naturalHeight * scale;
    
    DOM.walletPreview().innerHTML = `
      <div style="text-align: center; width: 100%;">
        <img 
          src="${imageDataURL}" 
          alt="Wallet with Keys and QR Codes" 
          style="width: ${displayWidth}px; height: ${displayHeight}px; max-width: 100%; border-radius: 0; box-shadow: 0 0 10px rgba(0,0,0,0.1); display: block; margin: 0 auto;" 
        />
        <p style="margin-top: 10px; color: white; font-size: 0.9em;">Preview (scaled to fit). Actual print size: ${naturalWidth}px × ${naturalHeight}px</p>
      </div>
    `;
  };
  img.onerror = () => {
    DOM.walletPreview().innerHTML = `
      <div style="text-align: center; width: 100%;">
        <p style="color: red;">Failed to load preview image</p>
      </div>
    `;
  };
  img.src = imageDataURL;
};

// Module-level storage for wallet data (replaces window object storage)
const walletData: {
  wallets?: Wallet[];
  compositeImage?: string;
  individualImages?: string[];
} = {};

export const storeWalletData = (wallets: Wallet | Wallet[], compositeImage: string, individualImages?: string[]): void => {
  walletData.wallets = Array.isArray(wallets) ? wallets : [wallets];
  walletData.compositeImage = compositeImage;
  walletData.individualImages = individualImages;
};

export const getWalletData = (): typeof walletData => walletData;

const copyToClipboard = (id: string, button: HTMLButtonElement): void => {
  const element = getDOMElement<HTMLDivElement>(id);
  const text = element.textContent || '';

  const handleSuccess = () => {
    const originalText = button.textContent || '';
    button.textContent = 'Copied!';
    button.style.background = '#ff8e19';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  };

  const handleError = () => {
    alert('Failed to copy to clipboard');
  };

  navigator.clipboard.writeText(text).then(handleSuccess, handleError);
};

/**
 * Sets up copy-to-clipboard functionality for all wallet data
 * Handles both single and multiple wallet scenarios
 */
export const setupCopyButtons = (): void => {
  // Handle single wallet copy buttons
  const getCopyButton = (sectionId: string) => {
    const section = document.getElementById(sectionId)?.parentElement;
    return section?.querySelector('.copy-btn') as HTMLButtonElement | undefined;
  };

  const addressCopyBtn = getCopyButton('address');
  const privateKeyCopyBtn = getCopyButton('privateKey');
  const mnemonicCopyBtn = getCopyButton('mnemonic');

  if (addressCopyBtn) {
    addressCopyBtn.addEventListener('click', () => copyToClipboard('address', addressCopyBtn));
  }
  if (privateKeyCopyBtn) {
    privateKeyCopyBtn.addEventListener('click', () => copyToClipboard('privateKey', privateKeyCopyBtn));
  }
  if (mnemonicCopyBtn) {
    mnemonicCopyBtn.addEventListener('click', () => copyToClipboard('mnemonic', mnemonicCopyBtn));
  }

  // Handle multiple wallet copy buttons (using data attributes)
  const allCopyButtons = document.querySelectorAll('.copy-btn[data-copy]');
  allCopyButtons.forEach(btn => {
    const copyId = (btn as HTMLElement).getAttribute('data-copy');
    if (copyId) {
      btn.addEventListener('click', () => {
        const element = document.getElementById(copyId);
        if (element) {
          const text = element.textContent || '';
          
          const handleSuccess = () => {
            const originalText = btn.textContent || '';
            (btn as HTMLButtonElement).textContent = 'Copied!';
            (btn as HTMLButtonElement).style.background = '#ff8e19';

            setTimeout(() => {
              (btn as HTMLButtonElement).textContent = originalText;
              (btn as HTMLButtonElement).style.background = '';
            }, 2000);
          };

          const handleError = () => {
            alert('Failed to copy to clipboard');
          };

          navigator.clipboard.writeText(text).then(handleSuccess, handleError);
        }
      });
    }
  });
};

/**
 * Main wallet generation handler
 * Generates one or more wallets, displays them, and creates printable images
 */
export const generateWallet = async (): Promise<void> => {
  // Get wallet count from input
  const walletCountInput = DOM.walletCountInput();
  const walletCountValue = walletCountInput.value.trim();
  const walletCount = walletCountValue ? parseInt(walletCountValue, 10) : 1;
  
  if (isNaN(walletCount) || walletCount < 1 || walletCount > 20) {
    alert('Please enter a valid number of wallets (1-20)');
    return;
  }

  const loadingMessage = walletCount === 1 
    ? 'Generating wallet...' 
    : `Generating ${walletCount} wallets...`;
  showLoading(loadingMessage);

  // Get Satoshis amount from input
  const satoshisInput = DOM.satoshisInput();
  const satoshisValue = satoshisInput.value.trim();
  const satoshis = satoshisValue ? parseInt(satoshisValue, 10) : undefined;
  
  if (satoshis !== undefined && (isNaN(satoshis) || satoshis < 0)) {
    alert('Please enter a valid Satoshis amount (must be a positive number)');
    hideLoading();
    return;
  }

  // Generate multiple wallets
  const wallets: Wallet[] = Array.from({ length: walletCount }, () => {
    const wallet = generateBitcoinWallet();
    return { ...wallet, satoshis };
  });

  // Display all wallet information
  if (walletCount === 1) {
    displayWalletInfo(wallets[0]);
    await displayQRCodes(wallets[0]);
  } else {
    await displayAllWalletsInfo(wallets);
  }

  // Generate individual wallet images first
  const walletKeys = wallets.map(w => ({
    address: w.address,
    privateKey: w.privateKey,
    satoshis: w.satoshis
  }));
  
  const individualImages: string[] = [];
  for (const walletKey of walletKeys) {
    const walletImage = await generateCompositeImage(walletKey);
    individualImages.push(walletImage);
  }

  // Generate composite image for preview
  const compositeImage = await generateMultiWalletCompositeImage(walletKeys);

  displayCompositeImage(compositeImage);
  storeWalletData(wallets, compositeImage, individualImages);
  hideLoading();
  setupCopyButtons();
  setupPrintButton();
};

