import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import clone from 'lodash/clone';
import get from 'lodash/get';
import { InvalidAddressError } from '../exceptions/custom-errors';

export const addressModel = gql`fragment AddressModel on Address {
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
  parent_id
  phones {
    id
    phone
    notes
    sort 
  }
}`;

export const activityModel = gql`fragment ActivityModel on ActivityLog {
  id
  checkout_id
  address_id
  value
  tz_offset
  timestamp
  timezone
  publisher_id
  notes
}`;

export const ADDRESS_STATUS = {
  Active: 'Active',
  NF: 'NF',
  DNC: 'DNC',
};

const SET_ADDRESS = 'SET_ADDRESS';
const UPDATE_LOG = 'UPDATE_LOG';
const REMOVE_LOG = 'REMOVE_LOG';
const ADD_ADDRESS = 'ADD_ADDRESS';
const UPDATE_ADDRESS = 'UPDATE_ADDRESS';
const CHANGE_STATUS = 'CHANGE_STATUS';
const ADD_TAG = 'ADD_TAG';
const REMOVE_TAG = 'REMOVE_TAG';
const UPDATE_GEOCODE = 'UPDATE_GEOCODE';
const FETCH_LAST_ACTIVITY_SUCCESS = 'FETCH_LAST_ACTIVITY_SUCCESS';
const FETCH_LAST_ACTIVITY_FAIL = 'FETCH_LAST_ACTIVITY_FAIL';

const ACTION_BUTTON_LIST = [
  {
    type: 'fa-icon',
    value: 'START',
    text: '',
    icon: '',
    color: 'success',
  },
  {
    type: 'fa-icon',
    value: 'NH',
    text: 'NH',
    icon: 'circle',
    color: 'warning',
    description: 'Not Home',
  },
  {
    type: 'fa-icon',
    value: 'HOME',
    text: '',
    icon: 'house-user',
    color: 'primary',
    description: 'Home',
  },
  {
    type: 'fa-icon',
    value: 'PH',
    text: '',
    icon: 'phone',
    color: 'info',
    description: 'Phone',
  },
  {
    type: 'fa-icon',
    value: 'LW',
    text: '',
    icon: 'envelope',
    color: 'primary',
    description: 'Letter',
    disabledText: 'Do Not Mail',
  },
  {
    type: 'fa-icon',
    value: 'no number',
    text: '',
    icon: 'phone-slash',
    color: 'danger',
    description: 'No Number',
  },
  {
    type: 'fa-icon',
    value: 'do not mail',
    text: '',
    icon: 'envelope',
    color: 'danger',
    description: 'Do Not Mail',
    slashed: true,
  },
];

