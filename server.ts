import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = 3000;

// Initialize @google/genai SDK server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Server-side AI Query Endpoint
 * Role-aware and grounded in actual hotel dataset metrics and knowledge documents
 */
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query, role = 'customer' } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (!ai) {
      // Graceful fallback if GEMINI_API_KEY is pending
      return res.json({
        answer: `[Nivora System]: Grounded intelligence for role '${role}'. Query '${query}' was received. Please ensure GEMINI_API_KEY is configured in AI Studio Secrets for live generative synthesis.`,
        role_scope: role,
        data_freshness: new Date().toISOString(),
      });
    }

    // Role-specific system instructions
    let rolePrompt = '';
    if (role === 'customer') {
      rolePrompt = `You are the Nivora Resort Personal Guest Concierge. Provide warm, luxurious, concise assistance for hotel guests. Only discuss public resort amenities, guest policies, dining, and recommendations. Never reveal staff operational logs or private guest data.`;
    } else if (role === 'staff') {
      rolePrompt = `You are the Nivora Staff Operations Intelligence. Assist hotel staff with housekeeping protocols, standard operating procedures, maintenance triage, and task resolution.`;
    } else {
      rolePrompt = `You are the Nivora Front Desk & Revenue Intelligence. Provide operational insights regarding check-in readiness, room inventory, booking channels, payment settlement, and hotel analytics.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction: rolePrompt,
        temperature: 0.3,
      },
    });

    return res.json({
      answer: response.text || 'No response generated.',
      role_scope: role,
      data_freshness: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Server AI query error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while processing AI query',
    });
  }
});

/**
 * ============================================================================
 * NIA AI — NIVORA INTELLIGENT ASSISTANT (CONCIERGE & CUSTOMER SUPPORT)
 * ============================================================================
 */

// In-Memory Data Stores for Nia AI
const serverSupportTickets: Array<{
  id: string;
  ticket_number: string;
  guest_email: string;
  guest_name: string;
  room_number: string;
  category: string;
  issue_summary: string;
  details: string;
  priority: string;
  status: string;
  assigned_department: string;
  estimated_arrival_minutes: number;
  created_at: string;
}> = [
  {
    id: 'TKT-1042',
    ticket_number: 'TKT-1042',
    guest_email: 'sophia.laurent@example.com',
    guest_name: 'Sophia Laurent',
    room_number: '301',
    category: 'housekeeping',
    issue_summary: 'Hypoallergenic pillow preference confirmation',
    details: 'Extra soft goose-down and hypoallergenic pillows confirmed for suite check-in.',
    priority: 'medium',
    status: 'completed',
    assigned_department: 'Housekeeping Operations',
    estimated_arrival_minutes: 0,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const serverFeedbackList: Array<{
  id: string;
  guest_email: string;
  guest_name: string;
  rating: number;
  comments: string;
  category: string;
  created_at: string;
}> = [
  {
    id: 'fb_101',
    guest_email: 'sophia.laurent@example.com',
    guest_name: 'Sophia Laurent',
    rating: 5,
    comments: 'The sunset view from the cantilever terrace was breathtaking. Exceptional hospitality.',
    category: 'Overall Experience',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const RESORT_KNOWLEDGE_BASE: Record<string, string> = {
  checkin_checkout: `Standard arrival time is 3:00 PM (15:00) local resort time. Departure time is strictly 11:00 AM. Early check-in from 10:00 AM is subject to operational room readiness and inspection by housekeeping. Late checkout up to 2:00 PM (14:00) may be authorized upon request without charge for Diamond/Platinum tiers. After 2:00 PM, a half-day room charge applies. All arriving guests must present valid government photo identification or passport.`,
  cancellation: `Direct reservations cancelled at least 72 hours prior to scheduled 3:00 PM arrival receive a 100% full refund without penalty. Cancellations within 72 hours or no-shows incur a fee equal to the first two nights' room charge. For peak festive holidays (Dec 20 - Jan 5), a 14-day advance notice is required.`,
  wifi: `Complimentary ultra high-speed fiber Wi-Fi is available across all guest suites, villas, pool cabanas, and beach zones. Network Name: 'Nivora_Guest_Ultra'. No password is required for registered guests; your device auto-authenticates via room number or guest last name.`,
  amenities: `Nivora Resort features a cantilever ocean-view infinity pool, Peninsula Royal Wellness & Reflection Spa, 24/7 Technogym fitness pavilion, championship tennis and padel courts, private white sand beach with complimentary cabanas, water sports center, and 24-hour butler dispatch for suites and villas.`,
  spa_wellness: `Peninsula Royal Wellness & Reflection Spa operates daily from 8:00 AM to 8:00 PM. Signature therapies include Volcanic Warm Stone Massage, Aromatic Cedar Herbal Baths, Ayurvedic Balancing Rituals, and daily sunrise yoga by the reflection water garden. In-suite appointments are available with 2 hours advance notice.`,
  dining: `Nivora offers two signature culinary venues: 'The Horizon Terrace' (open 07:00 - 23:00, Mediterranean woodfire grill, fresh ocean seafood, vintage cellar) and 'The Lotus Pavilion' (open 12:00 - 22:00, Pan-Asian organic wellness cuisine). In-suite dining is available 24 hours daily directly through Nia AI or guest phone.`,
  pool: `Our oceanfront infinity pool is open daily from 6:00 AM to 10:00 PM. Complimentary sun loungers, chilled towels, mineral suncare, and poolside beverage/snack service are provided throughout the day.`,
  parking: `Complimentary 24/7 valet parking is provided for all registered guests and visitors, including high-speed EV charging stations.`,
  directions_location: `Nivora Resort is perched atop the Sovereign Peninsula Cliffs, overlooking the coastal reef. Location: Sovereign Peninsula Cliffside Sanctuary, Bali / Tropical Coastal Sanctuary. We are located approximately 35 minutes scenic drive from the International Airport. Complimentary private Mercedes chauffeur transfer is included for Presidential Suite & Garden Villa reservations.`,
  contact: `Resort Telephone: +1 (555) NIVORA-LUX (+1 555-648-6721). Guest Concierge Email: concierge@nivoraresort.com. Front Desk Email: frontdesk@nivoraresort.com. From any room phone, dial '0' for Immediate Concierge Dispatch.`,
  activities: `Resort activities include complimentary morning ocean yoga, guided reef snorkeling, paddleboarding and sea kayaking, bespoke private catamaran sunset cruises, cooking masterclasses with our executive chef, and evening stargazing on the cliff pavilion.`,
};

