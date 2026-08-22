import { AIConsultationRequest, AIConsultationResponse } from '../types';

export const aiService = {
  async getAIConsultation(request: AIConsultationRequest): Promise<AIConsultationResponse> {
    try {
      const res = await fetch('/api/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('AI consultation network fallback:', e);
    }

    // Default heuristic fallback if network fails
    return {
      recommendedStyleName: 'The Classic Executive Side-Part',
      reasoning: 'Gaya potongan klasik yang proporsional, rapi, dan memberikan impresi eksekutif terpercaya.',
      stylingTips: [
        'Gunakan pomade matte atau sea salt spray saat rambut setengah basah.',
        'Sisir belah samping dengan rapi.',
        'Keringkan dengan blow dryer arah diagonal.',
      ],
      recommendedProduct: 'High-Hold Matte Pomade',
      recommendedService: 'The Signature Gentleman Haircut',
      maintenanceSchedule: 'Rapikan setiap 3 minggu sekali.',
      isAiPowered: false,
      source: 'Offline Master Barber Knowledge Base',
    };
  },
};
