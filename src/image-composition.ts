import walletImageUrl from './images/blank wallet image.png';
import type { WalletKeys } from '../types/types';
import { generateQRCodeDataURL, createQRCodeImage } from './qr-code';

const COMPOSITION_CONFIG = {
  qrSize: 120,
  addressPosition: { x: 0.05, y: 0.40 },
  privateKeyPosition: { x: 0.95, y: 0.40 },
  addressTextPosition: { x: 0.009, y: 0.5, width: 0.45 },
  privateKeyTextPosition: { x: 0.99, y: 0.5, width: 0.45 },
  satoshisPosition: { x: 0.78, y: 0.18 },
  satoshisNumberPositions: [
    { x: 0.05, y: 0.12 },  // Position 1
    { x: 0.84, y: 0.12 },  // Position 2
    { x: 0.05, y: 0.86 },  // Position 3
    { x: 0.84, y: 0.86 }   // Position 4
  ],
  textStyle: { fontSize: 8, padding: 3, height: 12 },
  satoshisTextStyle: { fontSize: 14, padding: 5, height: 20 },
  satoshisNumberStyle: { fontSize: 12, padding: 4, height: 18 },
  colors: {
    address: '#0d579b',      // Blue for address
    privateKey: '#f7931a',   // Red for private key
    satoshis: '#f7931a',     // Green for satoshis
    satoshisNumber: '#f7931a' // Orange for satoshis numbers
  }
} as const;

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

const createCanvas = (width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  return { canvas, ctx };
};

const drawQRCode = (
  ctx: CanvasRenderingContext2D,
  qrImage: HTMLImageElement,
  x: number,
  y: number,
  size: number
): void => {
  ctx.drawImage(qrImage, x, y, size, size);
};

