import React from 'react';

export default function Card({ title, subtitle, actions, className = '', children }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || subtitle || actions) ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-semibold text-gray-900">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
