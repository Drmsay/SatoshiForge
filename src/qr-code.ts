/**
 * QR code generation module
 * Creates QR codes for Bitcoin addresses and private keys
 */
import QRCode from 'qrcode';

const QR_CODE_OPTIONS = {
  width: 200,
  margin: 2,
  color: { dark: '#000000', light: '#FFFFFF' }
} as const;

/**
 * Generates a QR code as a base64 data URL
 */
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, QR_CODE_OPTIONS);
};

export const createQRCodeImage = (dataURL: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load QR code image'));
    img.src = dataURL;
  });
};

/**
 * Generates and displays a QR code in the specified container element
 */
export const displayQRCode = async (text: string, container: HTMLDivElement): Promise<void> => {
  container.innerHTML = '';
  const qrDataUrl = await generateQRCodeDataURL(text);
  const img = document.createElement('img');
  img.src = qrDataUrl;
  img.alt = 'QR Code';
  img.style.display = 'block';
  container.appendChild(img);
};

