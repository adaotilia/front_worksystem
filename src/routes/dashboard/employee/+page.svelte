<script>
  import { auth } from '../../../stores/authStore.js';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../../../themeStore.js';
  import ThemeToggle from '../../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { API_BASE } from '../../../config.js';
  import { authFetch } from '../../../authFetch.js';
  
  const dispatch = createEventDispatcher();
  let token = '';
  let userRole = '';
  export let EmployeeId = '';

  let employeeData = null;
  let error = '';

  let showActions = false;
  let showMonthlyActions = false;
  let showScheduleActions = false;
  let showReportActions = false;

  let activeTab = 'checkpoint';
  const tabs = [
    { key: 'checkpoint', label: 'Checkpoint' },
    { key: 'monthly', label: 'Havi munka' },
    { key: 'schedule', label: 'Beosztás' },
    { key: 'report', label: 'Kimutatás' },
    { key: 'dashboard', label: 'Vezérlőpult' }
  ];

  // Auth store szinkronizáció
  const unsubscribe = auth.subscribe((state) => {
    token = state.token;
    userRole = state.userRole;
  });

  async function fetchEmployeeData() {
    if (!token || !EmployeeId) return;
    try {
      // Az employee saját adatait az /Employee/employees/me végponton kérjük le
      const url = `${API_BASE}/Employee/employees/me`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const text = await response.text();
      if (!response.ok) throw new Error('Hiba az employee adatok lekérésekor');
      employeeData = JSON.parse(text);
      // Beállítjuk a sessionStatus-t 'online'-ra, ha sikerült az adatokat lekérni
      employeeData.sessionStatus = 'online';
    } catch (err) {
      console.error('Hiba az employee adatok lekérésekor:', err);
      error = err.message;
    }
  }

  // Jogosultság ellenőrzés és adatlekérés csak böngészőben, onMount-ban!
  onMount(() => {
    if (!token || !userRole || userRole.toLowerCase() !== 'employee') {
      if (!token || !userRole) {
        goto('/');
      } else if (userRole.toLowerCase() === 'admin') {
        goto('/dashboard/admin');
      } else if (userRole.toLowerCase() === 'manager') {
        goto('/dashboard/manager');
      } else {
        goto('/');
      }
    } else {
      fetchEmployeeData();
    }
  });

  function handleLogout() {
    auth.logout();
    goto('/');
  }

  // --- Havi checkpoint lekérés saját azonosítóra ---
  let selectedYear = '';
  let selectedMonth = '';
  let checkpoints = [];
  let checkpointsLoading = false;
  let checkpointsError = '';
  let hasTriedMonthFetch = false;

  async function fetchCheckpointsByMonth(year, month) {
    checkpointsLoading = true;
    checkpointsError = '';
    checkpoints = [];
    hasTriedMonthFetch = true;
    try {
      const url = `${API_BASE}/Employee/checkpoints/${year}/${month}`;
      const response = await authFetch(url, {
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

  let employeeId = '';
  let oldPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let changePasswordLoading = false;
  let changePasswordError = '';
  let changePasswordSuccess = '';

  async function changeEmployeePassword() {
    changePasswordLoading = true;
    changePasswordError = '';
    changePasswordSuccess = '';
    if (newPassword !== confirmNewPassword) {
      changePasswordError = 'Az új jelszavak nem egyeznek!';
      changePasswordLoading = false;
      return;
    }
    try {
      const response = await authFetch(`${API_BASE}/Employee/employees/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: Number(employeeId),
          password: oldPassword,
          newPassword: newPassword,
          confirmNewPassword: confirmNewPassword
        })
      });
      if (!response.ok) {
        let errorMsg = 'Jelszó módosítása sikertelen.';
        try {
          const text = await response.text();
          let data;
          try { data = JSON.parse(text); } catch {}
          if (data && typeof data === 'object') {
            if (data.message) {
              errorMsg = data.message;
            } else if (data.title) {
              errorMsg = data.title;
              if (data.detail) errorMsg += ': ' + data.detail;
            } else if (data.detail) {
              errorMsg = data.detail;
            }
          } else if (text) {
            errorMsg = text.split(/\.|\n/)[0].trim();
          }
        } catch {}
        throw new Error(errorMsg);
      }
      changePasswordSuccess = 'Jelszó sikeresen módosítva!';
      employeeId = '';
      oldPassword = '';
      newPassword = '';
      confirmNewPassword = '';
    } catch (err) {
      changePasswordError = err.message;
    }
    changePasswordLoading = false;
  }

  // --- Havi munka lekérdezés saját részre ---
  let monthlyYear = '';
  let monthlyMonth = '';
  let monthlyReportData = null;
  let monthlyReportLoading = false;
  let monthlyReportError = '';

  async function fetchMyMonthlyReport() {
    monthlyReportLoading = true;
    monthlyReportError = '';
    monthlyReportData = null;
    try {
      const url = `${API_BASE}/Employee/monthlyreports/me/bydate?year=${monthlyYear}&month=${monthlyMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Riport lekérdezése sikertelen');
      monthlyReportData = await resp.json();
    } catch (err) {
      monthlyReportError = err.message;
    }
    monthlyReportLoading = false;
  }
</script>

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

<section>
  {#if activeTab === 'checkpoint'}
    <div class="api-description">Év és hónap szerint az összes Checkpoint lekérése:</div>
    <form class="form-inline form-inline-labels-top" on:submit|preventDefault={() => fetchCheckpointsByMonth(selectedYear, selectedMonth)}>
      <div class="form-inline-group">
        <label for="year-select">Év:</label>
        <input type="number" id="year-select" name="year" min="2024" max="2070" bind:value={selectedYear} placeholder="Pl. 2025" required class="checkpoint-input" />
      </div>
      <div class="form-inline-group">
        <label for="month-select">Hónap:</label>
        <input type="number" id="month-select" name="month" min="1" max="12" bind:value={selectedMonth} placeholder="1-12" required class="checkpoint-input" />
      </div>
      <button type="submit" class="primary-action btn-align-bottom">Lekérés</button>
    </form>
    {#if checkpointsLoading}
      <div>Betöltés...</div>
    {:else if checkpointsError}
      <div class="error">{checkpointsError}</div>
    {:else if checkpoints.length > 0}
      <table class="data-table">
        <thead>
          <tr>
            <th>Dolgozó azonosító</th>
            <th>Belépési idő</th>
            <th>Kilépési idő</th>
            <th>Státusz</th>
          </tr>
        </thead>
        <tbody>
          {#each checkpoints as cp}
            <tr>
              <td>{cp.employeeId}</td>
              <td>{cp.checkInTime}</td>
              <td>{cp.checkOutTime}</td>
              <td>{cp.sessionStatus}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if hasTriedMonthFetch}
      <div>Nincs adat a megadott időszakra.</div>
    {/if}
  {/if}

  {#if activeTab === 'monthly'}
    <div class="api-row api-row-column">
      <div class="api-description">Havi riport lekérdezése (saját):</div>
      <form class="form-2row api-action-form" on:submit|preventDefault={fetchMyMonthlyReport}>
        <div class="form-2row-row">
          <label for="monthly-year">Év:</label>
          <input id="monthly-year" type="number" bind:value={monthlyYear} min="2020" max="2070" required placeholder="Pl. 2025" size="12" class="checkpoint-input" />
          <label for="monthly-month">Hónap:</label>
          <input id="monthly-month" type="number" bind:value={monthlyMonth} min="1" max="12" required placeholder="1-12" size="9" class="checkpoint-input" />
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if monthlyReportLoading}
        <div>Betöltés...</div>
      {:else if monthlyReportError}
        <div class="error">{monthlyReportError}</div>
      {:else if monthlyReportData}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Hónap</th>
                <th>Dátum</th>
                <th>Ledolgozott órák</th>
                <th>Túlórák</th>
                <th>Havi munkanapok</th>
                <th>Havi munkaórák</th>
                <th>Havi túlórák</th>
              </tr>
            </thead>
            <tbody>
              {#if Array.isArray(monthlyReportData)}
                {#each monthlyReportData as row}
                  <tr>
                    <td>{row.reportMonth?.slice(0,7) ?? ''}</td>
                    <td>{row.date && row.date !== '0001-01-01' && row.date !== null && row.date !== '' ? row.date : ''}</td>
                    <td>{row.workHours?.toFixed(2) ?? ''}</td>
                    <td>{row.overtimeHours?.toFixed(2) ?? ''}</td>
                    <td>{row.monthlyWorkDays ?? ''}</td>
                    <td>{row.monthlyWorkHours?.toFixed(2) ?? ''}</td>
                    <td>{row.monthlyOvertimeHours?.toFixed(2) ?? ''}</td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td>{monthlyReportData.reportMonth?.slice(0,7) ?? ''}</td>
                  <td>{monthlyReportData.date && monthlyReportData.date !== '0001-01-01' && monthlyReportData.date !== null && monthlyReportData.date !== '' ? monthlyReportData.date : ''}</td>
                  <td>{monthlyReportData.workHours?.toFixed(2) ?? ''}</td>
                  <td>{monthlyReportData.overtimeHours?.toFixed(2) ?? ''}</td>
                  <td>{monthlyReportData.monthlyWorkDays ?? ''}</td>
                  <td>{monthlyReportData.monthlyWorkHours?.toFixed(2) ?? ''}</td>
                  <td>{monthlyReportData.monthlyOvertimeHours?.toFixed(2) ?? ''}</td>
                </tr>
              {/if}
            </tbody>
          </table>
          {#if Array.isArray(monthlyReportData) && monthlyReportData.length > 0}
            <table class="summary-table summary-table-standalone">
              <tbody>
                <tr>
                  <td>Havi munkanapok</td>
                  <td>{monthlyReportData[0].monthlyWorkDays}</td>
                </tr>
                <tr>
                  <td>Havi munkaórák</td>
                  <td>{monthlyReportData[0].monthlyWorkHours?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{monthlyReportData[0].monthlyOvertimeHours?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          {:else if monthlyReportData}
            <table class="summary-table summary-table-standalone">
              <tbody>
                <tr>
                  <td>Havi munkanapok</td>
                  <td>{monthlyReportData.monthlyWorkDays}</td>
                </tr>
                <tr>
                  <td>Havi munkaórák</td>
                  <td>{monthlyReportData.monthlyWorkHours?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{monthlyReportData.monthlyOvertimeHours?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'schedule'}
    <div class="api-row api-row-column">
      <div class="api-description">
        Beosztás lekérdezése (dátum, dolgozó):
      </div>
      <form class="api-action-form">
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
    <div class="data-table-wrapper">
      <table class="data-table">
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
    <div class="api-row api-row-column">
      <div class="api-description">
        Kimutatás lekérdezése (dátum, dolgozó):
      </div>
      <form class="api-action-form">
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
    <div class="data-table-wrapper">
      <table class="data-table">
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
    <div class="api-row api-row-column">
      <div class="api-description">Jelszó módosítása:</div>
      <form class="api-action-form form-inline-group-2row" on:submit|preventDefault={changeEmployeePassword}>
        <label for="employee-id">Azonosító:</label>
        <input id="employee-id" type="number" bind:value={employeeId} required placeholder="Pl. 123" min="1" size="6" class="checkpoint-input" style="max-width: 110px;" />
        <label for="old-password">Régi jelszó:</label>
        <input id="old-password" type="password" bind:value={oldPassword} required placeholder="Régi jelszó" autocomplete="current-password" class="checkpoint-input" style="max-width: 180px;" />
        <label for="new-password">Új jelszó:</label>
        <input id="new-password" type="password" bind:value={newPassword} required placeholder="Új jelszó" autocomplete="new-password" class="checkpoint-input" style="max-width: 180px;" />
        <label for="confirm-new-password">Új jelszó megerősítése:</label>
        <input id="confirm-new-password" type="password" bind:value={confirmNewPassword} required placeholder="Új jelszó újra" autocomplete="new-password" class="checkpoint-input" style="max-width: 180px;" />
        <button type="submit" class="primary-action" disabled={changePasswordLoading}>Jelszó módosítása</button>
      </form>
      {#if changePasswordLoading}
        <div>Jelszó módosítása folyamatban...</div>
      {:else if changePasswordError}
        <div class="error">{changePasswordError}</div>
      {:else if changePasswordSuccess}
        <div class="success">{changePasswordSuccess}</div>
      {/if}
    </div>
  {/if}
</section>

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
  .api-row-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  .api-action-form {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.2rem;
    flex-wrap: wrap;
  }
  .form-inline {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 1.1rem;
    flex-wrap: wrap;
    margin-bottom: 1.2rem;
  }
  .form-inline label {
    margin-right: 0.3rem;
  }
  .form-inline input {
    min-width: 90px;
  }
  .form-inline .primary-action {
    margin-top: 0;
  }
  .form-inline-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
  .form-inline-group label {
    margin: 0;
    min-width: 0;
  }
  .form-inline-group input[type="date"] {
  margin: 0;
  min-width: 180px;
  color: var(--color-table-placeholder, #bdbfff);
  background: inherit;
  }
  .form-inline-group input[type="date"]::placeholder {
    color: var(--color-table-placeholder, #bdbfff);
    opacity: 1;
  }
  .form-inline-group input[type="text"] {
    min-width: 140px;
    max-width: 220px;
    width: 100%;
    font-size: 1rem;
    padding: 0.42rem 0.8rem;
    border-radius: 0.42rem;
    box-sizing: border-box;
  }
  .form-inline-group input[type="text"]::placeholder {
    color: var(--color-table-placeholder, #bdbfff);
    opacity: 1;
  }
  .primary-action {
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 0.7rem;
    padding: 0.5rem 1.2rem;
    font-size: 1.05rem;
    font-weight: 600;
    box-shadow: var(--shadow);
    transition: background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 42px;
  }
  .primary-action:hover {
    background: var(--color-primary-hover, #a084e8);
  }
  @media (max-width: 1100px) {
    .primary-action {
      margin-top: 0.5rem;
      align-self: center;
    }
  }
  .data-table-wrapper {
  overflow-x: auto;
  margin-top: 1.2rem;
  }
  .data-table {
  border-collapse: collapse;
  width: 100%;
  background: var(--color-table-bg, #fff);
  color: var(--color-table-row-text, #23203a);
  border-radius: 0.7rem;
  box-shadow: 0 2px 16px 0 rgba(76,36,150,0.08);
  }
  .data-table th, .data-table td {
  padding: 0.75rem 1.2rem;
  border-bottom: 1px solid var(--color-table-border, #ece6fa);
  text-align: left;
  }
  .data-table th {
  background: var(--color-table-header-bg, #f5f3ff);
  color: var(--color-table-header-text, #6c3bb8);
  font-weight: 700;
  font-size: 1.07rem;
  }
  .data-table tr:last-child td {
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
  .checkpoint-input {
    color: var(--color-table-placeholder, #bdbfff);
    background: inherit;
    border: 1px solid var(--color-table-placeholder, #bdbfff);
    border-radius: 0.7rem;
    padding: 0.5rem 1rem;
    font-size: 1.05rem;
    transition: border 0.15s;
  }
  .checkpoint-input::placeholder {
    color: var(--color-table-placeholder, #bdbfff);
    opacity: 1;
  }
  .checkpoint-input:focus {
    border-color: var(--color-table-header-text, #6c3bb8);
    outline: none;
  }
  .api-description {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.04rem;
    color: var(--color-table-header-text, #6c3bb8);
    font-weight: 500;
  }
  label[for="month-select"] {
    margin-right: 0.5rem;
  }
  .form-inline.form-inline-labels-top {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 2.2rem;
    flex-wrap: wrap;
    margin-bottom: 1.2rem;
  }
  .form-inline-labels-top .form-inline-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    min-width: 140px;
  }
  .btn-align-bottom {
    align-self: flex-end;
    margin-top: 1.6rem;
    min-width: 140px;
  }
  /* --- Egyedi stílus a két soros lekérdezéshez --- */
  .form-inline-group-2row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .form-inline {
    display: flex;
    align-items: flex-end;
    gap: 1.1rem;
    flex-wrap: wrap;
  }
  .form-inline label {
    margin-right: 0.3rem;
  }
  .form-inline input {
    min-width: 90px;
  }
  .form-inline .primary-action {
    margin-top: 0;
  }
  /* --- 2 soros havi munka form --- */
  .form-2row {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    align-items: flex-start;
  }
  .form-2row-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .form-2row input {
    min-width: 120px;
  }
  .form-2row .primary-action {
    margin-top: 0.3rem;
    align-self: flex-start;
  }
  form.form-2row.api-action-form {
    display: grid;
    grid-template-rows: repeat(2, auto);
    gap: 1rem;
  }
  .form-2row-row {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .form-2row-row .primary-action {
    align-self: center;
    height: 42px;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
</style>