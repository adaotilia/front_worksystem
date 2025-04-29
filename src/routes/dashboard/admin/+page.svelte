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

  let employeeIdInput = '';
  let employeeYearInput = '';
  let employeeMonthInput = '';
  let checkpointsByEmployee = [];
  let checkpointsByEmployeeLoading = false;
  let checkpointsByEmployeeError = '';
  let hasTriedEmployeeFetch = false;

  let statusEmployeeId = '';
  let statusDate = '';
  let statusResult = null;
  let statusLoading = false;
  let statusError = '';

  let checkTimesIdInput = '';
  let checkTimesYearInput = '';
  let checkTimesMonthInput = '';
  let checkTimesResult = null;
  let checkTimesLoading = false;
  let checkTimesError = '';
  let hasTriedCheckTimes = false;

  let newCheckpointId = '';
  let newCheckpointStart = '';
  let newCheckpointEnd = '';
  let creatingCheckpoint = false;
  let checkpointCreateMessage = '';
  let checkpointCreateError = '';

  let updateCheckpointEmployeeId = '';
  let updateCheckpointId = '';
  let updateCheckpointCheckIn = '';
  let updateCheckpointCheckOut = '';
  let updatingCheckpoint = false;
  let updateCheckpointMessage = '';
  let updateCheckpointError = '';

  let deleteCheckpointEmployeeIdVar = '';
  let deleteCheckpointIdVar = '';
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

  let displayedCheckpoints = [];
  let displayedLoading = false;
  let displayedError = '';

  let createCheckpointEmployeeId = '';
  let createCheckpointCheckInDate = '';
  let createCheckpointCheckInTime = '';
  let createCheckpointCheckOutDate = '';
  let createCheckpointCheckOutTime = '';
  let createCheckpointLoading = false;
  let createCheckpointError = '';
  let createCheckpointResult = null;

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

  let newFullName = '';
  let newUsername = '';
  let newPassword = '';
  let newUserRole = 'Employee';
  let addEmployeeLoading = false;
  let addEmployeeError = '';
  let addEmployeeSuccess = '';

  let updateFullnameId = '';
  let updateFullnameOld = '';
  let updateFullnameNew = '';
  let updateFullnameLoading = false;
  let updateFullnameError = '';
  let updateFullnameSuccess = '';

  let updateUsernameId = '';
  let updateUsernameOld = '';
  let updateUsernameNew = '';
  let updateUsernameLoading = false;
  let updateUsernameError = '';
  let updateUsernameSuccess = '';

  let updatePasswordId = '';
  let updatePasswordUsername = '';
  let updatePasswordNew = '';
  let updatePasswordLoading = false;
  let updatePasswordError = '';
  let updatePasswordSuccess = '';

  let updateRoleId = '';
  let updateRoleNew = 'Employee';
  let updateRoleLoading = false;
  let updateRoleError = '';
  let updateRoleSuccess = '';

  let deleteEmployeeId = '';
  let deleteEmployeeLoading = false;
  let deleteEmployeeError = '';
  let deleteEmployeeSuccess = '';
  let showDeleteConfirm = false;

  const roleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Employee', label: 'Dolgozó' }
  ];

  async function fetchEmployees() {
    employeesLoading = true;
    employeesError = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees`, {
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
      const response = await authFetch(`${API_BASE}/Admin/employees/${singleEmployeeIdInput}`, {
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
      const response = await authFetch(`${API_BASE}/Admin/employees/username/${usernameInput}`, {
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
      if (!response.ok) {
        let errorMsg = 'Hiba a checkpoint létrehozásakor';
        try {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {}
          if (data && typeof data === 'object' && data.message) {
            errorMsg = data.message;
          } else if (text) {
            errorMsg = text.split(/\.|\n/)[0].trim();
          }
        } catch {}
        throw new Error(errorMsg);
      }
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
      if (!updateCheckpointEmployeeId || !updateCheckpointId || !updateCheckpointCheckIn || !updateCheckpointCheckOut) {
        updateCheckpointError = 'Minden mezőt ki kell tölteni!';
        updatingCheckpoint = false;
        return;
      }
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
        sessionStatus: 'Inactive' 
      };
      const url = `${API_BASE}/Admin/checkpoints/${updateCheckpointEmployeeId}/${updateCheckpointId}`;
      const body = JSON.stringify(checkpointDto);
      const response = await authFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!response.ok) {
        let errorMsg = 'Hiba a checkpoint módosítása során';
        try {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {}
          if (data && typeof data === 'object' && data.message) {
            errorMsg = data.message;
          } else if (text) {
            errorMsg = text.split(/\.|\n/)[0].trim();
          }
        } catch {}
        throw new Error(errorMsg);
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
      if (!deleteCheckpointEmployeeIdVar || !deleteCheckpointIdVar) {
        deleteCheckpointError = 'Minden mezőt ki kell tölteni!';
        deletingCheckpoint = false;
        return;
      }
      const url = `${API_BASE}/Admin/checkpoints/${deleteCheckpointEmployeeIdVar}/${deleteCheckpointIdVar}`;
      const response = await authFetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok && response.status !== 204) throw new Error('Hiba a checkpoint törlésekor');
      deleteCheckpointMessage = 'Checkpoint sikeresen törölve!';
      deleteCheckpointEmployeeIdVar = '';
      deleteCheckpointIdVar = '';
    } catch (err) {
      deleteCheckpointError = err.message;
    }
    deletingCheckpoint = false;
  }

  function handleLogout() {
    auth.logout();
    goto('/');
  }

  let worklogsByMonth = null;
  let worklogsByMonthLoading = false;
  let worklogsByMonthError = '';

  let worklogsByEmployee = null;
  let worklogsByEmployeeLoading = false;
  let worklogsByEmployeeError = '';

  let worklogsByDate = null;
  let worklogsByDateLoading = false;
  let worklogsByDateError = '';

  async function fetchWorklogsByMonth(year, month) {
    worklogsByMonthLoading = true;
    worklogsByMonthError = '';
    worklogsByMonth = null;
    try {
      const url = `${API_BASE}/Admin/worklogs/${year}/${month}`;
      const response = await authFetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Hiba a kimutatás lekérdezésekor (hónap)');
      worklogsByMonth = await response.json();
    } catch (err) {
      worklogsByMonthError = err.message;
    }
    worklogsByMonthLoading = false;
  }

  async function fetchWorklogsByEmployee(employeeId, year, month) {
    worklogsByEmployeeLoading = true;
    worklogsByEmployeeError = '';
    worklogsByEmployee = null;
    try {
      const url = `${API_BASE}/Admin/worklogs/employee/${employeeId}/${year}/${month}`;
      const response = await authFetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Hiba a kimutatás lekérdezésekor (dolgozó)');
      worklogsByEmployee = await response.json();
    } catch (err) {
      worklogsByEmployeeError = err.message;
    }
    worklogsByEmployeeLoading = false;
  }

  async function fetchWorklogsByDate(year, month, day) {
    worklogsByDateLoading = true;
    worklogsByDateError = '';
    worklogsByDate = null;
    try {
      const url = `${API_BASE}/Admin/worklogs/date/${year}/${month}/${day}`;
      const response = await authFetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Hiba a kimutatás lekérdezésekor (dátum)');
      worklogsByDate = await response.json();
    } catch (err) {
      worklogsByDateError = err.message;
    }
    worklogsByDateLoading = false;
  }

  let worklogEmployeeId = '';
  let worklogEmployeeYear = '';
  let worklogEmployeeMonth = '';
  let worklogDateYear = '';
  let worklogDateMonth = '';
  let worklogDateDay = '';

  let scheduleYear = '';
  let scheduleMonth = '';
  let schedules = [];
  let schedulesLoading = false;
  let schedulesError = '';
  let scheduleSummary = { totalPlannedHours: 0, totalPlannedDays: 0 };

  let scheduleDay = '';
  let schedulesByDay = [];
  let schedulesByDayLoading = false;
  let schedulesByDayError = '';

  async function fetchSchedulesByMonth() {
    schedulesLoading = true;
    schedulesError = '';
    schedules = [];
    scheduleSummary = { totalPlannedHours: 0, totalPlannedDays: 0 };
    try {
      const url = `${API_BASE}/Admin/schedules/${scheduleYear}/${scheduleMonth}`;
      const response = await authFetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Hiba a beosztások lekérdezésekor');
      schedules = await response.json();
    } catch (err) {
      schedulesError = err.message;
    }
    schedulesLoading = false;
  }

  async function fetchSchedulesByDay() {
    schedulesByDayLoading = true;
    schedulesByDayError = '';
    schedulesByDay = [];
    try {
      const url = `${API_BASE}/Admin/schedules/date/${scheduleYear}/${scheduleMonth}/${scheduleDay}`;
      const response = await authFetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Hiba a napi beosztások lekérdezésekor');
      schedulesByDay = await response.json();
    } catch (err) {
      schedulesByDayError = err.message;
    }
    schedulesByDayLoading = false;
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
      const url = `${API_BASE}/Admin/schedules/employee/${scheduleEmployeeId}/${scheduleEmployeeYear}/${scheduleEmployeeMonth}`;
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

  let newScheduleEmployeeId = '';
  let newScheduleDate = '';
  let newScheduleStart = '';
  let newScheduleEnd = '';
  let newScheduleType = 'Shift';
  let newScheduleLoading = false;
  let newScheduleError = '';
  let newScheduleSuccess = '';

  const scheduleTypeOptions = [
    { value: 'Shift', label: 'Műszak' },
    { value: 'Overtime', label: 'Túlóra' },
    { value: 'DayOff', label: 'Pihenőnap' },
    { value: 'PaidTimeOff', label: 'Szabadság' },
    { value: 'SickLeave', label: 'Betegség' }
  ];

  async function createSchedule() {
    newScheduleLoading = true;
    newScheduleError = '';
    newScheduleSuccess = '';
    if (!newScheduleEmployeeId || !newScheduleDate || !newScheduleType) {
      newScheduleError = 'Az azonosító, dátum és típus megadása kötelező!';
      newScheduleLoading = false;
      return;
    }
    try {
      const body = JSON.stringify({
        scheduleId: 0,
        employeeId: Number(newScheduleEmployeeId),
        fullName: '', 
        scheduledDate: newScheduleDate,
        startTime: newScheduleStart ? newScheduleStart : '00:00',
        endTime: newScheduleEnd ? newScheduleEnd : '00:00',
        type: newScheduleType,
        scheduledHours: newScheduleStart && newScheduleEnd ? 0 : 0,
        scheduledMonthlyHours: 0,
        scheduledWorkDays: 0
      });
      const url = `${API_BASE}/Admin/schedules?employeeId=${encodeURIComponent(newScheduleEmployeeId)}`;
      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!response.ok) throw new Error('Hiba a beosztás mentésekor');
      newScheduleSuccess = 'Beosztás sikeresen létrehozva!';
      newScheduleEmployeeId = '';
      newScheduleDate = '';
      newScheduleStart = '';
      newScheduleEnd = '';
      newScheduleType = 'Shift';
    } catch (err) {
      newScheduleError = err.message;
    } finally {
      newScheduleLoading = false;
    }
  }

  let monthlyYear = '';
  let monthlyMonth = '';
  let monthlyReportData = null;
  let monthlyReportLoading = false;
  let monthlyReportError = '';

  async function fetchMonthlyReportByDate() {
    monthlyReportLoading = true;
    monthlyReportError = '';
    monthlyReportData = null;
    try {
      const url = `${API_BASE}/Admin/monthlyreports/${monthlyYear}/${monthlyMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Riport lekérdezése sikertelen');
      monthlyReportData = await resp.json();
    } catch (err) {
      monthlyReportError = err.message;
    }
    monthlyReportLoading = false;
  }

  let monthlyEmployeeId = '';
  let monthlyEmployeeYear = '';
  let monthlyEmployeeMonth = '';
  let monthlyEmployeeReportData = null;
  let monthlyEmployeeReportLoading = false;
  let monthlyEmployeeReportError = '';

  async function fetchMonthlyReportByEmployee() {
    monthlyEmployeeReportLoading = true;
    monthlyEmployeeReportError = '';
    monthlyEmployeeReportData = null;
    try {
      const url = `${API_BASE}/Admin/monthlyreports/employee/${monthlyEmployeeId}?year=${monthlyEmployeeYear}&month=${monthlyEmployeeMonth}`;
      const resp = await authFetch(url);
      if (!resp.ok) throw new Error('Riport lekérdezése sikertelen');
      monthlyEmployeeReportData = await resp.json();
    } catch (err) {
      monthlyEmployeeReportError = err.message;
    }
    monthlyEmployeeReportLoading = false;
  }

  function worklogsByMonthSummary(worklogs) {
    if (!worklogs) return { workdays: 0, plannedWorkdays: 0, totalOvertime: 0 };
    let workdays = worklogs.length;
    let plannedWorkdays = worklogs.filter(w => w.plannedWorkHours > 0).length;
    let totalOvertime = worklogs.reduce((sum, w) => sum + (w.overtimeHours || 0), 0);
    return { workdays, plannedWorkdays, totalOvertime };
  }

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

  let updateEmployeeId = '';
  let updateYear = '';
  let updateMonth = '';
  let updateDay = '';
  let updateStartTime = '';
  let updateEndTime = '';
  let updateType = 'Shift';
  let updateScheduleLoading = false;
  let updateScheduleError = '';
  let updateScheduleSuccess = '';

  async function updateSchedule() {
    updateScheduleLoading = true;
    updateScheduleError = '';
    updateScheduleSuccess = '';
    if (!updateEmployeeId || !updateYear || !updateMonth || !updateDay || !updateType) {
      updateScheduleError = 'Az azonosító, év, hónap, nap és típus megadása kötelező!';
      updateScheduleLoading = false;
      return;
    }
    try {
      const url = `${API_BASE}/Admin/schedules/employee/${updateEmployeeId}/${updateYear}/${updateMonth}/${updateDay}`;
      const body = JSON.stringify({
        scheduleId: 0,
        employeeId: Number(updateEmployeeId),
        fullName: '', 
        scheduledDate: `${updateYear}-${String(updateMonth).padStart(2, '0')}-${String(updateDay).padStart(2, '0')}`,
        startTime: updateStartTime ? updateStartTime : '00:00',
        endTime: updateEndTime ? updateEndTime : '00:00',
        type: updateType,
        scheduledHours: 0,
        scheduledMonthlyHours: 0,
        scheduledWorkDays: 0
      });
      const response = await authFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!response.ok) throw new Error('Hiba a beosztás módosításakor');
      updateScheduleSuccess = 'Beosztás sikeresen módosítva!';
    } catch (err) {
      updateScheduleError = err.message;
    } finally {
      updateScheduleLoading = false;
    }
  }

  let deleteEmployeeIdVar = '';
  let deleteYearVar = '';
  let deleteMonthVar = '';
  let deleteDayVar = '';
  let deleteScheduleLoading = false;
  let deleteScheduleError = '';
  let deleteScheduleSuccess = '';

  async function deleteSchedule() {
    deleteScheduleLoading = true;
    deleteScheduleError = '';
    deleteScheduleSuccess = '';
    if (!deleteEmployeeIdVar || !deleteYearVar || !deleteMonthVar || !deleteDayVar) {
      deleteScheduleError = 'Az azonosító, év, hónap, nap megadása kötelező!';
      deleteScheduleLoading = false;
      return;
    }
    try {
      const url = `${API_BASE}/Admin/schedules/employee/${deleteEmployeeIdVar}/${deleteYearVar}/${deleteMonthVar}/${deleteDayVar}`;
      const response = await authFetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok && response.status !== 204) throw new Error('Hiba a beosztás törlésekor');
      deleteScheduleSuccess = 'Beosztás sikeresen törölve!';
    } catch (err) {
      deleteScheduleError = err.message;
    } finally {
      deleteScheduleLoading = false;
    }
  }

  let showDeleteScheduleConfirm = false;
  let pendingDeleteVars = { employeeId: '', year: '', month: '', day: '' };

  function openDeleteScheduleConfirm() {
    pendingDeleteVars.employeeId = deleteEmployeeIdVar;
    pendingDeleteVars.year = deleteYearVar;
    pendingDeleteVars.month = deleteMonthVar;
    pendingDeleteVars.day = deleteDayVar;
    showDeleteScheduleConfirm = true;
  }
  function cancelDeleteSchedule() {
    showDeleteScheduleConfirm = false;
  }
  async function confirmDeleteSchedule() {
    deleteEmployeeIdVar = pendingDeleteVars.employeeId;
    deleteYearVar = pendingDeleteVars.year;
    deleteMonthVar = pendingDeleteVars.month;
    deleteDayVar = pendingDeleteVars.day;
    showDeleteScheduleConfirm = false;
    await deleteSchedule();
  }

  let showDeleteCheckpointConfirm = false;
  let pendingDeleteCheckpointVars = { employeeId: '', checkpointId: '' };

  function openDeleteCheckpointConfirm() {
    pendingDeleteCheckpointVars.employeeId = deleteCheckpointEmployeeIdVar;
    pendingDeleteCheckpointVars.checkpointId = deleteCheckpointIdVar;
    showDeleteCheckpointConfirm = true;
  }
  function cancelDeleteCheckpoint() {
    showDeleteCheckpointConfirm = false;
  }
  async function confirmDeleteCheckpoint() {
    deleteCheckpointEmployeeIdVar = pendingDeleteCheckpointVars.employeeId;
    deleteCheckpointIdVar = pendingDeleteCheckpointVars.checkpointId;
    showDeleteCheckpointConfirm = false;
    await deleteCheckpoint();
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
        <table class="data-table">
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
        <table class="data-table">
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
      <form class="api-action-form checkpoint-form-row" on:submit|preventDefault={openDeleteCheckpointConfirm}>
        <div class="form-inline-group-col">
          <label for="delete-employee-id">Dolgozó azonosító:</label>
          <input type="number" id="delete-employee-id" min="100" max="999" bind:value={deleteCheckpointEmployeeIdVar} placeholder="Pl. 123" required class="checkpoint-input" />
        </div>
        <div class="form-inline-group-col">
          <label for="delete-checkpoint-id">Checkpoint ID:</label>
          <input type="number" id="delete-checkpoint-id" min="1" bind:value={deleteCheckpointIdVar} placeholder="Pl. 10" required class="checkpoint-input" />
        </div>
        <div class="form-btn-col">
          <button type="submit" class="danger-action" disabled={deletingCheckpoint}>Törlés</button>
        </div>
      </form>
      {#if showDeleteCheckpointConfirm}
        <div class="delete-confirm-modal">
          <div class="delete-confirm-message">
            Biztosan törölni szeretnéd ezt a checkpointot?
            <br>
            <b>Dolgozó azonosító:</b> {pendingDeleteCheckpointVars.employeeId},
            <b>Checkpoint azonosító:</b> {pendingDeleteCheckpointVars.checkpointId}
          </div>
          <div class="delete-confirm-buttons">
            <button class="danger-action" on:click={confirmDeleteCheckpoint} disabled={deletingCheckpoint}>Törlés</button>
            <button class="secondary-action" on:click={cancelDeleteCheckpoint} disabled={deletingCheckpoint}>Mégsem</button>
          </div>
        </div>
      {/if}
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
                  <td>{formatNumber2(row.workHours)}</td>
                  <td>{formatNumber2(row.overtimeHours)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if monthlyReportData.length > 0}
            <div class="api-row api-row-column summary-table-container">
              <table class="summary-table fill-width">
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
            </div>
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
                    <td>{formatNumber2(row.workHours)}</td>
                    <td>{formatNumber2(row.overtimeHours)}</td>
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
                </tr>
                {/if}
              </tbody>
            </table>
            {#if Array.isArray(monthlyEmployeeReportData) && monthlyEmployeeReportData.length > 0}
            <div class="api-row api-row-column summary-table-container">
              <table class="summary-table fill-width">
                <tbody>
                  <tr>
                    <td>Havi munkanapok</td>
                    <td>{monthlyEmployeeReportData[0]?.monthlyWorkDays ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>Tervezett munkanapok</td>
                    <td>{monthlyEmployeeReportData[0]?.scheduledWorkDays ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>Havi túlóra</td>
                    <td>{formatNumber2(monthlyEmployeeReportData[0]?.monthlyOvertimeHours ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'report'}
    <div class="api-row api-row-column">
      <div class="api-description">Havi kimutatás</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchWorklogsByMonth(monthlyYear, monthlyMonth)}>
        <label for="worklog-year">Év:</label>
        <input id="worklog-year" type="number" bind:value={monthlyYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="worklog-month">Hónap:</label>
        <input id="worklog-month" type="number" bind:value={monthlyMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if worklogsByMonthLoading}
        <div>Betöltés...</div>
      {:else if worklogsByMonthError}
        <div class="error">{worklogsByMonthError}</div>
      {:else if worklogsByMonth && worklogsByMonth.length > 0}
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
            </tr>
          </thead>
          <tbody>
            {#each worklogsByMonth as row}
              <tr>
                <td>{row.employeeId}</td>
                <td>{row.fullName}</td>
                <td>{row.scheduledDate}</td>
                <td>{formatNumber2(row.workHours)}</td>
                <td>{formatNumber2(row.overtimeHours)}</td>
                <td>{formatNumber2(row.scheduledHours)}</td>
                <td>{formatNumber2(row.scheduledOvertime)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="api-row api-row-column summary-table-container">
          <table class="summary-table fill-width">
            <tbody>
              <tr>
                <td>Havi munkanapok</td>
                <td>{worklogsByMonth[0]?.monthlyWorkDays ?? '-'}</td>
              </tr>
              <tr>
                <td>Tervezett munkanapok</td>
                <td>{worklogsByMonth[0]?.scheduledWorkDays ?? '-'}</td>
              </tr>
              <tr>
                <td>Havi túlóra</td>
                <td>{formatNumber2(worklogsByMonth[0]?.monthlyOvertimeHours ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      {/if}
      <div class="api-description">Havi kimutatás dolgozó azonosító alapján</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchWorklogsByEmployee(worklogEmployeeId, worklogEmployeeYear, worklogEmployeeMonth)}>
        <label for="worklog-employee-id">Dolgozó azonosító:</label>
        <input id="worklog-employee-id" type="number" bind:value={worklogEmployeeId} min="1" required placeholder="Pl. 123" class="checkpoint-input" />
        <label for="worklog-employee-year">Év:</label>
        <input id="worklog-employee-year" type="number" bind:value={worklogEmployeeYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="worklog-employee-month">Hónap:</label>
        <input id="worklog-employee-month" type="number" bind:value={worklogEmployeeMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if worklogsByEmployeeLoading}
        <div>Betöltés...</div>
      {:else if worklogsByEmployeeError}
        <div class="error">{worklogsByEmployeeError}</div>
      {:else if worklogsByEmployee && worklogsByEmployee.length > 0}
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
            </tr>
          </thead>
          <tbody>
            {#each worklogsByEmployee as row}
              <tr>
                <td>{row.employeeId}</td>
                <td>{row.fullName}</td>
                <td>{row.scheduledDate}</td>
                <td>{formatNumber2(row.workHours)}</td>
                <td>{formatNumber2(row.overtimeHours)}</td>
                <td>{formatNumber2(row.scheduledHours)}</td>
                <td>{formatNumber2(row.scheduledOvertime)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="api-row api-row-column summary-table-container">
          <table class="summary-table fill-width">
            <tbody>
              <tr>
                <td>Havi munkanapok</td>
                <td>{worklogsByEmployee[0]?.monthlyWorkDays ?? '-'}</td>
              </tr>
              <tr>
                <td>Tervezett munkanapok</td>
                <td>{worklogsByEmployee[0]?.scheduledWorkDays ?? '-'}</td>
              </tr>
              <tr>
                <td>Havi túlóra</td>
                <td>{formatNumber2(worklogsByEmployee[0]?.monthlyOvertimeHours ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      {/if}
     <div class="api-description">Dátum szerinti kimutatás</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => fetchWorklogsByDate(worklogDateYear, worklogDateMonth, worklogDateDay)}>
        <label for="worklog-date-year">Év:</label>
        <input id="worklog-date-year" type="number" bind:value={worklogDateYear} min="2024" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="worklog-date-month">Hónap:</label>
        <input id="worklog-date-month" type="number" bind:value={worklogDateMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <label for="worklog-date-day">Nap:</label>
        <input id="worklog-date-day" type="number" bind:value={worklogDateDay} min="1" max="31" required placeholder="1-31" class="checkpoint-input" />
        <button type="submit" class="primary-action">Lekérés</button>
      </form>
      {#if worklogsByDateLoading}
        <div>Betöltés...</div>
      {:else if worklogsByDateError}
        <div class="error">{worklogsByDateError}</div>
      {:else if worklogsByDate && worklogsByDate.length > 0}
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
            </tr>
          </thead>
          <tbody>
            {#each worklogsByDate as row}
              <tr>
                <td>{row.employeeId}</td>
                <td>{row.fullName}</td>
                <td>{row.scheduledDate}</td>
                <td>{formatNumber2(row.workHours)}</td>
                <td>{formatNumber2(row.overtimeHours)}</td>
                <td>{formatNumber2(row.scheduledHours)}</td>
                <td>{formatNumber2(row.scheduledOvertime)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'schedule'}
    <div class="api-row api-row-column">
      <div class="api-description">
        Havi beosztások lekérdezése
      </div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchSchedulesByMonth}>
        <label for="schedule-year">Év:</label>
        <input id="schedule-year" type="number" bind:value={scheduleYear} min="2020" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="schedule-month">Hónap:</label>
        <input id="schedule-month" type="number" bind:value={scheduleMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if schedulesLoading}
        <div>Betöltés...</div>
      {:else if schedulesError}
        <div class="error">{schedulesError}</div>
      {:else if schedules && schedules.length > 0}
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
              </tr>
            </thead>
          <tbody>
            {#each schedules as row}
              <tr>
                <td>{row.employeeId}</td>
                <td>{row.fullName}</td>
                <td>{row.scheduledDate}</td>
                <td>{row.startTime}</td>
                <td>{row.endTime}</td>
                <td>{row.type}</td>
                <td>{formatNumber2(row.scheduledHours)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="api-row api-row-column summary-table-container">
          <table class="summary-table fill-width">
            <tbody>
              <tr>
                <td>Tervezett havi munkaórák</td>
                <td>{formatNumber2(schedules.length > 0 ? schedules[schedules.length-1].scheduledMonthlyHours : 0)}</td>
              </tr>
              <tr>
                <td>Tervezett havi munkanapok</td>
                <td>{schedules.length > 0 ? schedules[schedules.length-1].scheduledWorkDays : 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        {/if}
      </div>
    <div class="api-row api-row-column">
      <div class="api-description">Napi beosztások lekérdezése</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchSchedulesByDay}>
        <label for="schedule-year-day">Év:</label>
        <input id="schedule-year-day" type="number" bind:value={scheduleYear} min="2020" max="2070" required placeholder="Pl. 2025" class="checkpoint-input" />
        <label for="schedule-month-day">Hónap:</label>
        <input id="schedule-month-day" type="number" bind:value={scheduleMonth} min="1" max="12" required placeholder="1-12" class="checkpoint-input" />
        <label for="schedule-day">Nap:</label>
        <input id="schedule-day" type="number" bind:value={scheduleDay} min="1" max="31" required placeholder="1-31" class="checkpoint-input" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action">Lekérés</button>
        </div>
      </form>
      {#if schedulesByDayLoading}
        <div>Betöltés...</div>
      {:else if schedulesByDayError}
        <div class="error">{schedulesByDayError}</div>
      {:else if schedulesByDay && schedulesByDay.length > 0}
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
              </tr>
            </thead>
          <tbody>
            {#each schedulesByDay as row}
              <tr>
                <td>{row.employeeId}</td>
                <td>{row.fullName}</td>
                <td>{row.scheduledDate}</td>
                <td>{row.startTime}</td>
                <td>{row.endTime}</td>
                <td>{row.type}</td>
                <td>{formatNumber2(row.scheduledHours)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Beosztás lekérdezése dolgozó, év és hónap szerint</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={fetchSchedulesByEmployee}>
        <label for="schedule-employee-id">Dolgozó azonosító:</label>
        <input id="schedule-employee-id" type="number" bind:value={scheduleEmployeeId} min="1" required class="checkpoint-input" placeholder="Pl. 100" />
        <label for="schedule-employee-year">Év:</label>
        <input id="schedule-employee-year" type="number" bind:value={scheduleEmployeeYear} min="2020" max="2070" required class="checkpoint-input" placeholder="Pl. 2025" />
        <label for="schedule-employee-month">Hónap:</label>
        <input id="schedule-employee-month" type="number" bind:value={scheduleEmployeeMonth} min="1" max="12" required class="checkpoint-input" placeholder="1-12" />
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
    <div class="api-row api-row-column">
      <div class="api-description">Új beosztás létrehozása</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={createSchedule}>
        <label for="new-schedule-employee-id">Dolgozó azonosító:</label>
        <input id="new-schedule-employee-id" type="number" bind:value={newScheduleEmployeeId} min="1" required class="checkpoint-input" placeholder="Pl. 100" />
        <label for="new-schedule-date">Tervezett dátum:</label>
        <input id="new-schedule-date" type="date" bind:value={newScheduleDate} required class="checkpoint-input" />
        <label for="new-schedule-start">Kezdési időpont:</label>
        <input id="new-schedule-start" type="time" bind:value={newScheduleStart} class="checkpoint-input" />
        <label for="new-schedule-end">Befejezési időpont:</label>
        <input id="new-schedule-end" type="time" bind:value={newScheduleEnd} class="checkpoint-input" />
        <label for="new-schedule-type">Típus:</label>
        <select id="new-schedule-type" bind:value={newScheduleType} class="checkpoint-input">
          {#each scheduleTypeOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <div class="form-btn-col">
          <button type="submit" class="primary-action" disabled={newScheduleLoading}>Létrehozás</button>
        </div>
      </form>
      <div style="margin-top:0.4em;">
        {#if newScheduleLoading}
          <span>Mentés...</span>
        {:else if newScheduleError}
          <span class="error">{newScheduleError}</span>
        {:else if newScheduleSuccess}
          <span style="color: #0dc37b;">{newScheduleSuccess}</span>
        {/if}
      </div>
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Beosztás szerkesztése (módosítás)</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={updateSchedule}>
        <label for="update-employee-id">Dolgozó azonosító:</label>
        <input id="update-employee-id" type="number" bind:value={updateEmployeeId} min="1" required class="checkpoint-input" placeholder="Pl. 100" />
        <label for="update-year">Év:</label>
        <input id="update-year" type="number" bind:value={updateYear} min="2020" max="2070" required class="checkpoint-input" placeholder="Pl. 2025" />
        <label for="update-month">Hónap:</label>
        <input id="update-month" type="number" bind:value={updateMonth} min="1" max="12" required class="checkpoint-input" placeholder="1-12" />
        <label for="update-day">Nap:</label>
        <input id="update-day" type="number" bind:value={updateDay} min="1" max="31" required class="checkpoint-input" placeholder="1-31" />
        <label for="update-start-time">Kezdési időpont:</label>
        <input id="update-start-time" type="time" bind:value={updateStartTime} class="checkpoint-input" />
        <label for="update-end-time">Befejezési időpont:</label>
        <input id="update-end-time" type="time" bind:value={updateEndTime} class="checkpoint-input" />
        <label for="update-type">Típus:</label>
        <select id="update-type" bind:value={updateType} class="checkpoint-input">
          {#each scheduleTypeOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <div class="form-btn-col">
          <button type="submit" class="primary-action" disabled={updateScheduleLoading}>Módosítás</button>
        </div>
      </form>
      <div style="margin-top:0.4em;">
        {#if updateScheduleLoading}
          <span>Mentés...</span>
        {:else if updateScheduleError}
          <span class="error">{updateScheduleError}</span>
        {:else if updateScheduleSuccess}
          <span style="color: #0dc37b;">{updateScheduleSuccess}</span>
        {/if}
      </div>
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Beosztás törlése</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={openDeleteScheduleConfirm}>
        <label for="delete-employee-id">Dolgozó azonosító:</label>
        <input id="delete-employee-id" type="number" bind:value={deleteEmployeeIdVar} min="1" required class="checkpoint-input" placeholder="Pl. 100" />
        <label for="delete-year">Év:</label>
        <input id="delete-year" type="number" bind:value={deleteYearVar} min="2020" max="2070" required class="checkpoint-input" placeholder="Pl. 2025" />
        <label for="delete-month">Hónap:</label>
        <input id="delete-month" type="number" bind:value={deleteMonthVar} min="1" max="12" required class="checkpoint-input" placeholder="1-12" />
        <label for="delete-day">Nap:</label>
        <input id="delete-day" type="number" bind:value={deleteDayVar} min="1" max="31" required class="checkpoint-input" placeholder="1-31" />
        <div class="form-btn-col">
          <button type="submit" class="primary-action" disabled={deleteScheduleLoading}>Törlés</button>
        </div>
      </form>
      {#if showDeleteScheduleConfirm}
        <div class="delete-confirm-modal">
          <div class="delete-confirm-message">
            Biztosan törölni szeretnéd ezt a beosztást?
            <br>
            <b>Dolgozó azonosító:</b> {pendingDeleteVars.employeeId},
            <b>Dátum:</b> {pendingDeleteVars.year}-{pendingDeleteVars.month}-{pendingDeleteVars.day}
          </div>
          <div class="delete-confirm-buttons">
            <button class="danger-action" on:click={confirmDeleteSchedule} disabled={deleteScheduleLoading}>Törlés</button>
            <button class="secondary-action" on:click={cancelDeleteSchedule} disabled={deleteScheduleLoading}>Mégsem</button>
          </div>
        </div>
      {/if}
      <div style="margin-top:0.4em;">
        {#if deleteScheduleLoading}
          <span>Törlés...</span>
        {:else if deleteScheduleError}
          <span class="error">{deleteScheduleError}</span>
        {:else if deleteScheduleSuccess}
          <span style="color: #0dc37b;">{deleteScheduleSuccess}</span>
        {/if}
      </div>
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
      <div class="api-description">Dolgozók lekérdezése jogkör szerint:</div>
      <form class="api-action-form" on:submit|preventDefault={() => { fetchEmployeesByRole(); }}>
        <label for="role-select">Jogkör:</label>
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
      <div class="api-description">Új dolgozó hozzáadása:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={addEmployee}>
        <label for="new-fullname">Teljes név:</label>
        <input id="new-fullname" type="text" bind:value={newFullName} required placeholder="Pl. Kiss Ádám" class="checkpoint-input" />
        <label for="new-username">Felhasználónév:</label>
        <input id="new-username" type="text" bind:value={newUsername} required placeholder="Pl. kiss" class="checkpoint-input" />
        <label for="new-password">Jelszó:</label>
        <input id="new-password" type="password" bind:value={newPassword} required placeholder="Jelszó" class="checkpoint-input" />
        <label for="new-userrole">Jogkör:</label>
        <select id="role-select" bind:value={selectedRole} class="checkpoint-input">
          {#each roleOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <button type="submit" class="primary-action" disabled={addEmployeeLoading}>Hozzáadás</button>
      </form>
      {#if addEmployeeLoading}
        <div>Dolgozó hozzáadása folyamatban...</div>
      {:else if addEmployeeError}
        <div class="error">{addEmployeeError}</div>
      {:else if addEmployeeSuccess}
        <div class="success">{addEmployeeSuccess}</div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó teljes nevének módosítása:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={updateEmployeeFullname}>
        <label for="update-fullname-id">Azonosító:</label>
        <input id="update-fullname-id" type="number" bind:value={updateFullnameId} required placeholder="Pl. 100" min="1" class="checkpoint-input" />
        <label for="update-fullname-old">Régi teljes név:</label>
        <input id="update-fullname-old" type="text" bind:value={updateFullnameOld} required placeholder="Pl. Kiss Ádám" class="checkpoint-input" />
        <label for="update-fullname-new">Új teljes név:</label>
        <input id="update-fullname-new" type="text" bind:value={updateFullnameNew} required placeholder="Pl. Nagy Ádám" class="checkpoint-input" />
        <button type="submit" class="primary-action" disabled={updateFullnameLoading}>Módosítás</button>
      </form>
      {#if updateFullnameLoading}
        <div>Teljes név módosítása folyamatban...</div>
      {:else if updateFullnameError}
        <div class="error">{updateFullnameError}</div>
      {:else if updateFullnameSuccess}
        <div class="success">{updateFullnameSuccess}</div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó felhasználónevének módosítása:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={updateEmployeeUsername}>
        <label for="update-username-id">Azonosító:</label>
        <input id="update-username-id" type="number" bind:value={updateUsernameId} required placeholder="Pl. 100" min="1" class="checkpoint-input" />
        <label for="update-username-old">Régi felhasználónév:</label>
        <input id="update-username-old" type="text" bind:value={updateUsernameOld} required placeholder="Pl. nagy" class="checkpoint-input" />
        <label for="update-username-new">Új felhasználónév:</label>
        <input id="update-username-new" type="text" bind:value={updateUsernameNew} required placeholder="Pl. anna" class="checkpoint-input" />
        <button type="submit" class="primary-action" disabled={updateUsernameLoading}>Módosítás</button>
      </form>
      {#if updateUsernameLoading}
        <div>Felhasználónév módosítása folyamatban...</div>
      {:else if updateUsernameError}
        <div class="error">{updateUsernameError}</div>
      {:else if updateUsernameSuccess}
        <div class="success">{updateUsernameSuccess}</div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó jelszavának módosítása:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={updateEmployeePassword}>
        <label for="update-password-id">Azonosító:</label>
        <input id="update-password-id" type="number" bind:value={updatePasswordId} required placeholder="Pl. 100" min="1" class="checkpoint-input" />
        <label for="update-password-username">Felhasználónév:</label>
        <input id="update-password-username" type="text" bind:value={updatePasswordUsername} required placeholder="Pl. nagy" class="checkpoint-input" />
        <label for="update-password-new">Új jelszó:</label>
        <input id="update-password-new" type="password" bind:value={updatePasswordNew} required placeholder="Új jelszó" class="checkpoint-input" />
        <button type="submit" class="primary-action" disabled={updatePasswordLoading}>Módosítás</button>
      </form>
      {#if updatePasswordLoading}
        <div>Jelszó módosítása folyamatban...</div>
      {:else if updatePasswordError}
        <div class="error">{updatePasswordError}</div>
      {:else if updatePasswordSuccess}
        <div class="success">{updatePasswordSuccess}</div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó jogkörének módosítása:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={updateEmployeeRole}>
        <label for="update-role-id">Azonosító:</label>
        <input id="update-role-id" type="number" bind:value={updateRoleId} required placeholder="Pl. 100" min="1" class="checkpoint-input" />
        <label for="update-role-new">Új jogkör:</label>
        <select id="role-select" bind:value={selectedRole} class="checkpoint-input">
          {#each roleOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <button type="submit" class="primary-action" disabled={updateRoleLoading}>Módosítás</button>
      </form>
      {#if updateRoleLoading}
        <div>Jogkör módosítása folyamatban...</div>
      {:else if updateRoleError}
        <div class="error">{updateRoleError}</div>
      {:else if updateRoleSuccess}
        <div class="success">{updateRoleSuccess}</div>
      {/if}
    </div>
    <div class="api-row api-row-column">
      <div class="api-description">Dolgozó törlése:</div>
      <form class="api-action-form form-inline-group" on:submit|preventDefault={() => showDeleteConfirm = true}>
        <label for="delete-employee-id">Azonosító:</label>
        <input id="delete-employee-id" type="number" bind:value={deleteEmployeeId} required placeholder="Pl. 100" min="1" class="checkpoint-input" />
        <button type="submit" class="danger-action" disabled={deleteEmployeeLoading}>Törlés</button>
      </form>
      {#if showDeleteConfirm}
        <div class="delete-confirm-modal">
          <div class="delete-confirm-message">
            <strong>A törlés végleges és nem visszavonható.</strong><br>
            Kérem erősítse meg a törlési szándékát!
          </div>
          <div class="delete-confirm-buttons">
            <button class="danger-action" on:click={deleteEmployee} disabled={deleteEmployeeLoading}>Törlés</button>
            <button class="secondary-action" on:click={() => showDeleteConfirm = false} disabled={deleteEmployeeLoading}>Mégsem</button>
          </div>
        </div>
      {/if}
      {#if deleteEmployeeLoading}
        <div>Dolgozó törlése folyamatban...</div>
      {:else if deleteEmployeeError}
        <div class="error">{deleteEmployeeError}</div>
      {:else if deleteEmployeeSuccess}
        <div class="success">{deleteEmployeeSuccess}</div>
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
:root {
  --modal-bg: #fff;
  --modal-fg: #222;
  --modal-border: #ddd;
}
:global(.delete-confirm-modal) {
  min-width: 350px;
  max-width: 90vw;
  width: 420px;
  margin: 0 auto;
  background: var(--modal-bg, #fff);
  border: 4px solid #a084ee;
  color: var(--modal-fg, #222);
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-radius: 0.7rem;
  box-shadow: 0 2px 24px 0 rgba(76,36,150,0.17);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}
:global(.delete-confirm-message) {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
  color: var(--modal-fg, #222);
  text-align: center;
}
:global(.delete-confirm-buttons) {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
}
.summary-table {
margin-top: 2.1rem;
width: 100%;
min-width: 380px;
max-width: none;
background: var(--color-table-bg, #fff);
color: var(--color-table-row-text, #23203a);
border-radius: 0.7rem;
box-shadow: 0 2px 16px 0 rgba(76,36,150,0.08);
border-collapse: collapse;
font-size: 1.35rem;
}
.summary-table td {
border: 1px solid var(--color-table-border, #ece6fa);
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
.data-table-wrapper {
overflow-x: auto;
margin-top: 1.2rem;
background: var(--color-table-bg, #fff);
border-radius: 0.7rem;
box-shadow: 0 2px 16px 0 rgba(76,36,150,0.08);
padding: 1.2rem 1.2rem 2.2rem 1.2rem;
}
.data-table {
border-collapse: collapse;
width: 100%;
background: var(--color-table-bg, #fff);
color: var(--color-table-row-text, #23203a);
border-radius: 0.7rem;
box-shadow: none;
table-layout: auto;
}
.data-table th, .data-table td {
padding: 0.85rem 1.1rem;
border-bottom: 1px solid var(--color-table-border, #ece6fa);
text-align: left;
font-size: 1.06rem;
}
.data-table th {
background: var(--color-table-header-bg, #f5f3ff);
color: var(--color-table-header-text, #6c3bb8);
font-weight: 700;
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
.checkpoint-input {
  color: var(--color-table-placeholder, #bdbfff);
  background: inherit;
  border: 1px solid var(--color-table-placeholder, #bdbfff);
  border-radius: 0.7rem;
  padding: 0.5rem 1rem;
  font-size: 1.05rem;
  transition: border 0.15s;
  min-width: 90px;
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
:global([data-theme="dark"]) .delete-confirm-modal {
  background: #232136;
  color: #fff;
  border: 4px solid #b692f6;
}
:global([data-theme="dark"]) .delete-confirm-message {
  color: #fff;
}
:global([data-theme="dark"]) .delete-confirm-buttons button.secondary-action {
  background: #39324d;
  color: #fff;
  border: 1px solid #5b5387;
}
:global([data-theme="dark"]) .delete-confirm-buttons button.danger-action {
  background: #ff6b6b;
  color: #fff;
}
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
.form-inline-group input:not(.checkpoint-input) {
  max-width: unset !important;
  min-width: unset !important;
  width: auto;
  box-sizing: border-box;
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
  color: var(--color-table-placeholder, #bdbfff) !important;
}
.summary-table.fill-width {
  width: 100%;
}
.api-action-form.form-inline-group {
  width: 100%;
  min-width: 400px;
}
.primary-action {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.7rem;
  padding: 0.42rem 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: var(--shadow);
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.3rem;
  min-width: 80px;
  max-width: 220px;
  cursor: pointer;
}
.primary-action:disabled {
  background: var(--color-table-placeholder, #bdbfff);
  cursor: not-allowed;
}
@media (max-width: 1100px) {
  .primary-action {
    margin-top: 0.5rem;
    align-self: center;
  }
}
</style>