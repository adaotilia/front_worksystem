import { get } from 'svelte/store';
import { auth } from './stores/authStore.js';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Egy közös fetch wrapper, ami automatikusan hozzáadja a Bearer tokent minden védett kéréshez
 * és kezeli az alap API URL-t.
 * @param {string} url - Az API végpont URL-je (relatív vagy teljes URL)
 * @param {object} options - Fetch opciók
 * @returns {Promise<Response>} - A fetch válasza
 */
export async function authFetch(url, options = {}) {
  // Ha a URL nem teljes URL, akkor hozzáadjuk az API_URL-t
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  // Token lekérése a store-ból vagy localStorage-ból
  let token = '';
  try {
    token = get(auth).token || localStorage.getItem('token') || '';
  } catch {
    token = localStorage.getItem('token') || '';
  }

  // Headers biztosítása
  options.headers = options.headers || {};
  if (!options.headers['Authorization'] && token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(fullUrl, options);
}