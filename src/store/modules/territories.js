import axios from 'axios';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import toArray from 'lodash/toArray';
import { print } from 'graphql/language/printer';
import { TEST_GROUPS } from './models/GroupModel';

export const TEST_TERRITORIES = [
  'TEST-000',
];

const SET_TERRITORIES = 'SET_TERRITORIES';
const RESET_TERRITORIES = 'RESET_TERRITORIES';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_NEAREST_TERRITORIES = 'SET_NEAREST_TERRITORIES';
const SET_LAST_ACTIVITY = 'SET_LAST_ACTIVITY';
const CHECKIN_ALL = 'CHECKIN_ALL';
const COPY_CHECKOUTS = 'COPY_CHECKOUTS';

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
    CHECKIN_ALL: () => {},
    COPY_CHECKOUTS: () => {},
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
            query: print(gql`query TerritoriesByCongAndGroup($congId: Int $groupId: Int) { 
              territories (congId: $congId, group_id: $groupId) { 
                id
                name
                description
                type
                congregationid
                status {
                  checkout_id
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
              groupId: params.groupId,
            },
          },
        });

        if (response && response.data && response.data.data) {
          const { territories: terrs } = response.data.data;
          const filtered = terrs.filter(t => t.type !== 'Test');
          commit(SET_TERRITORIES, TEST_GROUPS.includes(params.groupId) ? terrs : filtered);
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
            query: print(gql`query TerritoriesByCong($congId: Int, $keyword: String) {
              territories (congId: $congId, keyword: $keyword) {
                id
                name
                description
                type
                group_id
                group {
                  code
                }
                congregationid
              }
            }`),
            variables: {
              congId: params.congId,
              keyword: params.keyword,
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

    async checkinAll({ commit }, { congId, username, tzOffset, timezone, campaign }) {
      try {
        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(
              gql`
                mutation CheckinAll(
                  $congId: Int! $username: String! $tz_offset: String! $timezone: String! $campaign: Boolean
                ) { 
                  checkinAll (
                    congId: $congId, username: $username, tz_offset: $tz_offset, timezone: $timezone, campaign: $campaign
                  )
              }`
            ),
            variables: {
              congId,
              username,
              tz_offset: tzOffset,
              timezone,
              campaign,
            },
          },
        });

        commit(CHECKIN_ALL);
      } catch (exception) {
        console.error('Unable to checkin all territories', exception);
      }
    },

    async copyCheckouts({ commit }, { congId, username, campaign }) {
      try {
        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`mutation CopyCheckouts($congId: Int! $username: String! $campaign: Boolean) { 
              copyCheckouts (congId: $congId, username: $username, campaign: $campaign)
            }`),
            variables: {
              congId,
              username,
              campaign,
            },
          },
        });

        commit(COPY_CHECKOUTS);
      } catch (exception) {
        console.error('Unable to copy checkouts', exception);
      }
    },
  },
};
