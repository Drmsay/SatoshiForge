import type { Wallet } from './types';
import { displayQRCode } from './qr-code';
import { generateCompositeImage } from './image-composition';
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
  satoshisInput: () => getDOMElement<HTMLInputElement>('satoshisInput'),
  address: () => getDOMElement<HTMLDivElement>('address'),
  privateKey: () => getDOMElement<HTMLDivElement>('privateKey'),
  mnemonic: () => getDOMElement<HTMLDivElement>('mnemonic'),
  addressQR: () => getDOMElement<HTMLDivElement>('addressQR'),
  privateKeyQR: () => getDOMElement<HTMLDivElement>('privateKeyQR'),
  walletPreview: () => getDOMElement<HTMLDivElement>('walletPreview')
};

export const showLoading = (): void => {
  DOM.loading().classList.add('show');
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
          style="width: ${displayWidth}px; height: ${displayHeight}px; max-width: 100%; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); display: block; margin: 0 auto;" 
        />
        <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Preview (scaled to fit). Actual print size: ${naturalWidth}px × ${naturalHeight}px</p>
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

export const storeWalletData = (wallet: Wallet, compositeImage: string): void => {
  (window as any).currentWallet = wallet;
  (window as any).compositeWalletImage = compositeImage;
};

const copyToClipboard = (id: string, button: HTMLButtonElement): void => {
  const element = getDOMElement<HTMLDivElement>(id);
  const text = element.textContent || '';

  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent || '';
    button.textContent = 'Copied!';
    button.style.background = '#28a745';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  });
};

export const setupCopyButtons = (): void => {
  const getCopyButton = (sectionId: string) => {
    const section = document.getElementById(sectionId)?.parentElement;
    return section?.querySelector('.copy-btn') as HTMLButtonElement | undefined;
  };

  const addressCopyBtn = getCopyButton('address');
  const privateKeyCopyBtn = getCopyButton('privateKey');
  const mnemonicCopyBtn = getCopyButton('mnemonic');

  addressCopyBtn?.addEventListener('click', () => copyToClipboard('address', addressCopyBtn));
  privateKeyCopyBtn?.addEventListener('click', () => copyToClipboard('privateKey', privateKeyCopyBtn));
  mnemonicCopyBtn?.addEventListener('click', () => copyToClipboard('mnemonic', mnemonicCopyBtn));
};

export const generateWallet = async (): Promise<void> => {
  showLoading();

  // Get Satoshis amount from input
  const satoshisInput = DOM.satoshisInput();
  const satoshisValue = satoshisInput.value.trim();
  const satoshis = satoshisValue ? parseInt(satoshisValue, 10) : undefined;
  
  if (satoshis !== undefined && (isNaN(satoshis) || satoshis < 0)) {
    alert('Please enter a valid Satoshis amount (must be a positive number)');
    hideLoading();
    return;
  }

  const wallet = generateBitcoinWallet();
  const walletWithSatoshis = { ...wallet, satoshis };
  displayWalletInfo(walletWithSatoshis);
  await displayQRCodes(walletWithSatoshis);

  const compositeImage = await generateCompositeImage({
    address: wallet.address,
    privateKey: wallet.privateKey,
    satoshis
  });

  displayCompositeImage(compositeImage);
  storeWalletData(walletWithSatoshis, compositeImage);
  hideLoading();
  setupCopyButtons();
  setupPrintButton();
};

