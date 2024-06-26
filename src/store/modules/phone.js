import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import first from 'lodash/first';
import { model as phoneModel, validate, ACTION_BUTTON_LIST } from './models/PhoneModel';
import * as tagUtils from '../../utils/tags';


export const REJECT_TAGS = ['invalid', 'do not call'];

const SET_PHONE = 'SET_PHONE';
const ADD_PHONE = 'ADD_PHONE';
const ADD_PHONE_FAIL = 'ADD_PHONE_FAIL';
const UPDATE_PHONE = 'UPDATE_PHONE';
const UPDATE_PHONE_FAIL = 'UPDATE_PHONE_FAIL';
const ADD_TAG = 'ADD_TAG';
const ADD_TAG_FAIL = 'ADD_TAG_FAIL';
const REMOVE_TAG = 'REMOVE_TAG';
const REMOVE_TAG_FAIL = 'REMOVE_TAG_FAIL';
const PHONE_LOOKUP_SUCCESS = 'PHONE_LOOKUP_SUCCESS';
const PHONE_LOOKUP_FAIL = 'PHONE_LOOKUP_FAIL';
const FETCH_ACTIVITY_LOGS_SUCCESS = 'FETCH_ACTIVITY_LOGS_SUCCESS';
const FETCH_ACTIVITY_LOGS_FAIL = 'FETCH_ACTIVITY_LOGS_FAIL';

