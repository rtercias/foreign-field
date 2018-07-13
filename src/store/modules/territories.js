import Vue from 'vue';
import Vuex from 'vuex';
import VueAxios, { post } from 'vue-axios';
import axios from 'axios';

Vue.use([
  Vuex,
  VueAxios, 
  axios
]); 

export const territories = {
  namespaced: true,
  state: {
    territories: []
  },
  mutations: {

  },
  actions: {
    async getTerritoriesByCong({ commit }, congId) {
      try {
        const response = await post('52.168.120.105:4000/graphql', {
          body: `{ "query": "{ territories (congId: ${congId}) { name type }}" }`,
        });
        commit(response);
      } catch (e) {
        console.log(e);
      }
    }
  }
};
