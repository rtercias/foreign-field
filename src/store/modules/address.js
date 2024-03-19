import Vue from 'vue';
import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import first from 'lodash/first';
import format from 'date-fns/format';
import addYears from 'date-fns/addYears';
import {
  model as addressModel,
  validate,
  isCity,
  ACTION_BUTTON_LIST,
  ADDRESS_STATUS,
} from './models/AddressModel';
import { model as activityModel, createActivityLog } from './models/ActivityModel';
import * as tagUtils from '../../utils/tags';

const FETCH_ADDRESS = 'FETCH_ADDRESS';
const SET_ADDRESS = 'SET_ADDRESS';
const ADD_LOG = 'ADD_LOG';
const REMOVE_LOG = 'REMOVE_LOG';
const ADD_ADDRESS = 'ADD_ADDRESS';
const UPDATE_ADDRESS = 'UPDATE_ADDRESS';
const DELETE_ADDRESS = 'DELETE_ADDRESS';
const CHANGE_STATUS = 'CHANGE_STATUS';
const ADD_TAG = 'ADD_TAG';
const REMOVE_TAG = 'REMOVE_TAG';
const UPDATE_GEOCODE = 'UPDATE_GEOCODE';
const FETCH_LAST_ACTIVITY_SUCCESS = 'FETCH_LAST_ACTIVITY_SUCCESS';
const FETCH_LAST_ACTIVITY_FAIL = 'FETCH_LAST_ACTIVITY_FAIL';
const FETCH_ACTIVITY_LOGS_SUCCESS = 'FETCH_ACTIVITY_LOGS_SUCCESS';
const FETCH_ACTIVITY_LOGS_FAIL = 'FETCH_ACTIVITY_LOGS_FAIL';
const FETCH_ADDRESS_FAIL = 'FETCH_ADDRESS_FAIL';
const ADD_ADDRESS_FAIL = 'ADD_ADDRESS_FAIL';
const UPDATE_ADDRESS_FAIL = 'UPDATE_ADDRESS_FAIL';
const DELETE_ADDRESS_FAIL = 'DELETE_ADDRESS_FAIL';
const LOG_FAIL = 'LOG_FAIL';
const ADD_TAG_FAIL = 'ADD_TAG_FAIL';
const REMOVE_TAG_FAIL = 'REMOVE_TAG_FAIL';
const CHANGE_STATUS_FAIL = 'CHANGE_STATUS_FAIL';
const UPDATE_GEOCODE_FAIL = 'UPDATE_GEOCODE_FAIL';

