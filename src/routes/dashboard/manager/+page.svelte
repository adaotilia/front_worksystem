<script>
  import { auth } from '../../../stores/authStore.js';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import ThemeToggle from '../../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { API_BASE } from '../../../config.js';
  import { authFetch } from '../../../authFetch.js';
  

  const dispatch = createEventDispatcher();
  let token = '';
  let userRole = '';
  
  let managerData = null;
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

   // Új változók a checkpoint lekérdezéshez
   let selectedYear = '';
  let selectedMonth = '';
  let checkpoints = [];
  let checkpointsLoading = false;
  let checkpointsError = '';
  let hasTriedMonthFetch = false;

  let displayedCheckpoints = [];
  let displayedLoading = false;
  let displayedError = '';

  let employeeIdInput = '';
  let employeeYearInput = '';
  let employeeMonthInput = '';
  let checkpointsByEmployee = [];
  let checkpointsByEmployeeLoading = false;
  let checkpointsByEmployeeError = '';

  // Új változók a státusz lekérdezéshez
  let statusEmployeeId = '';
  let statusDate = '';
  let statusResult = null;
  let statusLoading = false;
  let statusError = '';

  // Új változók a dolgozók lekérdezéséhez
  let employees = [];
  let employeesLoading = false;
  let employeesError = '';

  // Új változó a dolgozók táblázat megjelenítéséhez
  let showEmployees = false;

  // Új változók egy dolgozó lekérdezéséhez
  let singleEmployee = null;
  let singleEmployeeLoading = false;
  let singleEmployeeError = '';
  let singleEmployeeIdInput = '';
  let showSingleEmployee = false;

  // Új: dolgozók lekérése szerep szerint
  let selectedRole = 'Employee';
  let employeesByRole = [];
  let employeesByRoleLoading = false;
  let employeesByRoleError = '';

  // Új: felhasználónév szerinti lekérdezés
  let usernameInput = '';
  let userByUsername = null;
  let userByUsernameLoading = false;
  let userByUsernameError = '';

  // --- Havi munka tab változók ---
  let monthlyYear = '';
  let monthlyMonth = '';
  let monthlyReportData = null;
  let monthlyReportLoading = false;
  let monthlyReportError = '';

  let monthlyEmployeeId = '';
  let monthlyEmployeeYear = '';
  let monthlyEmployeeMonth = '';
  let monthlyEmployeeReportData = null;
  let monthlyEmployeeReportLoading = false;
  let monthlyEmployeeReportError = '';

  const roleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Employee', label: 'Dolgozó' }
  ];

  async function fetchEmployeesByRole() {
    employeesByRoleLoading = true;
    employeesByRoleError = '';
    employeesByRole = [];
    try {
      const response = await authFetch(`${API_BASE}/Manager/employees/role/${selectedRole}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a dolgozók lekérdezésekor');
      employeesByRole = await response.json();
    } catch (err) {
      employeesByRoleError = err.message;
      employeesByRole = [];
    }
    employeesByRoleLoading = false;
  }

  async function fetchUserByUsername() {
    if (!usernameInput) {
      userByUsernameError = 'Kötelező megadni a felhasználónevet!';
      userByUsername = null;
      return;
    }
    userByUsernameLoading = true;
    userByUsernameError = '';
    userByUsername = null;
    try {
      const response = await authFetch(`${API_BASE}/Manager/employees/username/${usernameInput}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a dolgozó lekérdezésekor');
      userByUsername = await response.json();
    } catch (err) {
      userByUsernameError = err.message;
      userByUsername = null;
    }
    userByUsernameLoading = false;
  }

  // --- Havi munka tab API-k ---
  async function fetchMonthlyReportByDate() {
    monthlyReportLoading = true;
    monthlyReportError = '';
    monthlyReportData = null;
    try {
      const url = `${API_BASE}/Manager/monthlyreports/${monthlyYear}/${monthlyMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Riport lekérdezése sikertelen');
      monthlyReportData = await resp.json();
    } catch (err) {
      monthlyReportError = err.message;
    }
    monthlyReportLoading = false;
  }

  async function fetchMonthlyReportByEmployee() {
    monthlyEmployeeReportLoading = true;
    monthlyEmployeeReportError = '';
    monthlyEmployeeReportData = null;
    try {
      const url = `${API_BASE}/Manager/monthlyreports/employee/${monthlyEmployeeId}?year=${monthlyEmployeeYear}&month=${monthlyEmployeeMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Riport lekérdezése sikertelen');
      monthlyEmployeeReportData = await resp.json();
    } catch (err) {
      monthlyEmployeeReportError = err.message;
    }
    monthlyEmployeeReportLoading = false;
  }

  async function fetchCheckpointsByMonth(year, month) {
    checkpointsLoading = true;
    checkpointsError = '';
    checkpoints = [];
    try {
      const url = `${API_BASE}/Manager/checkpoints/${year}/${month}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a checkpointok lekérdezésekor');
      checkpoints = await response.json();
      displayedCheckpoints = checkpoints;
      displayedLoading = false;
      displayedError = '';
    } catch (err) {
      checkpointsError = err.message;
      checkpoints = [];
      displayedCheckpoints = [];
      displayedLoading = false;
      displayedError = checkpointsError;
    }
    checkpointsLoading = false;
  }

  async function fetchCheckpointsByEmployeeId(EmployeeId, year, month) {
    checkpointsByEmployeeLoading = true;
    checkpointsByEmployeeError = '';
    checkpointsByEmployee = [];
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const url = `${API_BASE}/Manager/checkpoints/employee/${EmployeeId}/${year}/${paddedMonth}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a checkpointok lekérdezésekor');
      checkpointsByEmployee = await response.json();
      displayedCheckpoints = checkpointsByEmployee;
      displayedLoading = false;
      displayedError = '';
    } catch (err) {
      checkpointsByEmployeeError = err.message;
      checkpointsByEmployee = [];
      displayedCheckpoints = [];
      displayedLoading = false;
      displayedError = checkpointsByEmployeeError;
    }
    checkpointsByEmployeeLoading = false;
  }

  async function fetchEmployeeStatus(employeeId, date) {
    statusLoading = true;
    statusError = '';
    statusResult = null;
    try {
      const url = `${API_BASE}/Manager/checkpoints/employee/${employeeId}/status/${date}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a státusz lekérdezésekor');
      statusResult = await response.json();
    } catch (err) {
      statusError = err.message;
      statusResult = null;
    }
    statusLoading = false;
  }

  async function fetchEmployees() {
    employeesLoading = true;
    employeesError = '';
    try {
      const response = await authFetch(`${API_BASE}/Manager/employees`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a dolgozók lekérdezésekor');
      employees = await response.json();
    } catch (err) {
      employeesError = err.message;
      employees = [];
    }
    employeesLoading = false;
  }

  async function fetchSingleEmployee() {
    if (!singleEmployeeIdInput) {
      singleEmployeeError = 'Kötelező az azonosító megadása!';
      singleEmployee = null;
      return;
    }
    singleEmployeeLoading = true;
    singleEmployeeError = '';
    singleEmployee = null;
    try {
      const response = await authFetch(`${API_BASE}/Manager/employees/${singleEmployeeIdInput}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a dolgozó lekérdezésekor');
      singleEmployee = await response.json();
    } catch (err) {
      singleEmployeeError = err.message;
      singleEmployee = null;
    }
    singleEmployeeLoading = false;
  }

  function handleLogout() {
    auth.logout();
    goto('/');
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
    <div class="api-row api-row-column">
      <div class="api-description">Év és hónap szerint az összes Checkpoint lekérése:</div>
      <form class="api-action-form" on:submit|preventDefault={() => fetchCheckpointsByMonth(selectedYear, selectedMonth)}>
        <div class="form-inline-group">
          <label for="year-select">Év:</label>
          <input type="number" id="year-select" name="year" min="2024" max="2070" bind:value={selectedYear} placeholder="Pl. 2025" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="month-select">Hónap:</label>
          <input type="number" id="month-select" name="month" min="1" max="12" bind:value={selectedMonth} placeholder="1-12" required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
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
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó azonosító, év és hónap szerint a Checkpoint-ok lekérése:</div>
      <form class="api-action-form" on:submit|preventDefault={() => fetchCheckpointsByEmployeeId(employeeIdInput, employeeYearInput, employeeMonthInput)}>
        <div class="form-inline-group">
          <label for="employee-id-input">Dolgozó azonosító:</label>
          <input type="number" id="employee-id-input" name="employeeId" min="100" max="999" bind:value={employeeIdInput} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="employee-year-input">Év:</label>
          <input type="number" id="employee-year-input" name="year" min="2024" max="2070" bind:value={employeeYearInput} placeholder="Pl. 2025" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="employee-month-input">Hónap:</label>
          <input type="number" id="employee-month-input" name="month" min="1" max="12" bind:value={employeeMonthInput} placeholder="1-12" required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if checkpointsByEmployeeLoading}
        <div>Betöltés...</div>
      {:else if checkpointsByEmployeeError}
        <div class="error">{checkpointsByEmployeeError}</div>
      {:else if checkpointsByEmployee.length > 0}
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
            {#each checkpointsByEmployee as cp}
              <tr>
                <td>{cp.employeeId}</td>
                <td>{cp.checkInTime}</td>
                <td>{cp.checkOutTime}</td>
                <td>{cp.sessionStatus}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Státusz lekérdezése dolgozó azonosító alapján (mai nap):</div>
      <form class="api-action-form" on:submit|preventDefault={() => fetchEmployeeStatus(statusEmployeeId, statusDate)}>
        <div class="form-inline-group">
          <label for="status-employee-id">Dolgozó azonosító:</label>
          <input type="number" id="status-employee-id" min="100" max="999" bind:value={statusEmployeeId} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if statusLoading}
        <div>Betöltés...</div>
      {:else if statusError}
        <div class="error">{statusError}</div>
      {:else if statusResult}
        <table class="data-table">
          <thead>
            <tr>
              <th>Dolgozó azonosító</th>
              <th>Dátum</th>
              <th>Státusz</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{statusEmployeeId}</td>
              <td>{statusDate}</td>
              <td>{typeof statusResult === 'string' ? (statusResult === 'Active' ? 'Aktív' : statusResult === 'Inactive' ? 'Inaktív' : statusResult) : JSON.stringify(statusResult)}</td>
            </tr>
          </tbody>
        </table>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó lekérdezése felhasználónév alapján:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => { fetchUserByUsername(); }}>
        <label for="username-input">Felhasználónév:</label>
        <input id="username-input" type="text" bind:value={usernameInput} placeholder="Pl. nagy" required class="checkpoint-input" />
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if userByUsernameLoading}
        <div>Dolgozó betöltése...</div>
      {:else if userByUsernameError}
        <div class="error">{userByUsernameError}</div>
      {:else if userByUsername}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dolgozó azonosító</th>
                <th>Teljes név</th>
                <th>Felhasználónév</th>
                <th>Jogkör</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{userByUsername.employeeId}</td>
                <td>{userByUsername.fullName}</td>
                <td>{userByUsername.username}</td>
                <td>{userByUsername.userRole === 'Employee' ? 'Dolgozó' : userByUsername.userRole}</td>
              </tr>
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'monthly'}
    <!-- Összes dolgozó havi riportja év/hónap szerint -->
    <div class="api-row api-row-column">
      <div class="api-description">Havi riport lekérdezése év és hónap szerint (összes dolgozó):</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchMonthlyReportByDate}>
        <label for="monthly-year">Év:</label>
        <input id="monthly-year" type="number" bind:value={monthlyYear} min="2020" max="2070" required placeholder="Pl. 2025" size="12" class="checkpoint-input" />
        <label for="monthly-month">Hónap:</label>
        <input id="monthly-month" type="number" bind:value={monthlyMonth} min="1" max="12" required placeholder="1-12" size="9" class="checkpoint-input" />
        <button type="submit" class="primary-action">Lekérés</button>
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
                <th>Dolgozó azonosító</th>
                <th>Teljes név</th>
                <th>Hónap</th>
                <th>Dátum</th>
                <th>Ledolgozott órák</th>
                <th>Túlórák</th>
              </tr>
            </thead>
            <tbody>
              {#each monthlyReportData as row}
                <tr>
                  <td>{row.employeeId}</td>
                  <td>{row.fullName}</td>
                  <td>{row.reportMonth?.slice(0,7) ?? ''}</td>
                  <td>{row.date && row.date !== '0001-01-01' && row.date !== null && row.date !== '' ? row.date : ''}</td>
                  <td>{row.workHours?.toFixed(2) ?? ''}</td>
                  <td>{row.overtimeHours?.toFixed(2) ?? ''}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if monthlyReportData.length > 0}
            <table class="summary-table summary-table-standalone">
              <tbody>
                <tr>
                  <td>Havi munkanapok</td>
                  <td>{monthlyReportData.reduce((sum, r) => sum + (r.monthlyWorkDays ?? 0), 0)}</td>
                </tr>
                <tr>
                  <td>Havi munkaórák</td>
                  <td>{monthlyReportData.reduce((sum, r) => sum + (r.monthlyWorkHours ?? 0), 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{monthlyReportData.reduce((sum, r) => sum + (r.monthlyOvertimeHours ?? 0), 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Egy dolgozó havi riportja év/hónap szerint -->
    <div class="api-row api-row-column">
      <div class="api-description">Havi riport lekérdezése dolgozó szerint:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchMonthlyReportByEmployee}>
        <label for="monthly-employee-id">Dolgozó azonosító:</label>
        <input id="monthly-employee-id" type="number" bind:value={monthlyEmployeeId} min="1" required placeholder="Pl. 123" size="12" class="checkpoint-input" />
        <label for="monthly-employee-year">Év:</label>
        <input id="monthly-employee-year" type="number" bind:value={monthlyEmployeeYear} min="2020" max="2070" required placeholder="Pl. 2025" size="12" class="checkpoint-input" />
        <label for="monthly-employee-month">Hónap:</label>
        <input id="monthly-employee-month" type="number" bind:value={monthlyEmployeeMonth} min="1" max="12" required placeholder="1-12" size="9" class="checkpoint-input" />
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if monthlyEmployeeReportLoading}
        <div>Betöltés...</div>
      {:else if monthlyEmployeeReportError}
        <div class="error">{monthlyEmployeeReportError}</div>
      {:else if monthlyEmployeeReportData}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dolgozó azonosító</th>
                <th>Teljes név</th>
                <th>Hónap</th>
                <th>Dátum</th>
                <th>Ledolgozott órák</th>
                <th>Túlórák</th>
              </tr>
            </thead>
            <tbody>
              {#if Array.isArray(monthlyEmployeeReportData)}
                {#each monthlyEmployeeReportData as row}
                  <tr>
                    <td>{row.employeeId}</td>
                    <td>{row.fullName}</td>
                    <td>{row.reportMonth?.slice(0,7) ?? ''}</td>
                    <td>{row.date && row.date !== '0001-01-01' && row.date !== null && row.date !== '' ? row.date : ''}</td>
                    <td>{row.workHours?.toFixed(2) ?? ''}</td>
                    <td>{row.overtimeHours?.toFixed(2) ?? ''}</td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td>{monthlyEmployeeReportData.employeeId}</td>
                  <td>{monthlyEmployeeReportData.fullName}</td>
                  <td>{monthlyEmployeeReportData.reportMonth?.slice(0,7) ?? ''}</td>
                  <td>{monthlyEmployeeReportData.date && monthlyEmployeeReportData.date !== '0001-01-01' && monthlyEmployeeReportData.date !== null && monthlyEmployeeReportData.date !== '' ? monthlyEmployeeReportData.date : ''}</td>
                  <td>{monthlyEmployeeReportData.workHours?.toFixed(2) ?? ''}</td>
                  <td>{monthlyEmployeeReportData.overtimeHours?.toFixed(2) ?? ''}</td>
                </tr>
              {/if}
            </tbody>
          </table>
          {#if Array.isArray(monthlyEmployeeReportData) && monthlyEmployeeReportData.length > 0}
            <table class="summary-table summary-table-standalone">
              <tbody>
                <tr>
                  <td>Havi munkanapok</td>
                  <td>{monthlyEmployeeReportData[0].monthlyWorkDays}</td>
                </tr>
                <tr>
                  <td>Havi munkaórák</td>
                  <td>{monthlyEmployeeReportData[0].monthlyWorkHours?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{monthlyEmployeeReportData[0].monthlyOvertimeHours?.toFixed(2)}</td>
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
          <input type="text" id="user-id-schedule" name="userIdSchedule" placeholder="Pl. 123" class="checkpoint-input" />
        </div>
        <button type="submit" class="primary-action">Lekérés</button>
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
          <input type="text" id="user-id-report" name="userIdReport" placeholder="Pl. 123" class="checkpoint-input" />
        </div>
        <button type="submit" class="primary-action">Lekérés</button>
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
      <div class="api-description">Az összes dolgozó adata:</div>
      <form class="api-action-form" on:submit|preventDefault={() => { showEmployees = true; fetchEmployees(); }}>
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if showEmployees}
        <div class="data-table-wrapper">
          {#if employeesLoading}
            <div>Dolgozók betöltése...</div>
          {:else if employeesError}
            <div class="error">{employeesError}</div>
          {:else if employees.length === 0}
            <div>Nincs dolgozó.</div>
          {:else}
            <table class="data-table">
              <thead>
                <tr>
                  <th>Dolgozó azonosító</th>
                  <th>Teljes név</th>
                  <th>Felhasználónév</th>
                  <th>Jogkör</th>
                </tr>
              </thead>
              <tbody>
                {#each employees as emp}
                  <tr>
                    <td>{emp.employeeId}</td>
                    <td>{emp.fullName}</td>
                    <td>{emp.username}</td>
                    <td>{emp.userRole === 'Employee' ? 'Dolgozó' : emp.userRole}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Egy dolgozó adatainak lekérdezése azonosító alapján:</div>
      <form class="api-action-form" on:submit|preventDefault={() => { showSingleEmployee = true; fetchSingleEmployee(); }}>
        <div class="form-inline-group">
          <label for="single-employee-id">Dolgozó azonosító:</label>
          <input type="text" id="single-employee-id" bind:value={singleEmployeeIdInput} required placeholder="Pl. 100" class="checkpoint-input" />
        </div>
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if showSingleEmployee}
        <div class="data-table-wrapper">
          {#if singleEmployeeLoading}
            <div>Dolgozó betöltése...</div>
          {:else if singleEmployeeError}
            <div class="error">{singleEmployeeError}</div>
          {:else if !singleEmployee}
            <div>Nincs ilyen dolgozó.</div>
          {:else}
            <table class="data-table">
              <thead>
                <tr>
                  <th>Dolgozó azonosító</th>
                  <th>Teljes név</th>
                  <th>Felhasználónév</th>
                  <th>Jogkör</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{singleEmployee.employeeId}</td>
                  <td>{singleEmployee.fullName}</td>
                  <td>{singleEmployee.username}</td>
                  <td>{singleEmployee.userRole === 'Employee' ? 'Dolgozó' : singleEmployee.userRole}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozók lekérdezése szerep szerint:</div>
      <form class="api-action-form" on:submit|preventDefault={() => { fetchEmployeesByRole(); }}>
        <label for="role-select">Szerep:</label>
        <select id="role-select" bind:value={selectedRole} class="checkpoint-input">
          {#each roleOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if employeesByRoleLoading}
        <div>Dolgozók betöltése...</div>
      {:else if employeesByRoleError}
        <div class="error">{employeesByRoleError}</div>
      {:else if employeesByRole.length === 0}
        <div></div>
      {:else}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dolgozó azonosító</th>
                <th>Teljes név</th>
                <th>Felhasználónév</th>
                <th>Jogkör</th>
              </tr>
            </thead>
            <tbody>
              {#each employeesByRole as emp}
                <tr>
                  <td>{emp.employeeId}</td>
                  <td>{emp.fullName}</td>
                  <td>{emp.username}</td>
                  <td>{emp.userRole === 'Employee' ? 'Dolgozó' : emp.userRole}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
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
  .api-row,
  .api-row-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
  }
  .api-action-form {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-wrap: wrap;
  }
  .form-inline-group {
    display: flex;
    align-items: center;
    gap: 1.2rem;
  }
  .form-inline-group label {
    margin-right: 0.8rem;
    min-width: 0;
  }
  .form-inline-group input[type="date"] {
    margin: 0.3rem;
    min-width: 180px;
    max-width: 220px;
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
  .api-description {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.04rem;
    color: var(--color-table-header-text, #6c3bb8);
    font-weight: 500;
  }
  .form-btn-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 120px;
    height: 100%;
    flex-direction: row;
  }
  @media (max-width: 1100px) {
    .form-btn-col {
      align-items: stretch;
      flex-direction: column;
    }
    .form-inline-group {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
    }
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
  select.checkpoint-input,
  select.checkpoint-input option {
    color: var(--color-table-placeholder, #bdbfff) !important;
  }
  select.checkpoint-input {
    min-width: 140px;
    max-width: 220px;
    font-size: 1rem;
    padding: 0.42rem 0.8rem;
    border-radius: 0.42rem;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background: var(--color-table-bg, #fff) url('data:image/svg+xml;utf8,<svg fill="%23bdbfff" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>') no-repeat right 0.8em center/1.2em 1.2em;
    color: var(--color-table-row-text, #23203a);
    border: 2px solid var(--color-table-placeholder, #bdbfff);
    transition: border-color 0.2s;
  }
  select.checkpoint-input:focus {
    border-color: var(--color-primary, #a084e8);
    box-shadow: 0 0 0 2px #a084e844;
    outline: none;
  }
  .checkpoint-input option {
    background: var(--color-table-bg, #fff);
    color: var(--color-table-row-text, #23203a);
  }
  @media (max-width: 600px) {
    .api-action-form {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.7rem;
    }
    .form-inline-group {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
    }
  }
  /* --- Havi munka tab stílusok --- */
  #monthly-year,
  #monthly-employee-year {
    width: 12ch;
  }
  #monthly-month,
  #monthly-employee-month {
    width: 9ch;
  }
  #monthly-employee-id {
    width: 12ch;
  }
  .form-inline-group input,
  .form-inline-group .checkpoint-input {
    max-width: unset !important;
    min-width: unset !important;
    width: auto;
    box-sizing: border-box;
  }
  /* --- Egységes soros elrendezés --- */
  .api-action-form {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-wrap: wrap;
  }
  .form-inline-group {
    display: flex;
    align-items: center;
    gap: 1.2rem;
  }
  .form-inline-group label {
    margin-right: 0.8rem;
    min-width: 0;
  }
  .form-btn-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 120px;
    height: 100%;
    flex-direction: row;
  }
  @media (max-width: 1100px) {
    .form-btn-col {
      align-items: stretch;
      flex-direction: column;
    }
    .form-inline-group {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
    }
  }
</style>