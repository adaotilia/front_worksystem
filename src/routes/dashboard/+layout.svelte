<script>
  import { theme } from '../../themeStore.js';
  import ProfileCard from '../../components/ProfileCard.svelte';
  import StatCard from '../../components/StatCard.svelte';
  import { goto } from '$app/navigation';
  import { auth } from '../../stores/authStore.js';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { API_BASE } from '../../config.js';

  // Tab menü logika: oldalon belüli tabváltás
  let activeTab = 'checkpoint';
  const tabs = [
    { key: 'checkpoint', label: 'Checkpoint' },
    { key: 'monthly', label: 'Havi munka' },
    { key: 'schedule', label: 'Beosztás' },
    { key: 'report', label: 'Kimutatás' },
    { key: 'dashboard', label: 'Vezérlőpult' }
  ];

  let userData = null;
  let userStatus = '';
  let token = '';
  let EmployeeId = '';
  let stat = {};
  let error = '';
  let logoutFn = () => { auth.logout(); goto('/'); };

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  async function fetchUserData(token, EmployeeId) {
    if (!token || !EmployeeId) return;
    const userRes = await fetch(`${API_BASE}/Employee/employees/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (userRes.ok) {
      userData = await userRes.json();
    }
    const statusRes = await fetch(`${API_BASE}/Employee/checkpoints/status/${year}/${month}/${day}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (statusRes.ok) {
      userStatus = await statusRes.text();
    }
  }

  onMount(() => {
    const token = localStorage.getItem('token');
    const EmployeeId = localStorage.getItem('EmployeeId');
    fetchUserData(token, EmployeeId);
  });

  let showActions = false;
  let showMonthlyActions = false;
  let showScheduleActions = false;
  let showReportActions = false;
</script>

<main class="dashboard-layout">
  <header class="dashboard-header">
    {#if userData}
      <ProfileCard
        fullName={userData.fullName}
        userRole={userData.userRole}
        username={userData.username}
        EmployeeId={userData.EmployeeId}
        sessionStatus={userStatus === 'Active' ? 'Aktív' : 'Inaktív'}
      />
    {/if}
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <div class="dashboard-header-center">
      <StatCard label={stat.label || 'Ledolgozott munkanapok'} value={stat.value || ''} />
    </div>
    <div class="dashboard-header-actions">
      <button class="main-btn logout-btn" on:click={logoutFn}>Kijelentkezés</button>
    </div>
  </header>
  <nav class="dashboard-tabs">
    {#each tabs as tab}
      <button
        type="button"
        class="dashboard-tab-btn"
        class:active={activeTab === tab.key}
        on:click={() => activeTab = tab.key}
      >
        {tab.label}
      </button>
    {/each}
  </nav>

  {#if activeTab === 'checkpoint'}
    <div class="dashboard-actions-row">
      <button class="dropdown-btn" on:click={() => showActions = !showActions} aria-expanded={showActions}>
        Műveletek {showActions ? '▲' : '▼'}
      </button>
    </div>
    {#if showActions}
      <div class="actions-panel">
        <div class="api-row">
          <form class="api-action-form" on:submit|preventDefault={() => {}}>
            <button type="submit" class="primary-action">Lekérés</button>
            <div class="form-inline-group">
              <label for="from-date">Dátum -tól:</label>
              <input type="date" id="from-date" name="fromDate" />
            </div>
            <div class="form-inline-group">
              <label for="to-date">-ig:</label>
              <input type="date" id="to-date" name="toDate" />
            </div>
          </form>
        </div>
        <div class="api-row">
          <button class="primary-action" disabled>Másik művelet (később)</button>
        </div>
      </div>
    {/if}
    <div class="checkpoint-table-wrapper">
      <table class="checkpoint-table">
        <thead>
          <tr>
            <th>Dolgozó azonosító</th>
            <th>Belépési idő</th>
            <th>Kilépési idő</th>
            <th>Státusz</th>
          </tr>
        </thead>
        <tbody>
          <!-- Itt lesznek a dinamikus sorok -->
          <tr>
            <td>123</td>
            <td>2025-04-27 08:00:00</td>
            <td>2025-04-27 16:00:00</td>
            <td>Aktív/Inaktív</td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}

  {#if activeTab === 'monthly'}
    <div class="dashboard-actions-row">
      <button class="dropdown-btn" on:click={() => showMonthlyActions = !showMonthlyActions} aria-expanded={showMonthlyActions}>
        Műveletek {showMonthlyActions ? '▲' : '▼'}
      </button>
    </div>
    {#if showMonthlyActions}
      <div class="actions-panel">
        <div class="api-row">
          <form class="api-action-form" on:submit|preventDefault={() => {}}>
            <button type="submit" class="primary-action">Lekérés</button>
            <div class="form-inline-group">
              <label for="month-date">Év-hónap:</label>
              <input type="month" id="month-date" name="monthDate" />
            </div>
            <div class="form-inline-group">
              <label for="user-id">Dolgozó azonosító:</label>
              <input type="text" id="user-id" name="userId" placeholder="Pl. 123" />
            </div>
          </form>
        </div>
      </div>
    {/if}
    <div class="checkpoint-table-wrapper">
      <table class="checkpoint-table">
        <thead>
          <tr>
            <th>Dolgozó azonosító</th>
            <th>Év-hónap</th>
            <th>Dátum</th>
            <th>Munkaórák</th>
            <th>Túlórák</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>123</td>
            <td>2025-04</td>
            <td>2025-04-27</td>
            <td>8</td>
            <td>2</td>
          </tr>
        </tbody>
      </table>
      <table class="summary-table">
        <tbody>
          <tr>
            <td>Havi munkanapok</td>
            <td>20</td>
          </tr>
          <tr>
            <td>Havi munkaórák</td>
            <td>160</td>
          </tr>
          <tr>
            <td>Havi túlórák</td>
            <td>12</td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}

  {#if activeTab === 'schedule'}
    <div class="dashboard-actions-row">
      <button class="dropdown-btn" on:click={() => showScheduleActions = !showScheduleActions} aria-expanded={showScheduleActions}>
        Műveletek {showScheduleActions ? '▲' : '▼'}
      </button>
    </div>
    {#if showScheduleActions}
      <div class="actions-panel">
        <div class="api-row">
          <form class="api-action-form" on:submit|preventDefault={() => {}}>
            <button type="submit" class="primary-action">Lekérés</button>
            <div class="form-inline-group">
              <label for="schedule-date">Dátum:</label>
              <input type="date" id="schedule-date" name="scheduleDate" />
            </div>
            <div class="form-inline-group">
              <label for="user-id-schedule">Dolgozó azonosító:</label>
              <input type="text" id="user-id-schedule" name="userIdSchedule" placeholder="Pl. 123" />
            </div>
          </form>
        </div>
      </div>
    {/if}
    <div class="checkpoint-table-wrapper">
      <table class="checkpoint-table">
        <thead>
          <tr>
            <th>Dolgozó azonosító</th>
            <th>Dátum</th>
            <th>Kezdési időpont</th>
            <th>Befejezési időpont</th>
            <th>Típus</th>
            <th>Tervezett munkaórák</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>123</td>
            <td>2025-04-27</td>
            <td>08:00</td>
            <td>16:00</td>
            <td>Nappali</td>
            <td>8</td>
          </tr>
        </tbody>
      </table>
      <table class="summary-table">
        <tbody>
          <tr>
            <td>Tervezett havi munkaórák</td>
            <td>168</td>
          </tr>
          <tr>
            <td>Tervezett havi munkanapok</td>
            <td>21</td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}

  {#if activeTab === 'report'}
    <div class="dashboard-actions-row">
      <button class="dropdown-btn" on:click={() => showReportActions = !showReportActions} aria-expanded={showReportActions}>
        Műveletek {showReportActions ? '▲' : '▼'}
      </button>
    </div>
    {#if showReportActions}
      <div class="actions-panel">
        <div class="api-row">
          <form class="api-action-form" on:submit|preventDefault={() => {}}>
            <button type="submit" class="primary-action">Lekérés</button>
            <div class="form-inline-group">
              <label for="report-date">Dátum:</label>
              <input type="date" id="report-date" name="reportDate" />
            </div>
            <div class="form-inline-group">
              <label for="user-id-report">Dolgozó azonosító:</label>
              <input type="text" id="user-id-report" name="userIdReport" placeholder="Pl. 123" />
            </div>
          </form>
        </div>
      </div>
    {/if}
    <div class="checkpoint-table-wrapper">
      <table class="checkpoint-table">
        <thead>
          <tr>
            <th>Dolgozó azonosító</th>
            <th>Dátum</th>
            <th>Munkaóra</th>
            <th>Túlóra</th>
            <th>Tervezett munkaóra</th>
            <th>Tervezett túlóra</th>
            <th>Típus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>123</td>
            <td>2025-04-27</td>
            <td>8</td>
            <td>2</td>
            <td>8</td>
            <td>1</td>
            <td>Nappali</td>
          </tr>
        </tbody>
      </table>
      <table class="summary-table">
        <tbody>
          <tr>
            <td>Havi munkanapok</td>
            <td>20</td>
          </tr>
          <tr>
            <td>Tervezett havi munkanapok</td>
            <td>21</td>
          </tr>
          <tr>
            <td>Havi túlórák</td>
            <td>12</td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}

  {#if activeTab === 'dashboard'}
    <div class="dashboard-actions-row">
      <span class="actions-label">Műveletek</span>
    </div>
    <div class="actions-panel">
      <div class="api-row">
        <button class="danger-action">Jelszó megváltoztatása</button>
      </div>
    </div>
  {/if}

  <section class="dashboard-content">
    <slot {activeTab} {tabs} />
  </section>
</main>

<style>
:global(.dashboard-layout) {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
}
:global(.dashboard-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--color-bg-header, #242038);
  color: var(--color-header-text, #fff);
  gap: 2.5rem;
}
@media (max-width: 900px) {
  :global(.dashboard-header) {
    flex-direction: column;
    align-items: stretch;
    gap: 1.2rem;
    padding: 1rem 0.7rem;
  }
}
:global(.dashboard-header-center) {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
}
@media (max-width: 900px) {
  :global(.dashboard-header-center) {
    justify-content: flex-start;
  }
}
:global(.dashboard-header-actions) {
  display: flex;
  gap: 1rem;
  align-items: center;
}
:global(.logout-btn) {
  background: var(--color-logout-btn-bg, #ff6b6b);
  color: var(--color-logout-btn-text, #fff);
  border: none;
  border-radius: var(--radius);
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
}
:global(.dashboard-tabs) {
  display: flex;
  justify-content: left;
  gap: 1.5rem;
  background: var(--color-dashboard-tabs-bg, #181526);
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-dashboard-tabs-border, #332f4b);
}
@media (max-width: 900px) {
  :global(.dashboard-tabs) {
    flex-wrap: wrap;
    gap: 0.7rem;
    padding: 0.5rem 0.2rem;
  }
}
:global(.dashboard-tab-btn) {
  background: none;
  border: none;
  color: var(--color-dashboard-tab, #bdbfff);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1.2rem;
  border-radius: 0.5rem 0.5rem 0 0;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
}
:global(.dashboard-tab-btn.active),
:global(.dashboard-tab-btn:hover) {
  background: var(--color-dashboard-tab-active-bg, #332f4b);
  color: var(--color-dashboard-tab-active-text, #fff);
}
:global(.dashboard-content) {
  flex: 1;
  padding: 2rem;
}
:global(.error) {
  color: var(--color-error, #ff6b6b);
  margin-left: 2rem;
  font-weight: bold;
}
.dashboard-actions-row {
  margin: 1.2rem 0 0.5rem 0;
  display: flex;
  align-items: flex-start;
}
.dropdown-btn {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.45rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  box-shadow: var(--shadow);
}
.actions-panel {
  background: var(--color-actionpanel-bg, #fff);
  border: 1.5px solid var(--color-actionpanel-border, #e2d9fa);
  box-shadow: 0 4px 16px 0 rgba(76,36,150,0.13);
  border-radius: 0.7rem;
  margin-top: 0.7rem;
  padding: 1.1rem 1.2rem 1.2rem 1.2rem;
  width: 100vw;
  max-width: none;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  box-sizing: border-box;
}
.api-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1rem;
}
.api-row:last-child {
  margin-bottom: 0;
}
.api-action-form {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}
.form-inline-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
.form-inline-group label {
  margin: 0;
  min-width: 0;
}
.form-inline-group input[type="date"] {
  margin: 0;
  min-width: 180px;
}
.primary-action {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.4rem;
  padding: 0.45rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  box-shadow: var(--shadow);
  transition: background 0.15s;
}
.primary-action:hover {
  background: var(--color-dashboard-tab-active-bg, #a383f5);
}
.checkpoint-table-wrapper {
  overflow-x: auto;
  margin-top: 1.2rem;
}
.checkpoint-table {
  border-collapse: collapse;
  width: 100%;
  background: var(--color-table-bg, #fff);
  color: var(--color-table-row-text, #23203a);
  border-radius: 0.7rem;
  box-shadow: 0 2px 16px 0 rgba(76,36,150,0.08);
}
.checkpoint-table th, .checkpoint-table td {
  padding: 0.75rem 1.2rem;
  border-bottom: 1px solid var(--color-table-border, #ece6fa);
  text-align: left;
}
.checkpoint-table th {
  background: var(--color-table-header-bg, #f5f3ff);
  color: var(--color-table-header-text, #6c3bb8);
  font-weight: 700;
  font-size: 1.07rem;
}
.checkpoint-table tr:last-child td {
  border-bottom: none;
}
.summary-table {
  margin-top: 1.7rem;
  width: 100%;
  background: var(--color-table-bg, #fff);
  color: var(--color-table-row-text, #23203a);
  border-radius: 0.7rem;
  box-shadow: 0 2px 16px 0 rgba(76,36,150,0.08);
  border-collapse: collapse;
}
.summary-table td {
  padding: 0.82rem 1.2rem;
  border-bottom: 1px solid var(--color-table-border, #ece6fa);
  font-size: 1.08rem;
}
.summary-table tr:last-child td {
  border-bottom: none;
}
.summary-table td:first-child {
  font-weight: 600;
  color: var(--color-table-header-text, #6c3bb8);
  background: var(--color-table-header-bg, #f5f3ff);
  width: 60%;
}
.summary-table td:last-child {
  text-align: right;
  font-weight: 500;
}
.danger-action {
  background: #ff6b6b;
  color: #fff;
  border: none;
  border-radius: 0.4rem;
  padding: 0.45rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  box-shadow: var(--shadow);
  transition: background 0.15s;
}
.danger-action:hover {
  background: #ff6b6b;
}
.actions-label {
  font-size: 1.13rem;
  font-weight: 600;
  color: var(--color-table-header-text, #6c3bb8);
  margin-left: 1.2rem;
  display: block;
}
</style>