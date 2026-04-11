import React from 'react';
import productLogo from '../assets/logo.png';
import loaderGif from '../assets/loader.gif';

export default function LoadingScreen() {
  return (
    <div className="app-loading-screen" role="status" aria-live="polite">
      <div className="app-loading-card">
        <img src={productLogo} alt="Mini Okta" className="app-loading-logo" />
        <img src={loaderGif} alt="Loading" className="app-loading-gif" />
        <div className="app-loading-copy">
          <h1>Mini Okta</h1>
          <p>Preparing your workspace.</p>
        </div>
      </div>
    </div>
  );
}