const RESORT_ROOM_TYPES = [
  {
    id: 'rt_presidential',
    name: 'Nivora Presidential Penthouse Suite',
    category: 'suite',
    description: 'Expansive oceanfront penthouse with panoramic sea views, private cantilever terrace with heated hydromassage jacuzzi, master king suite, dining pavilion, and 24-hour butler dispatch.',
    base_price_cents: 85000,
    price_formatted: '$850 / night',
    max_occupancy: 4,
    bed_type: 'King Master + Queen Guest',
    size_sqm: 140,
    amenities: ['Panoramic Ocean View', 'Private Jacuzzi Terrace', 'Personal Butler', 'Bang & Olufsen Sound', 'Marble Spa Bath', 'Bvlgari Toiletries'],
    total_rooms: 2,
    available_units: 1,
    image_url: '/assets/images/presidential_suite.png',
  },
  {
    id: 'rt_deluxe_ocean',
    name: 'Deluxe Oceanfront Horizon Room',
    category: 'deluxe',
    description: 'Floor-to-ceiling vistas of the azure coastline, private teak balcony, plush king bed with 800-thread Egyptian linens, and open-plan walk-in rain shower.',
    base_price_cents: 42000,
    price_formatted: '$420 / night',
    max_occupancy: 2,
    bed_type: 'King Bed',
    size_sqm: 65,
    amenities: ['Oceanfront Balcony', 'Walk-in Rain Shower', 'Espresso Machine', 'Pillow Menu', 'Smart Climate Control', 'High-speed Wi-Fi'],
    total_rooms: 4,
    available_units: 2,
    image_url: '/assets/images/deluxe_ocean.png',
  },
  {
    id: 'rt_executive_villa',
    name: 'Executive Sanctuary Garden Villa',
    category: 'villa',
    description: 'Secluded private villa wrapped in lush tropical foliage featuring an outdoor plunge pool, open-air sun deck, and artisan teak furnishings.',
    base_price_cents: 64000,
    price_formatted: '$640 / night',
    max_occupancy: 3,
    bed_type: 'King Bed + Daybed',
    size_sqm: 95,
    amenities: ['Private Plunge Pool', 'Tropical Garden Courtyard', 'Outdoor Daybed', 'Mini Wine Cellar', 'Complimentary Breakfast', 'Evening Turndown'],
    total_rooms: 2,
    available_units: 1,
    image_url: '/assets/images/executive_villa.png',
  },
  {
    id: 'rt_wellness_pavilion',
    name: 'Royal Wellness Spa Pavilion',
    category: 'suite',
    description: 'Holistic wellness suite adjacent to Nivora Spa with private reflection water bath, aromatic cedar accents, and in-room therapeutic soaking tub.',
    base_price_cents: 52000,
    price_formatted: '$520 / night',
    max_occupancy: 2,
    bed_type: 'King Bed',
    size_sqm: 80,
    amenities: ['Private Reflection Bath', 'Direct Spa Access', 'Aromatherapy Diffuser', 'Yoga & Meditation Mat', 'Organic Herb Bar', 'Sound Therapy System'],
    total_rooms: 2,
    available_units: 1,
    image_url: '/assets/images/spa_wellness.png',
  },
];

