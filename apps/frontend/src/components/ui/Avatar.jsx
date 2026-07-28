import React from 'react';

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
];

export function getInitials(name = '') {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradientByName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export function Avatar({ name = '', size = 'md', className = '' }) {
  const initials = getInitials(name);
  const gradient = getGradientByName(name);

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 text-xs font-semibold'
      : size === 'lg'
      ? 'w-12 h-12 text-base font-bold'
      : 'w-10 h-10 text-sm font-semibold';

  return (
    <div
      className={`rounded-full bg-linear-to-br ${gradient} text-white flex items-center justify-center shadow-sm shrink-0 uppercase tracking-wider select-none ${sizeClasses} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
