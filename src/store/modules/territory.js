import Vue from 'vue';
import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import maxBy from 'lodash/maxBy';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import { model, validate } from './models/TerritoryModel';
import { AddressStatus, AddressType } from '..';

const CHANGE_STATUS = 'CHANGE_STATUS';
const SET_TERRITORY = 'SET_TERRITORY';
const GET_TERRITORY_FAIL = 'GET_TERRITORY_FAIL';
const GET_TERRITORY_SUCCESS = 'GET_TERRITORY_SUCCESS';
const RESET_TERRITORY = 'RESET_TERRITORY';
const FETCH_LAST_ACTIVITY = 'FETCH_LAST_ACTIVITY';
const CANCEL_FETCH_LAST_ACTIVITY = 'CANCEL_FETCH_LAST_ACTIVITY';
const SET_ADDRESS_LAST_ACTIVITY = 'SET_ADDRESS_LAST_ACTIVITY';
const SET_PHONE_LAST_ACTIVITY = 'SET_PHONE_LAST_ACTIVITY';
const LOADING_TERRITORY_TRUE = 'LOADING_TERRITORY_TRUE';
const LOADING_TERRITORY_FALSE = 'LOADING_TERRITORY_FALSE';
const ADD_TERRITORY = 'ADD_TERRITORY';
const ADD_TERRITORY_FAIL = 'ADD_TERRITORY_FAIL';
const UPDATE_TERRITORY = 'UPDATE_TERRITORY';
const UPDATE_TERRITORY_FAIL = 'UPDATE_TERRITORY_FAIL';
const DELETE_TERRITORY = 'DELETE_TERRITORY';
const DELETE_TERRITORY_FAIL = 'DELETE_TERRITORY_FAIL';
const ADD_ADDRESS = 'ADD_ADDRESS';
const ADD_PHONE = 'ADD_PHONE';
const UPDATE_ADDRESS = 'UPDATE_ADDRESS';
const DELETE_ADDRESS = 'DELETE_ADDRESS';
const UPDATE_PHONE = 'UPDATE_PHONE';
const DELETE_PHONE = 'DELETE_PHONE';
const UPDATE_ADDRESS_NOTES = 'UPDATE_ADDRESS_NOTES';
const UPDATE_PHONE_NOTES = 'UPDATE_PHONE_NOTES';
const UPDATE_STATUS = 'UPDATE_STATUS';

const initialState = {
  territory: {
    name: '',
    description: '',
    addresses: [],
  },
  cancelTokens: {},
};