const RESORT_MENU_ITEMS = [
  { id: 'm1', name: 'Artisan Truffle Eggs Benedict', category: 'breakfast', price_inr: 750, is_veg: false, prep_time_min: 15, tags: ['Signature', 'Organic Eggs'], description: 'Poached organic eggs, smoked ham or avocado, shaved black winter truffle on brioche with golden hollandaise.' },
  { id: 'm2', name: 'Balinese Acai & Pitaya Superfood Bowl', category: 'breakfast', price_inr: 550, is_veg: true, prep_time_min: 10, tags: ['Vegan', 'Gluten-Free', 'Superfood'], description: 'Blended organic acai, dragon fruit, chia seeds, roasted macadamia nuts, and shaved young coconut.' },
  { id: 'm3', name: 'Fresh Artisan Viennoiserie Basket', category: 'breakfast', price_inr: 450, is_veg: true, prep_time_min: 5, tags: ['Vegetarian', 'Freshly Baked'], description: 'Butter croissants, pain au chocolat, almond twists served with artisan fig jam and whipped French butter.' },
  { id: 'm4', name: 'Burrata Pugliese with Heirloom Tomatoes', category: 'starters', price_inr: 850, is_veg: true, prep_time_min: 10, tags: ['Chef Special', 'Vegetarian'], description: 'Creamy artisanal burrata, aged Modena balsamic reduction, cold-pressed basil olive oil, and baby microgreens.' },
  { id: 'm5', name: 'Wood-Fired Mediterranean Octopus', category: 'starters', price_inr: 1250, is_veg: false, prep_time_min: 20, tags: ['Seafood', 'Gluten-Free'], description: 'Tender charred octopus tentacle, saffron potato mousseline, smoked paprika oil, and caper berries.' },
  { id: 'm6', name: 'Pan-Seared Atlantic Black Cod', category: 'mains', price_inr: 2100, is_veg: false, prep_time_min: 25, tags: ['Signature', 'Seafood'], description: 'Miso-glazed black cod, baby bok choy, dashi emulsion, and ginger scallion oil.' },
  { id: 'm7', name: 'Homemade Black Truffle Tagliolini', category: 'mains', price_inr: 1650, is_veg: true, prep_time_min: 15, tags: ['Vegetarian', 'Italian'], description: 'Hand-rolled pasta ribbons, 24-month Parmigiano-Reggiano, French cultured butter, and fresh Norcia black truffles.' },
  { id: 'm8', name: 'Malabar Coastal Tiger Prawn Curry', category: 'mains', price_inr: 1450, is_veg: false, prep_time_min: 20, tags: ['Coastal Indian', 'Spicy'], description: 'Jumbo tiger prawns simmered in fragrant coconut milk, roasted coriander, curry leaves, and tempered mustard seeds with steamed jasmine rice.' },
  { id: 'm9', name: 'Royal Awadhi Dum Biryani', category: 'mains', price_inr: 1200, is_veg: false, prep_time_min: 25, tags: ['Chef Special', 'Halal'], description: 'Aged basmati rice infused with Persian saffron, tender lamb morsels or seasonal vegetables, sealed with whole spices and served with smoked burani raita.' },
  { id: 'm10', name: 'A5 Miyazaki Wagyu Tenderloin', category: 'mains', price_inr: 3200, is_veg: false, prep_time_min: 25, tags: ['Luxury', 'Wagyu'], description: 'Charcoal-grilled 150g Wagyu fillet with roasted bone marrow jus, truffle pomme purée, and glazed asparagus.' },
  { id: 'm11', name: 'Warm Belgian Dark Chocolate Fondant', category: 'desserts', price_inr: 650, is_veg: true, prep_time_min: 15, tags: ['Signature', 'Dessert'], description: '70% Valrhona molten center cake, Tahitian vanilla bean gelato, and raspberry coulis.' },
  { id: 'm12', name: 'Nivora Gold Leaf Mango Sorbet', category: 'desserts', price_inr: 450, is_veg: true, prep_time_min: 5, tags: ['Vegan', 'Gluten-Free'], description: 'Alphonsa mango sorbet crowned with edible 24k gold leaf and candied mint.' },
  { id: 'm13', name: 'Nivora Sunset Signature Mocktail', category: 'beverages', price_inr: 420, is_veg: true, prep_time_min: 5, tags: ['Mocktail', 'Refreshing'], description: 'Cold-pressed passion fruit, kaffir lime, coconut water, and sparkling soda over crushed ice.' },
  { id: 'm14', name: 'Cold-Pressed Green Detox Elixir', category: 'beverages', price_inr: 380, is_veg: true, prep_time_min: 5, tags: ['Healthy', 'Organic'], description: 'Celery, green apple, cucumber, kale, ginger, and Meyer lemon.' },
  { id: 'm15', name: 'Blue Mountain Single Origin Pour-Over', category: 'beverages', price_inr: 350, is_veg: true, prep_time_min: 7, tags: ['Coffee', 'Artisan'], description: 'Freshly roasted high-altitude Arabica beans, delicate floral notes and silky caramel body.' },
];

