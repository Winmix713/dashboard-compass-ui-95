export function sanitizeCssInput(cssCode: string): string {
  // Remove potentially dangerous CSS contents
  return cssCode
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/behavior\s*:/gi, '')
    .replace(/@import/gi, '')
    .trim();
}

export function validateFigmaUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.figma.com' && 
           (urlObj.pathname.includes('/design/') || urlObj.pathname.includes('/file/'));
  } catch {
    return false;
  }
}

export function validateFigmaToken(token: string): boolean {
  return token.startsWith('figd_') && token.length > 20;
}

export function sanitizeComponentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[0-9]/, 'Component')
    .replace(/^\w/, c => c.toUpperCase()) || 'FigmaComponent';
}