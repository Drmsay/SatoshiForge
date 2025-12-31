const PRINT_STYLES = `
  @media print {
    @page {
      margin: 0;
      size: auto;
    }
    body {
      margin: 0;
      padding: 0;
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
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: white;
  }
  .print-image {
    max-width: 100%;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  @media screen {
    body {
      background: #f0f0f0;
      padding: 20px;
    }
  }
`;

const createPrintHTML = (imageDataURL: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bitcoin Wallet - Print</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      <img src="${imageDataURL}" class="print-image" alt="Bitcoin Wallet" />
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
  const compositeImage = (window as any).compositeWalletImage;
  if (!compositeImage) {
    alert('Please generate a wallet first');
    return;
  }

  const printHTML = createPrintHTML(compositeImage);
  const printWindow = openPrintWindow(printHTML);
  triggerPrint(printWindow);
};

export const setupPrintButton = (): void => {
  const printBtn = document.getElementById('printBtn');
  if (!printBtn) return;
  printBtn.onclick = () => printWallet();
};

