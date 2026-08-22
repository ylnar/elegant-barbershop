import 'dotenv/config';
import { createApp } from '../server/app.ts';

// Express app diekspos LANGSUNG sebagai handler Vercel.
// Runtime Node @vercel/node memanggil handler dengan objek req/res
// yang kompatibel Node, jadi TIDAK perlu wrapper serverless-http
// (wrapper itu justru membuat permintaan menggantung -> 500 di semua route).
const app = createApp();

export default function handler(
  req: Parameters<typeof app>[0],
  res: Parameters<typeof app>[1],
) {
  return app(req, res);
}
