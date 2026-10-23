// Centralized luxury asset registry with direct ES imports
// This guarantees Vite properly bundles and resolves every image asset in both development and production.

import heroResortImg from '../assets/images/nivora_hero_resort_1791530362412.jpg';
import roomPresSuiteImg from '../assets/images/room_presidential_suite_1791530372409.jpg';
import roomDeluxeOceanImg from '../assets/images/room_deluxe_ocean_1791530384315.jpg';
import roomExecVillaImg from '../assets/images/room_executive_villa_1791530394520.jpg';
import resortSpaWellnessImg from '../assets/images/resort_spa_wellness_1791530404463.jpg';

// Culinary & F&B Assets
import foodBiryaniImg from '../assets/images/food_royal_biryani_1791538066279.jpg';
import foodBreakfastImg from '../assets/images/food_artisan_breakfast_1791538087767.jpg';
import foodTandooriPaneerImg from '../assets/images/food_tandoori_paneer_1791538108189.jpg';
import foodSeaBassImg from '../assets/images/food_grilled_seabass_1791538130118.jpg';
import foodDessertImg from '../assets/images/food_valrhona_dessert_1791538156490.jpg';
import foodJuicesImg from '../assets/images/food_tropical_juices_1791538185198.jpg';
import foodRoomServiceImg from '../assets/images/food_room_service_tray_1791538216961.jpg';

export const RESORT_IMAGES = {
  hero: heroResortImg,
  presidentialSuite: roomPresSuiteImg,
  deluxeOcean: roomDeluxeOceanImg,
  executiveVilla: roomExecVillaImg,
  spaWellness: resortSpaWellnessImg,
  
  // Culinary
  biryani: foodBiryaniImg,
  breakfast: foodBreakfastImg,
  tandooriPaneer: foodTandooriPaneerImg,
  seaBass: foodSeaBassImg,
  dessert: foodDessertImg,
  juices: foodJuicesImg,
  roomService: foodRoomServiceImg,
};

// Safe fallback placeholder SVG data URL with robust URL encoding
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#12382D"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#C7A36A" stroke-width="2" stroke-opacity="0.3"/>
  <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#C7A36A" font-family="serif" font-size="32" letter-spacing="4">NIVORA RESORT</text>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#F7F3EA" font-family="sans-serif" font-size="14" opacity="0.7" letter-spacing="2">CULINARY &amp; SANCTUARY</text>
</svg>`;

export const FALLBACK_IMAGE_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`;

/**
 * Universal safe image resolver that maps legacy strings, local paths,
 * and external references to guaranteed high-res bundled assets.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return RESORT_IMAGES.hero;
  }

  const lower = url.toLowerCase();

  // 1. Suites & Accommodations
  if (lower.includes('presidential') || lower.includes('penthouse') || lower.includes('301') || lower.includes('302')) {
    return RESORT_IMAGES.presidentialSuite;
  }
  if (lower.includes('deluxe') || lower.includes('ocean') || lower.includes('horizon') || lower.includes('201') || lower.includes('202') || lower.includes('203') || lower.includes('204')) {
    return RESORT_IMAGES.deluxeOcean;
  }
  if (lower.includes('villa') || lower.includes('garden') || lower.includes('sanctuary') || lower.includes('101') || lower.includes('102')) {
    return RESORT_IMAGES.executiveVilla;
  }
  if (lower.includes('spa') || lower.includes('wellness') || lower.includes('pavilion') || lower.includes('103') || lower.includes('104')) {
    return RESORT_IMAGES.spaWellness;
  }

  // 2. Culinary & Dining
  if (lower.includes('biryani') || lower.includes('rice') || lower.includes('mutton') || lower.includes('murgh') || lower.includes('butter chicken') || lower.includes('ind_')) {
    return RESORT_IMAGES.biryani;
  }
  if (lower.includes('breakfast') || lower.includes('tartine') || lower.includes('croissant') || lower.includes('egg') || lower.includes('pancake') || lower.includes('bf_1') || lower.includes('bf_2')) {
    return RESORT_IMAGES.breakfast;
  }
  if (lower.includes('tandoori') || lower.includes('paneer') || lower.includes('tikka') || lower.includes('starter') || lower.includes('dal') || lower.includes('st_1')) {
    return RESORT_IMAGES.tandooriPaneer;
  }
  if (lower.includes('seabass') || lower.includes('fish') || lower.includes('salmon') || lower.includes('calamari') || lower.includes('shrimp') || lower.includes('fettuccine') || lower.includes('pasta') || lower.includes('truffle') || lower.includes('tenderloin') || lower.includes('con_')) {
    return RESORT_IMAGES.seaBass;
  }
  if (lower.includes('dessert') || lower.includes('valrhona') || lower.includes('chocolate') || lower.includes('rasmalai') || lower.includes('sweet') || lower.includes('cake') || lower.includes('des_')) {
    return RESORT_IMAGES.dessert;
  }
  if (lower.includes('juice') || lower.includes('tea') || lower.includes('coffee') || lower.includes('cooler') || lower.includes('coconut') || lower.includes('elixir') || lower.includes('beverage') || lower.includes('chia') || lower.includes('bev_') || lower.includes('juc_')) {
    return RESORT_IMAGES.juices;
  }
  if (lower.includes('room_service') || lower.includes('tray') || lower.includes('platter') || lower.includes('dining') || lower.includes('rs_')) {
    return RESORT_IMAGES.roomService;
  }

  // 3. Resort & Hero
  if (lower.includes('hero') || lower.includes('resort') || lower.includes('hotel') || lower.includes('exterior')) {
    return RESORT_IMAGES.hero;
  }

  // 4. Stale Unsplash or external URLs fallback to authentic hero
  if (lower.includes('unsplash.com') || lower.includes('placeholder')) {
    return RESORT_IMAGES.hero;
  }

  return url;
}
