<script>
  import { theme } from '../themeStore.js';
  import { get } from 'svelte/store';

  function toggleTheme() {
    theme.set(get(theme) === 'light' ? 'dark' : 'light');
  }
</script>

<button class="theme-toggle" on:click={toggleTheme} aria-label="Téma váltása">
  {#if $theme === 'dark'}
    <span class="icon moon">🌙</span>
  {:else}
    <span class="icon sun">☀️</span>
  {/if}
</button>

<style>
  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 2.1rem;
    margin-left: 0.5rem;
    line-height: 1;
    color: var(--color-accent);
    transition: color 0.2s, background 0.2s;
    padding: 0.2em 0.4em;
    border-radius: 50%;
    outline: none;
    box-shadow: 0 2px 8px 0 rgba(76, 36, 150, 0.09);
  }
  .theme-toggle:focus {
    outline: 2px solid var(--color-accent);
  }
  .theme-toggle:hover {
    background: var(--color-secondary);
    color: var(--color-primary);
  }
  .icon {
    vertical-align: middle;
    font-size: 2.1rem;
    pointer-events: none;
  }
  .moon {
    color: #f2d673;
    text-shadow: 0 0 4px #000;
  }
  .sun {
    color: #ffd700;
    text-shadow: 0 0 4px #fff;
  }
</style>
