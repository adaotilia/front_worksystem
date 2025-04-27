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
  export let EmployeeId = '';

  let adminData = null;
  let error = '';

  // Felső kártya státusz
  let adminCardStatus = '';
  let adminCardStatusLoading = false;
  let adminCardStatusError = '';

  // Auth store szinkronizáció
  const unsubscribe = auth.subscribe((state) => {
    token = state.token;
    userRole = state.userRole;
  });

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
    } else {
      fetchAdminData();
      if (EmployeeId) {
        fetchAdminCardStatus(EmployeeId);
      }
    }
  });

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

<section>
  <h2>Admin dashboard</h2>
</section>

<style>
  /* ... */
</style>
