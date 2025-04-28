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

  // Dolgozók lekérdezése admin vezérlőpult alá
  let employees = [];
  let employeesLoading = false;
  let employeesError = '';
  let showEmployees = false;

  // Egy dolgozó lekérdezése azonosító alapján
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

  // Új: dolgozó lekérése felhasználónév alapján
  let usernameInput = '';
  let userByUsername = null;
  let userByUsernameLoading = false;
  let userByUsernameError = '';

  // Új dolgozó hozzáadása változók
  let newFullName = '';
  let newUsername = '';
  let newPassword = '';
  let newUserRole = 'Employee';
  let addEmployeeLoading = false;
  let addEmployeeError = '';
  let addEmployeeSuccess = '';

  // Teljes név módosítása változók
  let updateFullnameId = '';
  let updateFullnameOld = '';
  let updateFullnameNew = '';
  let updateFullnameLoading = false;
  let updateFullnameError = '';
  let updateFullnameSuccess = '';

  // Felhasználónév módosítása változók
  let updateUsernameId = '';
  let updateUsernameOld = '';
  let updateUsernameNew = '';
  let updateUsernameLoading = false;
  let updateUsernameError = '';
  let updateUsernameSuccess = '';

  // Jelszó módosítása változók
  let updatePasswordId = '';
  let updatePasswordUsername = '';
  let updatePasswordNew = '';
  let updatePasswordLoading = false;
  let updatePasswordError = '';
  let updatePasswordSuccess = '';

  // Jogkör módosítása változók
  let updateRoleId = '';
  let updateRoleNew = 'Employee';
  let updateRoleLoading = false;
  let updateRoleError = '';
  let updateRoleSuccess = '';

  // Dolgozó törlése változók
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
        let errorMsg = 'Hiba a checkpoint törlése során';
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
      deleteCheckpointMessage = 'Checkpoint sikeresen törölve!';
      // Mezők ürítése
      deleteCheckpointEmployeeId = '';
      deleteCheckpointId = '';
    } catch (err) {
      deleteCheckpointError = err.message;
    }
    deletingCheckpoint = false;
  }

  async function fetchEmployeesByRole() {
    employeesByRoleLoading = true;
    employeesByRoleError = '';
    employeesByRole = [];
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees/role/${selectedRole}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        let errorMsg = 'Hiba a dolgozók lekérdezésekor';
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
      employeesByRole = await response.json();
    } catch (err) {
      employeesByRoleError = err.message;
      employeesByRole = [];
    }
    employeesByRoleLoading = false;
  }

  async function addEmployee() {
    addEmployeeLoading = true;
    addEmployeeError = '';
    addEmployeeSuccess = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 0,
          employeeId: 0,
          fullName: newFullName,
          username: newUsername,
          password: newPassword,
          userRole: newUserRole,
          newUsername: '',
          newFullName: ''
        })
      });
      if (!response.ok) {
        let errorMsg = 'Dolgozó hozzáadása sikertelen.';
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
      addEmployeeSuccess = 'Dolgozó sikeresen hozzáadva!';
      // Mezők ürítése
      newFullName = '';
      newUsername = '';
      newPassword = '';
      newUserRole = 'Employee';
    } catch (err) {
      addEmployeeError = err.message;
    }
    addEmployeeLoading = false;
  }

  async function updateEmployeeFullname() {
    updateFullnameLoading = true;
    updateFullnameError = '';
    updateFullnameSuccess = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees/${updateFullnameId}/fullname`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 0,
          employeeId: Number(updateFullnameId),
          fullName: updateFullnameOld,
          username: '',
          newUsername: '',
          newFullName: updateFullnameNew,
          password: '',
          userRole: 'Employee'
        })
      });
      if (!response.ok) {
        let errorMsg = 'Teljes név módosítása sikertelen.';
        try {
          const text = await response.text();
          let data;
          try { data = JSON.parse(text); } catch {}
          if (data && typeof data === 'object' && data.message) {
            errorMsg = data.message;
          } else if (text) {
            errorMsg = text.split(/\.|\n/)[0].trim();
          }
        } catch {}
        throw new Error(errorMsg);
      }
      updateFullnameSuccess = 'Teljes név sikeresen módosítva!';
      updateFullnameId = '';
      updateFullnameOld = '';
      updateFullnameNew = '';
    } catch (err) {
      updateFullnameError = err.message;
    }
    updateFullnameLoading = false;
  }

  async function updateEmployeeUsername() {
    updateUsernameLoading = true;
    updateUsernameError = '';
    updateUsernameSuccess = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees/${updateUsernameId}/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 0,
          employeeId: Number(updateUsernameId),
          fullName: '',
          username: updateUsernameOld,
          newUsername: updateUsernameNew,
          newFullName: '',
          password: '',
          userRole: 'Employee'
        })
      });
      if (!response.ok) {
        let errorMsg = 'Felhasználónév módosítása sikertelen.';
        try {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {}
          if (data && typeof data === 'object' && data.message) {
            errorMsg = data.message;
          } else if (text) {
            // Csak az első mondatot vagy sort jelenítsük meg
            errorMsg = text.split(/\.|\n/)[0].trim();
          }
        } catch {}
        throw new Error(errorMsg);
      }
      updateUsernameSuccess = 'Felhasználónév sikeresen módosítva!';
      updateUsernameId = '';
      updateUsernameOld = '';
      updateUsernameNew = '';
    } catch (err) {
      updateUsernameError = err.message;
    }
    updateUsernameLoading = false;
  }

  async function updateEmployeePassword() {
    updatePasswordLoading = true;
    updatePasswordError = '';
    updatePasswordSuccess = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees/${updatePasswordId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 0,
          employeeId: Number(updatePasswordId),
          fullName: '',
          username: updatePasswordUsername,
          newUsername: '',
          newFullName: '',
          password: updatePasswordNew,
          userRole: 'Employee'
        })
      });
      if (!response.ok) {
        let errorMsg = 'Jelszó módosítása sikertelen.';
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
      updatePasswordSuccess = 'Jelszó sikeresen módosítva!';
      updatePasswordId = '';
      updatePasswordUsername = '';
      updatePasswordNew = '';
    } catch (err) {
      updatePasswordError = err.message;
    }
    updatePasswordLoading = false;
  }

  async function updateEmployeeRole() {
    updateRoleLoading = true;
    updateRoleError = '';
    updateRoleSuccess = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees/${updateRoleId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateRoleNew)
      });
      if (!response.ok) {
        let errorMsg = 'Jogkör módosítása sikertelen.';
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
      updateRoleSuccess = 'Jogkör sikeresen módosítva!';
      updateRoleId = '';
      updateRoleNew = 'Employee';
    } catch (err) {
      updateRoleError = err.message;
    }
    updateRoleLoading = false;
  }

  async function deleteEmployee() {
    deleteEmployeeLoading = true;
    deleteEmployeeError = '';
    deleteEmployeeSuccess = '';
    try {
      const response = await authFetch(`${API_BASE}/Admin/employees/${deleteEmployeeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        let errorMsg = 'Dolgozó törlése sikertelen.';
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
      deleteEmployeeSuccess = 'Dolgozó sikeresen törölve!';
      deleteEmployeeId = '';
      showDeleteConfirm = false;
    } catch (err) {
      deleteEmployeeError = err.message;
    }
    deleteEmployeeLoading = false;
  }

  function handleLogout() {
    auth.logout();
    goto('/');
  }

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

  // Havi riport összes dolgozóra
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

  // Havi riport egy dolgozóra
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
    <!-- Év és hónap szerint az összes Checkpoint lekérése: -->
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
            <table class="summary-table">
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
            <table class="summary-table">
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
          <input type="date" id="schedule-date" name="scheduleDate" class="checkpoint-input" />
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
          <input type="date" id="report-date" name="reportDate" class="checkpoint-input" />
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
        <input id="new-password" type="password" bind:value={newPassword} required placeholder="Jelszó" size="15" style="max-width: 180px;" class="checkpoint-input" />
        <label for="new-userrole">Jogkör:</label>
        <select id="new-userrole" bind:value={newUserRole} required class="checkpoint-input">
          <option value="Employee">Dolgozó</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
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
        <input id="update-fullname-id" type="number" bind:value={updateFullnameId} required placeholder="Pl. 100" min="1" size="6" style="max-width: 110px;" class="checkpoint-input" />
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
        <input id="update-username-id" type="number" bind:value={updateUsernameId} required placeholder="Pl. 100" min="1" size="6" style="max-width: 110px;" class="checkpoint-input" />
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
        <input id="update-password-id" type="number" bind:value={updatePasswordId} required placeholder="Pl. 100" min="1" size="6" style="max-width: 110px;" class="checkpoint-input" />
        <label for="update-password-username">Felhasználónév:</label>
        <input id="update-password-username" type="text" bind:value={updatePasswordUsername} required placeholder="Pl. nagy" class="checkpoint-input" />
        <label for="update-password-new">Új jelszó:</label>
        <input id="update-password-new" type="password" bind:value={updatePasswordNew} required placeholder="Új jelszó" style="max-width: 180px;" class="checkpoint-input" />
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
        <input id="update-role-id" type="number" bind:value={updateRoleId} required placeholder="Pl. 100" min="1" size="6" style="max-width: 110px;" class="checkpoint-input" />
        <label for="update-role-new">Új jogkör:</label>
        <select id="update-role-new" bind:value={updateRoleNew} required class="checkpoint-input">
          <option value="Employee">Dolgozó</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
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
        <input id="delete-employee-id" type="number" bind:value={deleteEmployeeId} required placeholder="Pl. 100" min="1" size="6" style="max-width: 110px;" class="checkpoint-input" />
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
.form-inline-group input,
.form-inline-group .checkpoint-input {
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
</style>