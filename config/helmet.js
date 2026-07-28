import helmet from 'helmet';

export const helmetOptions = helmet({
  contentSecurityPolicy: false, // Turned off for API servers
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});
