import React from 'react';

export default function Input({ label, id, className = '', ...props }) {
  return (
    <div>
      {label ? <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label> : null}
      <input id={id} className={`input-field ${className}`.trim()} {...props} />
    </div>
  );
}
