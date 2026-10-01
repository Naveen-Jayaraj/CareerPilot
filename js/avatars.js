/**
 * Colorful Company Avatar Badges & Logo Resolver
 * Automatically pulls official high-res company logos via domain matching
 * with smooth fallback to vibrant curated gradient initials.
 */

const KNOWN_DOMAINS = {
  'goldman sachs': 'goldmansachs.com',
  'jp morgan': 'jpmorgan.com',
  'jpmorgan': 'jpmorgan.com',
  'jpmorgan chase': 'jpmorganchase.com',
  'morgan stanley': 'morganstanley.com',
  'bain': 'bain.com',
  'bain & company': 'bain.com',
  'mckinsey': 'mckinsey.com',
  'bcg': 'bcg.com',
  'boston consulting group': 'bcg.com',
  'google': 'google.com',
  'microsoft': 'microsoft.com',
  'amazon': 'amazon.com',
  'apple': 'apple.com',
  'meta': 'meta.com',
  'facebook': 'meta.com',
  'netflix': 'netflix.com',
  'uber': 'uber.com',
  'stripe': 'stripe.com',
  'airbnb': 'airbnb.com',
  'spotify': 'spotify.com',
  'twitter': 'x.com',
  'x': 'x.com',
  'adobe': 'adobe.com',
  'salesforce': 'salesforce.com',
  'oracle': 'oracle.com',
  'cisco': 'cisco.com',
  'intel': 'intel.com',
  'nvidia': 'nvidia.com',
  'amd': 'amd.com',
  'qualcomm': 'qualcomm.com',
  'atlassian': 'atlassian.com',
  'tcs': 'tcs.com',
  'tata consultancy services': 'tcs.com',
  'infosys': 'infosys.com',
  'wipro': 'wipro.com',
  'cognizant': 'cognizant.com',
  'accenture': 'accenture.com',
  'hcl': 'hcltech.com',
  'hcl tech': 'hcltech.com',
  'hcl technologies': 'hcltech.com',
  'deloitte': 'deloitte.com',
  'pwc': 'pwc.com',
  'ey': 'ey.com',
  'ernst & young': 'ey.com',
  'kpmg': 'kpmg.com',
  'barclays': 'barclays.com',
  'hsbc': 'hsbc.com',
  'swiggy': 'swiggy.com',
  'zomato': 'zomato.com',
  'flipkart': 'flipkart.com',
  'razorpay': 'razorpay.com',
  'cred': 'cred.club',
  'zepto': 'zepto.com',
  'blinkit': 'blinkit.com',
  'phonepe': 'phonepe.com',
  'paytm': 'paytm.com',
  'ola': 'olacabs.com',
  'zoho': 'zoho.com',
  'freshworks': 'freshworks.com',
  'postman': 'postman.com',
  'github': 'github.com',
  'gitlab': 'gitlab.com',
  'slack': 'slack.com',
  'notion': 'notion.so',
  'linear': 'linear.app',
  'figma': 'figma.com',
  'canva': 'canva.com',
  'ibm': 'ibm.com',
  'dell': 'dell.com',
  'hp': 'hp.com',
  'samsung': 'samsung.com',
  'sony': 'sony.com'
};

export function getCompanyDomain(companyName) {
  if (!companyName) return '';
  const trimmed = companyName.trim().toLowerCase();
  if (KNOWN_DOMAINS[trimmed]) return KNOWN_DOMAINS[trimmed];
  if (trimmed.includes('.') && !trimmed.includes(' ')) return trimmed;
  const sanitized = trimmed.replace(/[^a-z0-9]/g, '');
  return sanitized ? `${sanitized}.com` : '';
}

export function getCompanyAvatar(companyName, size = 26) {
  const name = companyName || 'Job';
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  const initials = clean.length >= 2 ? clean.substring(0, 2).toUpperCase() : (clean[0] || 'J').toUpperCase();
  const domain = getCompanyDomain(name);

  // Curated harmonious gradients
  const palettes = [
    { from: '#6366f1', to: '#a855f7' },
    { from: '#3b82f6', to: '#06b6d4' },
    { from: '#10b981', to: '#059669' },
    { from: '#f59e0b', to: '#ea580c' },
    { from: '#ec4899', to: '#f43f5e' },
    { from: '#8b5cf6', to: '#ec4899' },
    { from: '#0ea5e9', to: '#6366f1' },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const p = palettes[Math.abs(hash) % palettes.length];
  const fontSize = Math.max(10, Math.round(size * 0.4));
  const radius = size >= 40 ? 10 : 7;

  if (!domain) {
    return `
      <span class="company-avatar-badge" style="width: ${size}px; height: ${size}px; min-width: ${size}px; font-size: ${fontSize}px; background: linear-gradient(135deg, ${p.from}, ${p.to}); color: #ffffff; border-radius: ${radius}px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; box-shadow: 0 2px 8px ${p.from}44; text-shadow: 0 1px 2px rgba(0,0,0,0.25);">
        ${initials}
      </span>
    `;
  }

  const logoUrl = `https://unavatar.io/${domain}?fallback=false`;

  return `
    <span class="company-avatar-wrapper" style="width: ${size}px; height: ${size}px; min-width: ${size}px; position: relative; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
      <img src="${logoUrl}" 
           alt="${clean}" 
           class="company-logo-img" 
           loading="lazy"
           style="width: ${size}px; height: ${size}px; border-radius: ${radius}px; object-fit: contain; background: #ffffff; padding: ${size >= 40 ? 4 : 2}px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: inline-block;" 
           onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" 
      />
      <span class="company-avatar-badge" style="display: none; width: ${size}px; height: ${size}px; font-size: ${fontSize}px; background: linear-gradient(135deg, ${p.from}, ${p.to}); color: #ffffff; border-radius: ${radius}px; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-mono); box-shadow: 0 2px 8px ${p.from}44; text-shadow: 0 1px 2px rgba(0,0,0,0.25);">
        ${initials}
      </span>
    </span>
  `;
}
