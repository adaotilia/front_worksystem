<script>
  export let label = '';
  export let value = '';
  // value: "12/20" formátum
  $: [done, total] = value.split('/').map(Number);
  $: percent = total && done ? Math.min(100, Math.round((done / total) * 100)) : 0;

  // Nagyobb kör progress bar paraméterek
  const radius = 74;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  $: strokeDashoffset = circumference - percent / 100 * circumference;
</script>

<div class="stat-row">
  <span class="stat-label">{label}</span>
  <div class="stat-circle-wrap">
    <svg height="170" width="170" class="stat-svg">
      <circle
        class="stat-bg"
        stroke="#4f3799"
        stroke-width={stroke}
        fill="none"
        cx="85"
        cy="85"
        r={normalizedRadius}
      />
      <circle
        class="stat-progress"
        stroke="#b794f4"
        stroke-width={stroke}
        fill="none"
        cx="85"
        cy="85"
        r={normalizedRadius}
        stroke-dasharray={circumference}
        stroke-dashoffset={strokeDashoffset}
        stroke-linecap="round"
      />
    </svg>
    <div class="stat-value">{done}/{total}</div>
  </div>
</div>

<style>
  .stat-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.7rem;
    background: none;
    box-shadow: none;
    padding: 0.1rem 0.2rem 0.1rem 0.2rem;
  }
  .stat-label {
    color: #fff;
    font-size: 1.18rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    min-width: 120px;
    text-align: left;
  }
  .stat-circle-wrap {
    position: relative;
    width: 170px;
    height: 170px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .stat-svg {
    display: block;
    position: relative;
    z-index: 1;
  }
  .stat-bg {
    opacity: 0.2;
    transition: stroke 0.3s;
  }
  .stat-progress {
    transition: stroke-dashoffset 0.5s;
  }
  .stat-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -53%);
    font-size: 2.5rem;
    font-weight: bold;
    color: #7c3aed;
    z-index: 2;
    letter-spacing: 0.01em;
    pointer-events: none;
    text-shadow: 0 2px 8px rgba(60,40,100,0.12);
    background: none;
  }
</style>