export const address = {
  namespaced: true,
  state: {
    address: {},
    cancelTokens: {},
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
    FETCH_ADDRESS(state, addr) { state.address = addr; },
    FETCH_ADDRESS_FAIL(state, error) { state.error = error; },
    SET_ADDRESS(state, addr) { state.address = addr; },
    LOG_FAIL(state, error) { state.error = error; },
    ADD_ADDRESS(state, addr) { state.address = addr; },
    UPDATE_ADDRESS(state, addr) { state.address = addr; },
    DELETE_ADDRESS() {},
    DELETE_ADDRESS_FAIL(state, exception) {
      state.error = exception;
    },
    CHANGE_STATUS(state, { addr, tag }) {
      if (addr && get(state, 'address.id') === addr.id) {
        state.address.status = addr.status;
        state.address.notes = tagUtils.addTag(state.address.notes, tag);
      }
    },
    ADD_LOG(state, log) {
      if (state.address.id === log.address_id) {
        if (state.address.activityLogs && state.address.activityLogs.length) {
          state.address.activityLogs.push(log);
        } else {
          state.address.activityLogs = [log];
          Vue.set(address, 'lastActivity', log);
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
    ADD_TAG(state, { addressId, tag, notes }) {
      if (state.address.id === addressId) {
        state.address.notes = tagUtils.addTag(notes, tag);
      }
    },

    REMOVE_TAG(state, { addressId, tag, notes }) {
      if (state.address.id === addressId) {
        state.address.notes = tagUtils.removeTag(notes, tag);
      }
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
    },
    FETCH_LAST_ACTIVITY_SUCCESS(state, lastActivity) {
      state.error = null;
      state.address.lastActivity = lastActivity;
    },
    FETCH_ACTIVITY_LOGS_FAIL(state, exception) {
      state.error = exception;
    },
    FETCH_ACTIVITY_LOGS_SUCCESS(state, activityLogs) {
      state.error = null;
      state.address.activityLogs = activityLogs;
    },
  },

  actions: {
    setAddress({ commit }, addr) {
      commit(SET_ADDRESS, addr);
    },

    async fetchAddress({ commit }, { addressId, checkoutId, status }) {
      try {
        commit('auth/LOADING', true, { root: true });

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`query Address($addressId: Int $checkoutId: Int $status: String) {
              address(id: $addressId, status: $status) {
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
              status,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }

        const { address: addr } = get(response, 'data.data');
        commit(FETCH_ADDRESS, addr);
        commit('auth/LOADING', false, { root: true });
      } catch (e) {
        commit(FETCH_ADDRESS_FAIL, e);
        console.error(FETCH_ADDRESS_FAIL, e);
      }
    },

    async fetchLastActivity({ commit, dispatch }, { addressId, checkoutId, cancelToken }) {
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
          cancelToken,
          data: {
            query: print(gql`query Address($addressId: Int $checkoutId: Int) {
              address(id: $addressId) {
                lastActivity(checkout_id: $checkoutId) {
                  ...ActivityModel
                }
              }
            }
            ${activityModel}`),
            variables: {
              addressId,
              checkoutId,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }

        const { lastActivity } = get(response, 'data.data.address') || {};
        dispatch('territory/setAddressLastActivity', { addressId, lastActivity }, { root: true });
      } catch (e) {
        commit(FETCH_LAST_ACTIVITY_FAIL, e);
      }
    },

    async fetchActivityLogs({ commit, rootGetters, dispatch }, { addressId, checkoutId }) {
      try {
        if (!addressId) {
          commit(FETCH_ACTIVITY_LOGS_FAIL, 'id is required');
          return;
        }

        dispatch('territory/setAddressIsBusy', { addressId, status: true }, { root: true });

        const territory = rootGetters['territory/territory'];
        const { activityLogs: territoryLogs = [] } = territory;
        const activityLogs = territoryLogs.filter(log => log.address_id === addressId && log.checkout_id === checkoutId);

        const ordered = orderBy(activityLogs, ['timestamp'], ['desc']);
        const lastActivity = first(ordered);
        dispatch('territory/setAddressLastActivity', { addressId, lastActivity }, { root: true });
        dispatch('territory/setAddressActivityLogs', { addressId, activityLogs }, { root: true });
        dispatch('territory/setAddressIsBusy', { addressId, status: false }, { root: true });
        commit(FETCH_ACTIVITY_LOGS_SUCCESS, activityLogs);
      } catch (e) {
        commit(FETCH_ACTIVITY_LOGS_FAIL, e);
      }
    },

    async addLog({ commit, rootGetters, dispatch }, { entityId, value, checkoutId, parentId, type }) {
      try {
        const user = rootGetters['auth/user'];
        const activityLog = createActivityLog(0, entityId, value, checkoutId, user);

        // temporarily commit the new log to update the display
        commit(ADD_LOG, activityLog);
        dispatch('territory/addAddressActivityLog', {
          addressId: entityId,
          activityLog: { ...activityLog, timestamp: Date.now() },
        }, { root: true });
        dispatch('territory/addPhoneActivityLog', {
          phoneId: entityId,
          addressId: parentId,
          activityLog: { ...activityLog, timestamp: Date.now() },
        }, { root: true });

        commit('auth/LOADING', true, { root: true });
        dispatch('territory/setAddressIsBusy', { addressId: entityId, status: true }, { root: true });

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

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }

        // remove the temporary log
        commit(REMOVE_LOG, { id: 0, addressId: entityId });
        dispatch('territory/removeAddressActivityLog', {
          addressId: entityId,
          logId: 0,
        }, { root: true });
        dispatch('territory/removePhoneActivityLog', {
          phoneId: entityId,
          addressId: parentId,
          logId: 0,
        }, { root: true });

        // commit the permanent new log record
        const { addLog } = get(response, 'data.data') || {};
        commit(ADD_LOG, addLog);

        if (type === 'Regular') {
          dispatch('territory/setAddressLastActivity', {
            addressId: entityId,
            lastActivity: addLog,
          }, { root: true });
          dispatch('territory/addAddressActivityLog', {
            addressId: entityId,
            activityLog: addLog,
          }, { root: true });
          dispatch('territory/setAddressIsBusy', {
            addressId: entityId,
            status: false,
          }, { root: true });
        } else if (type === 'Phone') {
          dispatch('territory/setPhoneLastActivity', {
            phoneId: entityId,
            addressId: parentId,
            lastActivity: addLog,
          }, { root: true });
          dispatch('territory/addPhoneActivityLog', {
            phoneId: entityId,
            addressId: parentId,
            activityLog: addLog,
          }, { root: true });
          dispatch('territory/setPhoneIsBusy', {
            phoneId: entityId,
            addressId: parentId,
            status: false,
          }, { root: true });
        }
        commit(FETCH_LAST_ACTIVITY_SUCCESS, addLog);
      } catch (e) {
        commit(LOG_FAIL, e);
        console.error(LOG_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async removeLog({ commit, dispatch }, { id, entityId, parentId, type }) {
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

        if (type === 'Regular') {
          dispatch(
            'territory/removeAddressActivityLog',
            { addressId: entityId, logId: id },
            { root: true },
          );

          dispatch(
            'territory/setAddressLastActivity',
            { addressId: entityId },
            { root: true },
          );
        } else if (type === 'Phone') {
          dispatch(
            'territory/removePhoneActivityLog',
            { addressId: parentId, phoneId: entityId, logId: id },
            { root: true },
          );

          dispatch(
            'territory/setPhoneLastActivity',
            { phoneId: entityId, addressId: parentId },
            { root: true },
          );
        }
      } catch (e) {
        commit(LOG_FAIL, e);
      }

      commit('auth/LOADING', false, { root: true });
    },
    async addAddress({ commit, rootGetters, dispatch }, _address) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const addr = validate(_address, true);
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

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }

        const { addAddress } = get(response, 'data.data');
        commit(ADD_ADDRESS, addAddress);
        dispatch('territory/addAddress', addAddress, { root: true });
      } catch (e) {
        commit(ADD_ADDRESS_FAIL, e);
        console.error(ADD_ADDRESS_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updateAddress({ commit, rootGetters, dispatch }, _address) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const addr = validate(_address);

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


        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { updateAddress } = get(response, 'data.data');
        commit(UPDATE_ADDRESS, updateAddress);
        dispatch('territory/updateAddress', _address, { root: true });
      } catch (e) {
        commit(UPDATE_ADDRESS_FAIL, e);
        console.error(UPDATE_ADDRESS_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async deleteAddress({ commit, rootGetters, dispatch }, id) {
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
            query: print(gql`mutation DeleteAddress($id: Int!) {
              deleteAddress(id: $id)
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
        commit(DELETE_ADDRESS);
        dispatch('territory/deleteAddress', { id }, { root: true });
      } catch (e) {
        commit(DELETE_ADDRESS_FAIL, e);
        console.error(DELETE_ADDRESS_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async markAsNotForeign({ commit }, { addressId, userid, tag }) {
      try {
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
              status: ADDRESS_STATUS.NF.value,
              userid,
              tag,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { changeAddressStatus } = get(response, 'data.data');
        if (changeAddressStatus) {
          commit(CHANGE_STATUS, { addressId, status: ADDRESS_STATUS.NF.value, userid }, tag);
        }
      } catch (e) {
        commit(CHANGE_STATUS_FAIL, e);
        console.error(CHANGE_STATUS_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async markAsDoNotCall({ commit, dispatch }, { addr, userid, tag }) {
      try {
        commit('auth/LOADING', true, { root: true });
        const { id: addressId } = addr;
        const status = tag.caption || tag;
        const datestamped = `${status} until ${format(addYears(new Date(), 1), 'P')}`;

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
              status: ADDRESS_STATUS.Active.value,
              userid,
              tag: datestamped,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { changeAddressStatus } = get(response, 'data.data');
        if (changeAddressStatus) {
          dispatch('territory/setAddressIsBusy', { addressId, status: false }, { root: true });
          dispatch('territory/updateAddressNotes', {
            territoryId: addr.territory_id,
            addressId: addr.id,
            notes: tagUtils.addTag(addr.notes, datestamped),
          }, {
            root: true,
          });
          commit(CHANGE_STATUS, { addressId, status: ADDRESS_STATUS.DNC.value, userid }, datestamped);
        }
      } catch (e) {
        commit(CHANGE_STATUS_FAIL, e);
        console.error(CHANGE_STATUS_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addTag({ commit, dispatch }, { addr, userid, tag }) {
      try {
        const { id: addressId, territory_id: territoryId } = addr || {};
        commit('auth/LOADING', true, { root: true });
        dispatch('territory/setAddressIsBusy', {
          addressId,
          status: true,
        }, { root: true });

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

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }

        const { addNote } = get(response, 'data.data');
        const notes = tagUtils.addTag(addr.notes, tag);

        if (addNote) {
          commit(ADD_TAG, {
            addressId,
            tag,
            notes,
          });

          dispatch('territory/updateAddressNotes', {
            territoryId,
            addressId,
            notes,
          }, { root: true });

          dispatch('territory/setAddressIsBusy', {
            addressId,
            status: false,
          }, { root: true });
        }
      } catch (e) {
        commit(ADD_TAG_FAIL, e);
        console.error(ADD_TAG_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async removeTag({ commit, state }, { addressId, userid, tag }) {
      try {
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
        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { removeNote } = get(response, 'data.data');
        if (removeNote && get(state, 'address.id') === addressId) {
          commit(REMOVE_TAG, { addressId, tag, notes: tagUtils.removeTag(get(state, 'address.notes'), tag) });
        }
      } catch (e) {
        commit(REMOVE_TAG_FAIL, e);
        console.error(REMOVE_TAG_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addressLookup({ commit }, fullAddress) {
      try {
        const instance = axios.create();
        const key = process.env.VUE_APP_GOOGLE_MAPS_API;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${fullAddress}&key=${key}`;
        delete instance.defaults.headers.common.Authorization;
        const response = await instance.get(url);

        if (response && response.data) {
          const { geometry, address_components: addressComponent } = get(response, 'data.results[0]', {});
          if (geometry) {
            const country = addressComponent.find(c => c.types.includes('country')) || {};
            const streetNumber = addressComponent.find(c => c.types.includes('street_number')) || {};
            const route = addressComponent.find(c => c.types.includes('route')) || {};
            const city = addressComponent.find(c => isCity(c.types)) || {};
            const stateProvince = addressComponent.find(c => c.types.includes('administrative_area_level_1')) || {};
            const zip = addressComponent.find(c => c.types.includes('postal_code')) || {};
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
        commit(UPDATE_GEOCODE_FAIL, err);
        console.error(UPDATE_GEOCODE_FAIL, err);
      }
    },
  },
};
