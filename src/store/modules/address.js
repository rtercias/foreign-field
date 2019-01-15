import axios from 'axios';
import orderBy from 'lodash/orderBy';

const SET_ADDRESS = 'SET_ADDRESS';
const ADD_LOG = 'ADD_LOG';
const UPDATE_LOG = 'UPDATE_LOG';
const REMOVE_LOG = 'REMOVE_LOG';


function createActivityLog(id, addressId, value, checkoutId, user) {
  return {
    id: id,
    checkout_id: checkoutId,
    address_id: addressId,
    value,
    tz_offset: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    publisher_id: user.id,
  };
}

export const address = {
  namespaced: true,
  state: {
    address: {},
  },

  getters: {
    address: state => state.address,

    lastActivity: state => {
      const activity = state.address && state.address.activityLogs;

      if (activity) {
        const current = orderBy(activity, 'timestamp', 'desc')[0];
        return current && current.value;
      }

      return null;
    },

    checkoutInfo: (state, getters, rootState, rootGetters) => {
      const terr = rootGetters['territory/territory'];
      return terr.status;
    },
  },

  mutations: {
    SET_ADDRESS(state, address) {
      state.address = address;
    },

    ADD_LOG(state, log) {
      if (state.address.id === log.address_id) {
        state.address.activityLogs.push(log);
      }
    },

    UPDATE_LOG(state, log) {
      if (state.address.id === log.address_id) {
        const index = state.address.activityLogs.findIndex(a => a.id === log.id);
        if (index !== -1) {
          state.address.activityLogs.splice(index, 1, log);
        }
      }
    },

    REMOVE_LOG(state, { id, addressId }) {
      if (state.address.id === addressId) {
        const index = state.address.activityLogs.findIndex(a => a.id === id);
        if (index !== -1) {
          state.address.activityLogs.splice(index, 1);
        }
      }
    },
  },

  actions: {
    setAddress({ commit }, address) {
      commit(SET_ADDRESS, address);
    },

    async fetchAddress({ commit }, addressId) {
      commit('auth/IS_BUSY', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `query Address($addressId: Int) { 
            address(id: $addressId) { 
              id addr1 addr2 city state_province postal_code
              phone longitude latitude notes
              activityLogs {
                id checkout_id address_id value tz_offset timestamp
                timezone publisher_id notes
              }
            }
          }`,
          variables: {
            addressId,
          }
        }
      });

      if (response && response.data && response.data.data) {
        const { address } = response.data.data;
        commit(SET_ADDRESS, address);
        commit('auth/IS_BUSY', false, { root: true });
      }
    },

    async addLog({ commit, dispatch, getters, rootGetters }, { addressId, value }) {
      try {
        
        const checkoutId = getters['checkoutInfo'] &&  getters['checkoutInfo'].checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(0, addressId, value, checkoutId, user);
        
        commit('auth/IS_BUSY', true, { root: true });
        commit(ADD_LOG, activityLog);

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `mutation AddLog($activityLog: ActivityLogInput!) { 
              addLog(activityLog: $activityLog) {
                id checkout_id address_id value tz_offset timestamp
                timezone publisher_id notes
              }
            }`,
            variables: {
              activityLog: activityLog,
            }
          }
        });

        if (response && response.data && response.data.data) {
          dispatch('fetchAddress', addressId);
        }

      } catch (e) {
        console.error('Unable to add an activityLog', e);
      }

      commit('auth/IS_BUSY', false, { root: true });
    },

    async updateLog({ commit, dispatch, getters, rootGetters }, { id, addressId, value }) {
      try {
        const checkoutId = getters['checkoutInfo'] &&  getters['checkoutInfo'].checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(id, addressId, value, checkoutId, user);
        
        commit('auth/IS_BUSY', true, { root: true });
        commit(UPDATE_LOG, activityLog);

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `mutation UpdateLog($activityLog: ActivityLogInput!) { 
              updateLog(activityLog: $activityLog) {
                id checkout_id address_id value tz_offset timestamp
                timezone publisher_id notes
              }
            }`,
            variables: {
              activityLog: activityLog,
            }
          }
        });

        if (response && response.data && response.data.data) {
          dispatch('fetchAddress', addressId);
        }

      } catch (e) {
        console.error('Unable to update an activityLog', e);
      }

      commit('auth/IS_BUSY', false, { root: true });
    },

    async removeLog({ commit, dispatch }, { id, addressId }) {
      try {
        commit('auth/IS_BUSY', true, { root: true });
        commit(REMOVE_LOG, { id, addressId });

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `mutation RemoveLog($id: Int!) { 
              removeLog(id: $id)
            }`,
            variables: {
              id,
            }
          }
        });

        if (response && response.data && response.data.data) {
          dispatch('fetchAddress', addressId);
        }

      } catch (e) {
        console.error('Unable to remove an activityLog', e);
      }

      commit('auth/IS_BUSY', false, { root: true });
    },
  }
}
