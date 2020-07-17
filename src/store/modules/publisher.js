import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';

const SET_PUBLISHER = 'SET_PUBLISHER';

export const publisher = {
  namespaced: true,
  state: {
    publisher: {},
  },
  getters: {
    publisher: state => state.publisher,
  },
  mutations: {
    SET_PUBLISHER: (state, pub) => {
      state.publisher = pub;
    },
  },
  actions: {
    async fetchPublisher({ commit }, { id, congId }) {
      if (!id || !congId) {
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query Publisher($id: Int, $congId: Int) { 
            publisher (publisherId: $id, congId: $congId) { 
              id 
              firstname 
              lastname 
              congregationid 
              username 
              status
            }
          }`),
          variables: {
            id,
            congId,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const pub = response.data.data.publisher || [];
        commit(SET_PUBLISHER, pub);
      }
    },
  },
};
