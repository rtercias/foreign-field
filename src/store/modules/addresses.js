import axios from 'axios';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import { print } from 'graphql/language/printer';

const ADDRESS_COUNT_LIMIT = 26;

const DNC_SUCCESS = 'DNC_SUCCESS';
const DNC_FAIL = 'DNC_FAIL';
const OPTIMIZE_SUCCESS = 'OPTIMIZE_SUCCESS';
const OPTIMIZE_FAIL = 'OPTIMIZE_FAIL';
const CLEAR_ERROR = 'CLEAR_ERROR';
const SORT_UPDATED = 'SORT_UPDATED';
const ADDRESS_LOOKUP_SUCCESS = 'ADDRESS_LOOKUP_SUCCESS';
const ADDRESS_LOOKUP_FAIL = 'ADDRESS_LOOKUP_FAIL';
const GET_CHANGE_LOG = 'GET_CHANGE_LOG';
const CHANGE_LOGS_SUCCESS = 'CHANGE_LOGS_SUCCESS';
const CHANGE_LOGS_FAIL = 'CHANGE_LOGS_FAIL';
const RESET_CHANGE_LOG_PAYLOAD = 'RESET_CHANGE_LOG_PAYLOAD';
const SET_STARTING_ADDRESS = 'SET_STARTING_ADDRESS';
const SET_ENDING_ADDRESS = 'SET_ENDING_ADDRESS';


