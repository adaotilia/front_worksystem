<script>
  import { auth } from '../stores/authStore.js';
  import { goto } from '$app/navigation';
  import { theme } from '../themeStore.js';
  import { fetchMessage } from '../utils/fetchMessage.js';
  const API_BASE = import.meta.env.VITE_API_URL;
  let loginOpen = false;
  let checkpointOpen = false;
  let username = '';
  let password = '';
  let loginErrorMessage = '';
  let loginLoading = false;
  let employeeId = '';
  let checkpointMessage = '';
  let checkpointMessageType = '';
  let confirmation = '';
  let confirmationType = '';
  let confirmationEmployeeId = '';
  function redirectAfterLogin(userRole) {
    goto(`/${userRole.toLowerCase()}`);
  }
  async function handleLogin(e) {
    e.preventDefault();
    loginErrorMessage = '';
    loginLoading = true;
    try {
      const result = await fetchMessage(`${API_BASE}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (result.ok) {
        auth.login({ Token: '', ...result }); 
        redirectAfterLogin(result?.userRole || '');
      } else {
        loginErrorMessage = result.message;
      }
    } catch (err) {
      loginErrorMessage = 'Szerverhiba';
    }
    loginLoading = false;
  }
  async function handleStartWork(e) {
    e.preventDefault();
    checkpointMessage = '';
    confirmation = '';
    confirmationType = '';
    try {
      const result = await fetchMessage(`${API_BASE}/Checkpoint/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      
      if (result.type === 'confirmation') {
        confirmation = result.message;
        confirmationType = 'start';
        confirmationEmployeeId = employeeId;
      } else {
        checkpointMessage = result.message;
        checkpointMessageType = result.type;
      }
    } catch (error) {
      checkpointMessage = 'Hálózati hiba: ' + error.message;
      checkpointMessageType = 'error';
    }
  }
  async function handleEndWork(e) {
    e.preventDefault();
    checkpointMessage = '';
    confirmation = '';
    confirmationType = '';
    try {
      const result = await fetchMessage(`${API_BASE}/Checkpoint/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      
      if (result.type === 'confirmation') {
        confirmation = result.message;
        confirmationType = 'end';
        confirmationEmployeeId = employeeId;
      } else {
        checkpointMessage = result.message;
        checkpointMessageType = result.type;
      }
    } catch (error) {
      checkpointMessage = 'Hálózati hiba: ' + error.message;
      checkpointMessageType = 'error';
    }
  }
  async function handleConfirm() {
    checkpointMessage = '';
    confirmation = '';
    let url = '';
    if (confirmationType === 'start') {
      url = `${API_BASE}/Checkpoint/start`;
    } else if (confirmationType === 'end') {
      url = `${API_BASE}/Checkpoint/end`;
    }
    const result = await fetchMessage(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmationEmployeeId)
    });
    checkpointMessage = result.message || (result.json ? JSON.stringify(result.json) : 'Ismeretlen válasz');
    checkpointMessageType = result.type;
    confirmationType = '';
    confirmationEmployeeId = '';
  }
</script>
<div class="centered-content">
  <h1 class="main-title">Munkarendszer</h1>
  <div class="main-panel">
    <button class="main-btn" aria-expanded={loginOpen} aria-controls="login-dropdown" on:click={() => loginOpen = !loginOpen}>
      Belépés
    </button>
    {#if loginOpen}
      <div class="dropdown-panel">
        <form on:submit={handleLogin}>
          <input class="main-input" type="text" placeholder="Felhasználónév" bind:value={username} required />
          <input class="main-input" type="password" placeholder="Jelszó" bind:value={password} required />
          {#if loginErrorMessage}
            <div class="message error">{loginErrorMessage}</div>
          {/if}
          <button type="submit" class="main-btn" disabled={loginLoading}>Bejelentkezés</button>
        </form>
      </div>
    {/if}
    <button class="main-btn" aria-expanded={checkpointOpen} aria-controls="checkpoint-dropdown" on:click={() => checkpointOpen = !checkpointOpen}>
      Checkpoint
    </button>
    {#if checkpointOpen}
      <div class="dropdown-panel">
        <form>
          <label class="input-label" for="employeeIdInput">Dolgozó Azonosító</label>
          <input class="main-input" id="employeeIdInput" type="text" placeholder="123" bind:value={employeeId} required />
          <div style="display:flex; gap:0.8rem; margin-bottom:0.6rem;">
            <button type="button" class="main-btn" on:click={handleStartWork}>Belépés</button>
            <button type="button" class="main-btn" on:click={handleEndWork}>Kilépés</button>
          </div>
          {#if confirmation}
            <div class="message success">{confirmation}</div>
            <button type="button" class="main-btn" on:click={handleConfirm}>Megerősítem</button>
          {/if}
          {#if checkpointMessage}
            <div class="message {checkpointMessageType}">{checkpointMessage}</div>
          {/if}
        </form>
      </div>
    {/if}
    <button class="main-btn" disabled>Mobil app letöltés</button>
  </div>
</div>
<style>
  .centered-content {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 4rem;
    width: 100vw;
    box-sizing: border-box;
  }
  .main-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 3rem;
    letter-spacing: 1px;
    text-align: center;
  }
  .main-panel {
    margin: 0 auto;
    max-width: 700px;
    min-width: 320px;
    width: 100%;
    padding: 2.5em 2rem;
    background: var(--surface-1);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  .dropdown-panel {
    max-width: 700px;
    min-width: 320px;
    width: 100%;
    padding: 2em 1.2em;
    background: var(--surface-1);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-top: 0;
    margin-bottom: 0;
    gap: 0;
  }
  .login-message {
    font-size: 1.1rem;
    margin-top: 0.7rem;
    text-align: center;
  }
  .input-label {
    font-weight: 600;
    margin-bottom: 0.4rem;
    text-align: left;
    display: block;
    font-size: 1.1rem;
  }
  @media (max-width: 700px) {
    .main-title {
      font-size: 2.1rem;
    }
    .main-panel, .dropdown-panel {
      max-width: 98vw;
      min-width: unset;
      padding: 1.1rem 0.7rem;
    }
    .centered-content {
      width: 100vw;
      padding-left: 0;
      padding-right: 0;
    }
  }
</style>