import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { auth } from './modules/auth';
import { territories } from './modules/territories';

Vue.use(Vuex);

export const store = new Store({
  modules: {
    auth,
    territories
  }
});
