/**
 * Application entry point - initializes wallet generator UI
 */
import './assets/asset-font.css';
import { DOM, showLoading, hideLoading, generateWallet } from './ui';

/**
 * Initializes the application by setting up the generate button event listener
 */
const initializeApp = (): void => {
  DOM.generateBtn().addEventListener('click', () => {
    // Small delay to ensure UI updates before async operation
    setTimeout(() => {
      const handleError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Error generating wallet: ${errorMessage}\n\nPlease check the console for more details.`);
        hideLoading();
      };

      generateWallet().then(undefined, handleError);
    }, 10);
  });
};

initializeApp();
