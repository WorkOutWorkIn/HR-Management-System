import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import apiRouter from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { hydrateAuthContext } from './middlewares/auth.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { requestContextMiddleware } from './middlewares/requestContext.middleware.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

morgan.token('request-id', (request) => request.requestContext?.requestId || 'n/a');

app.use(requestContextMiddleware);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: env.appOrigins,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(
  morgan(
    env.nodeEnv === 'production'
      ? ':request-id :remote-addr :method :url :status :res[content-length] - :response-time ms'
      : ':request-id :method :url :status :response-time ms',
  ),
);
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.bodyLimit }));
app.use(cookieParser());
app.use(hydrateAuthContext);

app.get('/', (_request, response) => {
  response.json({
    name: 'secure-hrms-api',
    status: 'ok',
    apiPrefix: env.apiPrefix,
  });
});

app.use(env.apiPrefix, apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
