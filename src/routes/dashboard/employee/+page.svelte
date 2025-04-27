<script>
  import { auth } from '../../../stores/authStore.js';
  import { onMount } from 'svelte';
  import ProfileCard from '../../../components/ProfileCard.svelte';
  import StatCard from '../../../components/StatCard.svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../../../themeStore.js';
  import ThemeToggle from '../../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  const dispatch = createEventDispatcher();
  const API_BASE = import.meta.env.VITE_API_URL;
  let token = '';
  let userRole = '';
  export let EmployeeId = '';

  let employeeData = null;
  let error = '';

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

  // Jogosultság ellenőrzés és adatlekérés csak böngészőben, onMount-ban!
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
</script>

<section>
  <h2>Employee dashboard tartalom (TODO)</h2>
</section>

<style>
</style>
