import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import createCache from 'vuex-cache';
import axios from 'axios';
import { auth } from './modules/auth';
import { territory } from './modules/territory';
import { territories } from './modules/territories';
import { address } from './modules/address';
import { addresses } from './modules/addresses';
import { publishers } from './modules/publishers';
import '../../node_modules/firebaseui/dist/firebaseui.css';

Vue.use(Vuex);

axios.defaults.baseURL = process.env.VUE_APP_ROOT_API;
axios.defaults.method = 'post';
axios.defaults.headers.post['Content-Type'] = 'application/json';

export const store = new Store({
  plugins: [createCache()],
  modules: {
    auth,
    territory,
    territories,
    address,
    addresses,
    publishers,
  },
});
