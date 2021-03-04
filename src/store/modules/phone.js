import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import { model as phoneModel, validate, ACTION_BUTTON_LIST } from './models/PhoneModel';
import { model as activityModel } from './models/ActivityModel';


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
const FETCH_LAST_ACTIVITY_FAIL = 'FETCH_LAST_ACTIVITY_FAIL';

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
    ADD_TAG(state, { phoneId, tag }) {
      if (state.phone.id === phoneId) {
        const arrTags = (state.phone.notes && state.phone.notes.split(',')) || [];
        arrTags.push(tag);
        state.phone.notes = arrTags.join(',');
      }
    },
    ADD_TAG_FAIL(state, error) { state.error = error; },
    REMOVE_TAG(state, { phoneId, tag }) {
      if (state.phone.id === phoneId) {
        const arrTags = (state.phone.notes && state.phone.notes.split(',')) || [];
        const newTags = arrTags.filter(t => t !== tag);
        state.phone.notes = newTags.join(',');
      }
    },
    REMOVE_TAG_FAIL(state, error) { state.error = error; },
    FETCH_LAST_ACTIVITY_FAIL(state, exception) {
      state.error = exception;
    },
  },

  actions: {
    setPhone({ commit }, _phone) {
      commit(SET_PHONE, _phone);
    },

    async fetchLastActivity({ commit, dispatch }, { phoneId, checkoutId, cancelToken }) {
      try {
        if (!phoneId) {
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
            query: print(gql`query Phone($phoneId: Int $checkoutId: Int) {
              phone(id: $phoneId) {
                lastActivity(checkout_id: $checkoutId) {
                  ...ActivityModel
                }
              }
            }
            ${activityModel}`),
            variables: {
              phoneId,
              checkoutId,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { lastActivity } = get(response, 'data.data.phone') || {};
        dispatch('territory/setPhoneLastActivity', { phoneId, lastActivity }, { root: true });
      } catch (e) {
        commit(FETCH_LAST_ACTIVITY_FAIL, e);
      }
    },

    async addPhone({ commit, rootGetters }, _phone) {
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
      } catch (e) {
        commit(ADD_PHONE_FAIL, e);
        console.error(ADD_PHONE_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updatePhone({ commit, rootGetters }, _phone) {
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
      } catch (e) {
        commit(UPDATE_PHONE_FAIL, e);
        console.error(UPDATE_PHONE_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addTag({ commit }, { phoneId, userid, tag }) {
      try {
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
        if (addPhoneTag) {
          commit(ADD_TAG, { phoneId, tag });
        }
      } catch (e) {
        commit(ADD_TAG_FAIL, e);
        console.error(ADD_TAG_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },

    async removeTag({ commit }, { phoneId, userid, tag }) {
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
        if (removePhoneTag) {
          commit(REMOVE_TAG, { phoneId, tag });
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
