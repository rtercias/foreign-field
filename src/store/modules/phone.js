import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import clone from 'lodash/clone';
import get from 'lodash/get';
import { InvalidPhoneError } from '../exceptions/custom-errors';
import { model as activityModel } from './models/ActivityModel';

const phoneModel = gql`fragment PhoneModel on Phone {
  id
  congregationId
  parent_id
  territory_id
  type
  status
  phone
  notes
  sort
  create_user
  create_date
  update_user
  update_date
}`;

export const PHONE_STATUS = {
  Active: 'Active',
  NF: 'NF',
  DNC: 'DNC',
};

export const REJECT_TAGS = ['invalid', 'do not call'];

const SET_PHONE = 'SET_PHONE';
const ADD_PHONE = 'ADD_PHONE';
const UPDATE_PHONE = 'UPDATE_PHONE';
const ADD_TAG = 'ADD_TAG';
const REMOVE_TAG = 'REMOVE_TAG';
const PHONE_LOOKUP_SUCCESS = 'PHONE_LOOKUP_SUCCESS';
const PHONE_LOOKUP_FAIL = 'PHONE_LOOKUP_FAIL';
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
    value: 'NA',
    text: '',
    icon: 'comment-slash',
    color: 'warning',
    description: 'No Answer',
  },
  {
    type: 'fa-icon',
    value: 'CT',
    text: '',
    icon: 'comment',
    color: 'primary',
    description: 'Contacted',
  },
  {
    type: 'fa-icon',
    value: 'VM',
    text: '',
    icon: 'voicemail',
    color: 'primary',
    description: 'Voicemail',
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
    value: 'invalid',
    text: '',
    icon: 'phone-slash',
    color: 'danger',
    description: 'Invalid',
  },
  {
    type: 'fa-icon',
    value: 'do not call',
    text: '',
    icon: 'minus-circle',
    color: 'danger',
    description: 'Do Not Call',
  },
  {
    type: 'fa-icon',
    value: 'confirmed',
    text: '',
    icon: 'check',
    color: 'primary',
    description: 'Confirmed',
  },
];

function validatePhone(_phone, isNew) {
  const phone = clone(_phone);

  if (isNew && phone.id) {
    throw new InvalidPhoneError('Phone ID must be empty when adding a new phone');
  }
  if (!phone.congregationId) {
    throw new InvalidPhoneError('Congregation ID is required');
  }
  if (!phone.territory_id) {
    throw new InvalidPhoneError('Territory ID is required');
  }
  if (!Number.isInteger(phone.sort)) {
    phone.sort = 0;
  }
  if (!phone.phone) {
    throw new InvalidPhoneError('Phone is required');
  }
  if (phone.notes === null) {
    phone.notes = '';
  }

  const ignoredProperties = [
    'activityLogs', 'lastActivity', 'incomingResponse', 'selectedResponse', 'selectedResponseTS',
    'isBusy', 'editMode', 'create_date', 'update_date',
  ];

  for (const ignored of ignoredProperties) {
    if (ignored in phone) {
      delete phone[ignored];
    }
  }

  return phone;
}

export const phone = {
  namespaced: true,
  state: {
    phone: {},
    search: [],
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
    SET_PHONE(state, _phone) {
      state.phone = _phone;
    },

    ADD_PHONE(state, _phone) {
      state.phone = _phone;
    },

    UPDATE_PHONE(state, _phone) {
      state.phone = _phone;
    },

    CHANGE_STATUS(state, status) {
      state.phone.status = status;
    },

    ADD_TAG(state, tag) {
      const arrTags = (state.phone.notes && state.phone.notes.split(',')) || [];
      arrTags.push(tag);
      state.phone.notes = arrTags.join(',');
    },

    REMOVE_TAG(state, tag) {
      const arrTags = (state.phone.notes && state.phone.notes.split(',')) || [];
      const newTags = arrTags.filter(t => t !== tag);
      state.phone.notes = newTags.join(',');
    },

    PHONE_LOOKUP_SUCCESS(state, search) {
      state.search = search;
    },
    PHONE_LOOKUP_FAIL(state, exception) {
      console.error(PHONE_LOOKUP_FAIL, exception);
    },
    FETCH_LAST_ACTIVITY_FAIL(state, exception) {
      state.error = exception;
      console.error(FETCH_LAST_ACTIVITY_FAIL, exception);
    },
  },

  actions: {
    setPhone({ commit }, _phone) {
      commit(SET_PHONE, _phone);
    },

    async fetchLastActivity({ commit, dispatch }, { phoneId }) {
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
          data: {
            query: print(gql`query Phone($phoneId: Int) {
              phone(id: $phoneId) {
                lastActivity {
                  ...ActivityModel
                }
              }
            }
            ${activityModel}`),
            variables: {
              phoneId,
            },
          },
        });

        const { lastActivity } = get(response, 'data.data.phone') || {};
        dispatch('territory/setPhoneLastActivity', { phoneId, lastActivity }, { root: true });
      } catch (e) {
        console.error(`Unable to fetch last activity for phone id ${phoneId}.`, e);
      }
    },

    async addPhone({ commit, rootGetters }, _phone) {
      commit('auth/LOADING', true, { root: true });

      const user = rootGetters['auth/user'];
      const p = validatePhone(_phone, true);
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

      if (response && response.data && response.data.data) {
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }
        const { addPhone } = response.data.data;
        commit(ADD_PHONE, addPhone);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async updatePhone({ commit, rootGetters }, _phone) {
      commit('auth/LOADING', true, { root: true });

      const user = rootGetters['auth/user'];
      const p = validatePhone(_phone);

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

      if (response && response.data && response.data.data) {
        const { updatePhone } = response.data.data;
        commit(UPDATE_PHONE, updatePhone);
        commit('auth/LOADING', false, { root: true });
      }
    },

    async addTag({ commit }, { phoneId, userid, tag }) {
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

      if (response && response.data && response.data.data) {
        const { addPhoneTag } = response.data.data;
        if (addPhoneTag) {
          commit(ADD_TAG, tag);
        }
        commit('auth/LOADING', false, { root: true });
      }
    },

    async removeTag({ commit }, { phoneId, userid, tag }) {
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

      if (response && response.data && response.data.data) {
        const { removePhoneTag } = response.data.data;
        if (removePhoneTag) {
          commit(REMOVE_TAG, tag);
        }
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
                  group_code
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
