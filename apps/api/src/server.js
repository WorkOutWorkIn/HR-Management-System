import app from './app.js';
import env from './config/env.js';
import { testDatabaseConnection } from './config/db.js';
import { logProcessError } from './utils/errorLogger.js';

process.on('uncaughtException', (error) => {
  logProcessError('UNCAUGHT EXCEPTION', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logProcessError('UNHANDLED REJECTION', reason);
  process.exit(1);
});

async function startServer() {
  if (env.db.connectOnBoot) {
    await testDatabaseConnection();
  }

  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  logProcessError('SERVER START FAILURE', error);
  process.exit(1);
});
