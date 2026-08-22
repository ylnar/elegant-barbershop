import 'dotenv/config';
import serverless from 'serverless-http';
import { createApp } from '../server/app.ts';

const app = createApp();
const wrappedHandler = serverless(app);

export default function handler(req: unknown, res: unknown) {
  return wrappedHandler(req, res);
}
