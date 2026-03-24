import env from '../config/env.js';

export function getHealth(_request, response) {
  response.status(200).json({
    status: 'ok',
    service: 'secure-hrms-api',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
  });
}