export const addresses = {
  namespaced: true,
  state: {
    addresses: [],
    dnc: [],
    optimized: [],
    search: [],
    logs: [],
    logsPayload: {},
    cancelTokens: {},
    error: null,
    startingAddress: null,
    endingAddress: null,
  },
  getters: {
    dnc: state => state.dnc,
    optimized: state => state.optimized,
    search: state => state.search,
    logs: state => orderBy(state.logs, 'date', 'desc'),
    cancelTokens: state => state.cancelTokens,
    startingAddress: state => state.startingAddress,
    endingAddress: state => state.endingAddress,
    error: state => state.error,
  },
  mutations: {
    DNC_SUCCESS(state, dnc) {
      state.dnc = dnc;
    },
    DNC_FAIL(state, exception) {
      console.error(DNC_FAIL, exception);
    },
    OPTIMIZE_SUCCESS(state, optimized) {
      state.optimized = optimized;
    },
    OPTIMIZE_FAIL(state, exception) {
      state.error = exception;
      console.error(OPTIMIZE_FAIL, exception);
    },
    CLEAR_ERROR(state) {
      state.error = null;
    },
    SORT_UPDATED() {},
    ADDRESS_LOOKUP_SUCCESS(state, search) {
      state.search = search;
    },
    ADDRESS_LOOKUP_FAIL(state, exception) {
      console.error(ADDRESS_LOOKUP_FAIL, exception);
    },
    GET_CHANGE_LOG(state, cancelToken) {
      state.cancelTokens = { ...state.cancelTokens, GET_CHANGE_LOG: cancelToken };
    },
    CHANGE_LOGS_SUCCESS(state, { logs, payload }) {
      state.logs = logs;
      state.logsPayload = payload;
    },
    CHANGE_LOGS_FAIL(state, exception) {
      state.error = exception;
    },
    RESET_CHANGE_LOG_PAYLOAD(state) {
      state.logsPayload = {};
    },
    SET_STARTING_ADDRESS(state, address) {
      state.startingAddress = address;
    },
    SET_ENDING_ADDRESS(state, address) {
      state.endingAddress = address;
    },
  },
  actions: {
    async getDnc({ commit }, params) {
      try {
        if (!params.id) {
          return;
        }
        if (!params.keyword) {
          params.keyword = '';
        }

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query Dnc($congId: Int, $keyword: String) {
              dnc(congId: $congId, keyword: $keyword) {
                id
                addr1
                addr2
                city
                state_province
                postal_code
                territory_id
                notes
              }
            }`),
            variables: {
              congId: params.id,
              keyword: params.keyword,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.dnc) {
          return;
        }

        const { dnc } = response.data.data;
        commit(DNC_SUCCESS, dnc);
      } catch (exception) {
        commit(DNC_FAIL, exception);
      }
    },

    async optimize({ commit, state }, { territory, startLat, startLng }) {
      try {
        if (!territory) {
          return;
        }

        const hasStartingCoords = !!startLat && !!startLng;
        const mapQuestApiKey = process.env.VUE_APP_MAPQUEST_API_KEY;
        const { addresses: _addresses = [] } = territory;

        if (_addresses.length > ADDRESS_COUNT_LIMIT) {
          commit(OPTIMIZE_FAIL, `Too many addresses. Current limit is ${ADDRESS_COUNT_LIMIT}.`);
          return;
        }

        const startingAddress = _addresses.find(a => a.id === get(state, 'startingAddress.id'));
        const endingAddress = _addresses.find(a => a.id === get(state, 'endingAddress.id'));
        const remainingAddresses = _addresses
          // remove the starting and ending address (those will be added in manually later)
          .filter(a => a.id !== get(startingAddress, 'id') && a.id !== get(endingAddress, 'id'))
          // remove non-Regular address types (ie. Phone) and addresses with no long/lat coordinates
          .filter(a => a.type === 'Regular' && !!a.latitude && !!a.longitude);

        const raw = [];

        // starting point
        if (hasStartingCoords) {
          raw.push({ location: `${startLat},${startLng}` });
        }

        // first address
        if (startingAddress) {
          raw.push({
            ...startingAddress,
            location: `${startingAddress.latitude},${startingAddress.longitude}`,
          });
        }

        // all other addresses in the territory
        raw.push(...remainingAddresses.map(a => ({
          ...a,
          location: `${a.latitude},${a.longitude}`,
        })));

        // last address
        if (endingAddress) {
          raw.push({
            ...endingAddress,
            location: `${endingAddress.latitude},${endingAddress.longitude}`,
          });
        }

        const url = 'https://www.mapquestapi.com/directions/v2/optimizedroute?'
          + `outFormat=json&key=${mapQuestApiKey}`;

        const response = await axios.post(url, {
          locations: raw.map(r => r.location),
          options: {
            routeType: 'shortest',
            doReverseGeocode: false,
          },
        });
        const { locationSequence } = get(response, 'data.route') || [];

        // tie back to the original raw array (see above)
        const optimized = raw.map((a, index) => {
          const sequence = locationSequence.findIndex(l => index === l);
          return {
            ...a,
            sort: sequence,
          };
        });

        commit(OPTIMIZE_SUCCESS, orderBy(optimized, ['sort']));
      } catch (exception) {
        commit(OPTIMIZE_FAIL, exception);
        throw exception;
      }
    },

    async updateSort({ commit }, { addressIds, userid }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation UpdateSort($addressIds: [Int]!, $userid: Int) {
            updateSort(addressIds: $addressIds, userid: $userid)
          }`),
          variables: {
            addressIds,
            userid,
          },
        },
      });

      if (response && response.data && response.data.data) {
        commit(SORT_UPDATED);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addressSearch({ commit }, { congId, searchTerm, status }) {
      try {
        if (!congId) return;
        if (!searchTerm) {
          commit(ADDRESS_LOOKUP_SUCCESS, []);
          return;
        }

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query Search($congId: Int, $searchTerm: String, $status: String) {
              addresses(congId:$congId, keyword: $searchTerm, status: $status) {
                id
                addr1
                addr2
                city
                state_province
                phone
                notes
                status
                parent_id
                territory_id
                territory {
                  id
                  name
                  description
                  group_id
                }
              }
            }`),
            variables: {
              congId,
              searchTerm,
              status,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.addresses) {
          return;
        }

        const { addresses: _addresses } = response.data.data;
        const search = orderBy(_addresses, addr => addr.addr1);
        commit(ADDRESS_LOOKUP_SUCCESS, search);
      } catch (exception) {
        commit(ADDRESS_LOOKUP_FAIL, exception);
      }
    },

    async getChangeLog({ commit, state }, { congId, minDate, recordId }) {
      try {
        if (!congId) return;

        if (state.logsPayload.congId === congId
          && state.logsPayload.minDate === minDate
          && state.logsPayload.recordId === recordId
        ) {
          return;
        }

        const tokenSource = axios.CancelToken.source();
        const cancelToken = tokenSource.token;
        commit(GET_CHANGE_LOG, tokenSource);

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          cancelToken,
          data: {
            query: print(gql`query AddressChangeLog($congId: Int, $minDate: String, $recordId: Int) {
              addressChangeLogs(congId: $congId, minDate: $minDate, recordId: $recordId) {
                date
                changes
                publisher {
                  id
                  firstname
                  lastname
                  username
                }
                address {
                  id
                  addr1
                  addr2
                  city
                  state_province
                  postal_code
                  type
                  phone
                  territory {
                    id
                    name
                    description
                    group_id
                  }
                  parent_id
                }
              }
            }`),
            variables: {
              congId,
              minDate,
              recordId,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.addressChangeLogs) {
          return;
        }

        const updateFields = ['update_date', 'update_user'];
        const logs = response.data.data.addressChangeLogs;
        for (const log of logs) {
          log.changes = JSON.parse(log.changes);
          for (const key in log.changes) {
            if (!log.changes.added && !log.changes.removed) {
              const newValue = log.changes[key].new || '';
              const oldValue = log.changes[key].old || '';
              if ((!newValue && oldValue.length === newValue.length) || updateFields.includes(key)) {
                delete log.changes[key];
              }
            }
          }
        }

        commit(CHANGE_LOGS_SUCCESS, { logs, payload: { congId, minDate, recordId } });
      } catch (exception) {
        commit(CHANGE_LOGS_FAIL, exception);
      }
    },

    resetChangeLogPayload({ commit }) {
      commit(RESET_CHANGE_LOG_PAYLOAD);
    },

    setStartingAddress({ commit }, address) {
      commit(SET_STARTING_ADDRESS, address);
    },

    setEndingAddress({ commit }, address) {
      commit(SET_ENDING_ADDRESS, address);
    },
    clearError({ commit }) {
      commit(CLEAR_ERROR);
    },
  },
};
