// Egységes fetch util: minden üzenet, hiba, megerősítés, siker egy helyen kezelve
export async function fetchMessage(url, options = {}) {
  let response;
  let data = null;
  let text = '';
  try {
    response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      text = await response.text();
    }

    // Ha JSON és van confirmation, azt külön adjuk vissza
    if (data && typeof data === 'object' && data.confirmation) {
      return {
        ok: response.ok,
        status: response.status,
        type: 'confirmation',
        message: data.confirmation,
        employeeName: data.employeeName,
        data
      };
    }

    // Ha van data.message, azt adjuk vissza, különben a sima szöveget (pl. hibaüzenet)
    const msg = (data && typeof data === 'object' && data.message)
      ? data.message
      : (typeof text === 'string' && text.trim() !== '' ? text : JSON.stringify(data));

    return {
      ok: response.ok,
      status: response.status,
      type: response.ok ? 'success' : 'error',
      message: msg,
      data
    };
  } catch (err) {
    return {
      ok: false,
      status: response ? response.status : 0,
      type: 'error',
      message: err.message || 'Ismeretlen hiba',
      data: null
    };
  }
}
