import { GoogleGenAI } from '@google/genai';
import { AIConsultationRequest, AIConsultationResponse } from '@/types';
import { isRateLimited, json, readBody, sanitizeString, tooManyRequests } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialize Gemini AI client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Error initializing Gemini client:', err);
    return null;
  }
}

const fallbackRecommendations: Record<string, AIConsultationResponse> = {
  Oval: {
    recommendedStyleName: 'The Classic Executive Side-Part & Low Skin Fade',
    reasoning: 'Bentuk wajah Oval memiliki proporsi ideal dan seimbang. Side-part bertekstur dengan low fade mempertegas garis rahang tanpa membuat wajah terlihat terlalu lonjong.',
    stylingTips: [
      'Gunakan matte paste atau water-based pomade dengan kilau sedang saat rambut setengah kering.',
      'Sisir ke arah diagonal belakang (45 derajat) untuk memberi dimensi natural.',
      'Gunakan blow dryer suhu sedang untuk mengunci volume bagian atas.',
    ],
    recommendedProduct: 'High-Hold Matte Clay & Sea Salt Spray',
    recommendedService: 'The Signature Gentleman Haircut',
    maintenanceSchedule: 'Rapikan fade setiap 3 minggu sekali.',
  },
  Square: {
    recommendedStyleName: 'Modern Textured French Crop with Sharp Taper',
    reasoning: 'Wajah Square memiliki rahang tegas yang sangat maskulin. Textured Crop di atas dengan taper fade samping melembutkan sudut dahi namun tetap menonjolkan kekuatan rahang Anda.',
    stylingTips: [
      'Tekan dan acak ringan bagian atas rambut dengan styling powder untuk hasil tekstur maksimal.',
      'Rapikan garis poni depan agar jatuh sejajar 1-2 cm di atas alis.',
      'Gunakan beard oil pada jenggot agar selaras dengan ketajaman garis rambut.',
    ],
    recommendedProduct: 'Volumizing Texture Dust & Matte Pomade',
    recommendedService: 'The Executive Package (Cut, Shave & Scalp Spa)',
    maintenanceSchedule: 'Kunjungi barber setiap 2.5 - 3 minggu.',
  },
  Round: {
    recommendedStyleName: 'High-Volume Pompadour with Mid Fade',
    reasoning: 'Untuk wajah Round (bulat), gaya bertinggi vertikal seperti Pompadour atau Quiff menciptakan ilusi wajah lebih panjang dan ramping serta memberikan kesan tegas berkelas.',
    stylingTips: [
      'Keringkan rambut ke arah atas menggunakan round brush untuk mengangkat akar rambut.',
      'Aplikasikan pomade berdaya rekat tinggi mulai dari pangkal rambut ke ujung.',
      'Jaga sisi samping tetap pendek dan rapi agar siluet wajah tidak melebar.',
    ],
    recommendedProduct: 'Heavy Hold Water-Soluble Pomade',
    recommendedService: 'The Signature Gentleman Haircut',
    maintenanceSchedule: 'Potong rambut setiap 3 minggu.',
  },
  Diamond: {
    recommendedStyleName: 'Textured Scissor Quiff with Natural Taper',
    reasoning: 'Wajah Diamond memiliki tulang pipi lebar dan dagu runcing. Scissor quiff bervolume natural memberikan keseimbangan sempurna pada dahi dan melembutkan transisi pipi.',
    stylingTips: [
      'Hindari memotong samping terlalu botak licin (skin fade tinggi). Pilih natural taper dengan gunting.',
      'Gunakan sea salt spray sebelum blow-dry untuk gelombang alami.',
      'Grooming jenggot tipis di dagu untuk menambah ketebalan rahang bawah.',
    ],
    recommendedProduct: 'Sea Salt Texture Spray & Medium Cream Paste',
    recommendedService: 'The Signature Gentleman Haircut',
    maintenanceSchedule: 'Perawatan setiap 3-4 minggu.',
  },
  Heart: {
    recommendedStyleName: 'Medium Length Slicked Back Undercut',
    reasoning: 'Bentuk wajah Heart memiliki dahi lebar dan dagu lancip. Slicked back bervolume seimbang memberikan proporsi simetris yang menawan dan elegan.',
    stylingTips: [
      'Sisir rambut ke belakang dengan gigi sisir renggang.',
      'Kombinasikan dengan jenggot rapi untuk menyeimbangkan area dagu.',
    ],
    recommendedProduct: 'Classic Shine Pomade & Nourishing Beard Balm',
    recommendedService: 'Royal Shave & Hot Towel Treatment',
    maintenanceSchedule: 'Rapikan setiap 3 minggu.',
  },
};

// POST /api/ai-consultant
export async function POST(req: Request) {
  if (isRateLimited(req, 20, 60000, 'ai')) {
    return tooManyRequests();
  }

  const { faceShape, hairTexture, lifestyle, desiredLength, beardPreference, notes } =
    await readBody(req) as AIConsultationRequest;

  const cleanFaceShape = sanitizeString(faceShape) || 'Oval';
  const cleanHairTexture = sanitizeString(hairTexture) || 'Lurus / Bergelombang';
  const cleanLifestyle = sanitizeString(lifestyle) || 'Profesional Eksekutif';
  const cleanLength = sanitizeString(desiredLength) || 'Sedang / Rapi';
  const cleanBeard = sanitizeString(beardPreference) || 'Rapi & Terawat';
  const cleanNotes = notes ? sanitizeString(notes) : 'Tidak ada';

  const client = getGenAIClient();

  if (!client) {
    const defaultResp = fallbackRecommendations[cleanFaceShape] || fallbackRecommendations['Oval'];
    return json({
      ...defaultResp,
      isAiPowered: false,
      source: 'Curated Master Barber Heuristic Logic',
    });
  }

  try {
    const prompt = `Anda adalah Master Barber & Style Director berpengalaman 15 tahun di barbershop "Elegant Barbershop Solok".
Berikan rekomendasi potongan rambut pria dan perawatan spesifik paling tepat berdasarkan profil pelanggan berikut:
- Bentuk Wajah: ${cleanFaceShape}
- Tekstur Rambut: ${cleanHairTexture}
- Aktivitas / Gaya Hidup: ${cleanLifestyle}
- Preferensi Panjang: ${cleanLength}
- Preferensi Jenggot / Kumis: ${cleanBeard}
- Catatan Khusus: ${cleanNotes}

Balas HANYA dalam format JSON yang valid (tanpa markdown blok tambahan) dengan struktur berikut:
{
  "recommendedStyleName": "Nama gaya rambut (e.g. Modern Textured Taper Fade)",
  "reasoning": "Penjelasan mengapa gaya ini sangat pas dengan bentuk wajah dan karakter dalam 2-3 kalimat dalam bahasa Indonesia",
  "stylingTips": [
    "Tip styling langkah 1",
    "Tip styling langkah 2",
    "Tip styling langkah 3"
  ],
  "recommendedProduct": "Produk grooming yang tepat",
  "recommendedService": "Nama layanan yang direkomendasikan",
  "maintenanceSchedule": "Rekomendasi jadwal pangkas kembali"
}`;

    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return json({
        ...parsed,
        isAiPowered: true,
        source: 'Gemini AI Model',
      });
    }

    throw new Error('Empty response from Gemini');
  } catch (err) {
    console.warn('AI Consultant fallback due to:', err);
    const defaultResp = fallbackRecommendations[cleanFaceShape] || fallbackRecommendations['Oval'];
    return json({
      ...defaultResp,
      isAiPowered: false,
      source: 'Master Barber Knowledge Base (Fallback)',
    });
  }
}