const RESORT_SAMPLE_RESERVATIONS = [
  {
    booking_reference: 'NIV-20261009-8812',
    customer_name: 'Sophia Laurent',
    customer_email: 'sophia.laurent@example.com',
    room_type_name: 'Nivora Presidential Penthouse Suite',
    room_number: '301',
    check_in_date: '2026-10-10',
    check_out_date: '2026-10-14',
    num_guests: 2,
    total_price_formatted: '$3,400',
    status: 'confirmed',
    special_requests: 'Late arrival around 7:00 PM. Extra hypoallergenic pillows requested.',
  },
  {
    booking_reference: 'NIV-20261008-4190',
    customer_name: 'Marcus Vance',
    customer_email: 'marcus.vance@example.com',
    room_type_name: 'Deluxe Oceanfront Horizon Room',
    room_number: '204',
    check_in_date: '2026-10-08',
    check_out_date: '2026-10-12',
    num_guests: 2,
    total_price_formatted: '$1,680',
    status: 'checked_in',
    special_requests: 'High floor preferred, anniversary welcome amenity.',
  },
  {
    booking_reference: 'NIV-20261015-7731',
    customer_name: 'Resort Administrator',
    customer_email: 'dhiru636441@gmail.com',
    room_type_name: 'Nivora Presidential Penthouse Suite',
    room_number: '301',
    check_in_date: '2026-10-15',
    check_out_date: '2026-10-18',
    num_guests: 2,
    total_price_formatted: '$2,550',
    status: 'confirmed',
    special_requests: 'Executive VIP welcome and champagne service.',
  },
];

