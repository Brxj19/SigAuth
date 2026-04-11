import React from 'react';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../branding';
import productLogo from '../assets/logo.png';
import loaderGif from '../assets/loader.gif';

export default function LoadingScreen() {
  return (
    <div className="app-loading-screen" role="status" aria-live="polite">
      <div className="app-loading-card">
        <img src={productLogo} alt={PRODUCT_NAME} className="app-loading-logo" />
        <img src={loaderGif} alt="Loading" className="app-loading-gif" />
        <div className="app-loading-copy">
          <h1>{PRODUCT_NAME}</h1>
          <p>{PRODUCT_TAGLINE}</p>
        </div>
      </div>
    </div>
  );
}