export const territory = {
  namespaced: true,
  state: {
    ...initialState,
  },

  getters: {
    territory: state => state.territory,
    cancelTokens: state => state.cancelTokens,
    congId: state => state.territory.congregationid,
    isLoading: state => state.isLoading,
    isBusy: state => get(state.territory, 'addresses', []).some(a => a.isBusy),
    isCheckedOut: state => state.territory && state.territory.status && state.territory.status.status === 'Checked Out',
    isOwnedByUser: (state, getters, rootState, rootGetters) => {
      const user = rootGetters['auth/user'];

      if (user) {
        return get(state.territory, 'status.publisher.username');
      }

      return false;
    },
    maxSort: (state) => {
      const addresses = state.territory && state.territory.addresses || [];
      const max = maxBy(addresses, a => a.sort);
      return max && max.sort || 0;
    },
    address: state => id => state.territory.addresses.find(a => a.id === id),
    error: state => state.error,
  },

  mutations: {
    CHANGE_STATUS(state, { status, publisher, checkoutId }) {
      Vue.set(state.territory, 'status', {
        // eslint-disable-next-line
        checkout_id: checkoutId,
        status,
        date: new Date().getTime(),
        publisher,
      });
    },
    SET_TERRITORY(state, { terr, getLastActivity }) {
      if (terr && terr.addresses && getLastActivity) {
        const addresses = terr.addresses || [];
        for (const address of addresses) {
          address.isBusy = true;
          if (address.phones) {
            const phones = address.phones || [];
            for (const phone of phones) {
              phone.isBusy = true;
            }
          }
        }
      }
      state.territory = terr;
    },
    GET_TERRITORY_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_TERRITORY_FAIL, exception);
    },
    GET_TERRITORY_SUCCESS(state) {
      state.error = null;
    },
    RESET_TERRITORY(state) {
      state.territory = {};
    },
    FETCH_LAST_ACTIVITY(state, cancelToken) {
      state.cancelTokens = { ...state.cancelTokens, FETCH_LAST_ACTIVITY: cancelToken };
    },
    CANCEL_FETCH_LAST_ACTIVITY(state) {
      state.cancelTokens.FETCH_LAST_ACTIVITY = null;
    },
    SET_ADDRESS_LAST_ACTIVITY(state, { addressId, lastActivity }) {
      const addresses = get(state, 'territory.addresses') || [];
      const address = addresses.find(a => a.id === addressId);
      if (address) {
        Vue.set(address, 'lastActivity', lastActivity);
        Vue.set(address, 'isBusy', false);
      }
    },
    SET_PHONE_LAST_ACTIVITY(state, { phoneId, lastActivity }) {
      const addresses = get(state, 'territory.addresses') || [];
      for (const address of addresses) {
        const phone = address.phones && address.phones.find(p => p.id === phoneId);
        if (phone) {
          Vue.set(phone, 'lastActivity', lastActivity);
          Vue.set(phone, 'isBusy', false);
        }
      }
    },
    LOADING_TERRITORY_TRUE(state) {
      Vue.set(state, 'isLoading', true);
      state.territory = { ...initialState.territory };
    },
    LOADING_TERRITORY_FALSE(state) {
      Vue.set(state, 'isLoading', false);
    },
    ADD_TERRITORY(state, cong) {
      state.congregation = cong;
    },
    ADD_TERRITORY_FAIL(state, exception) {
      state.error = exception;
      console.error(ADD_TERRITORY_FAIL, exception);
    },
    UPDATE_TERRITORY(state, cong) {
      state.congregation = cong;
    },
    UPDATE_TERRITORY_FAIL(state, exception) {
      state.error = exception;
      console.error(UPDATE_TERRITORY_FAIL, exception);
    },
    DELETE_TERRITORY() {},
    DELETE_TERRITORY_FAIL(state, exception) {
      state.error = exception;
      console.error(DELETE_TERRITORY_FAIL, exception);
    },
    ADD_ADDRESS(state, newAddress) {
      if (state.territory && state.territory.addresses) {
        const exists = state.territory.addresses.some(a => a.id === newAddress.id);
        if (!exists) {
          newAddress.phones = [];
          newAddress.type = AddressType.Regular;
          state.territory.addresses.push(newAddress);
        }
      }
    },
    ADD_PHONE(state, newPhone) {
      if (state.territory && state.territory.addresses && state.territory.id === newPhone.territory_id) {
        const address = state.territory.addresses.find(a => a.id === newPhone.parent_id);
        const exists = address && address.phones.some(p => p.id === newPhone.id);
        if (address && address.phones && !exists) address.phones.push(newPhone);
      }
    },
    UPDATE_ADDRESS(state, address) {
      if (state.territory && state.territory.addresses) {
        address.id = address.id || address.addressId;
        const origAddress = state.territory.addresses.find(a => a.id === address.id);
        if (origAddress && address) {
          for (const property in address) {
            origAddress[property] = address[property];
          }
        }
      }
    },
    DELETE_ADDRESS(state, address) {
      address.id = address.id || address.addressId;
      if (state.territory && state.territory.addresses) {
        const origAddress = state.territory.addresses.find(a => a.id === address.id);
        if (origAddress && address.status !== AddressStatus.Active) {
          const index = state.territory.addresses.findIndex(a => a.id === address.id);
          state.territory.addresses.splice(index, 1);
        }
      }
    },
    UPDATE_PHONE(state, phone) {
      if (state.territory && state.territory.addresses) {
        const address = state.territory.addresses.find(a => a.id === phone.parent_id);
        const origPhone = address && address.phones.find(p => p.id === phone.id);
        if (origPhone && phone) {
          for (const property in phone) {
            origPhone[property] = phone[property];
          }
        }
      }
    },
    DELETE_PHONE(state, phone) {
      if (state.territory && state.territory.addresses) {
        const address = state.territory.addresses.find(a => a.id === phone.parent_id);
        const origPhone = address && address.phones.find(p => p.id === phone.id);
        if (origPhone && phone.status !== AddressStatus.Active) {
          const index = address.phones.findIndex(p => p.id === phone.id);
          address.phones.splice(index, 1);
        }
      }
    },
    UPDATE_ADDRESS_NOTES(state, { territoryId, addressId, notes }) {
      if (state.territory && state.territory.addresses && state.territory.id === territoryId) {
        const address = state.territory.addresses.find(a => a.id === addressId);
        if (address) address.notes = notes;
      }
    },
    UPDATE_PHONE_NOTES(state, { territoryId, phoneId, notes }) {
      if (state.territory && state.territory.addresses && state.territory.id === territoryId) {
        const address = state.territory.addresses.find(a => a.phones.some(p => p.id === phoneId));
        const phone = address && address.phones.find(p => p.id === phoneId);
        if (phone) phone.notes = notes;
      }
    },
    UPDATE_STATUS(state, status) {
      if (state.territory) state.territory.status = status;
    },
  },

  actions: {
    async checkinTerritory({ commit, dispatch }, args) {
      try {
        if (!args) {
          throw new Error('Unable to check in territory because the required arguments were not provided');
        }

        const response = await axios({
          data: {
            query: print(gql`mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user)
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: get(args, 'publisher.id'),
              user: args.username,
            },
          },
        });

        const checkoutId = get(response, 'data.data.checkinTerritory');
        commit(CHANGE_STATUS, {
          checkoutId,
          status: 'Recently Worked',
          publisher: args.publisher,
        });
        await dispatch('auth/getUserTerritories', args.username, { root: true });
      } catch (e) {
        console.error('Unable to check in territory', e);
      }
    },

    async checkoutTerritory({ commit, dispatch }, args) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user)
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: get(args, 'publisher.id'),
              user: args.username,
            },
          },
        });

        const checkoutId = get(response, 'data.data.checkoutTerritory');
        commit(CHANGE_STATUS, { checkoutId, status: 'Checked Out', publisher: args.publisher });
        await dispatch('auth/getUserTerritories', args.username, { root: true });
      } catch (e) {
        console.error('Unable to checkout territory', e);
      }
    },

    async getTerritory({ commit, getters, rootGetters, dispatch }, { id, getLastActivity }) {
      if (!id) {
        commit(RESET_TERRITORY);
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_TERRITORY_FAIL, 'Token is missing');
        return;
      }

      if (getters.error) {
        console.warn('Token is ready');
      }

      commit(LOADING_TERRITORY_TRUE);

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Territory($terrId: Int) { 
              territory (id: $terrId) {
                id congregationid name description type city group_id
                group {
                  code
                }
                addresses {
                  id addr1 addr2 city state_province postal_code
                  phone longitude latitude notes sort
                  territory_id congregationId status type
                  phones {
                    id
                    congregationId
                    territory_id
                    parent_id
                    type
                    status
                    phone
                    notes
                    sort
                    create_user
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
                lastActivity {
                  id
                  address_id
                  checkout_id
                  value
                  timestamp
                  publisher_id
                }
              }
            }`),
            variables: {
              terrId: id,
            },
          },
        });

        const { territory: terr } = get(response, 'data.data');
        if (terr && terr.addresses) {
          terr.addresses = orderBy(terr.addresses, 'sort');
        }
        commit(SET_TERRITORY, { terr, getLastActivity });
        commit(GET_TERRITORY_SUCCESS);

        if (getLastActivity) {
          await dispatch('fetchLastActivities', terr);
        } else {
          commit(LOADING_TERRITORY_FALSE);
        }
      } catch (exception) {
        commit(GET_TERRITORY_FAIL, exception);
        commit(LOADING_TERRITORY_FALSE);
        console.error(GET_TERRITORY_FAIL, exception);
      }
    },

    async fetchLastActivities({ commit, dispatch, getters }, terr) {
      const tokenSource = axios.CancelToken.source();
      const cancelToken = tokenSource.token;
      commit(FETCH_LAST_ACTIVITY, tokenSource);

      const addresses = terr.addresses || [];
      const checkoutId = get(terr, 'status.checkout_id');
      for (const address of addresses) {
        const phones = address.phones || [];
        for (const phone of phones) {
          await dispatch('phone/fetchLastActivity', { phoneId: phone.id, checkoutId, cancelToken }, { root: true });
          if (getters.isLoading) commit(LOADING_TERRITORY_FALSE);
        }
        await dispatch('address/fetchLastActivity', { addressId: address.id, checkoutId, cancelToken }, { root: true });
        if (getters.isLoading) commit(LOADING_TERRITORY_FALSE);
      }
      commit(LOADING_TERRITORY_FALSE);
    },

    cancelFetchLastActivity({ commit }) {
      commit(CANCEL_FETCH_LAST_ACTIVITY);
    },

    async setTerritory({ commit }, terr) {
      commit(SET_TERRITORY, terr);
    },

    resetTerritory({ commit }) {
      commit(RESET_TERRITORY);
    },

    async resetTerritoryActivities(vuex, { checkoutId, userid, tzOffset, timezone }) {
      try {
        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation ResetTerritoryActivity(
              $checkoutId: Int!,
              $userid: Int!,
              $tzOffset: String,
              $timezone: String
            ) { 
              resetTerritoryActivity(checkout_id: $checkoutId, userid: $userid, tz_offset: $tzOffset, timezone: $timezone)
            }`),
            variables: {
              checkoutId,
              userid,
              tzOffset,
              timezone,
            },
          },
        });
      } catch (e) {
        console.error('Unable to reset territory activities', e);
      }
    },

    setAddressLastActivity({ commit }, { addressId, lastActivity }) {
      commit(SET_ADDRESS_LAST_ACTIVITY, { addressId, lastActivity });
    },

    setPhoneLastActivity({ commit }, { phoneId, lastActivity }) {
      commit(SET_PHONE_LAST_ACTIVITY, { phoneId, lastActivity });
    },

    async getTerritoryInfo({ commit, rootGetters }, { id }) {
      if (!id) {
        commit(GET_TERRITORY_FAIL, 'id is required');
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_TERRITORY_FAIL, 'Token is missing');
        return;
      }

      commit(LOADING_TERRITORY_TRUE);

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Territory($terrId: Int) { 
              territory(id: $terrId) { 
                ...TerritoryModel
              }
            },
            ${model}`),
            variables: {
              terrId: id,
            },
          },
        });

        const { territory: terr } = get(response, 'data.data');
        commit(SET_TERRITORY, { terr });
        commit(GET_TERRITORY_SUCCESS);
        commit(LOADING_TERRITORY_FALSE);
      } catch (exception) {
        commit(GET_TERRITORY_FAIL, exception);
        commit(LOADING_TERRITORY_FALSE);
        console.error(GET_TERRITORY_FAIL, exception);
      }
    },

    async addTerritory({ commit, rootGetters }, _terr) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const terr = validate(_terr);

        if (!user) {
          throw new Error('No authorized user');
        }

        terr.create_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation AddTerritory($territory: TerritoryInput!) { 
              addTerritory(territory: $territory) { 
                ...TerritoryModel
              }
            }
            ${model}`),
            variables: {
              territory: terr,
            },
          },
        });

        const { addTerritory } = get(response, 'data.data');
        commit(ADD_TERRITORY, addTerritory);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(ADD_TERRITORY_FAIL, error);
      }
    },

    async updateTerritory({ commit, rootGetters }, _terr) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const terr = validate(_terr);

        if (!user) {
          throw new Error('No authorized user');
        }

        terr.update_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation UpdateTerritory($territory: TerritoryInput!) { 
              updateTerritory(territory: $territory) { 
                ...TerritoryModel
              }
            }
            ${model}`),
            variables: {
              territory: terr,
            },
          },
        });

        const { updateTerritory } = get(response, 'data.data');
        commit(UPDATE_TERRITORY, updateTerritory);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(UPDATE_TERRITORY_FAIL, error);
      }
    },

    async deleteTerritory({ commit, rootGetters }, id) {
      try {
        if (!id) {
          throw new Error('no id to delete');
        }

        const user = rootGetters['auth/user'];
        if (!user) {
          throw new Error('No authorized user');
        }

        commit('auth/LOADING', true, { root: true });
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation DeleteTerritory($id: Int!) { 
              deleteTerritory(id: $id)
            }`),
            variables: {
              id,
            },
          },
        });


        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        commit(DELETE_TERRITORY);
      } catch (e) {
        commit(DELETE_TERRITORY_FAIL, e);
        throw e;
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },
    addAddress({ commit }, address) {
      commit(ADD_ADDRESS, address);
    },
    updateAddress({ commit }, address) {
      commit(UPDATE_ADDRESS, address);
    },
    deleteAddress({ commit }, address) {
      commit(DELETE_ADDRESS, address);
    },
    addPhone({ commit }, phone) {
      commit(ADD_PHONE, phone);
    },
    updatePhone({ commit }, phone) {
      commit(UPDATE_PHONE, phone);
    },
    deletePhone({ commit }, phone) {
      commit(DELETE_PHONE, phone);
    },
    updateAddressNotes({ commit }, { territoryId, addressId, notes }) {
      commit(UPDATE_ADDRESS_NOTES, { territoryId, addressId, notes });
    },
    updatePhoneNotes({ commit }, { territoryId, phoneId, notes }) {
      commit(UPDATE_PHONE_NOTES, { territoryId, phoneId, notes });
    },
    updateStatus({ commit }, status) {
      const result = status.status === 'Checked Out' ? status : null;
      commit(UPDATE_STATUS, result);
    },
  },
};
