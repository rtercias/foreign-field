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
import { phone } from './modules/phone';
import { reports } from './modules/reports';
import '../../node_modules/firebaseui/dist/firebaseui.css';
import { router } from '../routes';

Vue.use(Vuex);

axios.defaults.baseURL = process.env.VUE_APP_ROOT_API;
axios.defaults.method = 'post';
axios.defaults.headers.common['Content-Type'] = 'application/json';
// axios.interceptors.response.use(
//   response => response,
//   (error) => {
//     if (error.response.status === 403) {
//       return router.push('/unauthorized');
//     }
//     return Promise.reject(error);
//   }
// );

export const AddressType = {
  Regular: 'Regular',
  Phone: 'Phone',
};

export const AddressStatus = {
  Active: 'Active',
  NF: 'NF',
  DNC: 'DNC',
  Inactive: 'Inactive',
};

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
    reports,
  },
});
