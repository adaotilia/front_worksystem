<!-- Áthelyezett Manager oldal SvelteKit-hez -->
<script>
  // Eredeti Manager.svelte tartalom ide kerül
  import { auth } from '../../stores/authStore.js';
  import { theme } from '../../themeStore.js';
  import { onMount } from 'svelte';
  import ProfileCard from '../../components/ProfileCard.svelte';
  import StatCard from '../../components/StatCard.svelte';
  import { createEventDispatcher } from 'svelte';
  import ThemeToggle from '../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';

  const dispatch = createEventDispatcher();
  const API_BASE = import.meta.env.VITE_API_URL;
  let token = '';
  let userRole = '';
  export let EmployeeId = '';

  let managerData = null;
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

  async function fetchManagerData() {
    if (!token || !EmployeeId) return;
    try {
      // A manager saját adatait a /Manager/employees/me végponton kérjük le
      const url = `${API_BASE}/Manager/employees/me`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const text = await response.text();
      if (!response.ok) throw new Error('Hiba a manager adatok lekérésekor');
      managerData = JSON.parse(text);
      // Beállítjuk a sessionStatus-t 'online'-ra, ha sikerült az adatokat lekérni
      managerData.sessionStatus = 'online';
    } catch (err) {
      console.error('Hiba a manager adatok lekérésekor:', err);
      error = err.message;
    }
  }

  $: if (token && userRole && userRole.toLowerCase() === 'manager') {
    fetchManagerData();
  }

  // Jogosultság ellenőrzés csak managernek
  $: {
    if (!token || !userRole) {
      goto('/');
    } else if (userRole.toLowerCase() !== 'manager') {
      if (userRole.toLowerCase() === 'admin') {
        goto('/admin');
      } else if (userRole.toLowerCase() === 'employee') {
        goto('/employee');
      } else {
        goto('/');
      }
    }
  }

  function handleLogout() {
    auth.logout();
    goto('/');
  }
</script>

<main class="manager-layout">
  <header class="manager-header">
    <ProfileCard
      fullName={managerData ? managerData.fullName : ''}
      userRole="Manager"
      username={managerData ? managerData.username : ''}
      sessionStatus={managerData ? managerData.sessionStatus : ''}
    />
    <div class="manager-header-center">
      <StatCard label="Ledolgozott munkanapok" value="12/20" />
    </div>
    <div class="manager-header-actions">
      <ThemeToggle />
      <button class="main-btn logout-btn" on:click={handleLogout}>Kijelentkezés</button>
    </div>
  </header>
  <nav class="manager-tabs">
    {#each tabs as tab}
      <button
        class="manager-tab-btn {activeTab === tab.key ? 'active' : ''}"
        on:click={() => activeTab = tab.key}
      >{tab.label}</button>
    {/each}
  </nav>
  <section class="manager-content">
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
  .manager-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #242038;
    color: #fff;
  }
  .manager-header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .manager-header-actions {
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
  .manager-tabs {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    background: #181526;
    padding: 0.75rem 0;
    border-bottom: 1px solid #332f4b;
  }
  .manager-tab-btn {
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
  .manager-tab-btn.active, .manager-tab-btn:hover {
    background: #332f4b;
    color: #fff;
  }
  .manager-content {
    flex: 1;
    padding: 2rem;
  }
</style>