export const phone = {
  namespaced: true,
  state: {
    phone: {},
    search: [],
    cancelTokens: {},
  },

  getters: {
    phone: state => state.phone,
    error: state => state.error,
    checkoutInfo: (state, getters, rootState, rootGetters) => {
      const terr = rootGetters['territory/territory'];
      return terr.status;
    },

    actionButtonList: () => ACTION_BUTTON_LIST,

    tags: state => ((state.phone.notes && state.phone.notes
      .toLowerCase()
      .split(',')
      .filter(n => !n.length))
      || []),

    search: state => state.search,
  },

  mutations: {
    SET_PHONE(state, _phone) { state.phone = _phone; },
    ADD_PHONE(state, _phone) { state.phone = _phone; },
    ADD_PHONE_FAIL(state, error) { state.error = error; },
    UPDATE_PHONE(state, _phone) { state.phone = _phone; },
    UPDATE_PHONE_FAIL(state, error) { state.error = error; },
    PHONE_LOOKUP_SUCCESS(state, search) { state.search = search; },
    PHONE_LOOKUP_FAIL(state, exception) { console.error(PHONE_LOOKUP_FAIL, exception); },
    ADD_TAG(state, { phoneId, tag, notes }) {
      if (state.phone.id === phoneId) {
        state.phone.notes = tagUtils.addTag(notes, tag);
      }
    },
    ADD_TAG_FAIL(state, error) { state.error = error; },
    REMOVE_TAG(state, { phoneId, tag, notes }) {
      if (state.phone.id === phoneId) {
        state.phone.notes = tagUtils.removeTag(notes, tag);
      }
    },
    REMOVE_TAG_FAIL(state, error) { state.error = error; },
    FETCH_ACTIVITY_LOGS_FAIL(state, exception) {
      state.error = exception;
    },
    FETCH_ACTIVITY_LOGS_SUCCESS(state, activityLogs) {
      state.error = null;
      state.phone.activityLogs = activityLogs;
    },
  },

  actions: {
    setPhone({ commit }, _phone) {
      commit(SET_PHONE, _phone);
    },


    async fetchActivityLogs({ commit, rootGetters, dispatch }, { addressId, phoneId, checkoutId }) {
      try {
        if (!phoneId) {
          commit(FETCH_ACTIVITY_LOGS_FAIL, 'id is required');
          return;
        }

        dispatch('territory/setPhoneIsBusy', { addressId, phoneId, status: true }, { root: true });

        const territory = rootGetters['territory/territory'];
        const { activityLogs: territoryLogs = [] } = territory;
        const activityLogs = territoryLogs.filter(log => log.address_id === phoneId && log.checkout_id === checkoutId);

        const ordered = orderBy(activityLogs, ['timestamp'], ['desc']);
        const lastActivity = first(ordered);
        commit(FETCH_ACTIVITY_LOGS_SUCCESS, activityLogs);
        dispatch('territory/setPhoneLastActivity', { addressId, phoneId, lastActivity }, { root: true });
        dispatch('territory/setPhoneActivityLogs', { addressId, phoneId, activityLogs }, { root: true });
        dispatch('territory/setPhoneIsBusy', { addressId, phoneId, status: false }, { root: true });
      } catch (e) {
        commit(FETCH_ACTIVITY_LOGS_FAIL, e);
      }
    },

    async addPhone({ commit, dispatch, rootGetters }, _phone) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const p = validate(_phone, true);
        p.create_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation AddPhone($phone: PhoneInput!) {
              addPhone(phone: $phone) {
                ...PhoneModel
              }
            }
            ${phoneModel}`),
            variables: {
              phone: p,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { addPhone } = get(response, 'data.data');
        commit(ADD_PHONE, addPhone);
        dispatch('territory/addPhone', addPhone, { root: true });
      } catch (e) {
        commit(ADD_PHONE_FAIL, e);
        console.error(ADD_PHONE_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updatePhone({ commit, rootGetters, dispatch }, _phone) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const p = validate(_phone);

        if (!user) {
          throw new Error('No authorized user');
        }

        p.update_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation UpdatePhone($phone: PhoneInput!) {
              updatePhone(phone: $phone) {
                ...PhoneModel
              }
            }
            ${phoneModel}`),
            variables: {
              phone: p,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { updatePhone } = get(response, 'data.data');
        commit(UPDATE_PHONE, updatePhone);
        dispatch('territory/updatePhone', updatePhone, { root: true });
      } catch (e) {
        commit(UPDATE_PHONE_FAIL, e);
        console.error(UPDATE_PHONE_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addTag({ commit, dispatch }, { phoneRecord, userid, tag }) {
      try {
        const {
          id: phoneId,
          parent_id: addressId,
          territory_id: territoryId,
        } = phoneRecord || {};

        commit('auth/LOADING', true, { root: true });

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation AddPhoneTag($phoneId: Int!, $userid: Int!, $tag: String!) {
              addPhoneTag(phoneId: $phoneId, userid: $userid, note: $tag)
            }`),
            variables: {
              phoneId,
              userid,
              tag,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { addPhoneTag } = get(response, 'data.data');
        const notes = tagUtils.addTag(phoneRecord.notes, tag);

        if (addPhoneTag) {
          commit(ADD_TAG, {
            phoneId,
            tag,
            notes,
          });

          dispatch('territory/updatePhoneNotes', {
            territoryId,
            addressId,
            phoneId,
            notes,
          }, { root: true });

          dispatch('territory/setPhoneIsBusy', {
            addressId,
            phoneId,
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

    async removeTag({ commit, state }, { phoneId, userid, tag }) {
      try {
        commit('auth/LOADING', true, { root: true });

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation RemoveTag($phoneId: Int!, $userid: Int!, $tag: String!) {
              removePhoneTag(phoneId: $phoneId, userid: $userid, note: $tag)
            }`),
            variables: {
              phoneId,
              userid,
              tag,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { removePhoneTag } = get(response, 'data.data');
        if (removePhoneTag && get(state, 'phone.id') === phoneId) {
          commit(REMOVE_TAG, { phoneId, tag, notes: tagUtils.removeTag(get(state, 'phone.notes'), tag) });
        }
      } catch (e) {
        commit(REMOVE_TAG_FAIL, e);
        console.error(REMOVE_TAG_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async phoneSearch({ commit }, { congId, searchTerm }) {
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
              phones(congId:$congId, keyword: $searchTerm) {
                id
                phone
                notes
                parent_id
                territory {
                  id
                  name
                  description
                  group_id
                }
                address {
                  id
                  addr1
                  addr2
                  city
                  state_province
                  postal_code
                  territory_id
                  status
                }
              }
            }`),
            variables: {
              congId,
              searchTerm,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.phones) {
          return;
        }

        const search = response.data.data.phones;
        commit(PHONE_LOOKUP_SUCCESS, search);
      } catch (exception) {
        commit(PHONE_LOOKUP_FAIL, exception);
      }
    },
  },
};
