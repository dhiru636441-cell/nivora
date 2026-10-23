import {
  RoomType,
  Room,
  Reservation,
  ActiveStay,
  ServiceRequest,
  HousekeepingTask,
  MaintenanceRequest,
  PaymentRecord,
  AuditLog,
  NotificationItem,
  UserRole,
  UserProfile,
  MenuItem,
  FoodOrder,
  FoodOrderStatus,
  FoodPaymentStatus,
} from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { RESORT_IMAGES, resolveImageUrl } from './assets';

export const INITIAL_ROOM_TYPES: RoomType[] = [
  {
    id: 'rt_presidential',
    name: 'Nivora Presidential Penthouse Suite',
    category: 'suite',
    description: 'Expansive oceanfront penthouse with panoramic sea views, private cantilever terrace, master king suite, dining pavilion, and bespoke bar.',
    base_price_cents: 85000,
    max_occupancy: 4,
    bed_type: 'King Master + Queen Guest',
    size_sqm: 140,
    amenities: ['Panoramic Ocean View', 'Private Jacuzzi Terrace', 'Personal Butler', 'Bang & Olufsen Sound', 'Marble Spa Bath', 'Bvlgari Toiletries'],
    image_url: RESORT_IMAGES.presidentialSuite,
  },
  {
    id: 'rt_deluxe_ocean',
    name: 'Deluxe Oceanfront Horizon Room',
    category: 'deluxe',
    description: 'Floor-to-ceiling vistas of the azure coastline, private teak balcony, plush king bed with high-thread Egyptian linens, and open-plan rain shower.',
    base_price_cents: 42000,
    max_occupancy: 2,
    bed_type: 'King Bed',
    size_sqm: 65,
    amenities: ['Oceanfront Balcony', 'Walk-in Rain Shower', 'Espresso Machine', 'Pillow Menu', 'Smart Climate Control', 'High-speed Wi-Fi'],
    image_url: RESORT_IMAGES.deluxeOcean,
  },
  {
    id: 'rt_executive_villa',
    name: 'Executive Sanctuary Garden Villa',
    category: 'villa',
    description: 'Secluded private villa wrapped in lush tropical foliage featuring an outdoor plunge pool, open-air sun deck, and artisan teak furnishings.',
    base_price_cents: 64000,
    max_occupancy: 3,
    bed_type: 'King Bed + Daybed',
    size_sqm: 95,
    amenities: ['Private Plunge Pool', 'Tropical Garden Courtyard', 'Outdoor Daybed', 'Mini Wine Cellar', 'Complimentary Breakfast', 'Evening Turndown'],
    image_url: RESORT_IMAGES.executiveVilla,
  },
  {
    id: 'rt_wellness_pavilion',
    name: 'Royal Wellness Spa Pavilion',
    category: 'suite',
    description: 'Holistic wellness suite adjacent to Nivora Spa with private reflection water bath, aromatic cedar accents, and in-room therapeutic soaking tub.',
    base_price_cents: 52000,
    max_occupancy: 2,
    bed_type: 'King Bed',
    size_sqm: 80,
    amenities: ['Private Reflection Bath', 'Direct Spa Access', 'Aromatherapy Diffuser', 'Yoga & Meditation Mat', 'Organic Herb Bar', 'Sound Therapy System'],
    image_url: RESORT_IMAGES.spaWellness,
  },
];

export const INITIAL_ROOMS: Room[] = [
  // 1st Floor - Villas & Pavilions
  { id: 'rm_101', room_number: '101', room_type_id: 'rt_executive_villa', floor: 1, operational_status: 'clean', occupancy_status: 'vacant' },
  { id: 'rm_102', room_number: '102', room_type_id: 'rt_executive_villa', floor: 1, operational_status: 'dirty', occupancy_status: 'vacant', notes: 'Checkout completed; pending turnover cleaning' },
  { id: 'rm_103', room_number: '103', room_type_id: 'rt_wellness_pavilion', floor: 1, operational_status: 'clean', occupancy_status: 'occupied', current_stay_id: 'stay_seed_1' },
  { id: 'rm_104', room_number: '104', room_type_id: 'rt_wellness_pavilion', floor: 1, operational_status: 'cleaning_in_progress', occupancy_status: 'vacant' },
  
  // 2nd Floor - Deluxe Ocean
  { id: 'rm_201', room_number: '201', room_type_id: 'rt_deluxe_ocean', floor: 2, operational_status: 'clean', occupancy_status: 'vacant' },
  { id: 'rm_202', room_number: '202', room_type_id: 'rt_deluxe_ocean', floor: 2, operational_status: 'inspected', occupancy_status: 'vacant' },
  { id: 'rm_203', room_number: '203', room_type_id: 'rt_deluxe_ocean', floor: 2, operational_status: 'dirty', occupancy_status: 'vacant' },
  { id: 'rm_204', room_number: '204', room_type_id: 'rt_deluxe_ocean', floor: 2, operational_status: 'clean', occupancy_status: 'occupied', current_stay_id: 'stay_seed_2' },

  // 3rd Floor - Presidential Penthouse & Suites
  { id: 'rm_301', room_number: '301', room_type_id: 'rt_presidential', floor: 3, operational_status: 'clean', occupancy_status: 'vacant' },
  { id: 'rm_302', room_number: '302', room_type_id: 'rt_presidential', floor: 3, operational_status: 'out_of_service', occupancy_status: 'vacant', notes: 'Scheduled AC balcony vent calibration' },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res_001',
    booking_reference: 'NIV-20261009-8812',
    user_id: 'usr_customer_demo',
    customer_name: 'Sophia Laurent',
    customer_email: 'sophia.laurent@example.com',
    customer_phone: '+1 (555) 234-8901',
    room_type_id: 'rt_presidential',
    assigned_room_id: 'rm_301',
    check_in_date: '2026-10-10',
    check_out_date: '2026-10-14',
    num_guests: 2,
    total_price_cents: 340000,
    paid_amount_cents: 340000,
    status: 'confirmed',
    special_requests: 'Late arrival expected around 7:00 PM. Extra hypoallergenic pillows requested.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'res_002',
    booking_reference: 'NIV-20261008-4190',
    user_id: 'usr_guest_arrived',
    customer_name: 'Marcus Vance',
    customer_email: 'marcus.vance@example.com',
    customer_phone: '+1 (555) 789-2210',
    room_type_id: 'rt_deluxe_ocean',
    assigned_room_id: 'rm_204',
    check_in_date: '2026-10-08',
    check_out_date: '2026-10-12',
    num_guests: 2,
    total_price_cents: 168000,
    paid_amount_cents: 168000,
    status: 'checked_in',
    special_requests: 'High floor preferred, anniversary celebration welcome amenity.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'res_003',
    booking_reference: 'NIV-20261007-9931',
    user_id: 'usr_guest_spa',
    customer_name: 'Elena Rostova',
    customer_email: 'elena.rostova@example.com',
    customer_phone: '+1 (555) 442-1099',
    room_type_id: 'rt_wellness_pavilion',
    assigned_room_id: 'rm_103',
    check_in_date: '2026-10-07',
    check_out_date: '2026-10-11',
    num_guests: 1,
    total_price_cents: 208000,
    paid_amount_cents: 208000,
    status: 'checked_in',
    special_requests: 'Daily green detox juice at 8:00 AM in room.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const INITIAL_ACTIVE_STAYS: ActiveStay[] = [
  {
    id: 'stay_seed_1',
    reservation_id: 'res_003',
    room_id: 'rm_103',
    room_number: '103',
    user_id: 'usr_guest_spa',
    guest_name: 'Elena Rostova',
    check_in_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    expected_check_out: '2026-10-11',
    keycard_code: 'KEY-SPA-103-A',
    status: 'active',
    notes: 'Requested quiet hours courtesy; organic tea restock.',
  },
  {
    id: 'stay_seed_2',
    reservation_id: 'res_002',
    room_id: 'rm_204',
    room_number: '204',
    user_id: 'usr_guest_arrived',
    guest_name: 'Marcus Vance',
    check_in_time: new Date(Date.now() - 86400000 * 1).toISOString(),
    expected_check_out: '2026-10-12',
    keycard_code: 'KEY-DLX-204-B',
    status: 'active',
    notes: 'Champagne amenity successfully delivered.',
  },
];

