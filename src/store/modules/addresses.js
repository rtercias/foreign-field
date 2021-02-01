import axios from 'axios';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import { print } from 'graphql/language/printer';

const DNC_SUCCESS = 'DNC_SUCCESS';
const DNC_FAIL = 'DNC_FAIL';
const OPTIMIZE_SUCCESS = 'OPTIMIZE_SUCCESS';
const OPTIMIZE_FAIL = 'OPTIMIZE_FAIL';
const SORT_UPDATED = 'SORT_UPDATED';
const ADDRESS_LOOKUP_SUCCESS = 'ADDRESS_LOOKUP_SUCCESS';
const ADDRESS_LOOKUP_FAIL = 'ADDRESS_LOOKUP_FAIL';
const GET_CHANGE_LOG = 'GET_CHANGE_LOG';
const CHANGE_LOGS_SUCCESS = 'CHANGE_LOGS_SUCCESS';
const CHANGE_LOGS_FAIL = 'CHANGE_LOGS_FAIL';

export const addresses = {
  namespaced: true,
  state: {
    addresses: [],
    dnc: [],
    optimized: [],
    search: [],
    logs: [],
    cancelTokens: {},
    error: null,
  },
  getters: {
    dnc: state => state.dnc,
    optimized: state => state.optimized,
    search: state => state.search,
    logs: state => orderBy(state.logs, 'date', 'desc'),
    cancelTokens: state => state.cancelTokens,
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
      console.error(OPTIMIZE_FAIL, exception);
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
    CHANGE_LOGS_SUCCESS(state, logs) {
      state.logs = logs;
    },
    CHANGE_LOGS_FAIL(state, exception) {
      state.error = exception;
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

    async optimize({ commit }, territoryId) {
      try {
        if (!territoryId) {
          return;
        }

        const base = `https://admin.foreignfield.com/api/addresses/getOptimizedRouteForTerritory?territoryId=${territoryId}`;
        const proxy = 'https://cors-anywhere.herokuapp.com';
        const url = document.location.host.includes('localhost') ? `${proxy}/${base}` : base;
        const response = await axios.get(url);
        const { data } = response;
        commit(OPTIMIZE_SUCCESS, data.map(d => ({
          id: d.Id,
          addr1: d.Address1,
          addr2: d.Address2,
          city: d.City,
          state_province: d.StateProvince,
          sort: d.Sort,
        })));
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

        const search = response.data.data.addresses;
        commit(ADDRESS_LOOKUP_SUCCESS, search);
      } catch (exception) {
        commit(ADDRESS_LOOKUP_FAIL, exception);
      }
    },

    async getChangeLog({ commit }, { congId, minDate, recordId }) {
      try {
        if (!congId) return;

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
            const newValue = log.changes[key].new || '';
            const oldValue = log.changes[key].old || '';
            if ((!newValue && oldValue.length === newValue.length) || updateFields.includes(key)) {
              delete log.changes[key];
            }
          }
        }

        commit(CHANGE_LOGS_SUCCESS, logs);
      } catch (exception) {
        commit(CHANGE_LOGS_FAIL, exception);
      }
    },
  },
};
