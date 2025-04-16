<script>
  import { auth } from '../../stores/authStore.js';
  import { onMount } from 'svelte';
  import ProfileCard from '../../components/ProfileCard.svelte';
  import StatCard from '../../components/StatCard.svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../../themeStore.js';
  import ThemeToggle from '../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';
  import { API_BASE } from '../../config.js';
  import { fetchMessage } from '../../utils/fetchMessage.js';

  const dispatch = createEventDispatcher();
  let token = '';
  let userRole = '';
  export let EmployeeId = '';

  let adminData = null;
  let error = '';

  // Tab menü logika
  let activeTab = 'checkpoint';
  const tabs = [
    { key: 'checkpoint', label: 'Checkpoint' },
    { key: 'monthly', label: 'Havi munka' },
    { key: 'schedule', label: 'Beosztás' },
    { key: 'report', label: 'Kimutatás' },
    { key: 'dashboard', label: 'Vezérlőpult' }
  ];

  // Új változók a checkpoint lekérdezéshez
  let selectedYear = '2025';
  let selectedMonth = '01';
  let checkpoints = [];
  let checkpointsLoading = false;
  let checkpointsError = '';
  let hasTriedMonthFetch = false;
  const years = ['2025', '2026'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  // Új változók az employee ID szerinti lekérdezéshez
  let employeeIdInput = '';
  let employeeYearInput = '';
  let employeeMonthInput = '';
  let checkpointsByEmployee = [];
  let checkpointsByEmployeeLoading = false;
  let checkpointsByEmployeeError = '';
  let hasTriedEmployeeFetch = false;

  // Új változók a státusz lekérdezéshez
  let employeeStatusIdInput = '';
  let employeeStatusDateInput = '';
  let employeeStatusResult = '';
  let employeeStatusLoading = false;
  let employeeStatusError = '';
  let hasTriedEmployeeStatus = false;

  // Új változók a checkpoint lekéréshez
  let checkTimesIdInput = '';
  let checkTimesYearInput = '';
  let checkTimesMonthInput = '';
  let checkTimesResult = null;
  let checkTimesLoading = false;
  let checkTimesError = '';
  let hasTriedCheckTimes = false;

  // Új változók az új checkpoint létrehozásához
  let newCheckpointId = '';
  let newCheckpointStart = '';
  let newCheckpointEnd = '';
  let creatingCheckpoint = false;
  let checkpointCreateMessage = '';
  let checkpointCreateError = '';

  // Új változók a checkpoint módosításához
  let updateCheckpointId = '';
  let updateCheckpointCheckIn = '';
  let updateCheckpointCheckOut = '';
  let updatingCheckpoint = false;
  let updateCheckpointMessage = '';
  let updateCheckpointError = '';

  // Felső kártya státusz
  let adminCardStatus = '';
  let adminCardStatusLoading = false;
  let adminCardStatusError = '';

  // Auth store szinkronizáció
  const unsubscribe = auth.subscribe((state) => {
    token = state.token;
    userRole = state.userRole;
    EmployeeId = state.EmployeeId;
  });

  // Jogosultság ellenőrzés csak adminnak
  $: {
    if (!token || !userRole) {
      goto('/');
    } else if (userRole.toLowerCase() !== 'admin') {
      if (userRole.toLowerCase() === 'employee') {
        goto('/employee');
      } else if (userRole.toLowerCase() === 'manager') {
        goto('/manager');
      } else {
        goto('/');
      }
    }
  }

  // Adatok lekérése, ha van token és a szerepkör admin
  $: if (token && userRole && userRole.toLowerCase() === 'admin') {
    fetchAdminData();
    if (EmployeeId) {
      fetchAdminCardStatus(EmployeeId);
    }
  }

  async function fetchAdminData() {
    if (!token || !EmployeeId) return;
    try {
      const url = `${API_BASE}/Admin/employees/me`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const text = await response.text();
      if (!response.ok) throw new Error('Hiba az admin adatok lekérésekor');
      adminData = JSON.parse(text);
      adminData.sessionStatus = 'online';
    } catch (err) {
      console.error('Hiba az admin adatok lekérésekor:', err);
      error = err.message;
    }
  }

  async function fetchAdminCardStatus(employeeId) {
    adminCardStatusLoading = true;
    adminCardStatusError = '';
    adminCardStatus = '';
    try {
      const today = new Date().toISOString().slice(0, 10);
      const url = `${API_BASE}/Admin/checkpoints/employee/${employeeId}/status/${today}`;
      const result = await fetchMessage(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (result.ok) {
        adminCardStatus = result.json || '';
      } else {
        throw new Error(result.message || 'Hiba a státusz lekérdezésekor');
      }
    } catch (err) {
      adminCardStatusError = err.message;
      adminCardStatus = '';
    }
    adminCardStatusLoading = false;
  }

  async function fetchCheckpointsByMonth(year, month) {
    checkpointsLoading = true;
    checkpointsError = '';
    checkpoints = [];
    try {
      const url = `${API_BASE}/Admin/checkpoints/month/${year}/${month}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Hiba a checkpointok lekérdezésekor');
      checkpoints = await response.json();
    } catch (err) {
      checkpointsError = err.message;
      checkpoints = [];
    }
    checkpointsLoading = false;
  }

  async function fetchCheckTimesByEmployeeId(EmployeeId, year, month) {
    hasTriedCheckTimes = true;
    checkTimesLoading = true;
    checkTimesError = '';
    checkTimesResult = null;
    try {
      const url = `${API_BASE}/Admin/checkpoints/employee/${EmployeeId}/times/${year}/${month}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Hiba a checkpointok lekérdezésekor');
      checkTimesResult = await response.json();
    } catch (err) {
      checkTimesError = err.message;
      checkTimesResult = null;
    }
    checkTimesLoading = false;
  }

  async function createCheckpoint() {
    creatingCheckpoint = true;
    checkpointCreateMessage = '';
    checkpointCreateError = '';
    try {
      const body = {
        EmployeeId: newCheckpointId,
        CheckInTime: newCheckpointStart ? new Date(newCheckpointStart).toISOString() : null,
        CheckOutTime: newCheckpointEnd ? new Date(newCheckpointEnd).toISOString() : null
      };
      const response = await fetch(`${API_BASE}/Admin/checkpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Hiba a checkpoint létrehozásakor');
      checkpointCreateMessage = 'Checkpoint sikeresen létrehozva!';
      newCheckpointId = '';
      newCheckpointStart = '';
      newCheckpointEnd = '';
    } catch (err) {
      checkpointCreateError = err.message;
    }
    creatingCheckpoint = false;
  }

  function handleLogout() {
    auth.logout();
    goto('/');
  }
</script>

<main class="admin-layout">
  <header class="admin-header">
    <ProfileCard
      fullName={adminData ? adminData.fullName : ''}
      userRole="Admin"
      username={adminData ? adminData.username : ''}
      sessionStatus={adminData ? adminData.sessionStatus : ''}
    />
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <div class="admin-header-center">
      <StatCard label="Ledolgozott munkanapok" value="12/20" />
    </div>
    <div class="admin-header-actions">
      <button class="main-btn logout-btn" on:click={handleLogout}>Kijelentkezés</button>
    </div>
  </header>
  <!-- Tab navigáció -->
  <nav class="admin-tabs">
    {#each tabs as tab}
      <button
        class="admin-tab-btn"
        class:active={activeTab === tab.key}
        type="button"
        on:click={() => activeTab = tab.key}>
        {tab.label}
      </button>
    {/each}
  </nav>
  <section class="admin-content">
    {#if activeTab === 'checkpoint'}
      <section class="admin-checkpoint-section" style="margin-top: 0;">
        <div class="checkpoint-filters checkpoint-filters-column">
          <div class="checkpoint-group">
            <label for="year">Év:</label>
            <select id="year" bind:value={selectedYear}>
              {#each years as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
            <label for="month">Hónap:</label>
            <select id="month" bind:value={selectedMonth}>
              {#each months as month}
                <option value={month}>{month}</option>
              {/each}
            </select>
            <button class="main-btn" type="button" on:click={() => fetchCheckpointsByMonth(selectedYear, selectedMonth)} disabled={checkpointsLoading}>
              {#if checkpointsLoading}Lekérés...{:else}Havi lekérés{/if}
            </button>
          </div>
        </div>
        <!-- Checkpoint lista -->
        {#if checkpointsLoading}
          <div>Betöltés...</div>
        {:else if checkpointsError}
          <div class="error">{checkpointsError}</div>
        {:else if checkpoints.length > 0}
          <table class="checkpoint-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Check-in</th>
                <th>Check-out</th>
              </tr>
            </thead>
            <tbody>
              {#each checkpoints as cp}
                <tr>
                  <td>{cp.id}</td>
                  <td>{cp.checkInTime}</td>
                  <td>{cp.checkOutTime}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <div>Nincs adat.</div>
        {/if}
      </section>
    {:else if activeTab === 'dashboard'}
      <section class="admin-dashboard-section">
        <h2>Vezérlőpult</h2>
        <table class="admin-table">
          <thead>
            <!-- ... -->
          </thead>
        </table>
      </section>
    {/if}
  </section>
</main>

<style>
  .admin-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100vw;
  }
  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #242038;
    color: #fff;
    gap: 2.5rem;
  }
  .admin-header-center {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
  .admin-header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .logout-btn {
    background: #ff6b6b;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }
  .logout-btn:hover {
    background: #6c3bb8;
  }
  /* TABOK */
  .admin-tabs {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    background: #181526;
    padding: 0.75rem 0;
    border-bottom: 1px solid #332f4b;
  }
  .admin-tab-btn {
    background: none;
    border: none;
    color: #bdbfff;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem 1.2rem;
    border-radius: 8px 8px 0 0;
    transition: background 0.15s, color 0.15s;
  }
  .admin-tab-btn.active, .admin-tab-btn:hover {
    background: #332f4b;
    color: #fff;
  }
  .admin-content {
    flex: 1;
    padding: 2rem;
  }
  /* .main-btn és .theme-toggle-btn stílust ne írj felül, azokat a global.css kezeli! */
</style>
