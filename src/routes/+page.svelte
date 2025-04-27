<script>
  import { auth } from '../stores/authStore.js';
  import { goto } from '$app/navigation';
  import { theme } from '../themeStore.js';
  import { handleBackendMessage } from '../messageHandler.js';
  import { authFetch } from '../authFetch.js';

  let loginOpen = false;
  let checkpointOpen = false;
  let loginErrorMessage = '';
  let loginLoading = false;
  let confirmation = '';
  let checkpointMessage = '';
  let checkpointMessageType = '';
  let username = '';
  let password = '';
  let employeeId = '';
  let checkpointData = null;

  async function handleLogin(event) {
    event.preventDefault();
    loginErrorMessage = '';
    loginLoading = true;

    try {
      const response = await fetch('/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) {
        const errorMsg = await handleBackendMessage(response);
        throw new Error(errorMsg);
      }
      const data = await response.json();
      if (data.token && data.userRole && data.employeeId) {
        auth.login({ token: data.token, userRole: data.userRole, employeeId: data.employeeId });
        loginOpen = false;
        username = '';
        password = '';
        if (data.userRole === 'Admin') {
          goto('/dashboard/admin', { replaceState: true, reload: true });
        } else if (data.userRole === 'Manager') {
          goto('/dashboard/manager', { replaceState: true, reload: true });
        } else if (data.userRole === 'Employee') {
          goto('/dashboard/employee', { replaceState: true, reload: true });
        } else {
          goto('/', { replaceState: true, reload: true });
        }
      } else {
        throw new Error('Hiányzó adat a válaszból!');
      }
    } catch (error) {
      loginErrorMessage = error.message || 'Ismeretlen hiba';
    } finally {
      loginLoading = false;
    }
  }

  function handleStartWork() {
    checkpointMessage = '';
    checkpointMessageType = '';
    fetchCheckpoint('/Checkpoint/start');
  }

  function handleEndWork() {
    checkpointMessage = '';
    checkpointMessageType = '';
    fetchCheckpoint('/Checkpoint/end');
  }

  async function fetchCheckpoint(endpoint) {
    try {
      if (!employeeId) {
        checkpointMessage = 'Dolgozó azonosító megadása kötelező!';
        checkpointMessageType = 'error';
        checkpointData = null;
        return;
      }
      const url = `${endpoint}?employeeId=${encodeURIComponent(employeeId)}`;
      const response = await authFetch(url, {
        method: 'POST'
      });
      let msg = '';
      checkpointData = null;
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          checkpointData = await response.json();
          msg = '';
        } else {
          msg = await handleBackendMessage(response);
        }
      } catch (e) {
        msg = 'Nem sikerült értelmezni a szerver válaszát.';
      }
      if (!response.ok) {
        checkpointMessage = msg || (checkpointData?.confirmation ?? '');
        checkpointMessageType = 'error';
      } else {
        checkpointMessage = '';
        checkpointMessageType = 'success';
        confirmation = checkpointData?.confirmation || '';
      }
    } catch (error) {
      checkpointMessage = error.message || 'Ismeretlen hiba';
      checkpointMessageType = 'error';
      checkpointData = null;
    }
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
          <input class="main-input" type="text" placeholder="Felhasználónév" required bind:value={username} />
          <input class="main-input" type="password" placeholder="Jelszó" required bind:value={password} />
          {#if loginErrorMessage}
            <div class="message-container">
              <div class="message error">{loginErrorMessage}</div>
            </div>
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
          <input class="main-input" id="employeeIdInput" type="text" placeholder="123" required bind:value={employeeId} />
          <div style="display:flex; gap:0.8rem; margin-bottom:0.6rem;">
            <button type="button" class="main-btn" on:click={handleStartWork}>Belépés</button>
            <button type="button" class="main-btn" on:click={handleEndWork}>Kilépés</button>
          </div>
          {#if checkpointData}
            <div class="message success">
              {#if checkpointData.duration}
                <div><b>Munkaidő:</b> {checkpointData.duration}</div>
              {/if}
              <div>{checkpointData.confirmation}</div>
            </div>
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
    font-size: 5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    letter-spacing: 1px;
    text-align: center;
  }
  .main-panel {
    margin: 0 auto;
    max-width: 43.75rem; /* 700px */
    min-width: 20rem; /* 320px */
    width: 100%;
    padding: 2rem 1.5rem;
    background: var(--surface-1);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  .dropdown-panel {
    max-width: 43.75rem;
    min-width: 20rem;
    width: 100%;
    padding: 1rem 1.2rem;
    background: var(--surface-1);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
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
  @media (max-width: 43.75rem) {
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