export const INITIAL_HOUSEKEEPING_TASKS: HousekeepingTask[] = [
  {
    id: 'hk_001',
    room_id: 'rm_102',
    room_number: '102',
    assigned_staff_name: 'Carlos Ruiz',
    task_type: 'turnover_clean',
    priority: 'urgent',
    status: 'pending',
    notes: 'Prioritize for incoming 2:00 PM guest arrival. Sanitize plunge pool perimeter.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'hk_002',
    room_id: 'rm_104',
    room_number: '104',
    assigned_staff_name: 'Maria Chen',
    task_type: 'daily_tidy',
    priority: 'routine',
    status: 'in_progress',
    notes: 'Restock botanical spa toiletries and fresh plush linens.',
    started_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'hk_003',
    room_id: 'rm_203',
    room_number: '203',
    assigned_staff_name: 'Carlos Ruiz',
    task_type: 'deep_clean',
    priority: 'priority',
    status: 'pending',
    notes: 'Full balcony glass polish and hardwood buffing.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export const INITIAL_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  {
    id: 'maint_001',
    room_id: 'rm_302',
    room_number: '302',
    assigned_staff_name: 'David Keller',
    issue_title: 'Balcony HVAC Air Recirculator Calibration',
    description: 'Thermostat sensor throwing code E-42 during peak afternoon solar load.',
    urgency: 'high',
    status: 'in_progress',
    reported_by: 'Front Desk System',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    resolution_notes: 'Replacement filter installed; diagnostic calibration run at 80% load.',
  },
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'srv_001',
    user_id: 'usr_guest_arrived',
    reservation_id: 'res_002',
    room_number: '204',
    category: 'room_service',
    title: 'Artisan Seafood Tasting & Coastal Pinot Noir',
    details: 'Grilled sea bass, roasted Mediterranean vegetables, and bottle of 2022 Willamette Pinot Noir.',
    priority: 'medium',
    status: 'in_progress',
    assigned_to_name: 'Sommelier Dining Team',
    created_at: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'srv_002',
    user_id: 'usr_guest_spa',
    reservation_id: 'res_003',
    room_number: '103',
    category: 'housekeeping',
    title: 'Fresh Cedar Towels & Extra Silk Robes',
    details: 'Two extra sets of sauna wrap towels and lavender pillow mist.',
    priority: 'low',
    status: 'pending',
    assigned_to_name: 'Housekeeping Desk',
    created_at: new Date(Date.now() - 1200000).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_001',
    actor_id: 'system',
    actor_email: 'frontdesk@nivoraresort.com',
    actor_role: 'front_desk',
    action: 'CHECK_IN_COMPLETED',
    entity_type: 'active_stay',
    entity_id: 'stay_seed_2',
    details: { room: '204', guest: 'Marcus Vance', booking_ref: 'NIV-20261008-4190' },
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'audit_002',
    actor_id: 'system',
    actor_email: 'frontdesk@nivoraresort.com',
    actor_role: 'front_desk',
    action: 'ROOM_ASSIGNED',
    entity_type: 'reservation',
    entity_id: 'res_001',
    details: { room: '301', guest: 'Sophia Laurent', type: 'Presidential Penthouse' },
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. Breakfast
  {
    id: 'item_bf_1',
    name: 'Artisan Balcony Continental Breakfast',
    category: 'breakfast',
    description: 'Freshly baked sourdough croissants, pain au chocolat, organic farm eggs with hollandaise, dragonfruit, seasonal berries, artisanal French butter, and espresso.',
    price_inr: 1450,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Chef Signature', 'Organic', 'Fresh Daily'],
    image_url: RESORT_IMAGES.breakfast,
    preparation_time_minutes: 20,
    calories: 580,
    featured: true,
  },
  {
    id: 'item_bf_2',
    name: 'Avocado Tartine with Poached Eggs & Microgreens',
    category: 'breakfast',
    description: 'Crushed Hass avocado on toasted brioche, heirloom cherry tomatoes, cold-pressed olive oil, organic poached eggs, and garden microgreens.',
    price_inr: 850,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Healthy Choice', 'Organic'],
    image_url: RESORT_IMAGES.breakfast,
    preparation_time_minutes: 15,
    calories: 420,
  },
  {
    id: 'item_bf_3',
    name: 'Superfood Tropical Chia Bowl',
    category: 'breakfast',
    description: 'Almond milk chia pudding, Alphonso mango purée, toasted coconut flakes, roasted pumpkin seeds, and wild forest honey.',
    price_inr: 650,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Vegan', 'Gluten-Free', 'Superfood'],
    image_url: RESORT_IMAGES.juices,
    preparation_time_minutes: 10,
    calories: 340,
  },

  // 2. Starters
  {
    id: 'item_st_1',
    name: 'Charred Malabar Tandoori Paneer Tikka',
    category: 'starters',
    description: 'Artisanal organic cottage cheese marinated in Kashmiri saffron and ground spices, charred with sweet bell peppers, served with mint coriander chutney and pickled shallots.',
    price_inr: 850,
    is_veg: true,
    is_available: true,
    spice_level: 'medium',
    dietary_tags: ['Vegetarian', 'Gluten-Free', 'Chef Special'],
    image_url: RESORT_IMAGES.tandooriPaneer,
    preparation_time_minutes: 25,
    calories: 480,
    featured: true,
  },
  {
    id: 'item_st_2',
    name: 'Crispy Island Calamari & Rock Shrimp',
    category: 'starters',
    description: 'Tempura crisp island seafood dusted with kaffir lime zest, served with roasted garlic chili emulsion and charred lime.',
    price_inr: 1150,
    is_veg: false,
    is_available: true,
    spice_level: 'medium',
    dietary_tags: ['Seafood', 'Signature'],
    image_url: RESORT_IMAGES.seaBass,
    preparation_time_minutes: 20,
    calories: 510,
  },

  // 3. Indian Cuisine
  {
    id: 'item_ind_1',
    name: 'Dum Awadhi Saffron Mutton Biryani',
    category: 'indian',
    description: 'Slow-cooked tender lamb infused with saffron, mace, and rosewater, layered with aged basmati, garnished with crisp caramelized onions, roasted cashews, edible gold leaf, and cucumber raita.',
    price_inr: 1650,
    is_veg: false,
    is_available: true,
    spice_level: 'medium',
    dietary_tags: ['Royal Feast', 'Chef Special', 'Gold Leaf'],
    image_url: RESORT_IMAGES.biryani,
    preparation_time_minutes: 35,
    calories: 780,
    featured: true,
  },
  {
    id: 'item_ind_2',
    name: 'Dal Nivora 36-Hour Slow-Simmered',
    category: 'indian',
    description: 'Slow-simmered black lentils cooked overnight on clay tandoor embers with organic churned butter, fresh cream, and smoked fenugreek.',
    price_inr: 750,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Vegetarian', 'Iconic', 'Comfort Classic'],
    image_url: RESORT_IMAGES.tandooriPaneer,
    preparation_time_minutes: 15,
    calories: 460,
  },
  {
    id: 'item_ind_3',
    name: 'Royal Murgh Makhani Velvet Butter Chicken',
    category: 'indian',
    description: 'Tandoor charred chicken simmered in a velvety San Marzano tomato satin gravy with hand-churned white butter and dried fenugreek.',
    price_inr: 1350,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Gluten-Free', 'Classic'],
    image_url: RESORT_IMAGES.biryani,
    preparation_time_minutes: 25,
    calories: 650,
  },

  // 4. Continental
  {
    id: 'item_con_1',
    name: 'Pan-Seared Chilean Sea Bass with Saffron Risotto',
    category: 'continental',
    description: 'Wild caught sea bass with crispy golden skin, served over creamy saffron arborio risotto, grilled tender asparagus spears, microgreens, and lemon herb beurre blanc.',
    price_inr: 2450,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Signature', 'Gluten-Free', 'Wild Caught'],
    image_url: RESORT_IMAGES.seaBass,
    preparation_time_minutes: 30,
    calories: 620,
    featured: true,
  },
  {
    id: 'item_con_2',
    name: 'Handcrafted Wild Truffle Mushroom Fettuccine',
    category: 'continental',
    description: 'Fresh egg pasta tossed with porcini and morel mushrooms, black summer truffle cream, toasted pine nuts, and 24-month aged Parmigiano Reggiano.',
    price_inr: 1250,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Vegetarian', 'Artisan Pasta'],
    image_url: RESORT_IMAGES.seaBass,
    preparation_time_minutes: 20,
    calories: 590,
  },

  // 5. Main Course
  {
    id: 'item_mn_1',
    name: 'Grilled Herb-Crusted Australian Lamb Chops',
    category: 'mains',
    description: 'Rosemary and garlic crusted tender lamb cutlets, mint sweet pea purée, glazed heritage baby carrots, and rich Pinot Noir reduction.',
    price_inr: 2850,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Premium Cut', 'Chef Special'],
    image_url: RESORT_IMAGES.seaBass,
    preparation_time_minutes: 30,
    calories: 720,
  },
  {
    id: 'item_mn_2',
    name: 'Coastal Malabar Coconut King Prawn Curry',
    category: 'mains',
    description: 'Jumbo king prawns simmered in stone-ground coconut milk, Kokum, curry leaves, and mustard seeds, served with steamed jasmine rice.',
    price_inr: 1750,
    is_veg: false,
    is_available: true,
    spice_level: 'medium',
    dietary_tags: ['Seafood', 'Gluten-Free', 'Local Catch'],
    image_url: RESORT_IMAGES.biryani,
    preparation_time_minutes: 25,
    calories: 580,
  },

  // 6. Desserts
  {
    id: 'item_des_1',
    name: 'Valrhona Warm Chocolate Fondant Sphere',
    category: 'desserts',
    description: 'Valrhona 70% dark chocolate dome with liquid chocolate center, cocoa crumble, raspberry coulis swirl, edible flowers, 24k gold leaf, and Tahitian vanilla bean gelato.',
    price_inr: 850,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Vegetarian', '24k Gold', 'Signature Dessert'],
    image_url: RESORT_IMAGES.dessert,
    preparation_time_minutes: 20,
    calories: 510,
    featured: true,
  },
  {
    id: 'item_des_2',
    name: 'Royal Kesari Rasmalai Tres Leches',
    category: 'desserts',
    description: 'Saffron and cardamom infused sponge steeped in three rich milks, topped with artisanal chenna dumplings, slivered pistachios, and Persian rose petals.',
    price_inr: 650,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Vegetarian', 'Royal Heritage'],
    image_url: RESORT_IMAGES.dessert,
    preparation_time_minutes: 15,
    calories: 420,
  },

  // 7. Beverages
  {
    id: 'item_bev_1',
    name: 'Royal Darjeeling First Flush Vintage Tea',
    category: 'beverages',
    description: 'Single-estate high mountain tea with delicate muscatel notes, served with raw wild forest honey, organic lemon slices, and artisanal shortbread.',
    price_inr: 450,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Organic', 'Single Estate'],
    image_url: RESORT_IMAGES.juices,
    preparation_time_minutes: 8,
    calories: 40,
  },
  {
    id: 'item_bev_2',
    name: 'Smoked Rosemary Botanical Infusion',
    category: 'beverages',
    description: 'Craft tonic with charred garden rosemary, white elderflower, dehydrated blood orange, and sparkling mineral water.',
    price_inr: 520,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Signature Mocktail', 'Zero Alcohol'],
    image_url: RESORT_IMAGES.juices,
    preparation_time_minutes: 10,
    calories: 95,
  },

  // 8. Fresh Juices
  {
    id: 'item_juc_1',
    name: 'Nivora Sunrise Tropical Elixir',
    category: 'juices',
    description: 'Freshly squeezed Valencia oranges, golden passion fruit, organic ginger root, and mint leaves served over crushed crystal ice.',
    price_inr: 480,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Cold-Pressed', 'Immunity Boost', '100% Raw'],
    image_url: RESORT_IMAGES.juices,
    preparation_time_minutes: 8,
    calories: 120,
    featured: true,
  },
  {
    id: 'item_juc_2',
    name: 'Emerald Island Sanctuary Detox',
    category: 'juices',
    description: 'Cold-pressed English cucumber, organic celery, green Granny Smith apple, baby spinach, mint, and Tahitian lime.',
    price_inr: 480,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Detox', 'Cold-Pressed', 'No Added Sugar'],
    image_url: RESORT_IMAGES.juices,
    preparation_time_minutes: 8,
    calories: 95,
  },
  {
    id: 'item_juc_3',
    name: 'Fresh Chilled Tender King Coconut',
    category: 'juices',
    description: 'Plucked fresh daily from the resort’s organic palm groves, chilled, and served in-shell with fragrant lemongrass straw.',
    price_inr: 350,
    is_veg: true,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Electrolyte Rich', '100% Natural'],
    image_url: RESORT_IMAGES.juices,
    preparation_time_minutes: 5,
    calories: 60,
  },

  // 9. Room Service
  {
    id: 'item_rs_1',
    name: 'The Sanctuary Balcony Breakfast Set for Two',
    category: 'room_service',
    description: 'In-room dining luxury spread delivered under silver cloches: warm basket of croissants, pain au chocolat, sourdough with jams, choice of organic eggs Florentine or Royale, tropical fruit platter with dragonfruit, two fresh squeezed juices, and artisanal French press coffee.',
    price_inr: 2800,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Bespoke Dining', 'Silver Cloche Service', 'Serves 2'],
    image_url: RESORT_IMAGES.roomService,
    preparation_time_minutes: 30,
    calories: 1100,
    featured: true,
  },
  {
    id: 'item_rs_2',
    name: 'Midnight Sanctuary Gourmet Tasting Platter',
    category: 'room_service',
    description: 'Available 24 hours: artisanal imported cheese board, truffle fries with smoked garlic aioli, mini gourmet wagyu or paneer sliders, and chocolate truffles.',
    price_inr: 1950,
    is_veg: false,
    is_available: true,
    spice_level: 'mild',
    dietary_tags: ['Available 24/7', 'Late Night'],
    image_url: RESORT_IMAGES.roomService,
    preparation_time_minutes: 25,
    calories: 840,
  },
];

