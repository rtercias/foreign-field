import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';

const DNC_SUCCESS = 'DNC_SUCCESS';
const DNC_FAIL = 'DNC_FAIL';
const OPTIMIZE_SUCCESS = 'OPTIMIZE_SUCCESS';
const OPTIMIZE_FAIL = 'OPTIMIZE_FAIL';
const SORT_UPDATED = 'SORT_UPDATED';
const ADDRESS_LOOKUP_SUCCESS = 'ADDRESS_LOOKUP_SUCCESS';
const ADDRESS_LOOKUP_FAIL = 'ADDRESS_LOOKUP_FAIL';

export const addresses = {
  namespaced: true,
  state: {
    addresses: [],
    dnc: [],
    optimized: [],
    search: [],
  },
  getters: {
    dnc: state => state.dnc,
    optimized: state => state.optimized,
    search: state => state.search,
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
  },
  actions: {
    async getDnc({ commit }, id) {
      try {
        if (!id) {
          return;
        }
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query Dnc($congId: Int) {
              dnc(congId:$congId) {
                addr1
                addr2
                city
                state_province
              }
            }`),
            variables: {
              congId: id,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.dnc) {
          return;
        }

        const raw = response.data.data.dnc;

        const dnc = raw.map(d => ({
          address: `
              ${d.addr1} 
              ${d.addr2 ? `${d.addr2} ` : ''}
              ${d.city ? `${d.city} ` : ''}
              ${d.state_province ? `${d.state_province} ` : ''}`,
        }));

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

        const url = `https://admin.foreignfield.com/api/addresses/getOptimizedRouteForTerritory?territoryId=${territoryId}`;
        const proxy = 'https://cors-anywhere.herokuapp.com';
        const response = await axios.get(`${proxy}/${url}`);
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
      }
    },

    async updateSort({ commit }, addressIds) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation UpdateSort($addressIds: [Int]!) { 
            updateSort(addressIds: $addressIds)
          }`),
          variables: {
            addressIds,
          },
        },
      });

      if (response && response.data && response.data.data) {
        commit(SORT_UPDATED);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addressSearch({ commit }, { congId, searchTerm }) {
      try {
        if (!congId) return;
        if (!searchTerm) return;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query Search($congId: Int, $searchTerm: String) {
              addresses(congId:$congId, keyword: $searchTerm) {
                id
                addr1
                addr2
                city
                state_province
                territory {
                  id
                  name
                  description
                  group_code
                }
              }
            }`),
            variables: {
              congId,
              searchTerm,
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
  },
};
