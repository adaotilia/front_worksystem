/**
 * Kezeli a háttérhívások válaszait.
 * @param {Response} response - A háttérhívás válasza
 * @returns {Promise<string>} - Felhasználóbarát üzenet
 */
export async function handleBackendMessage(response) {
  const unknownError = 'Ismeretlen hiba';
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (typeof data === 'object' && data !== null && data.message) {
        return data.message;
      }
      return JSON.stringify(data);
    } else if (contentType.includes('text/')) {
      const text = await response.text();
      return text || unknownError;
    } else {
      return unknownError;
    }
  } catch (e) {
    return unknownError;
  }
}
