import axios from 'axios';
import orderBy from 'lodash/orderBy';

const SET_ADDRESS = 'SET_ADDRESS';
const ADD_LOG = 'ADD_LOG';
const UPDATE_LOG = 'UPDATE_LOG';
const REMOVE_LOG = 'REMOVE_LOG';
const ADD_ADDRESS = 'ADD_ADDRESS';
const UPDATE_ADDRESS = 'UPDATE_ADDRESS';
const CHANGE_STATUS = 'CHANGE_STATUS';
const ADD_NOTE = 'ADD_NOTE';
const REMOVE_NOTE = 'REMOVE_NOTE';

const ACTION_BUTTON_LIST = [
  {
    type: 'fa-icon',
    value: 'START',
    text: '',
    icon: '',
    className: 'text-success',
  },
  {
    type: 'fa-icon',
    value: 'NH',
    text: 'NH',
    icon: 'circle',
    className: 'text-warning',
  },
  {
    type: 'fa-icon',
    value: 'HOME',
    text: '',
    icon: 'house-user',
    className: 'text-success',
  },
  {
    type: 'fa-icon',
    value: 'PH',
    text: '',
    icon: 'phone',
    className: 'text-tomato',
  },
  {
    type: 'fa-icon',
    value: 'LW',
    text: '',
    icon: 'envelope',
    className: 'text-slate-blue',
  },
  {
    type: 'fa-icon',
    value: 'NF',
    text: 'NF',
    icon: 'circle',
    className: 'text-danger',
  },
];

function createActivityLog(id, addressId, value, checkoutId, user) {
  return {
    id,
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

    lastActivity: (state) => {
      const activity = state.address && state.address.activityLogs;
      if (activity) {
        const current = orderBy(activity, a => (new Date(a.timestamp)), 'desc')[0];
        return current && current.value;
      }

      return null;
    },

    checkoutInfo: (state, getters, rootState, rootGetters) => {
      const terr = rootGetters['territory/territory'];
      return terr.status;
    },

    actionButtonList: () => ACTION_BUTTON_LIST,
  },

  mutations: {
    SET_ADDRESS(state, addr) {
      state.address = addr;
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

    ADD_ADDRESS(state, addr) {
      state.address = addr;
    },

    UPDATE_ADDRESS(state, addr) {
      state.address = addr;
    },

    CHANGE_STATUS(state, status) {
      state.address.status = status;
    },

    ADD_NOTE(state, note) {
      const arrNotes = (state.address.notes && state.address.notes.split(',')) || [];
      arrNotes.push(note);
      state.address.notes = arrNotes.join(',');
    },

    REMOVE_NOTE(state, note) {
      const arrNotes = (state.address.notes && state.address.notes.split(',')) || [];
      const newNotes = arrNotes.filter(n => n !== note);
      state.address.notes = newNotes.join(',');
    },
  },

  actions: {
    setAddress({ commit }, addr) {
      commit(SET_ADDRESS, addr);
    },

    async fetchAddress({ commit }, addressId) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
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
          },
        },
      });

      if (response && response.data && response.data.data) {
        const { address: addr } = response.data.data;
        commit(SET_ADDRESS, addr);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addLog({
      commit, dispatch, getters, rootGetters,
    }, { addressId, value }) {
      try {
        const checkoutId = getters.checkoutInfo && getters.checkoutInfo.checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(0, addressId, value, checkoutId, user);

        commit('auth/LOADING', true, { root: true });
        commit(ADD_LOG, activityLog);

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: `mutation AddLog($activityLog: ActivityLogInput!) { 
              addLog(activityLog: $activityLog) {
                id checkout_id address_id value tz_offset timestamp
                timezone publisher_id notes
              }
            }`,
            variables: {
              activityLog,
            },
          },
        });

        if (response && response.data && response.data.data) {
          dispatch('fetchAddress', addressId);
        }

        return response;
      } catch (e) {
        console.error('Unable to add an activityLog', e);
        throw e;
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updateLog({
      commit, dispatch, getters, rootGetters,
    }, { id, addressId, value }) {
      try {
        const checkoutId = getters.checkoutInfo && getters.checkoutInfo.checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(id, addressId, value, checkoutId, user);

        commit('auth/LOADING', true, { root: true });
        commit(UPDATE_LOG, activityLog);

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: `mutation UpdateLog($activityLog: ActivityLogInput!) { 
              updateLog(activityLog: $activityLog) {
                id checkout_id address_id value tz_offset timestamp
                timezone publisher_id notes
              }
            }`,
            variables: {
              activityLog,
            },
          },
        });

        if (response && response.data && response.data.data) {
          dispatch('fetchAddress', addressId);
        }
      } catch (e) {
        console.error('Unable to update an activityLog', e);
      }

      commit('auth/LOADING', false, { root: true });
    },

    async removeLog({ commit, dispatch }, { id, addressId }) {
      try {
        commit('auth/LOADING', true, { root: true });
        commit(REMOVE_LOG, { id, addressId });

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: `mutation RemoveLog($id: Int!) { 
              removeLog(id: $id)
            }`,
            variables: {
              id,
            },
          },
        });

        if (response && response.data && response.data.data) {
          dispatch('fetchAddress', addressId);
        }
      } catch (e) {
        console.error('Unable to remove an activityLog', e);
      }

      commit('auth/LOADING', false, { root: true });
    },

    async addAddress({ commit }, _address) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `mutation CreateAddress($address: AddressInput!) { 
            addAddress(address: $address) { 
              id, addr1, addr2, city, state_province, postal_code
            }
          }`,
          variables: {
            address: _address,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const { address: addr } = response.data.data;
        commit(ADD_ADDRESS, addr);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updateAddress({ commit }, _address) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `mutation UpdateAddress($address: AddressInput!) { 
            updateAddress(address: $address) { 
              id, addr1, addr2, city, state_province, postal_code
            }
          }`,
          variables: {
            address: _address,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const { address: addr } = response.data.data;
        commit(UPDATE_ADDRESS, addr);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async markAsNotForeign({ commit }, addressId, userid, note) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `mutation ChangeStatus($addressId: addressId, $status: status, $userid: userid, $note: note) { 
            changeAddressStatus(addressId: $addressId, status: $status, userid: $userid, note: $note)
          }`,
          variables: {
            addressId,
            status: 'NF',
            userid,
            note,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const result = response.data.data;
        commit(CHANGE_STATUS, result);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async markAsDoNotCall({ commit }, addressId, userid, note) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `mutation ChangeStatus($addressId: addressId, $status: status, $userid: userid, $note: note) { 
            changeAddressStatus(addressId: $addressId, status: $status, userid: $userid, note: $note)
          }`,
          variables: {
            addressId,
            status: 'DNC',
            userid,
            note,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const result = response.data.data;
        commit(CHANGE_STATUS, result);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addNote({ commit }, { addressId, userid, note }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `mutation AddNote($addressId: Int!, $userid: Int!, $note: String!) { 
            addNote(addressId: $addressId, userid: $userid, note: $note)
          }`,
          variables: {
            addressId,
            userid,
            note,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const result = response.data.data;
        if (result) {
          commit(ADD_NOTE, note);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },

    async removeNote({ commit }, { addressId, userid, note }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `mutation RemoveNote($addressId: Int!, $userid: Int!, $note: String!) { 
            removeNote(addressId: $addressId, userid: $userid, note: $note)
          }`,
          variables: {
            addressId,
            userid,
            note,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const result = response.data.data;
        if (result) {
          commit(REMOVE_NOTE, note);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },
  },
};