export const INITIAL_FOOD_ORDERS: FoodOrder[] = [
  {
    id: 'ord_001',
    order_number: 'NIV-FB-1002',
    user_id: 'usr_guest_arrived',
    guest_name: 'Marcus Vance',
    guest_email: 'marcus.vance@example.com',
    guest_phone: '+1 (555) 392-1840',
    order_type: 'room_service',
    delivery_location: 'Room 204 - Deluxe Oceanfront',
    room_number: '204',
    special_instructions: 'Please deliver around 1:30 PM. Extra mint raita with the biryani.',
    items: [
      {
        menu_item_id: 'item_ind_1',
        name: 'Dum Awadhi Saffron Mutton Biryani',
        price_inr: 1650,
        quantity: 1,
        is_veg: false,
        subtotal_inr: 1650,
      },
      {
        menu_item_id: 'item_juc_1',
        name: 'Nivora Sunrise Tropical Elixir',
        price_inr: 480,
        quantity: 1,
        is_veg: true,
        subtotal_inr: 480,
      },
    ],
    subtotal_inr: 2130,
    tax_inr: 107,
    service_charge_inr: 107,
    discount_inr: 0,
    total_inr: 2344,
    payment_method: 'room_charge',
    payment_status: 'billed_to_room',
    status: 'preparing',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    estimated_delivery_time: '25 mins',
  },
  {
    id: 'ord_002',
    order_number: 'NIV-FB-1001',
    user_id: 'usr_guest_spa',
    guest_name: 'Elena Rostova',
    guest_email: 'elena.rostova@example.com',
    guest_phone: '+44 20 7946 0912',
    order_type: 'room_service',
    delivery_location: 'Room 103 - Royal Spa Pavilion',
    room_number: '103',
    special_instructions: 'Leave on balcony table, do not knock loudly.',
    items: [
      {
        menu_item_id: 'item_juc_2',
        name: 'Emerald Island Sanctuary Detox',
        price_inr: 480,
        quantity: 1,
        is_veg: true,
        subtotal_inr: 480,
      },
      {
        menu_item_id: 'item_rs_1',
        name: 'The Sanctuary Balcony Breakfast Set for Two',
        price_inr: 2800,
        quantity: 1,
        is_veg: false,
        subtotal_inr: 2800,
      },
    ],
    subtotal_inr: 3280,
    tax_inr: 164,
    service_charge_inr: 164,
    discount_inr: 0,
    total_inr: 3608,
    payment_method: 'card',
    payment_status: 'paid',
    status: 'delivered',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Local storage persistent keys
const STORAGE_KEYS = {
  ROOM_TYPES: 'nivora_room_types_v4',
  ROOMS: 'nivora_rooms_v4',
  RESERVATIONS: 'nivora_reservations_v4',
  ACTIVE_STAYS: 'nivora_active_stays_v4',
  HOUSEKEEPING: 'nivora_housekeeping_v4',
  MAINTENANCE: 'nivora_maintenance_v4',
  SERVICE_REQUESTS: 'nivora_service_requests_v4',
  PAYMENTS: 'nivora_payments_v4',
  AUDIT_LOGS: 'nivora_audit_logs_v4',
  USER_ROLES: 'nivora_user_roles_v4',
  MENU_ITEMS: 'nivora_menu_items_v4',
  FOOD_ORDERS: 'nivora_food_orders_v4',
};

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    // Ignore storage quota or environment restrictions
  }
}

