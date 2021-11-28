import Vue from 'vue';
import Vuex, { Store } from 'vuex';
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
import { congregation } from './modules/congregation';
import { group } from './modules/group';

Vue.use(Vuex);

export const axiosToken = axios.CancelToken.source();
axios.defaults.baseURL = process.env.VUE_APP_ROOT_API;
axios.defaults.method = 'post';
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const defaultOptions = {
  territory: {
    defaultView: 'address-list',
  },
  territories: {
    defaultSort: 'Description',
  },
};

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

export const TerritoryType = {
  Regular: { text: 'Regular', value: 'Regular' },
  Survey: { text: 'Survey', value: 'SEARCH' },
  Business: { text: 'Business', value: 'BUSINESS' },
  Test: { text: 'Test', value: 'Test' },
};

export const store = new Store({
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
    congregation,
    group,
  },
});
