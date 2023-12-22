import Vue from 'vue';
import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import maxBy from 'lodash/maxBy';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';
import get from 'lodash/get';
import set from 'lodash/set';
import { model, validate } from './models/TerritoryModel';
import { model as addressModel } from './models/AddressModel';
import { model as phoneModel } from './models/PhoneModel';
import { model as activityModel } from './models/ActivityModel';
import { AddressStatus, AddressType } from '..';

const CHANGE_STATUS = 'CHANGE_STATUS';
const SET_TERRITORY = 'SET_TERRITORY';
const GET_TERRITORY_FAIL = 'GET_TERRITORY_FAIL';
const GET_TERRITORY_SUCCESS = 'GET_TERRITORY_SUCCESS';
const RESET_TERRITORY = 'RESET_TERRITORY';
const RESET_TERRITORY_ACTIVITIES = 'RESET_TERRITORY_ACTIVITIES';
const FETCH_LAST_ACTIVITY = 'FETCH_LAST_ACTIVITY';
const CANCEL_FETCH_LAST_ACTIVITY = 'CANCEL_FETCH_LAST_ACTIVITY';
const FETCH_LAST_ACTIVITY_FAIL = 'FETCH_LAST_ACTIVITY_FAIL';
const FETCH_ACTIVITY_LOGS = 'FETCH_ACTIVITY_LOGS';
const CANCEL_FETCH_ACTIVITY_LOGS = 'CANCEL_FETCH_ACTIVITY_LOGS';
const FETCH_ACTIVITY_LOGS_FAIL = 'FETCH_ACTIVITY_LOGS_FAIL';
const SET_TERRITORY_LAST_ACTIVITY = 'SET_TERRITORY_LAST_ACTIVITY';
const SET_ADDRESS_LAST_ACTIVITY = 'SET_ADDRESS_LAST_ACTIVITY';
const SET_PHONE_LAST_ACTIVITY = 'SET_PHONE_LAST_ACTIVITY';
const SET_ADDRESS_ACTIVITY_LOGS = 'SET_ADDRESS_ACTIVITY_LOGS';
const SET_PHONE_ACTIVITY_LOGS = 'SET_PHONE_ACTIVITY_LOGS';
const ADD_ADDRESS_ACTIVITY_LOG = 'ADD_ADDRESS_ACTIVITY_LOG';
const REMOVE_ADDRESS_ACTIVITY_LOG = 'REMOVE_ADDRESS_ACTIVITY_LOG';
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
const CHECKING_OUT = 'CHECKING_OUT';
const CHECKOUT_FAIL = 'CHECKOUT_FAIL';
const SET_FILTER = 'SET_FILTER';
const SET_ADDRESSES = 'SET_ADDRESSES';

