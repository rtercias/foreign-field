import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import clone from 'lodash/clone';
import { InvalidPhoneError } from '../exceptions/custom-errors';

const model = gql`fragment Model on Phone {
  id
  congregationId
  parentId: parent_id
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
  lastActivity {
    value
    timestamp
    publisher_id
  }
}`;

export const PHONE_STATUS = {
  Active: 'Active',
  NF: 'NF',
  DNC: 'DNC',
};

const SET_PHONE = 'SET_PHONE';
const ADD_PHONE = 'ADD_PHONE';
const UPDATE_PHONE = 'UPDATE_PHONE';
const ADD_TAG = 'ADD_TAG';
const REMOVE_TAG = 'REMOVE_TAG';

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
    value: 'CNFRM',
    text: '',
    icon: 'comment',
    icon2: 'check',
    color: 'primary',
    description: 'Confirmed',
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
  },
  {
    type: 'fa-icon',
    value: 'INVLD',
    text: '',
    icon: 'phone-slash',
    color: 'danger',
    description: 'Invalid',
  },
  {
    type: 'fa-icon',
    value: 'DNC',
    text: '',
    icon: 'minus-circle',
    color: 'danger',
    description: 'Do Not Call',
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

  if ('activityLogs' in phone) {
    delete phone.activityLogs;
  }

  if ('lastActivity' in phone) {
    delete phone.lastActivity;
  }

  if ('incomingResponse' in phone) {
    delete phone.incomingResponse;
  }

  if ('selectedResponse' in phone) {
    delete phone.selectedResponse;
  }

  if ('selectedResponseTS' in phone) {
    delete phone.selectedResponseTS;
  }

  return phone;
}

export const phone = {
  namespaced: true,
  state: {
    phone: {},
  },

  getters: {
    phone: state => state.phone,

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
  },

  mutations: {
    SET_PHONE(state, _phone) {
      state.phone = _phone;
    },

    ADD_LOG(state, log) {
      if (state.phone.id === log.address_id) {
        state.phone.activityLogs.push(log);
      }
    },

    UPDATE_LOG(state, log) {
      if (state.phone.id === log.address_id) {
        const index = state.phone.activityLogs.findIndex(a => a.id === log.id);
        if (index !== -1) {
          state.phone.activityLogs.splice(index, 1, log);
        }
      }
    },

    REMOVE_LOG(state, { id, addressId }) {
      if (state.phone.id === addressId) {
        const index = state.phone.activityLogs.findIndex(a => a.id === id);
        if (index !== -1) {
          state.phone.activityLogs.splice(index, 1);
        }
      }
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
  },

  actions: {
    setPhone({ commit }, _phone) {
      commit(SET_PHONE, _phone);
    },

    async fetchPhone({ commit }, phoneId) {
      commit('auth/LOADING', true, { root: true });

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query Phone($phoneId: Int) { 
            phone(id: $phoneId) { 
              ...Model
            }
          }
          ${model}`),
          variables: {
            phoneId,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const { phone: p } = response.data.data;
        commit(SET_PHONE, p);
        commit('auth/LOADING', false, { root: true });
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
              ...Model
            }
          }
          ${model}`),
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
              ...Model
            }
          }
          ${model}`),
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
  },
};
