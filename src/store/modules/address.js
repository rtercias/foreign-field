import axios from 'axios';
import gql from 'graphql-tag';
import orderBy from 'lodash/orderBy';
import clone from 'lodash/clone';
import { InvalidAddressError } from '../exceptions/custom-errors';

const model = gql`fragment Model on Address {
  congregationId
  territory_id
  id
  addr1
  addr2
  city
  state_province
  postal_code
  phone
  longitude
  latitude
  notes
  status
  sort
  activityLogs {
    id
    checkout_id
    address_id
    value
    tz_offset
    timestamp
    timezone
    publisher_id
    notes
  }
}`;

const SET_ADDRESS = 'SET_ADDRESS';
const ADD_LOG = 'ADD_LOG';
const UPDATE_LOG = 'UPDATE_LOG';
const REMOVE_LOG = 'REMOVE_LOG';
const ADD_ADDRESS = 'ADD_ADDRESS';
const UPDATE_ADDRESS = 'UPDATE_ADDRESS';
const CHANGE_STATUS = 'CHANGE_STATUS';
const TEXT_FIELDS = ['addr1', 'addr2', 'city', 'state_province', 'postal_code', 'phone'];
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


function validateAddress(_address, isNew) {
  const address = clone(_address);

  if (isNew && address.id) {
    throw new InvalidAddressError('Address ID must be empty when adding a new address');
  }
  if (!address.addr1) {
    throw new InvalidAddressError('Address 1 is required');
  }
  if (!address.city) {
    throw new InvalidAddressError('City is required');
  }
  if (!address.state_province) {
    throw new InvalidAddressError('State is required');
  }
  if (!Number.isInteger(address.sort)) {
    throw new InvalidAddressError('Sort is required');
  }

  for (const key of TEXT_FIELDS) {
    address[key] = address[key] || ' ';
  }

  return address;
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
        return current;
      }

      return { value: 'START', timestamp: '' };
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
          query: gql`query Address($addressId: Int) { 
            address(id: $addressId) { 
              ...Model
            }
          }
          ${model}`,
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
            query: gql`mutation AddLog($activityLog: ActivityLogInput!) { 
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
            query: gql`mutation UpdateLog($activityLog: ActivityLogInput!) { 
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
            query: gql`mutation RemoveLog($id: Int!) { 
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
    async addAddress({ commit, rootGetters }, _address) {
      commit('auth/LOADING', true, { root: true });

      const user = rootGetters['auth/user'];
      const addr = validateAddress(_address, true);
      addr.create_user = user.id;

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: gql`mutation CreateAddress($address: AddressInput!) { 
            addAddress(address: $address) { 
              ...Model
            }
          }
          ${model}`,
          variables: {
            address: addr,
          },
        },
      });

      if (response && response.data && response.data.data) {
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }
        const { addAddress } = response.data.data;
        commit(ADD_ADDRESS, addAddress);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updateAddress({ commit, rootGetters }, _address) {
      commit('auth/LOADING', true, { root: true });

      const user = rootGetters['auth/user'];
      const addr = validateAddress(_address);
      addr.update_user = user.id;

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: gql`mutation UpdateAddress($address: AddressInput!) { 
            updateAddress(address: $address) { 
              ...Model
            }
          }
          ${model}`,
          variables: {
            address: addr,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const { updateAddress } = response.data.data;
        commit(UPDATE_ADDRESS, updateAddress);
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
          query: gql`mutation ChangeStatus($addressId: addressId, $status: status, $userid: userid, $note: note) { 
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
          query: gql`mutation ChangeStatus($addressId: addressId, $status: status, $userid: userid, $note: note) { 
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
  },
};