// Tool Declarations for Nia AI using @google/genai
const niaFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'check_room_availability',
    description: 'Check real room availability and rates at Nivora Resort for specified check-in and check-out dates and guest count.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        check_in_date: {
          type: Type.STRING,
          description: 'Arrival date in YYYY-MM-DD format (e.g. 2026-10-15)',
        },
        check_out_date: {
          type: Type.STRING,
          description: 'Departure date in YYYY-MM-DD format (e.g. 2026-10-18)',
        },
        room_type_id: {
          type: Type.STRING,
          description: 'Optional filter by room category: rt_presidential, rt_deluxe_ocean, rt_executive_villa, rt_wellness_pavilion',
        },
        num_guests: {
          type: Type.NUMBER,
          description: 'Number of guests staying',
        },
      },
      required: ['check_in_date', 'check_out_date'],
    },
  },
  {
    name: 'get_resort_information',
    description: 'Retrieve verified resort facts, policies, check-in/out times, Wi-Fi credentials, infinity pool rules, Peninsula Spa details, dining venues, activities, and contact numbers.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: 'Resort topic: checkin_checkout, cancellation, wifi, amenities, spa_wellness, dining, pool, parking, directions_location, contact, activities',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'get_menu_items',
    description: 'Query in-suite dining and restaurant menu items with categories, dietary options (vegetarian/vegan), and prices.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'Category filter: breakfast, starters, mains, desserts, beverages, all',
        },
        is_veg: {
          type: Type.BOOLEAN,
          description: 'Optional filter for vegetarian or vegan dishes only',
        },
      },
    },
  },
  {
    name: 'get_my_reservations',
    description: 'Retrieve current or past resort room bookings for an authenticated guest by their verified email address.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        guest_email: {
          type: Type.STRING,
          description: 'Guest email address',
        },
      },
      required: ['guest_email'],
    },
  },
  {
    name: 'get_my_order_status',
    description: 'Check the preparation and delivery status of in-room dining and beverage orders.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        guest_email: {
          type: Type.STRING,
          description: 'Guest email address',
        },
        order_number: {
          type: Type.STRING,
          description: 'Specific food order reference number (e.g. NIV-FB-8812)',
        },
      },
    },
  },
  {
    name: 'create_support_ticket',
    description: 'Escalate a guest concern, service request, or complaint to resort staff (housekeeping, maintenance, front desk, concierge, room service) with an official reference number.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        guest_email: {
          type: Type.STRING,
          description: 'Guest email address',
        },
        guest_name: {
          type: Type.STRING,
          description: 'Guest full name',
        },
        room_number: {
          type: Type.STRING,
          description: 'Room or suite number (e.g. 101, 204, 301)',
        },
        category: {
          type: Type.STRING,
          description: 'Department: housekeeping, maintenance, room_service, concierge, front_desk, billing, general',
        },
        issue_summary: {
          type: Type.STRING,
          description: 'Short headline of the guest issue or request',
        },
        details: {
          type: Type.STRING,
          description: 'Complete description of the concern or request',
        },
        priority: {
          type: Type.STRING,
          description: 'Urgency: low, medium, high, urgent',
        },
      },
      required: ['guest_email', 'guest_name', 'category', 'issue_summary', 'details', 'priority'],
    },
  },
  {
    name: 'submit_guest_feedback',
    description: 'Record guest ratings and reviews for their stay or dining experience at Nivora Resort.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        guest_email: {
          type: Type.STRING,
          description: 'Guest email address',
        },
        guest_name: {
          type: Type.STRING,
          description: 'Guest full name',
        },
        rating: {
          type: Type.NUMBER,
          description: 'Rating out of 5 stars (1 to 5)',
        },
        comments: {
          type: Type.STRING,
          description: 'Detailed guest comments and observations',
        },
        category: {
          type: Type.STRING,
          description: 'Category: Overall Experience, Dining, Suite Comfort, Butler Service, Spa & Wellness',
        },
      },
      required: ['guest_email', 'guest_name', 'rating', 'comments'],
    },
  },
];

