/**
 * Colorful Company Avatar Badges & Fun Visual Helpers
 * Brings vibrant life and instant recognition to companies across all views.
 */

export function getCompanyAvatar(companyName, size = 26) {
  const name = companyName || 'Job';
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  const initials = clean.length >= 2 ? clean.substring(0, 2).toUpperCase() : (clean[0] || 'J').toUpperCase();

  // Curated harmonious gradients
  const palettes = [
    { from: '#6366f1', to: '#a855f7' }, // Indigo-Violet
    { from: '#3b82f6', to: '#06b6d4' }, // Blue-Cyan
    { from: '#10b981', to: '#059669' }, // Emerald-Teal
    { from: '#f59e0b', to: '#ea580c' }, // Amber-Orange
    { from: '#ec4899', to: '#f43f5e' }, // Pink-Rose
    { from: '#8b5cf6', to: '#ec4899' }, // Purple-Pink
    { from: '#0ea5e9', to: '#6366f1' }, // Sky-Indigo
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const p = palettes[Math.abs(hash) % palettes.length];

  return `
    <span class="company-avatar-badge" style="width: ${size}px; height: ${size}px; min-width: ${size}px; font-size: ${Math.max(10, Math.round(size * 0.42))}px; background: linear-gradient(135deg, ${p.from}, ${p.to}); color: #ffffff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; box-shadow: 0 2px 8px ${p.from}44; text-shadow: 0 1px 2px rgba(0,0,0,0.25);">
      ${initials}
    </span>
  `;
}
