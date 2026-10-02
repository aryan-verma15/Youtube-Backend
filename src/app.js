import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error.middlewares.js';

const app = express();

// cors is a middleware
// CORS -> Cross-Origin Resource Sharing
// when request come from different port or domain name then CORS is used to decide which port or domain name can send request to this server

// CORS is all about controlling who is allowed to send requests to your server based on:
// ✅ Protocol (http:// or https://)
// ✅ Domain name (example.com or examples.com)
// ✅ Port (:3000, :5000, etc.)

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }),
);

// common middleware
app.use(express.json({ limit: '16kb' }));
app.use(
    express.urlencoded({
        extended: true,
        limit: '16kb',
    }),
);
app.use(express.static('public'));
app.use(cookieParser());

// import routes
import healthcheckRouter from './routes/healthcheck.routes.js';
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';

// route
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/video', videoRouter);

app.use(errorHandler);



export { app };
