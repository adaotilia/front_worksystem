// Globális API végpont konfiguráció SvelteKit-hez
// A .env vagy .env.production VITE_API_URL változóját használja

export const API_BASE = import.meta.env.VITE_API_URL;
