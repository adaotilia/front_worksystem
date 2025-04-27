<!-- Áthelyezett Manager oldal SvelteKit-hez -->
<script>
  // Eredeti Manager.svelte tartalom ide kerül
  import { auth } from '../../../stores/authStore.js';
  import { theme } from '../../../themeStore.js';
  import { onMount } from 'svelte';
  import ProfileCard from '../../../components/ProfileCard.svelte';
  import StatCard from '../../../components/StatCard.svelte';
  import { createEventDispatcher } from 'svelte';
  import ThemeToggle from '../../../components/ThemeToggle.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  const dispatch = createEventDispatcher();
  let token = '';
  let userRole = '';
  
  let managerData = null;
  let error = '';

  // Auth store szinkronizáció
  const unsubscribe = auth.subscribe((state) => {
    token = state.token;
    userRole = state.userRole;
  });

  // Jogosultság ellenőrzés és adatlekérés csak böngészőben, onMount-ban!
  onMount(() => {
    if (!token || !userRole || userRole.toLowerCase() !== 'manager') {
      if (!token || !userRole) {
        goto('/');
      } else if (userRole.toLowerCase() === 'admin') {
        goto('/dashboard/admin');
      } else if (userRole.toLowerCase() === 'employee') {
        goto('/dashboard/employee');
      } else {
        goto('/');
      }
    } else {
      // Itt lehet majd manager-specific fetch, ha szükséges
    }
  });

  function handleLogout() {
    auth.logout();
    goto('/');
  }
</script>

<section>
  <h2>Manager dashboard tartalom (TODO)</h2>
</section>

<style>
</style>
