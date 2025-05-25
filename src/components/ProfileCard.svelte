<script>
  import { onMount } from 'svelte';
  import { authFetch } from '../utils/auth'; // Adjust the import path as needed
  import { API_BASE } from '../config'; // Adjust the import path as needed

  export let fullName = '';
  export let username = '';
  export let employeeId = '';
  export let sessionStatus = '';

  let checkpointStatus = null;
  let checkpointLoading = false;
  let checkpointError = '';

  // Monogram generálása
  $: monogram =
    fullName.trim()
      .split(' ')
      .map(n => n[0]?.toUpperCase() || '')
      .join('')
      .slice(0,2);

  // Fetch checkpoint status when component mounts
  onMount(async () => {
    const today = new Date();
    await checkCheckpointStatus(
      today.getFullYear(),
      today.getMonth() + 1, // Months are 0-indexed in JS
      today.getDate()
    );
  });

  async function checkCheckpointStatus(year, month, day) {
    checkpointLoading = true;
    checkpointError = '';
    
    try {
      const response = await authFetch(`${API_BASE}/Employee/checkpoints/status/${year}/${month}/${day}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Hiba történt az állapot lekérdezése során');
      }

      checkpointStatus = await response.json();
    } catch (err) {
      console.error('Hiba az állapot lekérdezésekor:', err);
      checkpointError = err.message || 'Ismeretlen hiba történt az állapot lekérdezése során';
    } finally {
      checkpointLoading = false;
    }
  }
</script>

<div class="profile-card">
  <div class="profile-avatar">{monogram}</div>
  <div class="profile-info">
    <div class="profile-name">{fullName}</div>
    <span class="profile-username">{username}</span>
    <div class="profile-employeeid">ID: {employeeId}</div>
    {#if sessionStatus}
      <div class="profile-status {sessionStatus === 'Active' ? 'status-active' : 'status-inactive'}">
        <span class="status-dot"></span>
        {sessionStatus === 'Active' ? 'Aktív' : 'Inaktív'}
      </div>
    {/if}
    {#if checkpointLoading}
      <div>Betöltés...</div>
    {:else if checkpointError}
      <div class="error">{checkpointError}</div>
    {:else if checkpointStatus}
      <div class="checkpoint-status">
        Ma: {checkpointStatus.status || 'Nincs adat'}
      </div>
    {/if}
  </div>
</div>

<style>
  .profile-card {
    display: flex;
    align-items: center;
    background: var(--color-profile-bg, linear-gradient(135deg, #5b2be7 0%, #5636b8 100%));
    border-radius: var(--radius);
    padding: 1.2rem 2rem;
    box-shadow: 0 2px 12px rgba(44, 34, 94, 0.12);
    color: var(--color-profile-text, #fff);
    min-width: 20rem; /* 320px */
    max-width: 26.25rem; /* 420px */
    gap: 1.3rem;
    position: relative;
  }
  .profile-avatar {
    width: 3.75rem; /* 60px */
    height: 3.75rem;
    border-radius: 50%;
    background: var(--color-profile-avatar-bg, #a084e8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
    font-weight: bold;
    letter-spacing: 0.03em;
    margin-right: 0.5rem;
    box-shadow: 0 2px 8px rgba(44, 34, 94, 0.10);
  }
  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    position: relative;
    min-width: 0;
  }
  .profile-name {
    font-size: 1.35rem;
    font-weight: bold;
    margin-bottom: 0.1rem;
    letter-spacing: 0.01em;
  }
  .profile-username {
    font-size: 1rem;
    color: var(--color-profile-username, #e0e0ff);
    font-weight: 400;
    opacity: 0.85;
    margin-left: 0.2rem;
  }
  .profile-status {
    display: block;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 0.5rem;
    width: fit-content;
  }
  .profile-status.status-active {
    color: #22c55e; 
    font-weight: bold;
  }
  .profile-status.status-inactive {
    color: #ef4444; 
    font-weight: bold;
  }
</style>
