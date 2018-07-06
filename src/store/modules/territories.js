import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';

Vue.use(VueAxios); 
Vue.use(axios); 


export const territories = {
  state: {
    territories: []
  },
  mutations: {

  },
  actions: {
    territoriesByCong: async (congId) => {
      return await Vue.axios.post('52.168.120.105:4000/graphql', {
        body: `{ "query": "{ territories (congId: ${congId}) { name type }}" }`,
      });
    }
  }
};
