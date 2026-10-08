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

  const fontSize = Math.max(9, Math.round(size * 0.38));
  const radius = size >= 40 ? 14 : 10;

  if (!domain) {
    return `
      <span class="company-avatar-badge" style="width: ${size}px; height: ${size}px; min-width: ${size}px; font-size: ${fontSize}px; background: #FAFAF8; color: #0F0F11; border: 1px solid rgba(15, 15, 17, 0.10); border-radius: ${radius}px; display: inline-flex; align-items: center; justify-content: center; font-weight: 500; font-family: var(--font-mono, 'Geist Mono'); flex-shrink: 0; box-shadow: 0 1px 2px rgba(15, 15, 17, 0.04);">
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
           style="width: ${size}px; height: ${size}px; border-radius: ${radius}px; object-fit: contain; background: #FFFFFF; border: 1px solid rgba(15, 15, 17, 0.08); padding: ${size >= 40 ? 4 : 2}px; box-shadow: 0 1px 2px rgba(15, 15, 17, 0.04); display: inline-block;" 
           onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" 
      />
      <span class="company-avatar-badge" style="display: none; width: ${size}px; height: ${size}px; font-size: ${fontSize}px; background: #FAFAF8; color: #0F0F11; border: 1px solid rgba(15, 15, 17, 0.10); border-radius: ${radius}px; align-items: center; justify-content: center; font-weight: 500; font-family: var(--font-mono, 'Geist Mono'); box-shadow: 0 1px 2px rgba(15, 15, 17, 0.04);">
        ${initials}
      </span>
    </span>
  `;
}

