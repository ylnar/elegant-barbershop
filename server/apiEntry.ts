import 'dotenv/config';
import { createApp } from './app.ts';

// Entry API untuk Vercel Serverless Function.
// Di-bundle esbuild menjadi api/index.cjs (CJS murni) oleh build script,
// sehingga runtime Vercel tidak pernah mengompilasi TypeScript sendiri.
const app = createApp();

export default function handler(
  req: Parameters<typeof app>[0],
  res: Parameters<typeof app>[1],
) {
  return app(req, res);
}
