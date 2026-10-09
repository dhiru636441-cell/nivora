import { HotelKnowledgeDocument } from './types';

export const HOTEL_KNOWLEDGE_DOCUMENTS: HotelKnowledgeDocument[] = [
  {
    id: 'doc_policy_checkin_checkout',
    category: 'policy',
    title: 'Nivora Check-In & Check-Out Policy',
    content: `Standard arrival time is 15:00 (3:00 PM) local resort time. Departure time is strictly 11:00 AM. Early check-in from 10:00 AM is subject to operational room readiness and inspection by housekeeping. Late checkout up to 14:00 (2:00 PM) may be authorized by the Front Desk upon request without additional charge for Platinum & Diamond loyalty tiers. For departures after 14:00, a half-day room charge applies. All arriving guests must present valid government photo identification or passport.`,
    keywords: ['check-in', 'checkout', 'departure', 'arrival', 'timing', 'late checkout', 'identification', 'passport'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_policy_cancellation',
    category: 'policy',
    title: 'Cancellation & Guarantee Policy',
    content: `Direct reservations cancelled at least 72 hours prior to the scheduled 15:00 arrival time receive a full 100% refund without penalty. Cancellations within 72 hours or failure to arrive (No Show) incur a fee equal to the first two nights' room charge and applicable tax. For festive peak seasons (Dec 20 - Jan 5), a 14-day notice is required for complimentary cancellation.`,
    keywords: ['cancellation', 'refund', 'penalty', 'no show', 'deposit', 'policy', 'guarantee'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_room_presidential',
    category: 'room_spec',
    title: 'Presidential Penthouse Suite Specifications',
    content: `The Presidential Penthouse spans 140 square meters on the 3rd floor featuring dual master king suites, floor-to-ceiling panoramic ocean horizon windows, a private cantilever infinity terrace with heated hydromassage jacuzzi, personal 24-hour butler dispatch, Bang & Olufsen acoustic system, Bvlgari white tea bathroom amenities, private wine humidor, and priority spa reservations. Maximum occupancy: 4 adult guests.`,
    keywords: ['presidential', 'penthouse', 'suite', 'butler', 'jacuzzi', 'ocean view', 'room 301', 'capacity'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_room_deluxe_ocean',
    category: 'room_spec',
    title: 'Deluxe Oceanfront Horizon Room Specifications',
    content: `Located on the 2nd floor, each 65 square meter Deluxe Oceanfront Horizon Room offers uninterrupted vistas of the coral reef and azure coastline. Includes private teak balcony, king plush bedding with 800-thread Egyptian cotton, open-concept rain shower, artisanal espresso bar, smart environmental climate control, and dedicated high-speed fiber Wi-Fi. Maximum occupancy: 2 guests.`,
    keywords: ['deluxe', 'ocean', 'horizon', 'balcony', 'king bed', 'floor 2', 'room 201', 'room 202', 'room 204'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_room_villa',
    category: 'room_spec',
    title: 'Executive Sanctuary Garden Villa Specifications',
    content: `Positioned on the ground sanctuary level, the 95 square meter Executive Villa is sheltered by tropical frangipani and palm gardens. Features a private outdoor emerald plunge pool, teak open-air sun deck, semi-outdoor rainwater shower, outdoor daybed, and complimentary evening turndown service. Maximum occupancy: 3 guests.`,
    keywords: ['executive villa', 'sanctuary', 'plunge pool', 'garden', 'private pool', 'villa', 'room 101', 'room 102'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_dining_hours',
    category: 'dining',
    title: 'Dining Venues, Menus & In-Suite Service',
    content: `Nivora hosts two culinary destinations: 'The Horizon Terrace' (open 07:00 - 23:00, specializing in caught-daily seafood, Mediterranean woodfire grill, and vintage wines) and 'The Lotus Pavilion' (open 12:00 - 22:00, pan-Asian organic wellness cuisine). 24-hour In-Suite Dining is accessible directly via the Guest Portal or room phone. Breakfast is served complimentary from 07:00 to 11:00 for villa and suite guests.`,
    keywords: ['dining', 'restaurant', 'food', 'breakfast', 'room service', 'wine', 'hours', 'seafood'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_wellness_spa',
    category: 'wellness',
    title: 'Nivora Royal Wellness & Reflection Spa',
    content: `Operating daily from 08:00 to 20:00. Offers therapeutic volcanic stone treatments, cedar herbal steam baths, traditional Ayurvedic balancing rituals, and guided morning meditation by the reflection pool. In-suite spa appointments are available for Presidential Suite and Garden Villa guests upon 2 hours' notice.`,
    keywords: ['spa', 'wellness', 'massage', 'ayurvedic', 'reflection pool', 'steam bath', 'meditation'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_sop_complaints',
    category: 'sop',
    title: 'Standard Operating Procedure: Guest Complaint Resolution',
    content: `All reported guest concerns (HVAC temperature, noise, slow dining delivery) must be acknowledged by staff within 10 minutes. If resolution exceeds 30 minutes, the Duty Manager must be notified immediately and an automated priority ticket generated. Front Desk staff are authorized to provide a complimentary $75 dining credit or spa pass for validated inconveniences without executive sign-off.`,
    keywords: ['complaint', 'resolution', 'sop', 'service level', 'delay', 'duty manager', 'compensation', 'staff'],
    updated_at: '2026-10-01',
  },
  {
    id: 'doc_sop_housekeeping_turnover',
    category: 'sop',
    title: 'Housekeeping Turnover Clean Standards',
    content: `Turnover cleans must strictly adhere to the 42-point Nivora Luxury Protocol: complete bed linen replacement with sterilized cottons, chemical disinfection of bathroom surfaces and whirlpool jets, balcony glass polish, espresso bar replenish, climate reset to 21°C (70°F), and physical inspection sign-off. Average turnover duration is 45 minutes for suites and 60 minutes for private villas. Rooms must never be marked clean while guest checkout is pending.`,
    keywords: ['housekeeping', 'turnover', 'cleaning', 'sanitization', 'inspection', 'protocol', 'dirty', 'clean'],
    updated_at: '2026-10-01',
  },
];

export function retrieveKnowledgeChunks(query: string, limit: number = 3): HotelKnowledgeDocument[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return HOTEL_KNOWLEDGE_DOCUMENTS.slice(0, limit);

  const scored = HOTEL_KNOWLEDGE_DOCUMENTS.map(doc => {
    let score = 0;
    const fullText = (doc.title + ' ' + doc.content + ' ' + doc.keywords.join(' ')).toLowerCase();
    
    for (const word of queryWords) {
      if (doc.title.toLowerCase().includes(word)) score += 5;
      if (doc.keywords.some(k => k.toLowerCase().includes(word))) score += 4;
      if (fullText.includes(word)) score += 1;
    }

    return { doc, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.doc);
}
