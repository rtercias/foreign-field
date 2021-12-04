import axios from 'axios';
import { axiosToken } from '..';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import toArray from 'lodash/toArray';
import differenceInDays from 'date-fns/differenceInDays';
import { print } from 'graphql/language/printer';
import { TEST_GROUPS } from './models/GroupModel';
import Vue from 'vue';

export const TEST_TERRITORIES = [
  'TEST-000',
];

const FETCH_TERRITORIES = 'FETCH_TERRITORIES';
const SET_TERRITORIES = 'SET_TERRITORIES';
const RESET_TERRITORIES = 'RESET_TERRITORIES';
const SET_ALL_TERRITORIES = 'SET_ALL_TERRITORIES';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_NEAREST_TERRITORIES = 'SET_NEAREST_TERRITORIES';
const SET_LAST_ACTIVITY = 'SET_LAST_ACTIVITY';
const CHECKIN_ALL = 'CHECKIN_ALL';
const COPY_CHECKOUTS = 'COPY_CHECKOUTS';
const SET_RECENTLY_SEEN_TERRITORIES = 'SET_RECENTLY_SEEN_TERRITORIES';
const GET_ADDRESS_COUNT = 'GET_ADDRESS_COUNT';
const GET_PHONE_COUNT = 'GET_PHONE_COUNT';
const SET_SORT_FILTER = 'SET_SORT_FILTER';
const SET_IS_BUSY = 'SET_IS_BUSY';
const FETCH_STATUSES = 'FETCH_STATUSES';
const SET_STATUS = 'SET_STATUS';

