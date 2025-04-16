import { writable } from 'svelte/store';

function getInitialFromStorage() {
  if (typeof window !== 'undefined') {
    return {
      token: localStorage.getItem('token') || '',
      userRole: localStorage.getItem('userRole') || '',
      EmployeeId: localStorage.getItem('EmployeeId') || ''
    };
  }
  return { token: '', userRole: '', EmployeeId: '' };
}

function createAuthStore() {
  const { subscribe, set, update } = writable(getInitialFromStorage());

  return {
    subscribe,
    login: ({ token, userRole, EmployeeId }) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('EmployeeId', EmployeeId);
      }
      set({ token, userRole, EmployeeId });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('EmployeeId');
      }
      set({ token: '', userRole: '', EmployeeId: '' });
    },
    setToken: (token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      update(state => ({ ...state, token }));
    },
    setUserRole: (userRole) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', userRole);
      }
      update(state => ({ ...state, userRole }));
    },
    setEmployeeId: (EmployeeId) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('EmployeeId', EmployeeId);
      }
      update(state => ({ ...state, EmployeeId }));
    }
  };
}

export const auth = createAuthStore();
