import Vue from 'vue';
import Vuex from 'vuex';
import VueAxios from 'vue-axios';

Vue.use([
  Vuex,
  VueAxios, 
  axios
]); 

export const addresses = {
  namespaced: true,
  state: {
    addresses: []
  },
};
