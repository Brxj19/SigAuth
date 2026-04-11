import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthParticleCanvas from '../components/AuthParticleCanvas';
import { ProductMark } from '../components/Icons';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../branding';
import { useAuth } from '../contexts/AuthContext';

const LOTTIE_SCRIPT_ID = 'not-found-dotlottie-script';
const LOTTIE_SCRIPT_SRC = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js';
const LOTTIE_ANIMATION_SRC = 'https://lottie.host/9432e88c-553f-427a-b8de-aa69881bb976/F5ObuN8IrE.lottie';

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (document.getElementById(LOTTIE_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.id = LOTTIE_SCRIPT_ID;
    script.type = 'module';
    script.src = LOTTIE_SCRIPT_SRC;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="auth-cosmos-shell not-found-shell flex min-h-screen items-center justify-center px-4 py-10">
      <AuthParticleCanvas />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center">
        <div className="not-found-brand">
          <ProductMark className="h-11 w-11" />
          <div>
            <h1>{PRODUCT_NAME}</h1>
            <p>{PRODUCT_TAGLINE}</p>
          </div>
        </div>

        <dotlottie-wc
          src={LOTTIE_ANIMATION_SRC}
          className="not-found-animation"
          style={{ width: 'min(92vw, 46rem)', height: 'min(62vh, 36rem)' }}
          autoplay
          loop
        />

        <div className="not-found-copy">
          <span className="not-found-code">404</span>
          <h2>This page drifted out of orbit.</h2>
          <p>
            The page you are looking for does not exist, may have moved, or the link is no longer valid.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="btn-primary">
            {isAuthenticated ? 'Go to dashboard' : 'Back to home'}
          </Link>
          {!isAuthenticated ? (
            <Link to="/login" className="btn-secondary">
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