const initialState = {
  territory: {
    id: null,
    name: '',
    description: '',
    addresses: [],
  },
  cancelTokens: {},
  isCheckingOut: false,
  filter: {
    keyword: '',
    exclude: false,
  },
  error: '',
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
    isCheckingOut: state => state.isCheckingOut,
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
    filter: state => state.filter,
  },

  mutations: {
    CHANGE_STATUS(state, args) {
      set(state.territory, 'status', {
        checkout_id: args.checkout_id,
        status: args.status,
        date: new Date().getTime(),
        publisher: args.publisher,
      });
    },
    SET_TERRITORY(state, { terr, getLastActivity }) {
      if (terr && terr.addresses) {
        const addresses = terr.addresses || [];
        for (const address of addresses) {
          if (getLastActivity) address.isBusy = true;

          const phones = get(terr, 'phones', []).filter(p => p.parent_id === address.id);
          address.phones = phones;

          for (const phone of address.phones) {
            if (getLastActivity) phone.isBusy = true;
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
    RESET_TERRITORY_ACTIVITIES(state) {
      if (state.territory) {
        for (const address of state.territory.addresses) {
          address.lastActivity = null;
          for (const phone of address.phones) {
            phone.lastActivity = null;
          }
        }
      }
    },
    FETCH_LAST_ACTIVITY(state, cancelToken) {
      state.cancelTokens = { ...state.cancelTokens, FETCH_LAST_ACTIVITY: cancelToken };
    },
    CANCEL_FETCH_LAST_ACTIVITY(state) {
      state.cancelTokens.FETCH_LAST_ACTIVITY = null;
    },
    FETCH_LAST_ACTIVITY_FAIL(state, exception) {
      state.error = exception;
    },

    FETCH_ACTIVITY_LOGS(state, cancelToken) {
      state.cancelTokens = { ...state.cancelTokens, FETCH_ACTIVITY_LOGS: cancelToken };
      const terr = state.territory;
      if (terr && terr.addresses) {
        const addresses = terr.addresses || [];
        for (const address of addresses) {
          address.isBusy = true;
        }
      }
    },
    CANCEL_FETCH_ACTIVITY_LOGS(state) {
      state.cancelTokens.FETCH_ACTIVITY_LOGS = null;
    },
    FETCH_ACTIVITY_LOGS_FAIL(state, exception) {
      state.error = exception;
    },

    SET_TERRITORY_LAST_ACTIVITY(state, { territoryId, lastActivity }) {
      if (state.territory.id === territoryId) {
        Vue.set(state.territory, 'lastActivity', lastActivity);
        Vue.set(state.territory, 'isBusy', false);
      }
    },
    SET_ADDRESS_LAST_ACTIVITY(state, { addressId, lastActivity }) {
      const addresses = get(state, 'territory.addresses') || [];
      const address = addresses.find(a => a.id === addressId);
      const activity = lastActivity
        || orderBy(get(address, 'activityLogs', []), ['timestamp'], ['desc'])[0];

      if (address) {
        Vue.set(address, 'lastActivity', activity);
        Vue.set(address, 'isBusy', false);
      }
    },
    SET_ADDRESS_ACTIVITY_LOGS(state, { addressId, activityLogs }) {
      const addresses = get(state, 'territory.addresses') || [];
      const address = addresses.find(a => a.id === addressId);
      if (address) {
        Vue.set(address, 'activityLogs', activityLogs);
        Vue.set(address, 'isBusy', false);
      }
    },
    ADD_ADDRESS_ACTIVITY_LOG(state, { addressId, activityLog }) {
      const addresses = get(state, 'territory.addresses') || [];
      const address = addresses.find(a => a.id === addressId) || {};
      const { activityLogs } = address;
      if (activityLogs) {
        activityLogs.push(activityLog);
        // Vue.set(address, 'activityLogs', activityLogs);
      }
    },
    REMOVE_ADDRESS_ACTIVITY_LOG(state, { addressId, logId }) {
      const addresses = get(state, 'territory.addresses') || [];
      const address = addresses.find(a => a.id === addressId) || {};
      const { activityLogs } = address;
      if (activityLogs) {
        const index = activityLogs.findIndex(l => l.id === logId);
        if (index >= 0) {
          activityLogs.splice(index, 1);
        }
        // Vue.set(address, 'activityLogs', activityLogs);
      }
    },
    SET_PHONE_LAST_ACTIVITY(state, { phoneId, lastActivity }) {
      const addresses = get(state, 'territory.addresses') || [];
      for (const address of addresses) {
        for (const phone of address.phones) {
          if (phone.id === phoneId) {
            Vue.set(phone, 'lastActivity', lastActivity);
            Vue.set(phone, 'isBusy', false);
            break;
          }
        }
      }
    },
    SET_PHONE_ACTIVITY_LOGS(state, { phoneId, activityLogs }) {
      const addresses = get(state, 'territory.addresses') || [];
      for (const address of addresses) {
        for (const phone of address.phones) {
          if (phone.id === phoneId) {
            Vue.set(phone, 'activityLogs', activityLogs);
            Vue.set(phone, 'isBusy', false);
            break;
          }
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
      if (state.territory && state.territory.addresses && state.territory.id === newAddress.territory_id) {
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
      if (state.territory && state.territory.addresses && state.territory.id === address.territory_id) {
        address.id = address.id || address.addressId;
        const origAddress = state.territory.addresses.find(a => a.id === address.id);
        if (origAddress && address) {
          for (const property in address) {
            origAddress[property] = address[property];
          }
        } else if (!origAddress) {
          // this is necessary for re-activating non-active addresses
          const sort = address.sort < 0 ? 0 : address.sort;
          state.territory.addresses.splice(sort, 0, address);
        }
      }
    },
    DELETE_ADDRESS(state, address) {
      if (state.territory && state.territory.addresses && state.territory.id === address.territory_id) {
        address.id = address.id || address.addressId;
        const index = state.territory.addresses.findIndex(a => a.id === address.id);
        if (index >= 0) {
          Vue.set(state.territory.addresses[index], 'isBusy', false);
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
        if (address) Vue.set(address, 'notes', notes);
      }
    },
    UPDATE_PHONE_NOTES(state, { territoryId, phoneId, notes }) {
      if (state.territory && state.territory.addresses && state.territory.id === territoryId) {
        const address = state.territory.addresses.find(a => a.phones.some(p => p.id === phoneId));
        const phone = address && address.phones.find(p => p.id === phoneId);
        if (phone) Vue.set(phone, 'notes', notes);
      }
    },
    UPDATE_STATUS(state, status) {
      if (state.territory) state.territory.status = status;
    },
    CHECKING_OUT(state, value) {
      state.isCheckingOut = value;
    },
    CHECKOUT_FAIL(state, error) {
      state.error = error;
    },
    SET_FILTER(state, value) {
      state.filter = value;
    },
    SET_ADDRESSES(state, addresses) {
      if (state.territory) {
        Vue.set(state.territory, 'addresses', addresses);
      }
    },
  },

  actions: {
    async checkinTerritory({ commit, dispatch, rootGetters }, args) {
      try {
        if (!args) {
          throw new Error('Unable to check in territory because the required arguments were not provided');
        }

        const response = await axios({
          data: {
            query: print(gql`mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String, $checkoutId: Int!) {
              checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user, checkoutId: $checkoutId)
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: get(args, 'publisher.id'),
              user: args.username,
              checkoutId: args.checkoutId,
            },
          },
        });

        const checkoutId = get(response, 'data.data.checkinTerritory');
        const cong = rootGetters['auth/congregation'];
        const status = {
          checkout_id: checkoutId,
          status: 'Recently Worked',
          publisher: args.publisher,
          date: args.date,
          campaign: !!cong.currentCampaign,
          campaign_id: get(cong, 'currentCampaign.id') || null,
        };
        commit(CHANGE_STATUS, status);
        dispatch('auth/getUserTerritories', args.username, { root: true });
        dispatch('territories/setStatus', { id: args.territoryId, status }, { root: true });
      } catch (e) {
        console.error('Unable to check in territory', e);
      }
    },

    async checkoutTerritory({ commit, getters, dispatch, rootGetters }, args) {
      commit(CHECKING_OUT, true);
      dispatch('territories/setIsBusy', { id: args.territoryId, value: true }, { root: true });
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
      if (!checkoutId) {
        const error = get(response, 'data.errors[0].message');
        commit(CHECKOUT_FAIL, error);
        commit(CHECKING_OUT, false);
        throw error;
      }

      const cong = rootGetters['auth/congregation'];
      const status = {
        checkout_id: checkoutId,
        status: 'Checked Out',
        publisher: args.publisher,
        date: args.date,
        campaign: !!cong.currentCampaign,
        campaign_id: get(cong, 'currentCampaign.id') || null,
      };

      if (getters.territory.id === args.territoryId) {
        commit(CHANGE_STATUS, status);
      }
      if (args.publisher.username === args.username) {
        dispatch('auth/getUserTerritories', args.username, { root: true });
      }

      commit(CHECKING_OUT, false);
      dispatch('territories/setStatus', { id: args.territoryId, status }, { root: true });
      dispatch('territories/setIsBusy', { id: args.territoryId, value: false }, { root: true });
    },

    async reassignCheckout({ commit, getters, dispatch, rootGetters }, args) {
      try {
        if (!args.checkoutId) throw new Error('checkout id is required');
        commit(CHECKING_OUT, true);
        dispatch('territories/setIsBusy', { id: args.territoryId, value: true }, { root: true });
        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation ReassignCheckout($checkoutId: Int!, $pubId: Int!, $user: String!) {
              reassignCheckout(checkoutId: $checkoutId, publisherId: $pubId, user: $user)
            }`),
            variables: {
              checkoutId: args.checkoutId,
              pubId: get(args, 'publisher.id'),
              user: args.username,
            },
          },
        });

        const cong = rootGetters['auth/congregation'];
        const status = {
          checkout_id: args.checkoutId,
          status: 'Checked Out',
          publisher: args.publisher,
          date: args.date,
          campaign: !!cong.currentCampaign,
          campaign_id: get(cong, 'currentCampaign.id') || null,
        };

        if (getters.territory.id === args.territoryId) {
          commit(CHANGE_STATUS, status);
        }
        if (args.publisher.username === args.username) {
          await dispatch('auth/getUserTerritories', args.username, { root: true });
        }

        commit(CHECKING_OUT, false);
        dispatch('territories/setStatus', { id: args.territoryId, status }, { root: true });
        dispatch('territories/setIsBusy', { id: args.territoryId, value: false }, { root: true });
      } catch (e) {
        console.error('Unable to reassign territory checkout', e);
      }
    },

    async unassignCheckout({ dispatch }, args) {
      try {
        if (!args.checkoutId) throw new Error('checkout id is required');
        if (!args.territoryId) throw new Error('territory id is required');
        dispatch('territories/setIsBusy', { id: args.territoryId, value: true }, { root: true });
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation UnassignCheckout($checkoutId: Int!, $territoryId: Int!) {
              unassignCheckout(checkoutId: $checkoutId, territoryId: $territoryId) {
                ...TerritoryModel
              }
            },
            ${model}`),
            variables: {
              checkoutId: args.checkoutId,
              territoryId: args.territoryId,
            },
          },
        });

        const { unassignCheckout: terr } = get(response, 'data.data');
        dispatch('territories/setStatus', { id: args.territoryId, status: get(terr, 'status') }, { root: true });
        dispatch('territories/setIsBusy', { id: args.territoryId, value: false }, { root: true });
      } catch (e) {
        console.error('Unable to unassign territory', e);
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
                  ...AddressModel
                }
                phones {
                  ...PhoneModel
                }
                status {
                  checkout_id
                  status
                  date
                  publisher {
                    id username firstname lastname
                  }
                  campaign
                  campaign_id
                }
                lastActivity {
                  ...ActivityModel
                }
              }
            }
            ${addressModel}
            ${phoneModel}
            ${activityModel}`),
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

    async fetchLastActivities({ commit }, terr) {
      const tokenSource = axios.CancelToken.source();
      const cancelToken = tokenSource.token;
      commit(FETCH_LAST_ACTIVITY, tokenSource);

      const addresses = get(terr, 'addresses') || [];
      const checkoutId = get(terr, 'status.checkout_id');

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          cancelToken,
          data: {
            query: print(gql`query Territory($territoryId: Int $checkoutId: Int) {
              territory(id: $territoryId) {
                lastActivities(checkout_id: $checkoutId) {
                  ...ActivityModel
                }
              }
            }
            ${activityModel}`),
            variables: {
              territoryId: terr.id,
              checkoutId,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }

        const { lastActivities = [] } = get(response, 'data.data.territory') || {};

        for (const address of addresses) {
          let lastActivity = lastActivities.find(l => l.address_id === address.id);
          commit(SET_ADDRESS_LAST_ACTIVITY, { addressId: address.id, lastActivity });
          const phones = address.phones || [];
          for (const phone of phones) {
            lastActivity = lastActivities.find(l => l.address_id === phone.id);
            commit(SET_PHONE_LAST_ACTIVITY, { phoneId: phone.id, lastActivity });
          }
        }
        commit(LOADING_TERRITORY_FALSE);
      } catch (e) {
        commit(FETCH_LAST_ACTIVITY_FAIL, e);
        commit(LOADING_TERRITORY_FALSE);
      }
    },

    cancelFetchLastActivity({ commit }) {
      commit(CANCEL_FETCH_LAST_ACTIVITY);
    },

    cancelFetchActivityLogs({ commit }) {
      commit(CANCEL_FETCH_ACTIVITY_LOGS);
    },

    async setTerritory({ commit }, terr) {
      commit(SET_TERRITORY, terr);
    },

    resetTerritory({ commit }) {
      commit(RESET_TERRITORY);
    },

    async resetTerritoryActivities({ commit }, { checkoutId, userid, tzOffset, timezone }) {
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
        commit(RESET_TERRITORY_ACTIVITIES);
      } catch (e) {
        console.error('Unable to reset territory activities', e);
      }
    },

    setTerritoryLastActivity({ commit }, { territoryId, lastActivity }) {
      commit(SET_TERRITORY_LAST_ACTIVITY, { territoryId, lastActivity });
    },

    setAddressLastActivity({ commit }, { addressId, lastActivity }) {
      commit(SET_ADDRESS_LAST_ACTIVITY, { addressId, lastActivity });
    },

    setAddressActivityLogs({ commit }, { addressId, activityLogs }) {
      commit(SET_ADDRESS_ACTIVITY_LOGS, { addressId, activityLogs });
    },

    addAddressActivityLog({ commit }, { addressId, activityLog }) {
      commit(ADD_ADDRESS_ACTIVITY_LOG, { addressId, activityLog });
    },

    removeAddressActivityLog({ commit }, { addressId, logId }) {
      commit(REMOVE_ADDRESS_ACTIVITY_LOG, { addressId, logId });
    },

    setPhoneLastActivity({ commit }, { phoneId, lastActivity }) {
      commit(SET_PHONE_LAST_ACTIVITY, { phoneId, lastActivity });
    },

    setPhoneActivityLogs({ commit }, { phoneId, activityLogs }) {
      commit(SET_PHONE_ACTIVITY_LOGS, { phoneId, activityLogs });
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
    setFilter({ commit }, filter) {
      commit(SET_FILTER, filter);
    },
    reorderAddresses({ state, commit }, { sortList = [], revert }) {
      const ordered = sortBy(state.territory.addresses, (address) => {
        const sortedIndex = sortList.findIndex(o => o.id === address.id);
        const sortOrder = sortedIndex === -1 ? 999 : (sortedIndex + 1);
        return revert ? address.sort : sortOrder;
      });

      commit(SET_ADDRESSES, ordered);
    },

    fetchActivityLogs({ state, commit, dispatch }, { checkoutId }) {
      const tokenSource = axios.CancelToken.source();
      const cancelToken = tokenSource.token;
      commit(FETCH_ACTIVITY_LOGS, tokenSource);

      try {
        const { addresses = [] } = state.territory || {};
        addresses.forEach((address) => {
          dispatch('address/fetchActivityLogs', {
            addressId: address.id,
            checkoutId,
            cancelToken,
          }, {
            root: true,
          });
        });
      } catch (e) {
        commit(FETCH_ACTIVITY_LOGS_FAIL, e);
      }
    },
  },
};
