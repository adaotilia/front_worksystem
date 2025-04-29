<script>
  import { theme } from '../../themeStore.js';
  import ProfileCard from '../../components/ProfileCard.svelte';
  import { goto } from '$app/navigation';
  import { auth } from '../../stores/authStore.js';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { API_BASE } from '../../config.js';

  let userData = null;
  let userStatus = '';
  let token = '';
  let EmployeeId = '';
  let stat = {};
  let error = '';
  let logoutFn = () => { auth.logout(); goto('/'); };

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  async function fetchUserData(token, EmployeeId) {
    if (!token) return;
    const userRes = await fetch(`${API_BASE}/Employee/employees/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (userRes.ok) {
      userData = await userRes.json();
      EmployeeId = userData.EmployeeId || userData.employeeId || '';
    }
    const statusRes = await fetch(`${API_BASE}/Employee/checkpoints/status/${year}/${month}/${day}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (statusRes.ok) {
      userStatus = await statusRes.text();
    }
  }

  onMount(() => {
    const token = localStorage.getItem('token');
    fetchUserData(token);
  });
</script>

<main class="dashboard-layout">
  <header class="dashboard-header">
    {#if userData}
      <ProfileCard
        fullName={userData.fullName}
        userRole={userData.userRole}
        username={userData.username}
        employeeId={userData.EmployeeId || userData.employeeId || ''}
        sessionStatus={userStatus === 'Active' ? 'Aktív' : 'Inaktív'}
      />
    {/if}
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <div class="dashboard-header-center">
      <!-- StatCard removed -->
    </div>
    <div class="dashboard-header-actions">
      <button class="main-btn logout-btn" on:click={logoutFn}>Kijelentkezés</button>
    </div>
  </header>

  <section class="dashboard-content">
    <slot />
  </section>
</main>

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
:global(.dashboard-content) {
  flex: 1;
  padding: 2rem;
}
:global(.error) {
  color: var(--color-error, #ff6b6b);
  margin-left: 2rem;
  font-weight: bold;
}
</style>