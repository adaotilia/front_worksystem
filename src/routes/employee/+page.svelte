<script>
  import { auth } from '../../stores/authStore.js';
  import { onMount } from 'svelte';
  import ProfileCard from '../../components/ProfileCard.svelte';
  import StatCard from '../../components/StatCard.svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../../themeStore.js';
  import ThemeToggle from '../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';

  const dispatch = createEventDispatcher();
  const API_BASE = import.meta.env.VITE_API_URL;
  let token = '';
  let userRole = '';
  export let EmployeeId = '';

  let employeeData = null;
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

  // Jogosultság ellenőrzés csak employee-nak
  $: {
    if (!token || !userRole) {
      goto('/');
    } else if (userRole.toLowerCase() !== 'employee') {
      if (userRole.toLowerCase() === 'admin') {
        goto('/admin');
      } else if (userRole.toLowerCase() === 'manager') {
        goto('/manager');
      } else {
        goto('/');
      }
    }
  }

  // Helyette csak a saját adatokat kérjük le, ha van token és a szerepkör employee
  $: if (token && userRole && userRole.toLowerCase() === 'employee') {
    fetchEmployeeData();
  }

  function handleLogout() {
    auth.logout();
    goto('/');
  }
</script>

<main class="employee-layout">
  <header class="employee-header">
    <ProfileCard
      fullName={employeeData ? employeeData.fullName : ''}
      userRole="Employee"
      username={employeeData ? employeeData.username : ''}
      sessionStatus={employeeData ? employeeData.sessionStatus : ''}
    />
    <div class="employee-header-center">
      <StatCard label="Ledolgozott munkanapok" value="12/20" />
    </div>
    <div class="employee-header-actions">
      <ThemeToggle />
      <button class="main-btn logout-btn" on:click={handleLogout}>Kijelentkezés</button>
    </div>
  </header>
  <nav class="employee-tabs">
    {#each tabs as tab}
      <button class="employee-tab-btn {activeTab === tab.key ? 'active' : ''}" on:click={() => activeTab = tab.key}>{tab.label}</button>
    {/each}
  </nav>
  <section class="employee-content">
    {#if activeTab === 'checkpoint'}
      <div>Checkpoint tartalom (TODO)</div>
    {:else if activeTab === 'monthly'}
      <div>Havi munka tartalom (TODO)</div>
    {:else if activeTab === 'schedule'}
      <div>Beosztás tartalom (TODO)</div>
    {:else if activeTab === 'report'}
      <div>Kimutatás tartalom (TODO)</div>
    {:else if activeTab === 'dashboard'}
      <div>Vezérlőpult tartalom (TODO)</div>
    {/if}
  </section>
</main>

<style>
  .employee-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .employee-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #242038;
    color: #fff;
  }
  .employee-header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .employee-header-actions {
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
    background: #e05555;
  }
  .employee-tabs {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    background: #181526;
    padding: 0.75rem 0;
    border-bottom: 1px solid #332f4b;
  }
  .employee-tab-btn {
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
  .employee-tab-btn.active, .employee-tab-btn:hover {
    background: #332f4b;
    color: #fff;
  }
  .employee-content {
    flex: 1;
    padding: 2rem;
  }
</style>