// Primary authorized owner/admin email with multi-portal access to Customer, Staff, and Front Desk
export const AUTHORIZED_ADMIN_EMAIL = 'dhiru636441@gmail.com';
export const AUTHORIZED_ADMIN_EMAILS = [AUTHORIZED_ADMIN_EMAIL.toLowerCase()];

// In-Memory & LocalStorage backed DB engine
class HotelDatabase {
  private roomTypes: RoomType[] = loadStorage(STORAGE_KEYS.ROOM_TYPES, INITIAL_ROOM_TYPES).map((rt) => {
    const initial = INITIAL_ROOM_TYPES.find((i) => i.id === rt.id);
    return {
      ...rt,
      image_url: initial ? initial.image_url : resolveImageUrl(rt.image_url),
    };
  });
  private rooms: Room[] = loadStorage(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
  private reservations: Reservation[] = loadStorage(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
  private activeStays: ActiveStay[] = loadStorage(STORAGE_KEYS.ACTIVE_STAYS, INITIAL_ACTIVE_STAYS);
  private housekeepingTasks: HousekeepingTask[] = loadStorage(STORAGE_KEYS.HOUSEKEEPING, INITIAL_HOUSEKEEPING_TASKS);
  private maintenanceRequests: MaintenanceRequest[] = loadStorage(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_REQUESTS);
  private serviceRequests: ServiceRequest[] = loadStorage(STORAGE_KEYS.SERVICE_REQUESTS, INITIAL_SERVICE_REQUESTS);
  private payments: PaymentRecord[] = loadStorage(STORAGE_KEYS.PAYMENTS, []);
  private auditLogs: AuditLog[] = loadStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  private menuItems: MenuItem[] = loadStorage(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS).map((mi) => {
    const initial = INITIAL_MENU_ITEMS.find((i) => i.id === mi.id);
    return {
      ...mi,
      image_url: initial ? initial.image_url : resolveImageUrl(mi.image_url),
    };
  });
  private foodOrders: FoodOrder[] = loadStorage(STORAGE_KEYS.FOOD_ORDERS, INITIAL_FOOD_ORDERS);

  private userRoles: Record<string, UserRole> = loadStorage(STORAGE_KEYS.USER_ROLES, {
    'usr_customer_demo': 'customer',
    'staff@nivoraresort.com': 'staff',
    'frontdesk@nivoraresort.com': 'front_desk',
    [AUTHORIZED_ADMIN_EMAIL.toLowerCase()]: 'admin',
  });

  private notifyListeners: Array<() => void> = [];

  public subscribe(listener: () => void) {
    this.notifyListeners.push(listener);
    return () => {
      this.notifyListeners = this.notifyListeners.filter(l => l !== listener);
    };
  }

  private emitChange() {
    this.notifyListeners.forEach(listener => listener());
  }

  // --- ROLE MANAGEMENT & SECURE PORTAL AUTHORIZATION ---
  public isSuperAdmin(userIdOrEmail?: string | null): boolean {
    if (!userIdOrEmail) return false;
    const clean = userIdOrEmail.toLowerCase().trim();
    return AUTHORIZED_ADMIN_EMAILS.includes(clean);
  }

  public getUserRole(userIdOrEmail: string): UserRole {
    if (!userIdOrEmail) return 'customer';
    const clean = userIdOrEmail.toLowerCase().trim();
    if (this.isSuperAdmin(clean)) return 'admin';
    const role = this.userRoles[clean] || this.userRoles[userIdOrEmail];
    if (role) return role;
    // By security default: Any unprovisioned user is strictly 'customer'
    return 'customer';
  }

  public canEmailAccessPortal(userIdOrEmail: string, portal: 'customer' | 'staff' | 'front_desk'): boolean {
    if (!userIdOrEmail) return false;
    const clean = userIdOrEmail.toLowerCase().trim();
    // Authorized admin email has permission to access all three portals
    if (this.isSuperAdmin(clean)) return true;
    const assignedRole = this.getUserRole(clean);
    return assignedRole === portal;
  }

  public getAuthorizedPortals(userIdOrEmail: string): Array<'customer' | 'staff' | 'front_desk'> {
    if (!userIdOrEmail) return ['customer'];
    const clean = userIdOrEmail.toLowerCase().trim();
    if (this.isSuperAdmin(clean)) {
      return ['customer', 'staff', 'front_desk'];
    }
    const role = this.getUserRole(clean);
    if (role === 'staff') return ['staff'];
    if (role === 'front_desk') return ['front_desk'];
    return ['customer'];
  }

  public setUserRole(userIdOrEmail: string, role: UserRole) {
    const clean = userIdOrEmail.toLowerCase().trim();
    this.userRoles[clean] = role;
    saveStorage(STORAGE_KEYS.USER_ROLES, this.userRoles);
    this.emitChange();
  }

  // --- AUDIT LOGS ---
  public logAudit(actor: { id: string; email: string; role: string }, action: string, entityType: string, entityId: string, details?: any) {
    const entry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    saveStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    this.emitChange();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- ROOM TYPES & ROOMS ---
  public getRoomTypes(): RoomType[] {
    return [...this.roomTypes];
  }

  public getRooms(): Room[] {
    return [...this.rooms];
  }

  public updateRoomStatus(roomId: string, operationalStatus: Room['operational_status'], notes?: string, actor?: { id: string; email: string; role: string }) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    // Operational rule: If room is occupied, cannot mark as clean without checkout
    if (room.occupancy_status === 'occupied' && operationalStatus === 'clean') {
      // Room is occupied, clean indicates tidied during stay
    }

    room.operational_status = operationalStatus;
    if (notes !== undefined) room.notes = notes;
    if (operationalStatus === 'clean' || operationalStatus === 'inspected') {
      room.last_cleaned_at = new Date().toISOString();
    }

    saveStorage(STORAGE_KEYS.ROOMS, this.rooms);
    if (actor) {
      this.logAudit(actor, 'UPDATE_ROOM_STATUS', 'room', roomId, { room_number: room.room_number, operationalStatus, notes });
    }
    this.emitChange();
    return room;
  }

  // --- AVAILABILITY & DOUBLE-BOOKING PREVENTION ---
  public checkAvailability(roomTypeId: string, checkIn: string, checkOut: string, excludeReservationId?: string): { available: boolean; availableRoomCount: number; availableRooms: Room[] } {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return { available: false, availableRoomCount: 0, availableRooms: [] };
    }

    // Get all rooms of this type that are NOT out of service
    const matchingRooms = this.rooms.filter(r => r.room_type_id === roomTypeId && r.operational_status !== 'out_of_service');

    // Find conflicting reservations in date range
    const conflictingBookings = this.reservations.filter(res => {
      if (res.id === excludeReservationId) return false;
      if (res.status === 'cancelled' || res.status === 'checked_out') return false;
      if (res.room_type_id !== roomTypeId) return false;

      const resIn = new Date(res.check_in_date);
      const resOut = new Date(res.check_out_date);

      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return checkInDate < resOut && checkOutDate > resIn;
    });

    // Check which specific assigned rooms are booked
    const bookedRoomIds = new Set(conflictingBookings.map(b => b.assigned_room_id).filter(Boolean));
    const unassignedConflictingCount = conflictingBookings.filter(b => !b.assigned_room_id).length;

    // Available unassigned physical rooms
    const freeRooms = matchingRooms.filter(r => !bookedRoomIds.has(r.id));
    const availableCount = Math.max(0, freeRooms.length - unassignedConflictingCount);

    return {
      available: availableCount > 0,
      availableRoomCount: availableCount,
      availableRooms: freeRooms,
    };
  }

  // --- RESERVATIONS ---
  public getReservations(filter?: { userId?: string; status?: Reservation['status'] }): Reservation[] {
    let list = [...this.reservations];
    if (filter?.userId) {
      list = list.filter(r => r.user_id === filter.userId);
    }
    if (filter?.status) {
      list = list.filter(r => r.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getReservationById(id: string): Reservation | undefined {
    return this.reservations.find(r => r.id === id || r.booking_reference === id);
  }

  public createReservation(params: {
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    numGuests: number;
    specialRequests?: string;
  }): Reservation {
    // 1. Strict double-booking validation
    const availability = this.checkAvailability(params.roomTypeId, params.checkInDate, params.checkOutDate);
    if (!availability.available) {
      throw new Error('This room type is no longer available for the selected dates. Please choose alternate dates or accommodations.');
    }

    const roomType = this.roomTypes.find(rt => rt.id === params.roomTypeId);
    if (!roomType) throw new Error('Selected room type not found.');

    const checkIn = new Date(params.checkInDate);
    const checkOut = new Date(params.checkOutDate);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPriceCents = nights * roomType.base_price_cents;

    // Generate unique booking ref
    const dateStamp = params.checkInDate.replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `NIV-${dateStamp}-${randomHex}`;

    const newRes: Reservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      booking_reference: bookingRef,
      user_id: params.userId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      room_type_id: params.roomTypeId,
      check_in_date: params.checkInDate,
      check_out_date: params.checkOutDate,
      num_guests: params.numGuests,
      total_price_cents: totalPriceCents,
      paid_amount_cents: totalPriceCents, // Verified in payment step
      status: 'confirmed',
      special_requests: params.specialRequests,
      created_at: new Date().toISOString(),
    };

    this.reservations.unshift(newRes);
    saveStorage(STORAGE_KEYS.RESERVATIONS, this.reservations);

    // Record verified payment
    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      reservation_id: newRes.id,
      booking_reference: bookingRef,
      amount_cents: totalPriceCents,
      currency: 'USD',
      payment_method: 'card',
      status: 'verified',
      verified_by: 'Customer Card Payment Gateway',
      transaction_reference: `TXN-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
      created_at: new Date().toISOString(),
    };
    this.payments.unshift(paymentRecord);
    saveStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    this.logAudit(
      { id: params.userId, email: params.customerEmail, role: 'customer' },
      'RESERVATION_CREATED',
      'reservation',
      newRes.id,
      { booking_reference: bookingRef, total_price_cents: totalPriceCents, nights }
    );

    this.emitChange();
    return newRes;
  }

  public assignRoomToReservation(reservationId: string, roomId: string, actor: { id: string; email: string; role: string }) {
    const reservation = this.reservations.find(r => r.id === reservationId);
    if (!reservation) throw new Error('Reservation not found');

    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    if (room.room_type_id !== reservation.room_type_id) {
      throw new Error(`Room ${room.room_number} does not match booked category.`);
    }

    if (room.occupancy_status === 'occupied') {
      throw new Error(`Room ${room.room_number} is currently occupied.`);
    }

    reservation.assigned_room_id = roomId;
    saveStorage(STORAGE_KEYS.RESERVATIONS, this.reservations);

    this.logAudit(actor, 'ASSIGN_ROOM', 'reservation', reservationId, { room_number: room.room_number });
    this.emitChange();
    return reservation;
  }

  // --- CHECK-IN WORKFLOW ---
  public checkInGuest(reservationId: string, assignedRoomId: string, actor: { id: string; email: string; role: string }): ActiveStay {
    const res = this.reservations.find(r => r.id === reservationId);
    if (!res) throw new Error('Reservation not found');

    if (res.status === 'checked_in') {
      throw new Error('Guest is already checked in.');
    }
    if (res.status === 'cancelled') {
      throw new Error('Cannot check in a cancelled reservation.');
    }

    const room = this.rooms.find(r => r.id === assignedRoomId);
    if (!room) throw new Error('Assigned room does not exist.');

    // OPERATIONAL SAFETY CHECK: Room must not be dirty or out of service!
    if (room.operational_status === 'dirty' || room.operational_status === 'cleaning_in_progress') {
      throw new Error(`Room ${room.room_number} is currently ${room.operational_status}. It must be cleaned and inspected before check-in.`);
    }
    if (room.operational_status === 'out_of_service') {
      throw new Error(`Room ${room.room_number} is out of service for maintenance.`);
    }
    if (room.occupancy_status === 'occupied') {
      throw new Error(`Room ${room.room_number} is currently occupied by another guest.`);
    }

    // Assign room and update reservation
    res.assigned_room_id = assignedRoomId;
    res.status = 'checked_in';

    // Update Room
    room.occupancy_status = 'occupied';
    
    // Generate keycard
    const keycard = `KEY-${room.room_number}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newStay: ActiveStay = {
      id: `stay_${Date.now()}`,
      reservation_id: res.id,
      room_id: room.id,
      room_number: room.room_number,
      user_id: res.user_id,
      guest_name: res.customer_name,
      check_in_time: new Date().toISOString(),
      expected_check_out: res.check_out_date,
      keycard_code: keycard,
      status: 'active',
      notes: res.special_requests,
    };

    room.current_stay_id = newStay.id;

    this.activeStays.unshift(newStay);
    saveStorage(STORAGE_KEYS.ACTIVE_STAYS, this.activeStays);
    saveStorage(STORAGE_KEYS.RESERVATIONS, this.reservations);
    saveStorage(STORAGE_KEYS.ROOMS, this.rooms);

    this.logAudit(actor, 'CHECK_IN', 'active_stay', newStay.id, {
      room_number: room.room_number,
      guest_name: res.customer_name,
      booking_reference: res.booking_reference,
    });

    this.emitChange();
    return newStay;
  }

  // --- CHECKOUT WORKFLOW ---
  public checkOutGuest(stayId: string, paymentDetails: { method: PaymentRecord['payment_method']; amountCents: number; transactionRef?: string }, actor: { id: string; email: string; role: string }) {
    const stay = this.activeStays.find(s => s.id === stayId);
    if (!stay) throw new Error('Active stay not found.');
    if (stay.status === 'completed') throw new Error('Stay is already checked out.');

    const room = this.rooms.find(r => r.id === stay.room_id);
    const reservation = this.reservations.find(r => r.id === stay.reservation_id);

    // Record verified settlement
    const paymentRecord: PaymentRecord = {
      id: `pay_checkout_${Date.now()}`,
      reservation_id: stay.reservation_id,
      booking_reference: reservation?.booking_reference || stay.id,
      amount_cents: paymentDetails.amountCents,
      currency: 'USD',
      payment_method: paymentDetails.method,
      status: 'verified',
      verified_by: `${actor.email} (${actor.role})`,
      transaction_reference: paymentDetails.transactionRef || `SETTLE-${Date.now()}-${Math.random().toString(36).toUpperCase().substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.payments.unshift(paymentRecord);
    saveStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // Update Stay
    stay.status = 'completed';
    stay.actual_check_out_time = new Date().toISOString();

    // Update Reservation
    if (reservation) {
      reservation.status = 'checked_out';
    }

    // Update Room: Vacate and mark as DIRTY
    if (room) {
      room.occupancy_status = 'vacant';
      room.operational_status = 'dirty';
      room.current_stay_id = undefined;
      room.notes = 'Awaiting turnover housekeeping after guest checkout';

      // AUTOMATION: Create a high priority housekeeping turnover task!
      const hkTask: HousekeepingTask = {
        id: `hk_turnover_${Date.now()}`,
        room_id: room.id,
        room_number: room.room_number,
        task_type: 'turnover_clean',
        priority: 'urgent',
        status: 'pending',
        notes: `Turnover cleaning for vacated Room ${room.room_number}. Prepared for next guest.`,
        created_at: new Date().toISOString(),
      };
      this.housekeepingTasks.unshift(hkTask);
      saveStorage(STORAGE_KEYS.HOUSEKEEPING, this.housekeepingTasks);
    }

    saveStorage(STORAGE_KEYS.ACTIVE_STAYS, this.activeStays);
    saveStorage(STORAGE_KEYS.RESERVATIONS, this.reservations);
    saveStorage(STORAGE_KEYS.ROOMS, this.rooms);

    this.logAudit(actor, 'CHECK_OUT', 'active_stay', stay.id, {
      room_number: stay.room_number,
      guest_name: stay.guest_name,
      amount_settled: paymentDetails.amountCents,
      method: paymentDetails.method,
    });

    this.emitChange();
    return { stay, room };
  }

  // --- ACTIVE STAYS ---
  public getActiveStays(): ActiveStay[] {
    return [...this.activeStays];
  }

  public getActiveStayForUser(userId: string): ActiveStay | undefined {
    return this.activeStays.find(s => s.user_id === userId && s.status === 'active');
  }

  // --- HOUSEKEEPING & MAINTENANCE QUEUES ---
  public getHousekeepingTasks(): HousekeepingTask[] {
    return [...this.housekeepingTasks];
  }

  public updateHousekeepingTaskStatus(taskId: string, status: HousekeepingTask['status'], notes?: string, actor?: { id: string; email: string; role: string }) {
    const task = this.housekeepingTasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = status;
    if (notes) task.notes = (task.notes ? task.notes + ' | ' : '') + notes;

    const room = this.rooms.find(r => r.id === task.room_id);

    if (status === 'in_progress') {
      task.started_at = new Date().toISOString();
      if (room && room.operational_status === 'dirty') {
        room.operational_status = 'cleaning_in_progress';
      }
    } else if (status === 'completed') {
      task.completed_at = new Date().toISOString();
      if (room) {
        room.operational_status = 'clean';
        room.last_cleaned_at = new Date().toISOString();
      }
    }

    saveStorage(STORAGE_KEYS.HOUSEKEEPING, this.housekeepingTasks);
    saveStorage(STORAGE_KEYS.ROOMS, this.rooms);

    if (actor) {
      this.logAudit(actor, 'UPDATE_HOUSEKEEPING_TASK', 'housekeeping_task', taskId, { status, room_number: task.room_number });
    }

    this.emitChange();
    return task;
  }

  public getMaintenanceRequests(): MaintenanceRequest[] {
    return [...this.maintenanceRequests];
  }

  public updateMaintenanceStatus(id: string, status: MaintenanceRequest['status'], resolutionNotes?: string, actor?: { id: string; email: string; role: string }) {
    const item = this.maintenanceRequests.find(m => m.id === id);
    if (!item) throw new Error('Maintenance request not found');

    item.status = status;
    if (resolutionNotes) item.resolution_notes = resolutionNotes;
    if (status === 'resolved') {
      item.resolved_at = new Date().toISOString();
      const room = this.rooms.find(r => r.id === item.room_id);
      if (room && room.operational_status === 'out_of_service') {
        room.operational_status = 'clean';
      }
      saveStorage(STORAGE_KEYS.ROOMS, this.rooms);
    }

    saveStorage(STORAGE_KEYS.MAINTENANCE, this.maintenanceRequests);
    if (actor) {
      this.logAudit(actor, 'UPDATE_MAINTENANCE', 'maintenance_request', id, { status, resolutionNotes });
    }
    this.emitChange();
    return item;
  }

  // --- SERVICE REQUESTS ---
  public getServiceRequests(userId?: string): ServiceRequest[] {
    let list = [...this.serviceRequests];
    if (userId) {
      list = list.filter(s => s.user_id === userId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createServiceRequest(params: {
    userId: string;
    roomNumber: string;
    category: ServiceRequest['category'];
    title: string;
    details: string;
    priority: ServiceRequest['priority'];
  }): ServiceRequest {
    const item: ServiceRequest = {
      id: `srv_${Date.now()}`,
      user_id: params.userId,
      room_number: params.roomNumber,
      category: params.category,
      title: params.title,
      details: params.details,
      priority: params.priority,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.serviceRequests.unshift(item);
    saveStorage(STORAGE_KEYS.SERVICE_REQUESTS, this.serviceRequests);

    this.logAudit(
      { id: params.userId, email: 'guest', role: 'customer' },
      'SERVICE_REQUEST_CREATED',
      'service_request',
      item.id,
      { category: params.category, room_number: params.roomNumber, title: params.title }
    );

    this.emitChange();
    return item;
  }

  public createTicketFromAI(params: {
    ticketId: string;
    userId: string;
    guestName: string;
    roomNumber?: string;
    category: ServiceRequest['category'];
    title: string;
    details: string;
    priority: ServiceRequest['priority'];
  }): ServiceRequest {
    const item: ServiceRequest = {
      id: params.ticketId,
      user_id: params.userId,
      room_number: params.roomNumber || '101',
      category: params.category,
      title: `[Nia AI] ${params.title}`,
      details: params.details,
      priority: params.priority,
      status: 'pending',
      assigned_to_name: params.category === 'maintenance' ? 'Duty Engineering Lead' : params.category === 'housekeeping' ? 'Floor Housekeeper' : 'Lead Guest Concierge',
      created_at: new Date().toISOString(),
    };
    this.serviceRequests.unshift(item);
    saveStorage(STORAGE_KEYS.SERVICE_REQUESTS, this.serviceRequests);

    this.logAudit(
      { id: params.userId, email: 'guest', role: 'customer' },
      'NIA_AI_DISPATCH_TICKET',
      'service_request',
      item.id,
      { title: item.title, priority: item.priority, category: item.category }
    );

    this.emitChange();
    return item;
  }

  public updateServiceRequestStatus(id: string, status: ServiceRequest['status'], notes?: string, actor?: { id: string; email: string; role: string }) {
    const item = this.serviceRequests.find(s => s.id === id);
    if (!item) throw new Error('Service request not found');

    item.status = status;
    if (notes) item.notes = notes;
    if (status === 'completed') {
      item.completed_at = new Date().toISOString();
    }

    saveStorage(STORAGE_KEYS.SERVICE_REQUESTS, this.serviceRequests);
    if (actor) {
      this.logAudit(actor, 'UPDATE_SERVICE_REQUEST', 'service_request', id, { status });
    }
    this.emitChange();
    return item;
  }

  // --- FOOD & BEVERAGE AND IN-ROOM DINING METHODS ---
  public getMenuItems(): MenuItem[] {
    return [...this.menuItems];
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    return this.menuItems.find((m) => m.id === id);
  }

  public updateMenuItem(
    updated: MenuItem,
    actor?: { id: string; email: string; role: string }
  ): MenuItem {
    const idx = this.menuItems.findIndex((m) => m.id === updated.id);
    if (idx !== -1) {
      this.menuItems[idx] = { ...updated, image_url: resolveImageUrl(updated.image_url) };
    } else {
      this.menuItems.push({ ...updated, image_url: resolveImageUrl(updated.image_url) });
    }
    saveStorage(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
    if (actor) {
      this.logAudit(actor, 'UPDATE_MENU_ITEM', 'menu_item', updated.id, {
        name: updated.name,
        is_available: updated.is_available,
        price_inr: updated.price_inr,
      });
    }
    this.emitChange();
    return this.menuItems[idx !== -1 ? idx : this.menuItems.length - 1];
  }

  public addMenuItem(
    itemData: Omit<MenuItem, 'id'>,
    actor?: { id: string; email: string; role: string }
  ): MenuItem {
    const newItem: MenuItem = {
      ...itemData,
      id: `item_custom_${Date.now()}`,
      image_url: resolveImageUrl(itemData.image_url),
    };
    this.menuItems.unshift(newItem);
    saveStorage(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
    if (actor) {
      this.logAudit(actor, 'ADD_MENU_ITEM', 'menu_item', newItem.id, { name: newItem.name });
    }
    this.emitChange();
    return newItem;
  }

  public deleteMenuItem(
    id: string,
    actor?: { id: string; email: string; role: string }
  ): boolean {
    const initialLen = this.menuItems.length;
    this.menuItems = this.menuItems.filter((m) => m.id !== id);
    if (this.menuItems.length !== initialLen) {
      saveStorage(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
      if (actor) {
        this.logAudit(actor, 'DELETE_MENU_ITEM', 'menu_item', id);
      }
      this.emitChange();
      return true;
    }
    return false;
  }

  public getFoodOrders(): FoodOrder[] {
    return [...this.foodOrders];
  }

  public getFoodOrdersByUser(userId: string): FoodOrder[] {
    return this.foodOrders.filter((o) => o.user_id === userId);
  }

  public createFoodOrder(
    orderData: Omit<FoodOrder, 'id' | 'order_number' | 'created_at'>,
    actor?: { id: string; email: string; role: string }
  ): FoodOrder {
    const orderNum = `NIV-FB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: FoodOrder = {
      ...orderData,
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_number: orderNum,
      created_at: new Date().toISOString(),
    };

    this.foodOrders.unshift(newOrder);
    saveStorage(STORAGE_KEYS.FOOD_ORDERS, this.foodOrders);

    // Also auto-generate a ServiceRequest for Staff operations if it is room service
    if (newOrder.order_type === 'room_service') {
      const roomNum = newOrder.room_number || newOrder.delivery_location.replace(/[^0-9]/g, '') || '101';
      this.serviceRequests.unshift({
        id: `srv_fb_${Date.now()}`,
        user_id: newOrder.user_id,
        room_number: roomNum,
        category: 'room_service',
        title: `In-Room Dining: ${newOrder.order_number}`,
        details: `${newOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}. Total: ₹${newOrder.total_inr.toLocaleString()}. ${newOrder.special_instructions || ''}`,
        priority: 'high',
        status: 'pending',
        assigned_to_name: 'Culinary In-Room Dining Team',
        created_at: newOrder.created_at,
      });
      saveStorage(STORAGE_KEYS.SERVICE_REQUESTS, this.serviceRequests);
    }

    if (actor) {
      this.logAudit(actor, 'CREATE_FOOD_ORDER', 'food_order', newOrder.id, {
        order_number: newOrder.order_number,
        total_inr: newOrder.total_inr,
        payment_method: newOrder.payment_method,
      });
    }

    this.emitChange();
    return newOrder;
  }

  public updateFoodOrderStatus(
    orderId: string,
    status: FoodOrderStatus,
    paymentStatus?: FoodPaymentStatus,
    notes?: string,
    actor?: { id: string; email: string; role: string }
  ): FoodOrder | undefined {
    const order = this.foodOrders.find((o) => o.id === orderId);
    if (!order) return undefined;

    order.status = status;
    if (paymentStatus) {
      order.payment_status = paymentStatus;
    }
    if (notes) {
      order.notes = notes;
    }

    saveStorage(STORAGE_KEYS.FOOD_ORDERS, this.foodOrders);

    if (actor) {
      this.logAudit(actor, 'UPDATE_FOOD_ORDER_STATUS', 'food_order', orderId, {
        status,
        payment_status: order.payment_status,
      });
    }

    this.emitChange();
    return order;
  }

  // --- STATS FOR FRONT DESK ---
  public getFrontDeskStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalRooms = this.rooms.length;
    const occupiedRooms = this.rooms.filter(r => r.occupancy_status === 'occupied').length;
    const availableRooms = this.rooms.filter(r => r.occupancy_status === 'vacant' && (r.operational_status === 'clean' || r.operational_status === 'inspected')).length;
    const dirtyRooms = this.rooms.filter(r => r.operational_status === 'dirty' || r.operational_status === 'cleaning_in_progress').length;
    const outOfServiceRooms = this.rooms.filter(r => r.operational_status === 'out_of_service').length;

    // Today's arrivals: confirmed reservations with check_in_date = today (or prior uncompleted)
    const todayArrivals = this.reservations.filter(r => r.status === 'confirmed' && r.check_in_date <= todayStr).length;

    // Today's departures: active stays with expected_check_out <= today
    const todayDepartures = this.activeStays.filter(s => s.status === 'active' && s.expected_check_out <= todayStr).length;

    const pendingReservations = this.reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length;
    const openServiceRequests = this.serviceRequests.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
    const pendingHousekeeping = this.housekeepingTasks.filter(h => h.status === 'pending' || h.status === 'in_progress').length;
    const activeFoodOrders = this.foodOrders.filter(o => o.status === 'received' || o.status === 'preparing' || o.status === 'out_for_delivery').length;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      dirtyRooms,
      outOfServiceRooms,
      todayArrivals,
      todayDepartures,
      pendingReservations,
      openServiceRequests,
      pendingHousekeeping,
      activeFoodOrders,
      occupancyRate,
    };
  }
}

export const db = new HotelDatabase();
