import { get } from 'svelte/store';
import { auth } from './stores/authStore.js';

/**
 * Egy közös fetch wrapper, ami automatikusan hozzáadja a Bearer tokent minden védett kéréshez.
 * @param {string} url - Az API végpont URL-je
 * @param {object} options - Fetch opciók
 * @returns {Promise<Response>} - A fetch válasza
 */
export async function authFetch(url, options = {}) {
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

  return fetch(url, options);
}
