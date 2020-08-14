import axios from 'axios';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import toArray from 'lodash/toArray';
import { print } from 'graphql/language/printer';

export const TEST_TERRITORIES = [
  'TEST-000',
];

const SET_TERRITORIES = 'SET_TERRITORIES';
const RESET_TERRITORIES = 'RESET_TERRITORIES';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_NEAREST_TERRITORIES = 'SET_NEAREST_TERRITORIES';
const SET_LAST_ACTIVITY = 'SET_LAST_ACTIVITY';

export const territories = {
  namespaced: true,
  state: {
    territories: [],
    loading: false,
    error: '',
    nearestTerritories: [],
  },
  getters: {
    territories: state => orderBy(state.territories, 'description', 'name'),
    loading: state => state.loading,
    error: state => state.error,
    nearestTerritories: state => state.nearestTerritories,
  },
  mutations: {
    SET_TERRITORIES: (state, terrs) => state.territories = terrs,
    RESET_TERRITORIES: state => state.territories = [],
    SET_LOADING: (state, value) => state.loading = value,
    SET_ERROR: (state, value) => state.error = value,
    SET_NEAREST_TERRITORIES: (state, nearest) => {
      const nearestTerritories = groupBy(nearest, 'territory_id');
      state.nearestTerritories = toArray(nearestTerritories).map(group => ({
        ...group[0],
        name: group[0].territory.name,
        description: group[0].territory.description,
        coordinates: [group[0].latitude, group[0].longitude],
        count: get(group[0], 'territory.addresses.length'),
      }));
    },
    SET_LAST_ACTIVITY: (state, { id, lastActivity }) => {
      const territory = state.territories.find(t => t.id === id);
      if (territory) {
        territory.lastActivity = lastActivity;
      }
    },
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
            query: print(gql`query TerritoriesByCongAndGroup($congId: Int $groupCode: String) { 
              territories (congId: $congId, group_code: $groupCode) { 
                id
                name
                description
                type
                congregationid
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
            }`),
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

    async fetchAllTerritories({ commit }, params) {
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
            query: print(gql`query TerritoriesByCong($congId: Int) {
              territories (congId: $congId) {
                id
                name
                description
                type
                congregationid
              }
            }`),
            variables: {
              congId: params.congId,
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

    async getNearestTerritories({ commit }, { congId, coordinates, radius, unit }) {
      if (!congId) {
        commit(SET_ERROR, 'congregation id required');
        return;
      }
      if (!coordinates) {
        commit(SET_ERROR, 'coordinates required');
        return;
      }

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query NearestAddresses($congId: Int $coordinates: [Float] $radius: Int, $unit: String) { 
              nearestAddresses (congId: $congId, coordinates: $coordinates, radius: $radius, unit: $unit) { 
                territory_id
                congregationId
                latitude
                longitude
                territory {
                  name
                  description
                  addresses {
                    latitude
                    longitude
                  }
                }
                distance
              }
            }`),
            variables: {
              congId,
              coordinates,
              radius,
              unit,
            },
          },
        });

        if (response && response.data && response.data.data) {
          commit(SET_NEAREST_TERRITORIES, response.data.data.nearestAddresses);
        }
      } catch (e) {
        commit(SET_ERROR, e);
      }
    },

    async fetchLastActivity({ commit }, id) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Territory($terrId: Int) { 
              territory (id: $terrId) {
                id
                lastActivity {
                  address_id
                  timestamp
                }
              }
            }`),
            variables: {
              terrId: id,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.territory) {
          return;
        }
        const { territory: terr } = response.data.data;
        commit(SET_LAST_ACTIVITY, terr);
      } catch (exception) {
        console.error('Unable to get last activity', exception);
      }
    },
  },
};
