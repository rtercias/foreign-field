import axios from 'axios';

export const TEST_TERRITORIES = [
  'TEST-000',
];

const SET_TERRITORIES = 'SET_TERRITORIES';
const RESET_TERRITORIES = 'RESET_TERRITORIES';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';

export const territories = {
  namespaced: true,
  state: {
    territories: [],
    loading: false,
    error: '',
  },
  getters: {
    territories: state => state.territories,
    loading: state => state.loading,
    error: state => state.error,
  },
  mutations: {
    SET_TERRITORIES: (state, terrs) => state.territories = terrs,
    RESET_TERRITORIES: state => state.territories = [],
    SET_LOADING: (state, value) => state.loading = value,
    SET_ERROR: (state, value) => state.error = value,
  },
  actions: {
    async fetchTerritories({ commit }, params) {
      if (!params || !params.congId) {
        return;
      }

      commit(SET_LOADING, true);

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          headers: {
            'Content-Type': 'application/json',
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
              groupCode: params.groupCode,
            },
          },
        });

        if (response && response.data && response.data.data) {
          commit(SET_TERRITORIES, response.data.data.territories);
          commit(SET_LOADING, false);
        }
      } catch (e) {
        commit(SET_LOADING, false);
        commit(SET_ERROR, e);
      }
    },

    resetTerritories({ commit }) {
      commit(RESET_TERRITORIES);
    },
  },
};
