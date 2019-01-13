import axios from 'axios';

const SET_PUBLISHERS = 'SET_PUBLISHERS';

export const publishers = {
  namespaced: true,
  state: {
    publishers: []
  },
  getters: {
    publishers: (state) => {
      return state.publishers;
    },
  },
  mutations: {
    SET_PUBLISHERS: (state, publishers) => {
      state.publishers = publishers;
    },
  },
  actions: {
    async fetchPublishers({ commit }, congId) {
      if (!congId) {
        console.log('Congregation id is required');
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `query PublishersList($congId: Int) { 
            publishers (congId: $congId) { 
              id 
              firstname 
              lastname 
              congregationid 
              username 
              status
            }
          }`,
          variables: {
            congId: congId
          }
        }
      });

      if (response && response.data && response.data.data) {
        const publishers = response.data.data.publishers || [];
        commit(SET_PUBLISHERS, publishers.filter(p => p.status === 'active'
          // TODO: remove congId filter when api has been pushed
          && p.congregationid === congId
        )); 
      }
    }
  },
};