export function createActivityLog(id, addressId, value, checkoutId, user) {
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
  if (!address.congregationId) {
    throw new InvalidAddressError('Congregation ID is required');
  }
  if (!address.territory_id) {
    throw new InvalidAddressError('Territory ID is required');
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
    address.sort = 0;
  }

  // convert nullable fields to empty string when null
  if (address.addr2 === null) {
    address.addr2 = '';
  }

  if (address.postal_code === null) {
    address.postal_code = '';
  }

  if (address.phone === null) {
    address.phone = '';
  }

  if (address.notes === null) {
    address.notes = '';
  }

  if ('activityLogs' in address) {
    delete address.activityLogs;
  }

  if ('lastActivity' in address) {
    delete address.lastActivity;
  }

  if ('incomingResponse' in address) {
    delete address.incomingResponse;
  }

  if ('selectedResponse' in address) {
    delete address.selectedResponse;
  }

  if ('selectedResponseTS' in address) {
    delete address.selectedResponseTS;
  }

  if ('phones' in address) {
    delete address.phones;
  }

  if ('type' in address) {
    delete address.type;
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
    error: state => state.error,
    checkoutInfo: (state, getters, rootState, rootGetters) => {
      const terr = rootGetters['territory/territory'];
      return terr.status;
    },

    actionButtonList: () => ACTION_BUTTON_LIST,

    tags: state => ((state.address.notes && state.address.notes
      .toLowerCase()
      .split(',')
      .filter(n => !n.length))
      || []),
  },

  mutations: {
    SET_ADDRESS(state, addr) {
      state.address = addr;
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

    ADD_TAG(state, tag) {
      const arrTags = (state.address.notes && state.address.notes.split(',')) || [];
      arrTags.push(tag);
      state.address.notes = arrTags.join(',');
    },

    REMOVE_TAG(state, tag) {
      const arrTags = (state.address.notes && state.address.notes.split(',')) || [];
      const newTags = arrTags.filter(t => t !== tag);
      state.address.notes = newTags.join(',');
    },

    UPDATE_GEOCODE(state, { longitude, latitude, addr1, city, stateProvince, zip }) {
      if (state.address) {
        state.address.longitude = longitude;
        state.address.latitude = latitude;
        state.address.addr1 = addr1;
        state.address.city = city;
        state.address.state_province = stateProvince;
        state.address.postal_code = zip;
      }
    },

    FETCH_LAST_ACTIVITY_FAIL(state, exception) {
      state.error = exception;
      console.error(FETCH_LAST_ACTIVITY_FAIL, exception);
    },
    FETCH_LAST_ACTIVITY_SUCCESS(state, lastActivity) {
      state.error = null;
      state.address.lastActivity = lastActivity;
    },
  },

  actions: {
    setAddress({ commit }, addr) {
      commit(SET_ADDRESS, addr);
    },

    async fetchAddress({ commit }, { addressId, checkoutId }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query Address($addressId: Int $checkoutId: Int) { 
            address(id: $addressId) { 
              ...AddressModel
              activityLogs(checkout_id: $checkoutId) {
                ...ActivityModel
              }
              lastActivity {
                ...ActivityModel
              }
            }
          }
          ${addressModel}
          ${activityModel}`),
          variables: {
            addressId,
            checkoutId,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const { address: addr } = response.data.data;
        commit(SET_ADDRESS, addr);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async fetchLastActivity({ commit, dispatch }, { addressId }) {
      try {
        if (!addressId) {
          commit(FETCH_LAST_ACTIVITY_FAIL, 'id is required');
          return;
        }

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query Address($addressId: Int) { 
              address(id: $addressId) { 
                lastActivity {
                  ...ActivityModel
                }
              }
            }
            ${activityModel}`),
            variables: {
              addressId,
            },
          },
        });

        const { lastActivity } = get(response, 'data.data.address') || {};
        if (lastActivity) {
          dispatch('territory/setAddressLastActivity', { addressId, lastActivity }, { root: true });
        }
      } catch (e) {
        console.error(`Unable to fetch last activity for address id ${addressId}.`, e);
        throw e;
      }
    },

    async addLog({ commit, getters, rootGetters }, { entityId, value }) {
      try {
        const checkoutId = getters.checkoutInfo && getters.checkoutInfo.checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(0, entityId, value, checkoutId, user);

        commit('auth/LOADING', true, { root: true });

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation AddLog($activityLog: ActivityLogInput!) { 
              addLog(activityLog: $activityLog) {
                ...ActivityModel
              }
            }
            ${activityModel}`),
            variables: {
              activityLog,
            },
          },
        });

        const { addLog } = get(response, 'data.data') || {};
        commit(FETCH_LAST_ACTIVITY_SUCCESS, addLog);
      } catch (e) {
        console.error('Unable to add an activityLog', e);
        throw e;
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updateLog({ commit, getters, rootGetters }, { id, entityId, value }) {
      try {
        const checkoutId = getters.checkoutInfo && getters.checkoutInfo.checkout_id;
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(id, entityId, value, checkoutId, user);

        commit('auth/LOADING', true, { root: true });

        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation UpdateLog($activityLog: ActivityLogInput!) { 
              updateLog(activityLog: $activityLog) {
                id checkout_id address_id value tz_offset timestamp
                timezone publisher_id notes
              }
            }`),
            variables: {
              activityLog,
            },
          },
        });

        commit(UPDATE_LOG, activityLog);
      } catch (e) {
        console.error('Unable to update an activityLog', e);
      }

      commit('auth/LOADING', false, { root: true });
    },

    async removeLog({ commit }, { id, entityId }) {
      try {
        commit('auth/LOADING', true, { root: true });

        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation RemoveLog($id: Int!) { 
              removeLog(id: $id)
            }`),
            variables: {
              id,
            },
          },
        });

        commit(REMOVE_LOG, { id, entityId });
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
          query: print(gql`mutation CreateAddress($address: AddressInput!) { 
            addAddress(address: $address) { 
              ...AddressModel
            }
          }
          ${addressModel}`),
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

      if (!user) {
        throw new Error('No authorized user');
      }

      addr.update_user = user.id;

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation UpdateAddress($address: AddressInput!) { 
            updateAddress(address: $address) { 
              ...AddressModel
            }
          }
          ${addressModel}`),
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

    async markAsNotForeign({ commit }, { addressId, userid, tag }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation ChangeStatus($addressId: Int!, $status: String!, $userid: Int!, $tag: String) { 
            changeAddressStatus(addressId: $addressId, status: $status, userid: $userid, note: $tag)
          }`),
          variables: {
            addressId,
            status: ADDRESS_STATUS.NF,
            userid,
            tag,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const changeAddressStatus = response.data.data;
        if (changeAddressStatus) {
          commit(CHANGE_STATUS, ADDRESS_STATUS.NF);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },

    async markAsDoNotCall({ commit }, { addressId, userid, tag }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation ChangeStatus($addressId: Int!, $status: String!, $userid: Int!, $tag: String) { 
            changeAddressStatus(addressId: $addressId, status: $status, userid: $userid, note: $tag)
          }`),
          variables: {
            addressId,
            status: ADDRESS_STATUS.DNC,
            userid,
            tag,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const changeAddressStatus = response.data.data;
        if (changeAddressStatus) {
          commit(CHANGE_STATUS, ADDRESS_STATUS.DNC);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addTag({ commit }, { addressId, userid, tag }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation AddTag($addressId: Int!, $userid: Int!, $tag: String!) { 
            addNote(addressId: $addressId, userid: $userid, note: $tag)
          }`),
          variables: {
            addressId,
            userid,
            tag,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const addNote = response.data.data;
        if (addNote) {
          commit(ADD_TAG, tag);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },

    async removeTag({ commit }, { addressId, userid, tag }) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation RemoveTag($addressId: Int!, $userid: Int!, $tag: String!) { 
            removeNote(addressId: $addressId, userid: $userid, note: $tag)
          }`),
          variables: {
            addressId,
            userid,
            tag,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const removeNote = response.data.data;
        if (removeNote) {
          commit(REMOVE_TAG, tag);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addressLookup({ commit }, fullAddress) {
      try {
        const instance = axios.create();
        const key = process.env.VUE_APP_GOOGLE_MAPS_API;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${fullAddress}&key=${key}`;
        const response = await instance.get(url);

        if (response && response.data) {
          const { geometry, address_components: addressComponent } = get(response, 'data.results[0]', {});
          if (geometry) {
            const country = addressComponent.find(c => c.types[0] === 'country') || {};
            const streetNumber = addressComponent.find(c => c.types[0] === 'street_number') || {};
            const route = addressComponent.find(c => c.types[0] === 'route') || {};
            const city = addressComponent.find(c => c.types[0] === 'locality') || {};
            const stateProvince = addressComponent.find(c => c.types[0] === 'administrative_area_level_1') || {};
            const zip = addressComponent.find(c => c.types[0] === 'postal_code') || {};
            const longitude = get(geometry, 'location.lng');
            const latitude = get(geometry, 'location.lat');

            commit(UPDATE_GEOCODE, {
              longitude,
              latitude,
              addr1: `${streetNumber.long_name || ''} ${route.short_name}`,
              city: city.long_name,
              stateProvince: country.short_name === 'US' ? stateProvince.short_name : stateProvince.long_name,
              zip: zip.long_name,
            });
          }
        }
      } catch (err) {
        console.error('Unable to geocode the address');
      }
    },
  },
};
