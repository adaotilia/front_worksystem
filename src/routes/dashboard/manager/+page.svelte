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

  const unsubscribe = auth.subscribe((state) => {
    token = state.token;
    userRole = state.userRole;
  });

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

  let statusEmployeeId = '';
  let statusDate = new Date().toISOString().slice(0, 10); 
  let statusResult = null;
  let statusLoading = false;
  let statusError = '';

  let employees = [];
  let employeesLoading = false;
  let employeesError = '';

  let showEmployees = false;

  let singleEmployee = null;
  let singleEmployeeLoading = false;
  let singleEmployeeError = '';
  let singleEmployeeIdInput = '';
  let showSingleEmployee = false;

  let selectedRole = 'Employee';
  let employeesByRole = [];
  let employeesByRoleLoading = false;
  let employeesByRoleError = '';

  let usernameInput = '';
  let userByUsername = null;
  let userByUsernameLoading = false;
  let userByUsernameError = '';

  async function fetchUserByUsername() {
    userByUsernameLoading = true;
    userByUsernameError = '';
    userByUsername = null;
    try {
      const response = await authFetch(`${API_BASE}/employees/username/${usernameInput}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Ismeretlen hiba');
      }
      userByUsername = await response.json();
    } catch (err) {
      userByUsernameError = err.message || 'Ismeretlen hiba';
    } finally {
      userByUsernameLoading = false;
    }
  }

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

  let worklogDateYear = '';
  let worklogDateMonth = '';
  let worklogDateDay = '';
  let worklogsByDate = null;
  let worklogsByDateLoading = false;
  let worklogsByDateError = '';

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

  async function fetchMonthlyReportByDate() {
    monthlyReportLoading = true;
    monthlyReportError = '';
    monthlyReportData = null;
    try {
      const url = `${API_BASE}/Manager/worklogs/${monthlyYear}/${monthlyMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Munkalapok lekérdezése sikertelen');
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
      const url = `${API_BASE}/Manager/worklogs/employee/${monthlyEmployeeId}/${monthlyEmployeeYear}/${monthlyEmployeeMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Munkalapok lekérdezése sikertelen');
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

  async function fetchWorklogsByDate(year, month, day) {
    worklogsByDateLoading = true;
    worklogsByDateError = '';
    worklogsByDate = null;
    try {
      const url = `${API_BASE}/Manager/worklogs/date/${year}/${month}/${day}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a kimutatás lekérdezésekor (dátum)');
      worklogsByDate = await response.json();
    } catch (err) {
      worklogsByDateError = err.message;
    }
    worklogsByDateLoading = false;
  }

  let scheduleEmployeeId = '';
  let scheduleEmployeeYear = '';
  let scheduleEmployeeMonth = '';
  let schedulesByEmployee = [];
  let schedulesByEmployeeLoading = false;
  let schedulesByEmployeeError = '';

  async function fetchSchedulesByEmployee() {
    schedulesByEmployeeLoading = true;
    schedulesByEmployeeError = '';
    schedulesByEmployee = [];
    try {
      const url = `${API_BASE}/Manager/schedules/employee/${scheduleEmployeeId}/${scheduleEmployeeYear}/${scheduleEmployeeMonth}`;
      const response = await authFetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Hiba a beosztások lekérdezésekor');
      schedulesByEmployee = await response.json();
    } catch (err) {
      schedulesByEmployeeError = err.message;
    }
    schedulesByEmployeeLoading = false;
  }

  function handleLogout() {
    auth.logout();
    goto('/');
  }

  function formatDateTime(dt) {
    if (!dt) return '';
    const match = dt.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
    if (match) return `${match[1]} ${match[2]}`;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt)) return dt;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) return dt + ' 00:00:00';
    if (/^\d{2}:\d{2}:\d{2}$/.test(dt)) return '';
    return dt;
  }

  function statusToHungarian(status) {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'active': return 'Aktív';
      case 'inactive': return 'Inaktív';
      default: return status;
    }
  }

  function formatNumber2(val) {
    if (val === null || val === undefined || isNaN(val)) return '';
    return Number(val).toFixed(2).replace(/\.00$/, '');
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
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchCheckpointsByMonth(selectedYear, selectedMonth)}>
        <label for="year-select">Év:</label>
        <input type="number" id="year-select" name="year" min="2024" max="2070" bind:value={selectedYear} placeholder="Pl. 2025" required class="checkpoint-input" />
        <label for="month-select">Hónap:</label>
        <input type="number" id="month-select" name="month" min="1" max="12" bind:value={selectedMonth} placeholder="1-12" required class="checkpoint-input" />
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
                <td>{formatDateTime(cp.checkInTime)}</td>
                <td>{formatDateTime(cp.checkOutTime)}</td>
                <td>{statusToHungarian(cp.sessionStatus)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó azonosító, év és hónap szerint a Checkpoint-ok lekérése:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchCheckpointsByEmployeeId(employeeIdInput, employeeYearInput, employeeMonthInput)}>
        <label for="employee-id-input">Dolgozó azonosító:</label>
        <input type="number" id="employee-id-input" name="employeeId" min="100" max="999" bind:value={employeeIdInput} placeholder="Pl. 123" required class="checkpoint-input" />
        <label for="employee-year-input">Év:</label>
        <input type="number" id="employee-year-input" name="year" min="2024" max="2070" bind:value={employeeYearInput} placeholder="Pl. 2025" required class="checkpoint-input" />
        <label for="employee-month-input">Hónap:</label>
        <input type="number" id="employee-month-input" name="month" min="1" max="12" bind:value={employeeMonthInput} placeholder="1-12" required class="checkpoint-input" />
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
                <td>{formatDateTime(cp.checkInTime)}</td>
                <td>{formatDateTime(cp.checkOutTime)}</td>
                <td>{statusToHungarian(cp.sessionStatus)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Státusz lekérdezése dolgozó azonosító alapján (mai nap):</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchEmployeeStatus(statusEmployeeId, statusDate)}>
        <label for="status-employee-id">Dolgozó azonosító:</label>
        <input type="number" id="status-employee-id" min="100" max="999" bind:value={statusEmployeeId} placeholder="Pl. 123" required class="checkpoint-input" />
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
  {/if}

  {#if activeTab === 'monthly'}
    <div class="api-row api-row-column">
      <div class="api-description">Havi riport lekérdezése év és hónap szerint (összes dolgozó):</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchMonthlyReportByDate}>
        <label for="monthly-year">Év:</label>
        <input id="monthly-year" type="number" bind:value={monthlyYear} min="2020" max="2070" required placeholder="Pl. 2025" size="12" class="checkpoint-input" />
        <label for="monthly-month">Hónap:</label>
        <input id="monthly-month" type="number" bind:value={monthlyMonth} min="1" max="12" required placeholder="1-12" size="9" class="checkpoint-input" />
        <div class="form-btn-col">
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
                <th>Dolgozó azonosító</th>
                <th>Teljes név</th>
                <th>Hónap</th>
                <th>Dátum</th>
                <th>Ledolgozott órák</th>
                <th>Túlórák</th>
                <th>Típus</th>
              </tr>
            </thead>
          <tbody>
            {#each monthlyReportData as row}
              <tr>
                <td>{row.employeeId}</td>
                <td>{row.fullName}</td>
                <td>{row.reportMonth?.slice(0,7) ?? ''}</td>
                <td>{row.date && row.date !== '0001-01-01' && row.date !== null && row.date !== '' ? row.date : ''}</td>
                <td>{formatNumber2(row.workHours)}</td>
                <td>{formatNumber2(row.overtimeHours)}</td>
                <td>{row.type}</td>
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
                  <td>{formatNumber2(monthlyReportData.reduce((sum, r) => sum + (r.monthlyWorkHours ?? 0), 0))}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{formatNumber2(monthlyReportData.reduce((sum, r) => sum + (r.monthlyOvertimeHours ?? 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>

    <div class="api-row api-row-column">
      <div class="api-description">Havi riport lekérdezése dolgozó szerint:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchMonthlyReportByEmployee}>
        <label for="monthly-employee-id">Dolgozó azonosító:</label>
        <input id="monthly-employee-id" type="number" bind:value={monthlyEmployeeId} min="1" required placeholder="Pl. 123" size="12" class="checkpoint-input" />
        <label for="monthly-employee-year">Év:</label>
        <input id="monthly-employee-year" type="number" bind:value={monthlyEmployeeYear} min="2020" max="2070" required placeholder="Pl. 2025" size="12" class="checkpoint-input" />
        <label for="monthly-employee-month">Hónap:</label>
        <input id="monthly-employee-month" type="number" bind:value={monthlyEmployeeMonth} min="1" max="12" required placeholder="1-12" size="9" class="checkpoint-input" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
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
                <th>Típus</th>
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
                    <td>{formatNumber2(row.workHours)}</td>
                    <td>{formatNumber2(row.overtimeHours)}</td>
                    <td>{row.type}</td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td>{monthlyEmployeeReportData.employeeId}</td>
                  <td>{monthlyEmployeeReportData.fullName}</td>
                  <td>{monthlyEmployeeReportData.reportMonth?.slice(0,7) ?? ''}</td>
                  <td>{monthlyEmployeeReportData.date && monthlyEmployeeReportData.date !== '0001-01-01' && monthlyEmployeeReportData.date !== null && monthlyEmployeeReportData.date !== '' ? monthlyEmployeeReportData.date : ''}</td>
                  <td>{formatNumber2(monthlyEmployeeReportData.workHours)}</td>
                  <td>{formatNumber2(monthlyEmployeeReportData.overtimeHours)}</td>
                  <td>{monthlyEmployeeReportData.type}</td>
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
                  <td>{formatNumber2(monthlyEmployeeReportData[0].monthlyWorkHours)}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{formatNumber2(monthlyEmployeeReportData[0].monthlyOvertimeHours)}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'report'}
    <div class="api-row api-row-column">
      <div class="api-description">Havi kimutatás</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchMonthlyReportByDate}>
        <label for="monthly-year">Év:</label>
        <input id="monthly-year" type="number" bind:value={monthlyYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="monthly-month">Hónap:</label>
        <input id="monthly-month" type="number" bind:value={monthlyMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <div class="form-btn-col">
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
                <th>Dolgozó azonosító</th>
                <th>Teljes név</th>
                <th>Hónap</th>
                <th>Dátum</th>
                <th>Ledolgozott órák</th>
                <th>Túlórák</th>
                <th>Típus</th>
              </tr>
            </thead>
            <tbody>
              {#each monthlyReportData as row}
                <tr>
                  <td>{row.employeeId}</td>
                  <td>{row.fullName}</td>
                  <td>{row.reportMonth?.slice(0,7) ?? ''}</td>
                  <td>{row.date && row.date !== '0001-01-01' && row.date !== null && row.date !== '' ? row.date : ''}</td>
                  <td>{formatNumber2(row.workHours)}</td>
                  <td>{formatNumber2(row.overtimeHours)}</td>
                  <td>{row.type}</td>
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
                  <td>{formatNumber2(monthlyReportData.reduce((sum, r) => sum + (r.monthlyWorkHours ?? 0), 0))}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{formatNumber2(monthlyReportData.reduce((sum, r) => sum + (r.monthlyOvertimeHours ?? 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>

    <div class="api-row api-row-column">
      <div class="api-description">Havi kimutatás dolgozó azonosító alapján</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchMonthlyReportByEmployee}>
        <label for="monthly-employee-id">Dolgozó azonosító:</label>
        <input id="monthly-employee-id" type="number" bind:value={monthlyEmployeeId} min="1" required placeholder="Pl. 123" class="checkpoint-input" />
        <label for="monthly-employee-year">Év:</label>
        <input id="monthly-employee-year" type="number" bind:value={monthlyEmployeeYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="monthly-employee-month">Hónap:</label>
        <input id="monthly-employee-month" type="number" bind:value={monthlyEmployeeMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
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
                <th>Típus</th>
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
                    <td>{formatNumber2(row.workHours)}</td>
                    <td>{formatNumber2(row.overtimeHours)}</td>
                    <td>{row.type}</td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td>{monthlyEmployeeReportData.employeeId}</td>
                  <td>{monthlyEmployeeReportData.fullName}</td>
                  <td>{monthlyEmployeeReportData.reportMonth?.slice(0,7) ?? ''}</td>
                  <td>{monthlyEmployeeReportData.date && monthlyEmployeeReportData.date !== '0001-01-01' && monthlyEmployeeReportData.date !== null && monthlyEmployeeReportData.date !== '' ? monthlyEmployeeReportData.date : ''}</td>
                  <td>{formatNumber2(monthlyEmployeeReportData.workHours)}</td>
                  <td>{formatNumber2(monthlyEmployeeReportData.overtimeHours)}</td>
                  <td>{monthlyEmployeeReportData.type}</td>
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
                  <td>{formatNumber2(monthlyEmployeeReportData[0].monthlyWorkHours)}</td>
                </tr>
                <tr>
                  <td>Havi túlórák</td>
                  <td>{formatNumber2(monthlyEmployeeReportData[0].monthlyOvertimeHours)}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>

    <div class="api-row api-row-column">
      <div class="api-description">Dátum szerinti kimutatás</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchWorklogsByDate(worklogDateYear, worklogDateMonth, worklogDateDay)}>
        <label for="worklog-date-year">Év:</label>
        <input id="worklog-date-year" type="number" bind:value={worklogDateYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="worklog-date-month">Hónap:</label>
        <input id="worklog-date-month" type="number" bind:value={worklogDateMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <label for="worklog-date-day">Nap:</label>
        <input id="worklog-date-day" type="number" bind:value={worklogDateDay} min="1" max="31" required placeholder="1-31" class="checkpoint-input" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if worklogsByDateLoading}
        <div>Betöltés...</div>
      {:else if worklogsByDateError}
        <div class="error">{worklogsByDateError}</div>
      {:else if worklogsByDate}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dolgozó azonosító</th>
                <th>Dolgozó neve</th>
                <th>Dátum</th>
                <th>Ledolgozott órák</th>
                <th>Túlórák</th>
                <th>Tervezett munkaórák</th>
                <th>Tervezett túlóra</th>
              </tr>
            </thead>
            <tbody>
              {#each worklogsByDate as row}
                <tr>
                  <td>{row.employeeId}</td>
                  <td>{row.fullName}</td>
                  <td>{row.date}</td>
                  <td>{formatNumber2(row.workHours)}</td>
                  <td>{formatNumber2(row.overtimeHours)}</td>
                  <td>{formatNumber2(row.scheduledHours)}</td>
                  <td>{formatNumber2(row.scheduledOvertime)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'schedule'}
    <div class="api-row api-row-column">
      <div class="api-description">
        Beosztás lekérdezése dolgozó, év és hónap szerint
      </div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchSchedulesByEmployee}>
        <label for="schedule-employee-id">Dolgozó azonosító:</label>
        <input id="schedule-employee-id" type="number" bind:value={scheduleEmployeeId} min="1" required placeholder="Pl. 100" class="checkpoint-input" />
        <label for="schedule-employee-year">Év:</label>
        <input id="schedule-employee-year" type="number" bind:value={scheduleEmployeeYear} min="2020" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="schedule-employee-month">Hónap:</label>
        <input id="schedule-employee-month" type="number" bind:value={scheduleEmployeeMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if schedulesByEmployeeLoading}
        <div>Betöltés...</div>
      {:else if schedulesByEmployeeError}
        <div class="error">{schedulesByEmployeeError}</div>
      {:else if schedulesByEmployee && schedulesByEmployee.length > 0}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dolgozó azonosító</th>
                <th>Dolgozó neve</th>
                <th>Beosztás dátuma</th>
                <th>Kezdési időpont</th>
                <th>Befejezési időpont</th>
                <th>Típus</th>
                <th>Tervezett munkaórák</th>
                <th>Tervezett havi munkaórák</th>
                <th>Tervezett havi munkanapok</th>
              </tr>
            </thead>
            <tbody>
              {#each schedulesByEmployee as row}
                <tr>
                  <td>{row.employeeId}</td>
                  <td>{row.fullName}</td>
                  <td>{row.scheduledDate}</td>
                  <td>{row.startTime}</td>
                  <td>{row.endTime}</td>
                  <td>{row.type}</td>
                  <td>{formatNumber2(row.scheduledHours)}</td>
                  <td>{formatNumber2(row.scheduledMonthlyHours)}</td>
                  <td>{row.scheduledWorkDays}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'dashboard'}
    <div class="api-row api-row-column">
      <div class="api-description">Az összes dolgozó adata:</div>
      <form class="api-action-form" on:submit|preventDefault={() => { showEmployees = true; fetchEmployees(); }}>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
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
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
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
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
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
    <div class="api-row api-row-column">
      <div class="api-description">Jelszó módosítása:</div>
      <form class="api-action-form form-inline-group-2row" on:submit|preventDefault={changeEmployeePassword}>
        <div class="form-inline-group">
          <label for="employee-id">Azonosító:</label>
          <input id="employee-id" type="number" bind:value={employeeId} required placeholder="Pl. 123" min="1" size="6" class="checkpoint-input" style="max-width: 110px;" />
        </div>
        <div class="form-inline-group">
          <label for="old-password">Régi jelszó:</label>
          <input id="old-password" type="password" bind:value={oldPassword} required placeholder="Régi jelszó" autocomplete="current-password" class="checkpoint-input" style="max-width: 180px;" />
        </div>
        <div class="form-inline-group">
          <label for="new-password">Új jelszó:</label>
          <input id="new-password" type="password" bind:value={newPassword} required placeholder="Új jelszó" autocomplete="new-password" class="checkpoint-input" style="max-width: 180px;" />
        </div>
        <div class="form-inline-group">
          <label for="confirm-new-password">Új jelszó megerősítése:</label>
          <input id="confirm-new-password" type="password" bind:value={confirmNewPassword} required placeholder="Új jelszó újra" autocomplete="new-password" class="checkpoint-input" style="max-width: 180px;" />
        </div>
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
  .form-btn-col {
    display: flex;
    align-items: flex-end;
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
  .api-action-form.form-inline-group {
    min-width: 400px;
    width: 100%;
  }
  .form-inline-group-2row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.2rem;
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
    align-items: flex-end;
    justify-content: flex-end;
    min-width: 120px;
    height: 100%;
    flex-direction: row;
  }
  @media (max-width: 900px) {
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
    align-items: flex-end;
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
  .api-action-form.form-inline-group {
    min-width: 400px;
    width: 100%;
  }
  .form-inline-group-2row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.2rem;
  }
</style>