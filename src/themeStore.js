import { writable } from 'svelte/store';

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    let initialTheme = 'light';
    if (saved === 'light' || saved === 'dark') initialTheme = saved;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) initialTheme = 'dark';
    document.documentElement.setAttribute('data-theme', initialTheme);
    return initialTheme;
  }
  return 'light'; 
}

export const theme = writable(getInitialTheme());

if (typeof window !== 'undefined') {
  theme.subscribe(value => {
    document.documentElement.setAttribute('data-theme', value);
    localStorage.setItem('theme', value);
  });
}
