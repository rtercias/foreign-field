import axios from 'axios';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import { print } from 'graphql/language/printer';

const SET_PUBLISHERS = 'SET_PUBLISHERS';

export const publishers = {
  namespaced: true,
  state: {
    publishers: [],
  },
  getters: {
    publishers: state => orderBy(state.publishers, 'lastname', 'firstname'),
  },
  mutations: {
    SET_PUBLISHERS: (state, pubs) => {
      state.publishers = pubs;
    },
  },
  actions: {
    async fetchPublishers({ commit }, congId) {
      if (!congId) {
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query PublishersList($congId: Int) { 
            publishers (congId: $congId) { 
              id 
              firstname 
              lastname 
              congregationid 
              username 
              status
            }
          }`),
          variables: {
            congId,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const pubs = response.data.data.publishers || [];
        commit(SET_PUBLISHERS, pubs.filter(p => p.status === 'active'
          // TODO: remove congId filter when api has been pushed
          && p.congregationid === congId));
      }
    },
  },
};
