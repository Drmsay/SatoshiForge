const PRINT_STYLES = `
  @media print {
    @page {
      margin: 0;
      size: auto;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
    }
    .wallet-page {
      page-break-inside: avoid;
      break-inside: avoid;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0;
      padding: 0;
    }
    .print-image {
      width: 100%;
      height: auto;
      max-width: 100%;
      object-fit: contain;
      page-break-inside: avoid;
      break-inside: avoid;
      display: block;
    }
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    background: white;
  }
  .wallet-page {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
    padding: 0;
  }
  .print-image {
    max-width: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  }
  @media screen {
    body {
      background: #f0f0f0;
      padding: 20px;
    }
    .wallet-page {
      margin-bottom: 20px;
      padding: 20px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
  }
`;

const createPrintHTML = (imageDataURLs: string | string[]): string => {
  const images = Array.isArray(imageDataURLs) ? imageDataURLs : [imageDataURLs];
  
  const walletPages = images.map((img, index) => 
    `<div class="wallet-page">
      <img src="${img}" class="print-image" alt="Bitcoin Wallet ${index + 1}" />
    </div>`
  ).join('\n');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bitcoin Wallet - Print</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      ${walletPages}
    </body>
    </html>
  `;
};

const openPrintWindow = (html: string): Window => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Please allow popups to print');
  printWindow.document.write(html);
  printWindow.document.close();
  return printWindow;
};

const triggerPrint = (printWindow: Window): void => {
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 500);
  };
};

export const printWallet = (): void => {
  const individualImages = (window as any).individualWalletImages;
  const compositeImage = (window as any).compositeWalletImage;
  
  if (!compositeImage) {
    alert('Please generate wallet(s) first');
    return;
  }

  // Use individual images if available (for proper page breaks), otherwise use composite
  const imagesToPrint = individualImages && individualImages.length > 0 
    ? individualImages 
    : [compositeImage];
  
  const printHTML = createPrintHTML(imagesToPrint);
  const printWindow = openPrintWindow(printHTML);
  triggerPrint(printWindow);
};

export const setupPrintButton = (): void => {
  const printBtn = document.getElementById('printBtn');
  if (!printBtn) return;
  printBtn.onclick = () => printWallet();
};

