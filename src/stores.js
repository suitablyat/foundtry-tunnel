import { persist } from '@tauri-apps/plugin-store';
import { writable } from 'svelte/store';

export const settings = writable({
  SSH_HOST: '',
  SSH_USER: '',
  REMOTE_BIND: '127.0.0.1',
  REMOTE_PORT: '31000',
  LOCAL_HOST: 'localhost',
  LOCAL_PORT: '30000'
});