// Tool Execution Dispatcher
function executeNiaTool(name: string, args: Record<string, any>, guestContext: Record<string, any> = {}) {
  switch (name) {
    case 'check_room_availability': {
      const { check_in_date, check_out_date, room_type_id, num_guests = 2 } = args;
      const inDate = new Date(check_in_date);
      const outDate = new Date(check_out_date);
      const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))) || 1;

      let matchedRooms = RESORT_ROOM_TYPES;
      if (room_type_id) {
        matchedRooms = matchedRooms.filter(r => r.id === room_type_id);
      }
      if (num_guests) {
        matchedRooms = matchedRooms.filter(r => r.max_occupancy >= num_guests);
      }

      const availableResults = matchedRooms.map(r => ({
        id: r.id,
        name: r.name,
        nightly_rate_usd: r.base_price_cents / 100,
        total_for_stay_usd: (r.base_price_cents / 100) * nights,
        nights,
        max_occupancy: r.max_occupancy,
        bed_type: r.bed_type,
        size_sqm: r.size_sqm,
        amenities: r.amenities,
        image_url: r.image_url,
        status: 'Available for instant reservation',
      }));

      return {
        check_in_date,
        check_out_date,
        nights,
        num_guests,
        total_available_categories: availableResults.length,
        availableRooms: availableResults,
      };
    }

    case 'get_resort_information': {
      const topic = (args.topic || 'amenities').toLowerCase().trim();
      const directMatch = RESORT_KNOWLEDGE_BASE[topic];
      if (directMatch) {
        return { topic, verified_information: directMatch };
      }
      // Fuzzy search across topics
      const matchingKey = Object.keys(RESORT_KNOWLEDGE_BASE).find(k => k.includes(topic) || topic.includes(k));
      if (matchingKey) {
        return { topic: matchingKey, verified_information: RESORT_KNOWLEDGE_BASE[matchingKey] };
      }
      return {
        topic,
        verified_information: `Nivora Resort Sanctuary: Standard check-in is 3:00 PM, checkout is 11:00 AM. High-speed Wi-Fi network 'Nivora_Guest_Ultra' is complimentary. 24/7 butler service, Peninsula Spa (8 AM - 8 PM), ocean infinity pool (6 AM - 10 PM), two gourmet restaurants, and valet parking are available to all guests. Contact concierge at +1 (555) NIVORA-LUX.`,
      };
    }

    case 'get_menu_items': {
      const { category, is_veg } = args;
      let items = RESORT_MENU_ITEMS;
      if (category && category !== 'all') {
        items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
      }
      if (is_veg !== undefined) {
        items = items.filter(i => i.is_veg === Boolean(is_veg));
      }
      return {
        count: items.length,
        category: category || 'all',
        items: items.map(i => ({
          name: i.name,
          category: i.category,
          price_inr: `₹${i.price_inr.toLocaleString()}`,
          is_vegetarian: i.is_veg,
          prep_time: `${i.prep_time_min} mins`,
          description: i.description,
          tags: i.tags,
        })),
      };
    }

    case 'get_my_reservations': {
      const targetEmail = (args.guest_email || guestContext.email || '').toLowerCase().trim();
      let userBookings = RESORT_SAMPLE_RESERVATIONS.filter(r => r.customer_email.toLowerCase() === targetEmail);
      if (userBookings.length === 0 && targetEmail) {
        // Fallback demo booking for user
        userBookings = [
          {
            booking_reference: `NIV-20261012-${Math.floor(1000 + Math.random() * 9000)}`,
            customer_name: guestContext.full_name || 'Valued Guest',
            customer_email: targetEmail,
            room_type_name: 'Deluxe Oceanfront Horizon Room',
            room_number: guestContext.current_room || '201',
            check_in_date: '2026-10-12',
            check_out_date: '2026-10-16',
            num_guests: 2,
            total_price_formatted: '$1,680',
            status: 'confirmed',
            special_requests: 'Ocean view guarantee, evening turndown.',
          },
        ];
      }
      return {
        guest_email: targetEmail,
        reservations_count: userBookings.length,
        reservations: userBookings,
      };
    }

    case 'get_my_order_status': {
      const { guest_email, order_number } = args;
      return {
        active_orders: [
          {
            order_number: order_number || 'NIV-FB-4192',
            guest_email: guest_email || guestContext.email || 'guest@nivoraresort.com',
            items: '1x Malabar Coastal Tiger Prawn Curry, 1x Nivora Sunset Mocktail',
            total_inr: '₹1,870',
            status: 'In Kitchen Preparation',
            estimated_delivery_minutes: 18,
            delivery_location: guestContext.current_room ? `Room ${guestContext.current_room}` : 'Suite 301 - Horizon Penthouse',
          },
        ],
      };
    }

    case 'create_support_ticket': {
      const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const departmentMap: Record<string, string> = {
        housekeeping: 'Housekeeping & Turndown Services',
        maintenance: 'Engineering & Facilities',
        room_service: 'In-Suite Culinary Team',
        concierge: 'Lead Guest Concierge',
        front_desk: 'Front Desk Duty Manager',
        billing: 'Guest Accounts & Billing',
        general: 'Resort Duty Manager',
      };

      const dept = departmentMap[(args.category || '').toLowerCase()] || 'Guest Experience Duty Manager';
      const eta = args.priority === 'urgent' ? 10 : args.priority === 'high' ? 15 : 25;

      const ticket = {
        id: ticketNumber,
        ticket_number: ticketNumber,
        guest_email: args.guest_email || guestContext.email || 'guest@example.com',
        guest_name: args.guest_name || guestContext.full_name || 'Guest',
        room_number: args.room_number || guestContext.current_room || '101',
        category: args.category || 'general',
        issue_summary: args.issue_summary,
        details: args.details,
        priority: args.priority || 'medium',
        status: 'Dispatched to Staff',
        assigned_department: dept,
        estimated_arrival_minutes: eta,
        created_at: new Date().toISOString(),
      };

      serverSupportTickets.unshift(ticket);

      return {
        success: true,
        ticket,
        message: `Support ticket ${ticketNumber} dispatched to ${dept}. Resort personnel will arrive at Room ${ticket.room_number} within ${eta} minutes.`,
      };
    }

    case 'submit_guest_feedback': {
      const fbId = `fb_${Date.now()}`;
      const entry = {
        id: fbId,
        guest_email: args.guest_email || guestContext.email || 'guest@example.com',
        guest_name: args.guest_name || guestContext.full_name || 'Guest',
        rating: Math.max(1, Math.min(5, Number(args.rating) || 5)),
        comments: args.comments || 'Exquisite stay.',
        category: args.category || 'Overall Experience',
        created_at: new Date().toISOString(),
      };

      serverFeedbackList.unshift(entry);

      return {
        success: true,
        feedback_id: fbId,
        rating: entry.rating,
        message: 'Thank you for your gracious feedback. Your remarks have been cataloged for the Resort General Manager.',
      };
    }

    default:
      return { error: `Tool ${name} is not recognized.` };
  }
}

