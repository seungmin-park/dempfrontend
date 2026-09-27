import type { Store } from 'vuex';
import type { Emitter } from 'mitt';
import type { RootState } from '@/store/types';
import type { AppEvents } from './events';

declare module 'vue' {
  interface ComponentCustomProperties {
    $store: Store<RootState>;
    emitter: Emitter<AppEvents>;
  }
}
