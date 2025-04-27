<script>
  import '../styles/global.css';
  import ThemeToggle from '../components/ThemeToggle.svelte';
</script>

<div class="layout-wrapper">
  <div style="position:fixed;top:1rem;right:1rem;z-index:1000;">
    <ThemeToggle class="theme-toggle-btn" />
  </div>
  <main class="layout-content">
    <slot />
  </main>
</div>

<style>
  .layout-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .layout-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100vw;
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
    transition: background 0.3s, color 0.3s;
  }
  @media (max-width: 768px) {
    .layout-content {
      padding: 1rem;
    }
  }
</style>
