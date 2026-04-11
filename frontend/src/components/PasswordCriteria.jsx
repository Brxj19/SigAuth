import React from 'react';

export function evaluatePasswordPolicy(password) {
  const value = password || '';
  return [
    { id: 'length', label: 'At least 8 characters', valid: value.length >= 8 },
    { id: 'upper', label: 'At least 1 uppercase letter', valid: /[A-Z]/.test(value) },
    { id: 'lower', label: 'At least 1 lowercase letter', valid: /[a-z]/.test(value) },
    { id: 'digit_or_symbol', label: 'At least 1 digit or special character', valid: /[\d\W_]/.test(value) },
  ];
}

export default function PasswordCriteria({ password }) {
  const rules = evaluatePasswordPolicy(password);
  return (
    <div className="password-criteria">
      {rules.map((rule) => (
        <div key={rule.id} className={`password-rule ${rule.valid ? 'valid' : 'invalid'}`}>
          <span className="password-rule-dot" />
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
}
