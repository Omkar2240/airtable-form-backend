import express from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import pkg from 'body-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import airtableRoutes from './routes/airtable.routes.js';
import formsRoutes from './routes/form.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
const { json } = pkg;
dotenv.config();

const app = express();

app.use(json());
app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'airtable-form-builder-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
  }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type','Authorization','x-user-id'],
  methods: ['GET','POST']
}));
app.use('/auth/airtable', airtableRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/webhooks', webhookRoutes);

connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Mongo connected');
    app.listen(process.env.PORT || 4000, () =>
      console.log(`Server running on http://localhost:${process.env.PORT || 4000}`)
    );
  })
  .catch(err => console.error(err));
