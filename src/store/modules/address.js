import axios from 'axios';
import orderBy from 'lodash/orderBy';

const SET_ADDRESS = 'SET_ADDRESS';
const IS_BUSY = 'IS_BUSY';

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
    isBusy: false,
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

    isBusy: state => state.isBusy,
  },

  mutations: {
    SET_ADDRESS(state, address) {
      state.address = address;
    },

    IS_BUSY(state, value) {
      state.isBusy = value;
    }
  },

  actions: {
    setAddress({ commit }, address) {
      commit(SET_ADDRESS, address);
    },

    async fetchAddress({ commit }, addressId) {
      commit(IS_BUSY, true);

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
        commit(IS_BUSY, false);
      }
    },

    async addLog({ commit, dispatch, getters, rootGetters }, { addressId, value }) {
      try {
        commit(IS_BUSY, true);
        const checkoutId = getters['checkoutInfo'] &&  getters['checkoutInfo'].checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(0, addressId, value, checkoutId, user);

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

      commit(IS_BUSY, false);
    },

    async updateLog({ commit, dispatch, getters, rootGetters }, { id, addressId, value }) {
      try {
        commit(IS_BUSY, true);
        const checkoutId = getters['checkoutInfo'] &&  getters['checkoutInfo'].checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(id, addressId, value, checkoutId, user);

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

      commit(IS_BUSY, false);
    },

    async removeLog({ commit, dispatch }, { id, addressId }) {
      try {
        commit(IS_BUSY, true);
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

      commit(IS_BUSY, false);
    },
  }
}
