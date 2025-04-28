<script>
  import { auth } from '../../../stores/authStore.js';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../../../themeStore.js';
  import { goto } from '$app/navigation';
  import { API_BASE } from '../../../config.js';
  import { authFetch } from '../../../authFetch.js';
  import { browser } from '$app/environment';

  const dispatch = createEventDispatcher();
  let token = '';
  let userRole = '';
  
  let adminData = null;
  let error = '';

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

  // Új változók az employee ID szerinti lekérdezéshez
  let employeeIdInput = '';
  let employeeYearInput = '';
  let employeeMonthInput = '';
  let checkpointsByEmployee = [];
  let checkpointsByEmployeeLoading = false;
  let checkpointsByEmployeeError = '';
  let hasTriedEmployeeFetch = false;

  // Új változók a státusz lekérdezéshez
  let statusEmployeeId = '';
  let statusDate = '';
  let statusResult = null;
  let statusLoading = false;
  let statusError = '';

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
  let updateCheckpointEmployeeId = '';
  let updateCheckpointId = '';
  let updateCheckpointCheckIn = '';
  let updateCheckpointCheckOut = '';
  let updatingCheckpoint = false;
  let updateCheckpointMessage = '';
  let updateCheckpointError = '';

  // Új változók a checkpoint törléséhez
  let deleteCheckpointEmployeeId = '';
  let deleteCheckpointId = '';
  let deletingCheckpoint = false;
  let deleteCheckpointMessage = '';
  let deleteCheckpointError = '';

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

  // Közös változó a megjelenítendő checkpointokhoz
  let displayedCheckpoints = [];
  let displayedLoading = false;
  let displayedError = '';

  // Új checkpoint létrehozása változók
  let createCheckpointEmployeeId = '';
  let createCheckpointCheckInDate = '';
  let createCheckpointCheckInTime = '';
  let createCheckpointCheckOutDate = '';
  let createCheckpointCheckOutTime = '';
  let createCheckpointLoading = false;
  let createCheckpointError = '';
  let createCheckpointResult = null;

  // Jogosultság ellenőrzés és adatlekérés csak böngészőben, onMount-ban!
  onMount(() => {
    if (!token || !userRole || userRole.toLowerCase() !== 'admin') {
      if (!token || !userRole) {
        goto('/');
      } else if (userRole.toLowerCase() === 'employee') {
        goto('/dashboard/employee');
      } else if (userRole.toLowerCase() === 'manager') {
        goto('/dashboard/manager');
      } else {
        goto('/');
      }
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    statusDate = `${yyyy}-${mm}-${dd}`;
  });

  async function fetchCheckpointsByMonth(year, month) {
    checkpointsLoading = true;
    checkpointsError = '';
    checkpoints = [];
    try {
      const url = `${API_BASE}/Admin/checkpoints/${year}/${month}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a checkpointok lekérdezésekor');
      checkpoints = await response.json();
      // Közös változó frissítése
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
      const url = `${API_BASE}/Admin/checkpoints/employee/${EmployeeId}/${year}/${month}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Hiba a checkpointok lekérdezésekor');
      checkpointsByEmployee = await response.json();
      // Közös változó frissítése
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

  async function fetchCheckTimesByEmployeeId(EmployeeId, year, month) {
    hasTriedCheckTimes = true;
    checkTimesLoading = true;
    checkTimesError = '';
    checkTimesResult = null;
    try {
      const url = `${API_BASE}/Admin/checkpoints/employee/${EmployeeId}/times/${year}/${month}`;
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json'
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
      const response = await authFetch(`${API_BASE}/Admin/checkpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  async function fetchEmployeeStatus(employeeId, date) {
    statusLoading = true;
    statusError = '';
    statusResult = null;
    try {
      const url = `${API_BASE}/Admin/checkpoints/employee/${employeeId}/status/${date}`;
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

  async function createNewCheckpoint() {
    createCheckpointLoading = true;
    createCheckpointError = '';
    createCheckpointResult = null;
    try {
      // Összeállítjuk az ISO stringeket
      const checkInDateTime = `${createCheckpointCheckInDate}T${createCheckpointCheckInTime}:00.000Z`;
      const checkOutDateTime = `${createCheckpointCheckOutDate}T${createCheckpointCheckOutTime}:00.000Z`;
      const url = `${API_BASE}/Admin/checkpoints`;
      const response = await authFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: Number(createCheckpointEmployeeId),
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime
        })
      });
      if (!response.ok) throw new Error('Hiba a checkpoint létrehozásakor');
      createCheckpointResult = await response.json();
    } catch (err) {
      createCheckpointError = err.message;
      createCheckpointResult = null;
    }
    createCheckpointLoading = false;
  }

  async function updateCheckpoint() {
    updatingCheckpoint = true;
    updateCheckpointError = '';
    updateCheckpointMessage = '';
    try {
      // Ellenőrzés: minden mező ki van-e töltve
      if (!updateCheckpointEmployeeId || !updateCheckpointId || !updateCheckpointCheckIn || !updateCheckpointCheckOut) {
        updateCheckpointError = 'Minden mezőt ki kell tölteni!';
        updatingCheckpoint = false;
        return;
      }
      // Ellenőrzés: belépési idő < kilépési idő
      if (updateCheckpointCheckIn >= updateCheckpointCheckOut) {
        updateCheckpointError = 'A belépési időnek korábbinak kell lennie, mint a kilépési idő!';
        updatingCheckpoint = false;
        return;
      }
      const checkpointDto = {
        checkpointId: updateCheckpointId,
        employeeId: updateCheckpointEmployeeId,
        checkInTime: updateCheckpointCheckIn,
        checkOutTime: updateCheckpointCheckOut,
        sessionStatus: 'Inactive' // vagy 'Active', ha az a kívánt default
      };
      const url = `${API_BASE}/Admin/checkpoints/${updateCheckpointEmployeeId}/${updateCheckpointId}`;
      const body = JSON.stringify(checkpointDto);
      const response = await authFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('Hiba a checkpoint módosítása során: ' + errText);
      }
      updateCheckpointMessage = 'Sikeres módosítás!';
    } catch (err) {
      updateCheckpointError = err.message;
    }
    updatingCheckpoint = false;
  }

  async function deleteCheckpoint() {
    deletingCheckpoint = true;
    deleteCheckpointMessage = '';
    deleteCheckpointError = '';
    try {
      if (!deleteCheckpointEmployeeId || !deleteCheckpointId) {
        deleteCheckpointError = 'Minden mezőt ki kell tölteni!';
        deletingCheckpoint = false;
        return;
      }
      const url = `${API_BASE}/Admin/checkpoints/${deleteCheckpointEmployeeId}/${deleteCheckpointId}`;
      const response = await authFetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('Hiba a checkpoint törlése során: ' + errText);
      }
      deleteCheckpointMessage = 'Checkpoint sikeresen törölve!';
      // Mezők ürítése
      deleteCheckpointEmployeeId = '';
      deleteCheckpointId = '';
    } catch (err) {
      deleteCheckpointError = err.message;
    }
    deletingCheckpoint = false;
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
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={() => fetchCheckpointsByMonth(selectedYear, selectedMonth)}>
        <div class="form-inline-group-col">
          <label for="year-select">Év:</label>
          <input type="number" id="year-select" name="year" min="2024" max="2070" bind:value={selectedYear} placeholder="Pl. 2025" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
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
        <table class="checkpoint-table">
          <thead>
            <tr>
              <th>Checkpoint ID</th>
              <th>Dolgozó azonosító</th>
              <th>Belépési idő</th>
              <th>Kilépési idő</th>
              <th>Státusz</th>
            </tr>
          </thead>
          <tbody>
            {#each checkpoints as cp}
              <tr>
                <td>{cp.checkpointId}</td>
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
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={() => fetchCheckpointsByEmployeeId(employeeIdInput, employeeYearInput, employeeMonthInput)}>
        <div class="form-inline-group-col">
          <label for="employee-id-input">Dolgozó azonosító:</label>
          <input type="number" id="employee-id-input" name="employeeId" min="100" max="999" bind:value={employeeIdInput} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="employee-year-input">Év:</label>
          <input type="number" id="employee-year-input" name="year" min="2024" max="2070" bind:value={employeeYearInput} placeholder="Pl. 2025" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
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
        <table class="checkpoint-table">
          <thead>
            <tr>
              <th>Checkpoint ID</th>
              <th>Dolgozó azonosító</th>
              <th>Belépési idő</th>
              <th>Kilépési idő</th>
              <th>Státusz</th>
            </tr>
          </thead>
          <tbody>
            {#each checkpointsByEmployee as cp}
              <tr>
                <td>{cp.checkpointId}</td>
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
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={() => fetchEmployeeStatus(statusEmployeeId, statusDate)}>
        <div class="form-inline-group-col">
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
        <table class="checkpoint-table">
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
      <div class="api-description">Checkpoint adatok manuális létrehozása:</div>
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={createNewCheckpoint}>
        <div class="form-inline-group-col">
          <label for="create-checkpoint-employee-id">Azonosító:</label>
          <input type="number" id="create-checkpoint-employee-id" min="100" max="999" bind:value={createCheckpointEmployeeId} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="create-checkin-date">Belépés dátum:</label>
          <input type="date" id="create-checkin-date" bind:value={createCheckpointCheckInDate} required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="create-checkin-time">Időpont:</label>
          <input type="time" id="create-checkin-time" bind:value={createCheckpointCheckInTime} required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="create-checkout-date">Kilépés dátum:</label>
          <input type="date" id="create-checkout-date" bind:value={createCheckpointCheckOutDate} required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="create-checkout-time">Időpont:</label>
          <input type="time" id="create-checkout-time" bind:value={createCheckpointCheckOutTime} required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Létrehozás</button>
        </div>
      </form>
      <div style="margin-top:0.4em;">
        {#if createCheckpointLoading}
          <span>Mentés...</span>
        {:else if createCheckpointError}
          <span class="error">{createCheckpointError}</span>
        {:else if createCheckpointResult}
          <span style="color: #0dc37b;">Checkpoint sikeresen létrehozva! (ID: {createCheckpointResult.checkpointId})</span>
        {/if}
      </div>
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Checkpoint adatok módosítása:</div>
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={updateCheckpoint}>
        <div class="form-inline-group-col">
          <label for="update-employee-id">Dolgozó azonosító:</label>
          <input type="number" id="update-employee-id" min="100" max="999" bind:value={updateCheckpointEmployeeId} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="update-checkpoint-id">Checkpoint ID:</label>
          <input type="number" id="update-checkpoint-id" min="1" bind:value={updateCheckpointId} placeholder="Pl. 12" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="update-checkin">Belépési idő (dátum és időpont):</label>
          <input type="datetime-local" id="update-checkin" bind:value={updateCheckpointCheckIn} required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="update-checkout">Kilépési idő (dátum és időpont):</label>
          <input type="datetime-local" id="update-checkout" bind:value={updateCheckpointCheckOut} required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Jóváhagyás</button>
        </div>
      </form>
      {#if updatingCheckpoint}
        <div>Mentés folyamatban...</div>
      {:else if updateCheckpointError}
        <div class="error">{updateCheckpointError}</div>
      {:else if updateCheckpointMessage}
        <div class="success">{updateCheckpointMessage}</div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Checkpoint törlése (employeeId + checkpointId):</div>
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={deleteCheckpoint}>
        <div class="form-inline-group-col">
          <label for="delete-employee-id">Dolgozó azonosító:</label>
          <input type="number" id="delete-employee-id" min="100" max="999" bind:value={deleteCheckpointEmployeeId} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="delete-checkpoint-id">Checkpoint ID:</label>
          <input type="number" id="delete-checkpoint-id" min="1" bind:value={deleteCheckpointId} placeholder="Pl. 12" required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="danger-action" disabled={deletingCheckpoint}>Törlés</button>
        </div>
      </form>
      {#if deletingCheckpoint}
        <div>Checkpoint törlése folyamatban...</div>
      {:else if deleteCheckpointError}
        <div class="error">{deleteCheckpointError}</div>
      {:else if deleteCheckpointMessage}
        <div class="success">{deleteCheckpointMessage}</div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'monthly'}
    <div class="api-row api-row-column">
      <div class="api-description">
        Havi munka lekérdezése (év-hónap, dolgozó):
      </div>
      <form class="api-action-form">
        <div class="form-inline-group">
          <label for="month-date">Év-hónap:</label>
          <input type="month" id="month-date" name="monthDate" />
        </div>
        <div class="form-inline-group">
          <label for="user-id">Dolgozó azonosító:</label>
          <input type="text" id="user-id" name="userId" placeholder="Pl. 123" />
        </div>
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
    </div>
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
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
    </div>
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
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
    </div>
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
.form-inline-group {
display: flex;
flex-direction: row;
align-items: center;
gap: 1.2rem;
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
label[for="month-select"] {
  margin-right: 0.5rem;
}
.api-description {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-size: 1.04rem;
  color: var(--color-table-header-text, #6c3bb8);
  font-weight: 500;
}
.checkpoint-form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.form-inline-group-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  min-width: 150px;
}
.form-btn-col {
  min-width: 120px;
  align-items: center;
  justify-content: flex-end;
  display: flex;
  flex-direction: column;
  height: 100%;
}
@media (max-width: 1100px) {
  .form-btn-col {
    align-items: stretch;
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
.success {
  color: var(--color-success, #2ecc40);
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>