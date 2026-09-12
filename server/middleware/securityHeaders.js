// Production security headers middleware
// Complies with OWASP Top 10 and Phase 12 Production Configuration

export function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy disabling unused sensitive hardware APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

  // Cross-Origin Resource Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Content Security Policy (CSP) tailored for the React frontend, Google Fonts, Unsplash images & Firebase
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.unsplash.com https://*.firebasestorage.app https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
    "frame-src 'self' https://*.firebaseapp.com",
    "object-src 'none'",
    "base-uri 'self'"
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Enforce HTTPS HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Hide Express server header
  res.removeHeader('X-Powered-By');

  next();
}