const drawKeyText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  padding: number,
  height: number,
  color: string,
  rotation: number = 0
): void => {
  ctx.save(); // Save the current context state

  ctx.font = `bold ${COMPOSITION_CONFIG.textStyle.fontSize}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;

  if (rotation !== 0) {
    // Translate to the rotation point
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
  } else {
    ctx.fillText(text, x, y);
  }

  ctx.restore(); // Restore the context state
};

const calculateOptimalFontSize = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialFontSize: number,
  fontFamily: string
): number => {
  // Set initial font to measure text width
  ctx.font = `${initialFontSize}px "${fontFamily}", sans-serif`;
  const textWidth = ctx.measureText(text).width;

  // If text already fits, return initial size
  if (textWidth <= maxWidth) {
    return initialFontSize;
  }

  // Calculate scale factor to fit within maxWidth (with 10% padding for safety)
  const padding = 0.90; // 10% padding to ensure text doesn't touch edges
  const scaleFactor = (maxWidth * padding) / textWidth;
  const optimalFontSize = Math.max(4, Math.floor(initialFontSize * scaleFactor));

  return optimalFontSize;
};

const drawSatoshisText = (
  ctx: CanvasRenderingContext2D,
  satoshis: number,
  x: number,
  y: number,
  maxWidth: number
): void => {
  const formattedAmount = satoshis.toLocaleString('en-US');
  const text = `${formattedAmount} SATOSHIS`;

  // Calculate optimal font size to fit within maxWidth
  const optimalFontSize = calculateOptimalFontSize(
    ctx,
    text,
    maxWidth,
    COMPOSITION_CONFIG.satoshisTextStyle.fontSize,
    'Asset'
  );

  ctx.font = `${optimalFontSize}px "Asset", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Set drop shadow
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw text with color (no background, no border)
  ctx.fillStyle = COMPOSITION_CONFIG.colors.satoshis;
  ctx.fillText(text, x, y);

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const drawSatoshisNumber = (
  ctx: CanvasRenderingContext2D,
  satoshis: number,
  x: number,
  y: number,
  maxWidth: number
): void => {
  const formattedAmount = satoshis.toLocaleString('en-US');
  const text = formattedAmount; // Just the number, no "Satoshis" text

  // Calculate optimal font size to fit within maxWidth
  const optimalFontSize = calculateOptimalFontSize(
    ctx,
    text,
    maxWidth,
    COMPOSITION_CONFIG.satoshisNumberStyle.fontSize,
    'Asset'
  );

  ctx.font = `${optimalFontSize}px "Asset", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Set drop shadow
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw text with color (no background, no border)
  ctx.fillStyle = COMPOSITION_CONFIG.colors.satoshisNumber;
  ctx.fillText(text, x, y);

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

export const generateCompositeImage = async (wallet: WalletKeys): Promise<string> => {
  // Wait for fonts to load, specifically the Asset font
  await document.fonts.ready;
  // Explicitly load the Asset font to ensure it's available for canvas
  await document.fonts.load(`${COMPOSITION_CONFIG.satoshisTextStyle.fontSize}px Asset`);

  const walletImg = await loadImage(walletImageUrl);
  const { canvas, ctx } = createCanvas(walletImg.width, walletImg.height);

  ctx.drawImage(walletImg, 0, 0);

  const addressQR = await generateQRCodeDataURL(wallet.address);
  const privateKeyQR = await generateQRCodeDataURL(wallet.privateKey);

  const addressQRImg = await createQRCodeImage(addressQR);
  const privateQRImg = await createQRCodeImage(privateKeyQR);

  const addressQRX = canvas.width * COMPOSITION_CONFIG.addressPosition.x;
  const addressQRY = canvas.height * COMPOSITION_CONFIG.addressPosition.y;
  drawQRCode(ctx, addressQRImg, addressQRX, addressQRY, COMPOSITION_CONFIG.qrSize);

  const privateQRX = canvas.width * COMPOSITION_CONFIG.privateKeyPosition.x - COMPOSITION_CONFIG.qrSize;
  const privateQRY = canvas.height * COMPOSITION_CONFIG.privateKeyPosition.y;
  drawQRCode(ctx, privateQRImg, privateQRX, privateQRY, COMPOSITION_CONFIG.qrSize);

  const addressX = canvas.width * COMPOSITION_CONFIG.addressTextPosition.x;
  const addressY = canvas.height * COMPOSITION_CONFIG.addressTextPosition.y;
  const addressWidth = canvas.width * COMPOSITION_CONFIG.addressTextPosition.width;
  drawKeyText(
    ctx,
    wallet.address,
    addressX,
    addressY,
    addressWidth,
    COMPOSITION_CONFIG.textStyle.padding,
    COMPOSITION_CONFIG.textStyle.height,
    COMPOSITION_CONFIG.colors.address,
    90 // Rotate 90 degrees
  );

  const privateKeyX = canvas.width * COMPOSITION_CONFIG.privateKeyTextPosition.x;
  const privateKeyY = canvas.height * COMPOSITION_CONFIG.privateKeyTextPosition.y;
  const privateKeyWidth = canvas.width * COMPOSITION_CONFIG.privateKeyTextPosition.width;
  drawKeyText(
    ctx,
    wallet.privateKey,
    privateKeyX,
    privateKeyY,
    privateKeyWidth,
    COMPOSITION_CONFIG.textStyle.padding,
    COMPOSITION_CONFIG.textStyle.height,
    COMPOSITION_CONFIG.colors.privateKey,
    270 // Rotate 270 degrees
  );

  // Draw Satoshis amount if provided
  if (wallet.satoshis !== undefined && wallet.satoshis > 0) {
    // Draw main Satoshis text with "Satoshis" label
    const satoshisX = canvas.width * COMPOSITION_CONFIG.satoshisPosition.x;
    const satoshisY = canvas.height * COMPOSITION_CONFIG.satoshisPosition.y;
    // Max width: 25% of canvas width (more aggressive scaling)
    const satoshisMaxWidth = canvas.width * 0.25;
    drawSatoshisText(ctx, wallet.satoshis, satoshisX, satoshisY, satoshisMaxWidth);

    // Draw 4 additional number-only elements
    const satoshisValue = wallet.satoshis; // TypeScript guard
    // Max width: 15% of canvas width for corner positions (more aggressive)
    const numberMaxWidth = canvas.width * 0.15;
    COMPOSITION_CONFIG.satoshisNumberPositions.forEach(position => {
      const numberX = canvas.width * position.x;
      const numberY = canvas.height * position.y;
      drawSatoshisNumber(ctx, satoshisValue, numberX, numberY, numberMaxWidth);
    });
  }

  return canvas.toDataURL('image/png');
};

export const generateMultiWalletCompositeImage = async (wallets: WalletKeys[]): Promise<string> => {
  // Wait for fonts to load
  await document.fonts.ready;
  await document.fonts.load(`${COMPOSITION_CONFIG.satoshisTextStyle.fontSize}px Asset`);

  // Generate individual wallet images
  const walletImages: string[] = [];
  for (const wallet of wallets) {
    const walletImage = await generateCompositeImage(wallet);
    walletImages.push(walletImage);
  }

  // Load all wallet images
  const loadedImages = await Promise.all(
    walletImages.map(imgDataURL => loadImage(imgDataURL))
  );

  // Stack wallets vertically in a single column
  // Get dimensions of a single wallet image (all should be the same size)
  const singleWalletWidth = loadedImages[0].width;
  const singleWalletHeight = loadedImages[0].height;
  
  // Calculate spacing between wallets (20px gap)
  const gap = 20;
  const padding = 40; // Page padding
  
  // Calculate total canvas dimensions - single column, stacked vertically
  const totalWidth = singleWalletWidth + (padding * 2);
  const totalHeight = (singleWalletHeight * wallets.length) + (gap * (wallets.length - 1)) + (padding * 2);
  
  // Create canvas for multi-wallet layout
  const { canvas, ctx } = createCanvas(totalWidth, totalHeight);
  
  // Fill background with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  
  // Draw each wallet image stacked vertically
  for (let i = 0; i < loadedImages.length; i++) {
    const x = padding;
    const y = padding + (i * (singleWalletHeight + gap));
    
    ctx.drawImage(loadedImages[i], x, y);
  }
  
  return canvas.toDataURL('image/png');
};

