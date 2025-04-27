<script>
  export let fullName = '';
  export let userRole = '';
  export let username = '';
  export let sessionStatus = '';

  // Monogram generálása
  $: monogram =
    fullName.trim()
      .split(' ')
      .map(n => n[0]?.toUpperCase() || '')
      .join('')
      .slice(0,2);
</script>

<div class="profile-card">
  <div class="profile-avatar">{monogram}</div>
  <div class="profile-info">
    <div class="profile-name">{fullName}</div>
    <span class="profile-username">{username}</span>
    <div class="profile-role">{userRole}</div>
    {#if sessionStatus}
      <div class="profile-status {sessionStatus === 'online' ? 'online' : 'offline'}">
        <span class="status-dot"></span>
        {sessionStatus === 'online' ? 'Aktív' : 'Inaktív'}
      </div>
    {/if}
  </div>
</div>

<style>
  .profile-card {
    display: flex;
    align-items: center;
    background: var(--color-profile-bg, linear-gradient(135deg, #5b2be7 0%, #5636b8 100%));
    border-radius: var(--radius);
    padding: 1.2rem 2rem;
    box-shadow: 0 2px 12px rgba(44, 34, 94, 0.12);
    color: var(--color-profile-text, #fff);
    min-width: 20rem; /* 320px */
    max-width: 26.25rem; /* 420px */
    gap: 1.3rem;
    position: relative;
  }
  .profile-avatar {
    width: 3.75rem; /* 60px */
    height: 3.75rem;
    border-radius: 50%;
    background: var(--color-profile-avatar-bg, #a084e8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
    font-weight: bold;
    letter-spacing: 0.03em;
    margin-right: 0.5rem;
    box-shadow: 0 2px 8px rgba(44, 34, 94, 0.10);
  }
  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    position: relative;
    min-width: 0;
  }
  .profile-name {
    font-size: 1.35rem;
    font-weight: bold;
    margin-bottom: 0.1rem;
    letter-spacing: 0.01em;
  }
  .profile-username {
    font-size: 1rem;
    color: var(--color-profile-username, #e0e0ff);
    font-weight: 400;
    opacity: 0.85;
    margin-left: 0.2rem;
  }
  .profile-role {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-profile-role, #e0e0ff);
    opacity: 0.95;
    margin-top: 0.1rem;
  }
  .profile-status {
    display: inline-block;
    padding: 0.3em 0.8em;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
  }
  .status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #ccc;
  }
  .profile-status.online {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.2);
    border: 1px solid #4ade80;
  }
  .profile-status.online .status-dot {
    background: #4ade80;
  }
  .profile-status.offline {
    color: #f87171;
    background: rgba(248, 113, 113, 0.2);
    border: 1px solid #f87171;
  }
  .profile-status.offline .status-dot {
    background: #f87171;
  }
</style>
