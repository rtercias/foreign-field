import axios from 'axios';

const SET_TERRITORIES = 'SET_TERRITORIES';

export const territories = {
  namespaced: true,
  state: {
    territories: []
  },
  getters: {
    territories: (state) => {
      return state.territories;
    },
  },
  mutations: {
    SET_TERRITORIES: (state, territories) => {
      state.territories = territories;
    },
  },
  actions: {
    async fetchTerritories({ commit }, params) {
      if (!params || !params.congId) {
        console.log('Congregation id is required');
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `query TerritoriesByCongAndGroup($congId: Int $groupCode: String) { 
            territories (congId: $congId, group_code: $groupCode) { 
              id 
              name 
              type 
              city 
              status {
                status
                date
                publisher {
                  id
                  username
                  firstname
                  lastname
                }
              }
            }
          }`,
          variables: {
            congId: params.congId,
            groupCode: params.groupCode
          }
        }
      });

      if (response && response.data && response.data.data) {
        commit(SET_TERRITORIES, response.data.data.territories);
      }
    }
  },
};
