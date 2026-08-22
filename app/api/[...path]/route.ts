import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Catch-all: endpoint /api/* yang tidak dikenal -> JSON 404 (paritas dengan server lama)
export function GET() {
  return json({ error: 'Endpoint tidak ditemukan.' }, 404);
}

export function POST() {
  return json({ error: 'Endpoint tidak ditemukan.' }, 404);
}

export function PUT() {
  return json({ error: 'Endpoint tidak ditemukan.' }, 404);
}

export function DELETE() {
  return json({ error: 'Endpoint tidak ditemukan.' }, 404);
}

export function PATCH() {
  return json({ error: 'Endpoint tidak ditemukan.' }, 404);
}
