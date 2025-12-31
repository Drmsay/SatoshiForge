import './assets/asset-font.css';
import { DOM, showLoading, hideLoading, generateWallet } from './ui';

const initializeApp = (): void => {
  DOM.generateBtn().addEventListener('click', () => {
    setTimeout(() => {
      generateWallet().catch(error => {
        console.error('Error generating wallet:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Error generating wallet: ${errorMessage}\n\nPlease check the console for more details.`);
        hideLoading();
      });
    }, 10);
  });
};

initializeApp();