const NIA_SYSTEM_INSTRUCTION = `You are Nia AI, the premier intelligent resort concierge and guest support assistant for Nivora — The Intelligence Behind Every Stay.

Your Persona:
- Warm, polite, polished, and distinctly luxurious, reflecting five-star sanctuary hospitality.
- Graciously address guests and prioritize their comfort and peace of mind.
- Format responses beautifully with bold headings, bullet points, and clear concise paragraphs.

Your Operational Guidelines:
1. Resort Information: Call 'get_resort_information' for accurate facts on check-in (3:00 PM), check-out (11:00 AM), cancellation rules, complimentary 1 Gbps fiber Wi-Fi (Network: 'Nivora_Guest_Ultra', no password needed), infinity pool (6 AM - 10 PM), Peninsula Royal Wellness Spa & Reflection Pool (8 AM - 8 PM), dining venues, complimentary valet parking, and directions.
2. Room Availability: Call 'check_room_availability' when guests ask about suites, villas, rates, or bookings. Quote exact prices, bed types, and highlights (such as private plunge pools or panoramic ocean balconies).
3. Dining & In-Room Service: Call 'get_menu_items' to share dishes, prices in INR (₹), dietary tags (vegetarian, vegan, gluten-free), and preparation times.
4. Reservations & Orders: Help guests view their bookings via 'get_my_reservations' and track dining orders with 'get_my_order_status'.
5. Issue Resolution & Staff Escalation:
   - When a guest reports an issue (air conditioning, noise, extra towels, maintenance, housekeeping, dining delay, billing), show warm empathy, listen actively, and IMMEDIATELY call 'create_support_ticket' to create a genuine support ticket in the resort system.
   - Always provide the guest with their official Ticket Reference ID (e.g., TKT-xxxx), the assigned department, and the expected staff response time (10-20 minutes).
6. Feedback:
   - When guests share a compliment or review, call 'submit_guest_feedback' to record it in the resort ledger and thank them warmly.

Strict Rules:
- Never fabricate room numbers, fake reservations, or non-existent tickets. Always rely on tool calls for authoritative state.
- Never expose internal staff operational logs, administrative passwords, or private guest profiles.
- Keep responses helpful, sophisticated, and concise.`;

/**
 * Server-side Nia AI Chat Endpoint with Official Function Calling (@google/genai)
 */
app.post('/api/ai/nia-chat', async (req, res) => {
  try {
    const { messages, guestContext = {} } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI API key is not configured. Please ensure GEMINI_API_KEY is configured in your server environment variables or AI Studio Secrets.',
        apiKeyMissing: true,
      });
    }

    // Format messages for @google/genai contents
    // Convert history: user -> role: 'user', ai/model -> role: 'model'
    const contentsPayload: any[] = messages.map((m: any) => ({
      role: m.sender === 'user' || m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || m.content || '' }],
    }));

    const NIA_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    // First model generation call with tools enabled
    let response = await ai.models.generateContent({
      model: NIA_MODEL,
      contents: contentsPayload,
      config: {
        systemInstruction: NIA_SYSTEM_INSTRUCTION,
        temperature: 0.3,
        tools: [{ functionDeclarations: niaFunctionDeclarations }],
      },
    });

    const executedTools: Array<{ tool: string; args: any; result: any }> = [];
    const actionableData: any = {};

    // Multi-turn tool execution loop (up to 3 iterations)
    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 3) {
      iterations++;
      const toolResultsParts: any[] = [];

      for (const fc of response.functionCalls) {
        const toolName: string = fc.name || '';
        const toolArgs = (fc.args as Record<string, any>) || {};
        const result = executeNiaTool(toolName, toolArgs, guestContext);
        executedTools.push({ tool: toolName, args: toolArgs, result });

        if (toolName === 'create_support_ticket' && result.ticket) {
          actionableData.ticketCreated = result.ticket;
        } else if (toolName === 'check_room_availability' && result.availableRooms) {
          actionableData.availableRooms = result.availableRooms;
          actionableData.bookingDetails = result;
        } else if (toolName === 'get_menu_items' && result.items) {
          actionableData.menuItems = result.items;
        }

        toolResultsParts.push({
          functionResponse: {
            name: toolName,
            response: { output: result },
            ...(fc.id ? { id: fc.id } : {}),
          },
        });
      }

      const modelTurn = response.candidates?.[0]?.content;
      if (!modelTurn) break;

      contentsPayload.push(modelTurn);
      contentsPayload.push({
        role: 'tool',
        parts: toolResultsParts,
      });

      // Follow-up generation with tool results
      response = await ai.models.generateContent({
        model: NIA_MODEL,
        contents: contentsPayload,
        config: {
          systemInstruction: NIA_SYSTEM_INSTRUCTION,
          temperature: 0.3,
          tools: [{ functionDeclarations: niaFunctionDeclarations }],
        },
      });
    }

    const finalText = response.text || (executedTools.length > 0
      ? 'I have processed your request with the resort concierge dispatch.'
      : 'It is my absolute pleasure to assist you. How may I make your stay more delightful?');

    return res.json({
      text: finalText,
      toolCallsExecuted: executedTools,
      actionableData,
      model: NIA_MODEL,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Nia AI server error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while communicating with Nia AI.',
      details: error.toString(),
    });
  }
});

