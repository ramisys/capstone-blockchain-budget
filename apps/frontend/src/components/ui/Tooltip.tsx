import React, { useState } from 'react';

export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-30 px-2.5 py-1 text-xs font-medium text-[var(--color-text-inverse)] bg-[var(--color-primary-dark)] rounded-lg shadow-md whitespace-nowrap pointer-events-none transition-all duration-200 transform ${
            position === 'top'
              ? '-top-9 left-1/2 -translate-x-1/2'
              : position === 'bottom'
              ? 'top-9 left-1/2 -translate-x-1/2'
              : position === 'left'
              ? 'right-full top-1/2 -translate-y-1/2 mr-2'
              : 'left-full top-1/2 -translate-y-1/2 ml-2'
          }`}
          role="tooltip"
        >
          {text}
          <div
            className={`absolute w-2 h-2 bg-[var(--color-primary-dark)] rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1'
                : 'right-full top-1/2 -translate-y-1/2 translate-x-1'
            }`}
          />
        </div>
      )}
    </div>
  );
}
