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

  const unsubscribe = auth.subscribe((state) => {
    token = state.token;
    userRole = state.userRole;
  });

  async function fetchEmployeeData() {
    if (!token || !EmployeeId) return;
    try {
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
      employeeData.sessionStatus = 'online';
    } catch (err) {
      console.error('Hiba az employee adatok lekérésekor:', err);
      error = err.message;
    }
  }

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

  let worklogMonthYear = '';
  let worklogMonthMonth = '';
  let worklogsByMonth = null;
  let worklogsByMonthLoading = false;
  let worklogsByMonthError = '';

  async function fetchWorklogsByMonth() {
    worklogsByMonthLoading = true;
    worklogsByMonthError = '';
    worklogsByMonth = null;
    try {
      const url = `${API_BASE}/Employee/worklogs/${worklogMonthYear}/${worklogMonthMonth}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Hiba a kimutatás lekérdezésekor (havi)');
      worklogsByMonth = await response.json();
    } catch (err) {
      worklogsByMonthError = err.message;
    }
    worklogsByMonthLoading = false;
  }

  let worklogDayYear = '';
  let worklogDayMonth = '';
  let worklogDayDay = '';
  let worklogsByDate = null;
  let worklogsByDateLoading = false;
  let worklogsByDateError = '';

  async function fetchWorklogsByDate() {
    worklogsByDateLoading = true;
    worklogsByDateError = '';
    worklogsByDate = null;
    try {
      const url = `${API_BASE}/Employee/worklogs/date/${worklogDayYear}/${worklogDayMonth}/${worklogDayDay}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Hiba a kimutatás lekérdezésekor (dátum)');
      worklogsByDate = await response.json();
    } catch (err) {
      worklogsByDateError = err.message;
    }
    worklogsByDateLoading = false;
  }

  let scheduleYear = '';
  let scheduleMonth = '';
  let schedules = [];
  let schedulesLoading = false;
  let schedulesError = '';
  let hasTriedScheduleFetch = false;

  async function fetchSchedulesByMonth() {
    hasTriedScheduleFetch = true;
    schedulesLoading = true;
    schedulesError = '';
    schedules = [];
    try {
      const url = `${API_BASE}/Employee/schedules/${scheduleYear}/${scheduleMonth}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Hiba a beosztások lekérdezésekor');
      schedules = await response.json();
    } catch (err) {
      schedulesError = err.message;
    }
    schedulesLoading = false;
  }

  let scheduleDayYear = '';
  let scheduleDayMonth = '';
  let scheduleDayDay = '';
  let schedulesByDay = [];
  let schedulesByDayLoading = false;
  let schedulesByDayError = '';
  let hasTriedScheduleByDayFetch = false;

  async function fetchSchedulesByDay() {
    scheduleYear = scheduleDayYear;
    scheduleMonth = scheduleDayMonth;
    scheduleDay = scheduleDayDay;

    hasTriedScheduleByDayFetch = true;
    schedulesByDayLoading = true;
    schedulesByDayError = '';
    schedulesByDay = [];
    try {
      const url = `${API_BASE}/Employee/schedules/date/${scheduleYear}/${scheduleMonth}/${scheduleDay}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Hiba a napi beosztások lekérdezésekor');
      schedulesByDay = await response.json();
    } catch (err) {
      schedulesByDayError = err.message;
    }
    schedulesByDayLoading = false;
  }

  let monthlyYear = '';
  let monthlyMonth = '';
  let monthlyReportData = null;
  let monthlyReportLoading = false;
  let monthlyReportError = '';
  let summaryRow = null;

  async function fetchMyMonthlyReport() {
    monthlyReportLoading = true;
    monthlyReportError = '';
    monthlyReportData = null;
    try {
      const url = `${API_BASE}/Employee/monthlyreports/me/bydate?year=${monthlyYear}&month=${monthlyMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Riport lekérdezése sikertelen');
      monthlyReportData = await resp.json();
      summaryRow = monthlyReportData.find(row => row.reportMonth === row.date);
    } catch (err) {
      monthlyReportError = err.message;
    }
    monthlyReportLoading = false;
  }

  function formatTimeString(datetimeString) {
    if (!datetimeString) return '00:00:00';
    const match = datetimeString.match(/\d{2}:\d{2}:\d{2}$/);
    if (match) return match[0];
    return '00:00:00';
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
              <td>{formatDateTime(cp.checkInTime)}</td>
              <td>{formatDateTime(cp.checkOutTime)}</td>
              <td>{statusToHungarian(cp.sessionStatus)}</td>
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
      <div class="api-description">Havi munka lekérdezése (saját):</div>
      <form class="form-2row api-action-form" on:submit|preventDefault={fetchMyMonthlyReport}>
        <div class="form-2row-row">
          <div class="form-inline-group">
            <label for="monthly-year">Év:</label>
            <input id="monthly-year" type="number" bind:value={monthlyYear} min="2020" max="2070" required placeholder="Pl. 2025" size="12" class="checkpoint-input" />
          </div>
          <div class="form-inline-group">
            <label for="monthly-month">Hónap:</label>
            <input id="monthly-month" type="number" bind:value={monthlyMonth} min="1" max="12" required placeholder="1-12" size="9" class="checkpoint-input" />
          </div>
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if monthlyReportLoading}
        <div>Betöltés...</div>
      {:else if monthlyReportError}
        <div class="error">{monthlyReportError}</div>
      {:else if monthlyReportData}
        <table class="data-table">
          <thead>
            <tr>
              <th>Hónap</th>
              <th>Dátum</th>
              <th>Belépési idő</th>
              <th>Kilépési idő</th>
              <th>Ledolgozott órák</th>
              <th>Túlórák</th>
            </tr>
          </thead>
          <tbody>
            {#each monthlyReportData as row}
              <tr>
                <td>{row.reportMonth ? row.reportMonth.slice(0,7) : ''}</td>
                <td>{row.date && row.date !== '0001-01-01' && row.date !== null && row.date !== '' ? row.date : ''}</td>
                <td>{row.checkInTime ? row.checkInTime : '00:00:00'}</td>
                <td>{row.checkOutTime ? row.checkOutTime : '00:00:00'}</td>
                <td>{formatNumber2(row.workHours)}</td>
                <td>{formatNumber2(row.overtimeHours)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if monthlyReportData && monthlyReportData.length > 0}
          <table class="summary-table summary-table-standalone">
            <tbody>
              <tr>
                <td>Havi munkanapok</td>
                <td>{summaryRow ? summaryRow.monthlyWorkDays : ''}</td>
              </tr>
              <tr>
                <td>Havi munkaórák</td>
                <td>{formatNumber2(summaryRow ? summaryRow.monthlyWorkHours : '')}</td>
              </tr>
              <tr>
                <td>Havi túlórák</td>
                <td>{formatNumber2(summaryRow ? summaryRow.monthlyOvertimeHours : '')}</td>
              </tr>
            </tbody>
          </table>
        {/if}
      {/if}
    </div>
  {/if}

  {#if activeTab === 'schedule'}
    <div class="api-row api-row-column">
      <div class="api-description">Saját havi beosztás lekérdezése</div>
      <form class="api-action-form" on:submit|preventDefault={fetchSchedulesByMonth}>
        <div class="form-inline-group">
          <label for="schedule-year">Év:</label>
          <input id="schedule-year" type="number" bind:value={scheduleYear} min="2020" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="schedule-month">Hónap:</label>
          <input id="schedule-month" type="number" bind:value={scheduleMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if hasTriedScheduleFetch}
        {#if schedulesLoading}
          <div>Betöltés...</div>
        {:else if schedulesError}
          <div class="error">{schedulesError}</div>
        {:else}
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Beosztás dátuma</th>
                  <th>Kezdési időpont</th>
                  <th>Befejezési időpont</th>
                  <th>Típus</th>
                  <th>Tervezett munkaórák</th>
                </tr>
              </thead>
              <tbody>
                {#if schedules.length > 0}
                  {#each schedules as row}
                    <tr>
                      <td>{row.scheduledDate || '-'}</td>
                      <td>{formatTimeString(row.startTime)}</td>
                      <td>{formatTimeString(row.endTime)}</td>
                      <td>{row.type}</td>
                      <td>{row.scheduledHours}</td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="5" class="empty-table-row">Nincs adat a megadott időszakra.</td>
                  </tr>
                {/if}
              </tbody>
            </table>
            <div class="api-row summary-table-container">
              <table class="summary-table fill-width">
                <tbody>
                  {#if schedules.length > 0}
                    <tr>
                      <td>Tervezett havi munkaórák</td>
                      <td>{schedules[schedules.length-1].scheduledMonthlyHours}</td>
                    </tr>
                    <tr>
                      <td>Tervezett havi munkanapok</td>
                      <td>{schedules[schedules.length-1].scheduledWorkDays}</td>
                    </tr>
                  {:else}
                    <tr>
                      <td colspan="2" class="empty-table-row">Nincs összegző adat.</td>
                    </tr>
                  {/if}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Saját napi beosztás lekérdezése</div>
      <form class="api-action-form" on:submit|preventDefault={fetchSchedulesByDay}>
        <div class="form-inline-group">
          <label for="schedule-year-day">Év:</label>
          <input id="schedule-year-day" type="number" bind:value={scheduleDayYear} min="2020" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="schedule-month-day">Hónap:</label>
          <input id="schedule-month-day" type="number" bind:value={scheduleDayMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="schedule-day">Nap:</label>
          <input id="schedule-day" type="number" bind:value={scheduleDayDay} min="1" max="31" required placeholder="1-31" class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if hasTriedScheduleByDayFetch}
        {#if schedulesByDayLoading}
          <div>Betöltés...</div>
        {:else if schedulesByDayError}
          <div class="error">{schedulesByDayError}</div>
        {:else if schedulesByDay && schedulesByDay.length > 0}
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Beosztás dátuma</th>
                  <th>Kezdési időpont</th>
                  <th>Befejezési időpont</th>
                  <th>Típus</th>
                  <th>Tervezett munkaórák</th>
                </tr>
              </thead>
              <tbody>
                {#each schedulesByDay as row}
                  <tr>
                    <td>{row.scheduledDate || '-'}</td>
                    <td>{formatTimeString(row.startTime)}</td>
                    <td>{formatTimeString(row.endTime)}</td>
                    <td>{row.type}</td>
                    <td>{row.scheduledHours}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Beosztás dátuma</th>
                  <th>Kezdési időpont</th>
                  <th>Befejezési időpont</th>
                  <th>Típus</th>
                  <th>Tervezett munkaórák</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="5" class="empty-table-row">Nincs adat a megadott napra.</td>
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  {#if activeTab === 'report'}
    <div class="api-row api-row-column">
      <div class="api-description">Kimutatás lekérdezése hónap szerint:</div>
      <form class="api-action-form form-inline" on:submit|preventDefault={fetchWorklogsByMonth}>
        <div class="form-inline-group">
          <label for="worklog-month-year">Év:</label>
          <input id="worklog-month-year" type="number" bind:value={worklogMonthYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="worklog-month-month">Hónap:</label>
          <input id="worklog-month-month" type="number" bind:value={worklogMonthMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if worklogsByMonthLoading}
        <div>Betöltés...</div>
      {:else if worklogsByMonthError}
        <div class="error">{worklogsByMonthError}</div>
      {:else if worklogsByMonth}
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dolgozó azonosító</th>
                <th>Dolgozó neve</th>
                <th>Beosztás dátuma</th>
                <th>Munkaórák</th>
                <th>Túlórák</th>
                <th>Tervezett munkaórák</th>
                <th>Tervezett túlóra</th>
                <th>Típus</th>
              </tr>
            </thead>
            <tbody>
              {#each worklogsByMonth as row}
                <tr>
                  <td>{row.employeeId}</td>
                  <td>{row.fullName}</td>
                  <td>{row.scheduledDate}</td>
                  <td>{row.workHours}</td>
                  <td>{row.overtimeHours}</td>
                  <td>{row.scheduledHours}</td>
                  <td>{row.scheduledOvertime}</td>
                  <td>{row.type}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if worklogsByMonth.length > 0}
            <table class="summary-table summary-table-standalone">
              <tbody>
                <tr>
                  <td>Havi munkanapok</td>
                  <td>{worklogsByMonth[0] ? worklogsByMonth[0].monthlyWorkDays : '-'}</td>
                </tr>
                <tr>
                  <td>Tervezett munkanapok</td>
                  <td>{worklogsByMonth[0] ? worklogsByMonth[0].scheduledWorkDays : '-'}</td>
                </tr>
                <tr>
                  <td>Havi túlóra</td>
                  <td>{worklogsByMonth[0] ? worklogsByMonth[0].monthlyOvertimeHours : '-'}</td>
                </tr>
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Kimutatás lekérdezése konkrét napra:</div>
      <form class="api-action-form form-inline" on:submit|preventDefault={fetchWorklogsByDate}>
        <div class="form-inline-group">
          <label for="worklog-date-year">Év:</label>
          <input id="worklog-date-year" type="number" bind:value={worklogDayYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="worklog-date-month">Hónap:</label>
          <input id="worklog-date-month" type="number" bind:value={worklogDayMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        </div>
        <div class="form-inline-group">
          <label for="worklog-date-day">Nap:</label>
          <input id="worklog-date-day" type="number" bind:value={worklogDayDay} min="1" max="31" required placeholder="1-31" class="checkpoint-input" />
        </div>
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
                <th>Beosztás dátuma</th>
                <th>Munkaórák</th>
                <th>Túlórák</th>
                <th>Tervezett munkaórák</th>
                <th>Tervezett túlóra</th>
                <th>Típus</th>
              </tr>
            </thead>
            <tbody>
              {#each worklogsByDate as row}
                <tr>
                  <td>{row.employeeId}</td>
                  <td>{row.fullName}</td>
                  <td>{row.scheduledDate}</td>
                  <td>{row.workHours}</td>
                  <td>{row.overtimeHours}</td>
                  <td>{row.scheduledHours}</td>
                  <td>{row.scheduledOvertime}</td>
                  <td>{row.type}</td>
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
    gap: 0.2rem;
    margin-bottom: 1.2rem;
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
  .data-table td:first-child {
    min-width: 120px;
    font-weight: 600;
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
  width: 38%;
  min-width: 170px;
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
  .api-action-form.form-inline {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
  .api-action-form.form-inline label {
    margin-bottom: 0;
  }
  .form-btn-col {
    display: flex;
    align-items: flex-end;
    align-self: flex-end;
    margin-top: 0;
  }
  .api-action-form .primary-action {
    align-self: flex-end;
    margin-top: 0;
    margin-bottom: 0;
  }
  .primary-action.btn-align-bottom {
    align-self: flex-end;
    margin-top: 0;
  }
  .empty-table-row {
    text-align: center;
    color: var(--color-table-placeholder, #bdbfff);
    font-style: italic;
  }
</style>