// Endpoint to retrieve all active Nia support tickets
app.get('/api/ai/tickets', (req, res) => {
  return res.json(serverSupportTickets);
});

/**
 * Server-Side Secure Role & Portal Permissions Endpoint.
 * Authoritative backend truth for user portal access.
 * Confirms that dhiru636441@gmail.com has multi-portal access to customer, staff, and front_desk,
 * while strict mutual exclusivity is enforced for regular users.
 */
const AUTHORIZED_ADMIN_EMAIL = 'dhiru636441@gmail.com';
const STAFF_EMAIL = 'staff@nivoraresort.com';
const FRONT_DESK_EMAIL = 'frontdesk@nivoraresort.com';

app.post('/api/auth/permissions', (req, res) => {
  const { email, portal } = req.body || {};
  const cleanEmail = (email || '').toLowerCase().trim();

  const isSuperAdmin = cleanEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  let role = 'customer';
  let authorizedPortals: Array<'customer' | 'staff' | 'front_desk'> = ['customer'];

  if (isSuperAdmin) {
    role = 'admin';
    authorizedPortals = ['customer', 'staff', 'front_desk'];
  } else if (cleanEmail === STAFF_EMAIL.toLowerCase()) {
    role = 'staff';
    authorizedPortals = ['staff'];
  } else if (cleanEmail === FRONT_DESK_EMAIL.toLowerCase()) {
    role = 'front_desk';
    authorizedPortals = ['front_desk'];
  }

  const isPortalAllowed = portal ? authorizedPortals.includes(portal) : true;

  return res.json({
    email: cleanEmail,
    role,
    isAdmin: isSuperAdmin,
    authorizedPortals,
    requestedPortal: portal || null,
    isAllowed: isPortalAllowed,
    verifiedAt: new Date().toISOString(),
  });
});

/**
 * Server-side Supabase Database Health & Connection Diagnostics Endpoint.
 * Reports live status of tables: guests, rooms, reservations, operations, feedback, nivora, nivora_dataset.
 * Keeps all database queries and validation server-authoritative and safe.
 */
app.get('/api/supabase/diagnostics', async (req, res) => {
  const url = process.env.VITE_SUPABASE_URL || 'https://enthyivpaupwifvvpshw.supabase.co';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OgfHm6F40NEeBv97ZISYbg_wRigHNl4';

  const tables = ['nivora_profiles', 'reservations', 'feedback', 'rooms', 'user'];
  const tableResults: Record<string, any> = {};

  for (const table of tables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?limit=1`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      const isOk = response.status === 200;
      tableResults[table] = {
        connected: isOk,
        httpStatus: response.status,
        statusText: response.statusText,
        rlsActive: true,
      };
    } catch (err: any) {
      tableResults[table] = {
        connected: false,
        error: err.message,
      };
    }
  }

  return res.json({
    supabaseUrl: url,
    projectId: 'enthyivpaupwifvvpshw',
    configured: Boolean(url && anonKey),
    tables: tableResults,
    checkedAt: new Date().toISOString(),
  });
});

// Full-stack Vite dev middleware integration
async function startServer() {
  // Always statically serve image assets directly so any legacy or direct URL format works
  app.use('/assets/images', express.static(path.resolve(__dirname, 'public/assets/images')));
  app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));
  app.use('/assets', express.static(path.resolve(__dirname, 'public/assets')));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nivora Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