export const territories = {
  namespaced: true,
  state: {
    territories: [],
    loading: false,
    error: '',
    nearestTerritories: [],
    recentlySeenTerritories: [],
    cancelTokens: {},
    selectedSortAndFilters: {},
    allTerritories: [],
  },
  getters: {
    territories: state => orderBy(state.territories, 'description', 'name'),
    allTerritories: state => orderBy(state.allTerritories, 'description', 'name'),
    cancelTokens: state => state.cancelTokens,
    loading: state => state.loading,
    error: state => state.error,
    nearestTerritories: state => state.nearestTerritories,
    recentlySeenTerritories: state => state.recentlySeenTerritories,
    selectedSortAndFilters: state => state.selectedSortAndFilters,
  },
  mutations: {
    FETCH_TERRITORIES(state, cancelToken) {
      state.cancelTokens = { ...state.cancelTokens, FETCH_TERRITORIES: cancelToken };
    },
    FETCH_STATUSES(state, cancelToken) {
      state.cancelTokens = { ...state.cancelTokens, FETCH_STATUSES: cancelToken };
    },
    SET_TERRITORIES: (state, terrs) => state.territories = terrs,
    RESET_TERRITORIES: state => state.territories = [],
    SET_ALL_TERRITORIES: (state, all) => state.allTerritories = all,
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
    SET_RECENTLY_SEEN_TERRITORIES: (state, terrs) => state.recentlySeenTerritories = terrs,
    GET_ADDRESS_COUNT: (state, terrAddressCount) => {
      if (terrAddressCount) {
        for (const terr of state.territories) {
          const count = terrAddressCount.find(t => t.id === terr.id);
          if (count) Vue.set(terr, 'addressCount', get(count, 'addressCount', 0));
        }
      }
    },
    GET_PHONE_COUNT: (state, terrPhoneCount) => {
      if (terrPhoneCount) {
        for (const terr of state.territories) {
          const count = terrPhoneCount.find(t => t.id === terr.id);
          if (count) Vue.set(terr, 'phoneCount', get(count, 'phoneCount', 0));
        }
      }
    },
    SET_IS_BUSY: (state, { id, value }) => {
      const terr = state.territories.find(t => t.id === id);
      if (terr) Vue.set(terr, 'isBusy', value);
    },
    SET_SORT_FILTER: (state, filter) => {
      state.selectedSortAndFilters = { ...state.selectedSortAndFilters, ...filter };
    },
    SET_STATUS: (state, { id, status }) => {
      const terr = state.territories.find(t => t.id === id);
      if (terr) Vue.set(terr, 'status', status);
    },
  },
  actions: {
    async fetchTerritories({ commit }, params) {
      if (!params || !params.congId) {
        return;
      }

      commit(SET_LOADING, true);
      const tokenSource = axios.CancelToken.source();
      const cancelToken = tokenSource.token;
      commit(FETCH_TERRITORIES, tokenSource);

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          headers: {
            'Content-Type': 'application/json',
          },
          cancelToken,
          data: {
            query: print(gql`query TerritoriesByCongAndGroup($congId: Int $groupId: Int) {
              territories (congId: $congId, group_id: $groupId) {
                id
                name
                description
                type
                congregationid
                tags
                group_id
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
          if (!params.groupId) {
            commit(SET_ALL_TERRITORIES, terrs);
          }
          commit(SET_LOADING, false);
        }
      } catch (e) {
        commit(SET_LOADING, false);
        commit(SET_ERROR, e);
      }
    },

    async fetchStatuses({ commit }, params) {
      if (!params || !params.congId) {
        return;
      }

      const { congId, groupId, limit, offset } = params;
      const tokenSource = axios.CancelToken.source();
      const cancelToken = tokenSource.token;
      commit(FETCH_STATUSES, tokenSource);

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          headers: {
            'Content-Type': 'application/json',
          },
          cancelToken,
          data: {
            query: print(gql`query TerritoriesByCongAndGroup($congId: Int $groupId: Int $limit: Int $offset: Int) {
              territories (congId: $congId, group_id: $groupId, limit: $limit, offset: $offset) {
                id
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
              congId,
              groupId,
              limit,
              offset,
            },
          },
        });

        if (response && response.data && response.data.data) {
          const { territories: terrs } = response.data.data;
          for (const terr of terrs) {
            commit(SET_STATUS, terr);
          }
        }
      } catch (e) {
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
          cancelToken: axiosToken.token,
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
          commit(SET_ALL_TERRITORIES, response.data.data.territories);
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
          cancelToken: axiosToken.token,
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
          cancelToken: axiosToken.token,
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

    async getAddressCountByTerritories({ commit }, congId) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          cancelToken: axiosToken.token,
          data: {
            query: print(gql`query AddressCountByTerritories($congId: Int) {
              addressCountByTerritories (congId: $congId) {
                id
                addressCount
              }
            }`),
            variables: {
              congId,
            },
          },
        });

        const { addressCountByTerritories } = response.data.data;
        commit(GET_ADDRESS_COUNT, addressCountByTerritories);
      } catch (e) {
        console.error('Unable to get address count by territories', e);
      }
    },

    async getPhoneCountByTerritories({ commit }, congId) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          cancelToken: axiosToken.token,
          data: {
            query: print(gql`query PhoneCountByTerritories($congId: Int) {
              phoneCountByTerritories (congId: $congId) {
                id
                phoneCount
              }
            }`),
            variables: {
              congId,
            },
          },
        });

        const { phoneCountByTerritories } = response.data.data;
        commit(GET_PHONE_COUNT, phoneCountByTerritories);
      } catch (e) {
        console.error('Unable to get phone count by territories', e);
      }
    },

    async checkinAll({ commit }, { congId, username, tzOffset, timezone, campaign }) {
      try {
        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          cancelToken: axiosToken.token,
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
          cancelToken: axiosToken.token,
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

    setSeenTerritories({ commit }) {
      const seenList = JSON.parse(localStorage.getItem('seenTerritories')) || [];
      commit(SET_RECENTLY_SEEN_TERRITORIES, seenList);
    },

    saveSeenTerritory({ commit, rootGetters }, terr) {
      if (!terr && !terr.name) return;

      const userTerritories = rootGetters['auth/userTerritories'];
      if (userTerritories.find(t => t.id === terr.id)) return;

      // create a basic territory and save it to local storage
      const basicTerritory = {
        name: terr.name,
        description: terr.description,
        group_id: terr.group_id,
        id: terr.id,
        lastVisited: (new Date()).toISOString(),
      };

      let seenList;
      try {
        seenList = JSON.parse(localStorage.getItem('seenTerritories')) || [];
      } catch (e) {
        seenList = [];
      }

      const idx = seenList.findIndex(t => t.id === terr.id);
      if (idx >= 0) {
        seenList.splice(idx, 1, basicTerritory);
      } else {
        seenList.push(basicTerritory);
      }
      // filter out old ones
      seenList = seenList.filter(t => differenceInDays(new Date(), new Date(t.lastVisited)) < 60);
      seenList = orderBy(seenList, 'lastVisited', 'desc');
      seenList.length = seenList.length <= 5 ? seenList.length : 5;
      const parsed = JSON.stringify(seenList);
      localStorage.setItem('seenTerritories', parsed);
      commit(SET_RECENTLY_SEEN_TERRITORIES, seenList);
    },
    removeSeenTerritory({ commit, state }, id) {
      const filtered = state.recentlySeenTerritories.filter(t => t.id !== id);
      localStorage.setItem('seenTerritories', JSON.stringify(filtered));
      commit(SET_RECENTLY_SEEN_TERRITORIES, filtered);
    },
    setSortAndFilter({ commit }, filter) {
      commit(SET_SORT_FILTER, filter);
    },
    setIsBusy({ commit }, { id, value }) {
      commit(SET_IS_BUSY, { id, value });
    },
    setStatus({ commit }, { id, status }) {
      commit(SET_STATUS, { id, status });
    },
  },
};
