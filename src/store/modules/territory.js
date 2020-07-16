import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import { store } from '..';
import maxBy from 'lodash/maxBy';

const CHANGE_STATUS = 'CHANGE_STATUS';
const SET_TERRITORY = 'SET_TERRITORY';
const GET_TERRITORY_FAIL = 'GET_TERRITORY_FAIL';
const RESET_TERRITORY = 'RESET_TERRITORY';

export const territory = {
  namespaced: true,
  state: {
    territory: {
      addresses: [],
    },
  },

  getters: {
    territory: state => state.territory,
    congId: state => state.territory.congregationid,
    isCheckedOut: state => state.territory && state.territory.status && state.territory.status.status === 'Checked Out',
    isOwnedByUser: (state, getters, rootState, rootGetters) => {
      const user = rootGetters['auth/user'];

      if (user) {
        const owner = state.territory && state.territory.status && state.territory.status.publisher;
        return owner && user.username === owner.username;
      }

      return false;
    },
    maxSort: (state) => {
      const addresses = state.territory && state.territory.addresses || [];
      const max = maxBy(addresses, a => a.sort);
      return max && max.sort || 0;
    },
    lastActivity: (state) => {
      const addresses = state.territory && state.territory.addresses || [];
      const mostRecentLogs = [];
      for (const addr of addresses) {
        const max = maxBy(addr.activityLogs, log => log && new Date(log.timestamp));
        mostRecentLogs.push(max);
      }

      return maxBy(mostRecentLogs, log => log && new Date(log.timestamp));
    },
    address: state => id => state.territory.addresses.find(a => a.id === id),
  },

  mutations: {
    CHANGE_STATUS(state, newStatus) {
      state.territory.status = newStatus;
      store.cache.clear();
    },
    SET_TERRITORY(state, terr) {
      state.territory = terr;
    },
    GET_TERRITORY_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_TERRITORY_FAIL, exception);
    },
    RESET_TERRITORY(state) {
      state.territory = {};
    },
  },

  actions: {
    async checkinTerritory({ commit }, args) {
      try {
        if (!args) {
          throw new Error('Unable to check in territory because the required arguments were not provided');
        }

        const response = await axios({
          data: {
            query: print(gql`mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  checkout_id
                  status
                  date
                }
              }
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            },
          },
        });

        if (response && response.data && response.data.data) {
          const { status } = response.data.data;
          commit(CHANGE_STATUS, status);
        }
      } catch (e) {
        console.error('Unable to check in territory', e);
      }
    },

    async checkoutTerritory({ commit }, args) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  checkout_id
                  status
                  date
                }
              }
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            },
          },
        });

        if (response && response.data && response.data.data) {
          const { status } = response.data.data;
          commit(CHANGE_STATUS, status);
        }
      } catch (e) {
        console.error('Unable to checkout territory', e);
      }
    },

    async getTerritory({ commit }, id) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Territory($terrId: Int) { 
              territory (id: $terrId) {
                group_code id congregationid name description type city
                addresses {
                  id addr1 addr2 city state_province postal_code
                  phone longitude latitude notes sort
                  activityLogs {
                    id checkout_id address_id value tz_offset
                    timestamp timezone publisher_id notes
                  }
                }
                status {
                  checkout_id
                  status
                  date
                  publisher {
                    id username firstname lastname
                  }
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
        commit(SET_TERRITORY, terr);
      } catch (exception) {
        commit(GET_TERRITORY_FAIL, exception);
      }
    },

    async setTerritory({ commit }, terr) {
      commit(SET_TERRITORY, terr);
    },

    resetTerritory({ commit }) {
      commit(RESET_TERRITORY);
    },

    async resetNHRecords({ dispatch, state }, territoryId) {
      await dispatch('getTerritory', territoryId);
      const { addresses } = state.territory;

      for (const address of addresses) {
        if (address.activityLogs && address.activityLogs.length > 0) {
          await dispatch('address/addLog', { addressId: address.id, value: 'START' }, { root: true });
        }
      }
    },
  },
};
