import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import createCache from 'vuex-cache';
import axios from 'axios';
import { auth } from './modules/auth';
import { territory } from './modules/territory';
import { territories } from './modules/territories';
import { address } from './modules/address';
import { addresses } from './modules/addresses';
import { publisher } from './modules/publisher';
import { publishers } from './modules/publishers';
// import { phones } from './modules/phones';
import { phone } from './modules/phone';
import { reports } from './modules/reports';
import '../../node_modules/firebaseui/dist/firebaseui.css';

Vue.use(Vuex);

axios.defaults.baseURL = process.env.VUE_APP_ROOT_API;
axios.defaults.method = 'post';
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const store = new Store({
  plugins: [createCache()],
  modules: {
    auth,
    territory,
    territories,
    address,
    addresses,
    publisher,
    publishers,
    phone,
    // phones,
    reports,
  },
});
