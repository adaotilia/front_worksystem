<script>
  import './styles/global.css';
  import ThemeToggle from './components/ThemeToggle.svelte';
</script>

<div class="app-wrapper">
  <div class="theme-toggle-bar">
    <ThemeToggle />
  </div>
  <main class="content-area">
    <slot />
  </main>
</div>

<style>
  .app-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .theme-toggle-bar {
    position: fixed;
    top: 1.3rem;
    right: 1.7rem;
    z-index: 1000;
    background: none;
    box-shadow: none;
  }
  .content-area {
    flex: 1;
    padding: 2rem;
    background-color: var(--surface-2);
  }
  @media (max-width: 768px) {
    .content-area {
      padding: 1rem;
    }
    .theme-toggle-bar {
      top: 0.7rem;
      right: 0.8rem;
    }
  }
</style>