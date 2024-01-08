import Vue from 'vue';
import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import { model, validate } from './models/CongregationModel';
import { ADDRESS_TAGS, PHONE_ADDRESS_TAGS } from '../../utils/tags';

const SET_CONGREGATION = 'SET_CONGREGATION';
const ADD_CONGREGATION = 'ADD_CONGREGATION';
const ADD_CONGREGATION_FAIL = 'ADD_CONGREGATION_FAIL';
const UPDATE_CONGREGATION = 'UPDATE_CONGREGATION';
const UPDATE_CONGREGATION_FAIL = 'UPDATE_CONGREGATION_FAIL';
const GET_CONGREGATION_FAIL = 'GET_CONGREGATION_FAIL';
const GET_CONGREGATION_SUCCESS = 'GET_CONGREGATION_SUCCESS';
const GET_CONGREGATIONS_BY_CIRCUIT_SUCCESS = 'GET_CONGREGATIONS_BY_CIRCUIT_SUCCESS';
const GET_CONGREGATIONS_BY_CIRCUIT_FAIL = 'GET_CONGREGATIONS_BY_CIRCUIT_FAIL';
const RESET_ERROR = 'RESET_ERROR';
const START_CAMPAIGN = 'START_CAMPAIGN';
const END_CAMPAIGN = 'END_CAMPAIGN';
const START_CAMPAIGN_FAIL = 'START_CAMPAIGN_FAIL';
const END_CAMPAIGN_FAIL = 'END_CAMPAIGN_FAIL';

const initialState = {
  congregation: {
    id: 0,
    name: '',
    description: '',
    circuit: '',
    territories: [],
    publishers: [],
    groups: [],
    language: '',
    admin_email: '',
    options: {},
    currentCampaign: null,
    historicalCampaigns: [],
  },
  congregationsByCircuit: [],
  error: null,
};

export const congregation = {
  namespaced: true,
  state: {
    ...initialState,
  },

  getters: {
    congregation: state => state.congregation,
    error: state => state.error,
    congregationsByCircuit: state => state.congregationsByCircuit,
    builtInAddressTags: () => ADDRESS_TAGS,
    builtInPhoneTags: () => PHONE_ADDRESS_TAGS,
    language: state => get(state.congregation, 'language') || 'Tagalog',
    customAddressTags: (state) => {
      const { customTags = '' } = get(state.congregation, 'options.address') || {};
      return customTags.split(',').map(t => t.trim()) || [];
    },
    customPhoneTags: (state) => {
      const { customTags = '' } = get(state.congregation, 'options.phone') || {};
      return customTags.split(',').map(t => t.trim()) || [];
    },
  },

  mutations: {
    SET_CONGREGATION(state, cong) {
      state.congregation = cong;
    },
    GET_CONGREGATION_FAIL(state, exception) {
      state.error = exception;
    },
    GET_CONGREGATION_SUCCESS(state, cong) {
      state.congregation = cong;
      state.error = null;
    },
    ADD_CONGREGATION(state, cong) {
      state.congregation = cong;
    },
    ADD_CONGREGATION_FAIL(state, exception) {
      state.error = exception;
    },
    UPDATE_CONGREGATION(state, cong) {
      cong.options = JSON.parse(get(cong, 'options', '{}'));
      state.congregation = cong;
    },
    UPDATE_CONGREGATION_FAIL(state, exception) {
      state.error = exception;
    },
    RESET_ERROR(state) {
      state.error = null;
    },
    GET_CONGREGATIONS_BY_CIRCUIT_SUCCESS(state, congs) {
      state.congregationsByCircuit = congs;
      state.error = null;
    },
    GET_CONGREGATIONS_BY_CIRCUIT_FAIL(state, exception) {
      state.error = exception;
    },
    START_CAMPAIGN(state, campaign) {
      Vue.set(state, 'congregation.currentCampaign', campaign);
    },
    END_CAMPAIGN(state) {
      Vue.set(state, 'congregation.currentCampaign', null);
    },
    START_CAMPAIGN_FAIL(state, error) {
      state.error = error;
    },
    END_CAMPAIGN_FAIL(state, error) {
      state.error = error;
    },
  },

  actions: {
    async setCongregation({ commit }, cong) {
      commit(SET_CONGREGATION, cong);
    },

    async getCongregation({ commit, getters, rootGetters }, { id }) {
      if (!id) {
        commit(GET_CONGREGATION_FAIL, 'id is required');
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_CONGREGATION_FAIL, 'Token is missing');
        return;
      }

      if (getters.error) {
        commit(RESET_ERROR);
      }

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Congregation($congId: Int!) {
              congregation (id: $congId) {
                ...CongregationModel
                groups {
                  id
                  code
                  description
                  overseer
                }
              }
            },
            ${model}`),
            variables: {
              congId: id,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { congregation: cong } = get(response, 'data.data');
        cong.options = JSON.parse(get(cong, 'options', '{}'));
        commit(GET_CONGREGATION_SUCCESS, cong);
      } catch (exception) {
        commit(GET_CONGREGATION_FAIL, exception);
        console.error(GET_CONGREGATION_FAIL, exception);
      }
    },

    async getCongregationsByCircuit({ commit, getters, rootGetters }, circuit) {
      if (!circuit) {
        commit(GET_CONGREGATIONS_BY_CIRCUIT_FAIL, 'circuit is required');
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_CONGREGATIONS_BY_CIRCUIT_FAIL, 'Token is missing');
        return;
      }

      if (getters.error) {
        commit(RESET_ERROR);
      }

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Congregation($keyword: String!) {
              congregations (keyword: $keyword) {
                ...CongregationModel
              }
            },
            ${model}`),
            variables: {
              keyword: circuit,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { congregations: congs } = get(response, 'data.data');
        commit(GET_CONGREGATIONS_BY_CIRCUIT_SUCCESS, congs);
      } catch (exception) {
        commit(GET_CONGREGATIONS_BY_CIRCUIT_FAIL, exception);
        console.error(GET_CONGREGATIONS_BY_CIRCUIT_FAIL, exception);
      }
    },

    async addCongregation({ commit, rootGetters }, _cong) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const cong = validate(_cong);

        if (!user) {
          throw new Error('No authorized user');
        }

        cong.create_user = user.id;
        if (cong.options && typeof cong.options === 'object') {
          cong.options = JSON.stringify(cong.options);
        }
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation AddCongregation($cong: CongregationInput!) {
              addCongregation(cong: $cong) {
                ...CongregationModel
              }
            }
            ${model}`),
            variables: {
              cong,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { addCongregation } = get(response, 'data.data');
        commit(ADD_CONGREGATION, addCongregation);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(ADD_CONGREGATION_FAIL, error);
        console.error(GET_CONGREGATION_FAIL, error);
      }
    },

    async updateCongregation({ commit, dispatch, rootGetters }, _cong) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const cong = validate(_cong);

        if (!user) {
          throw new Error('No authorized user');
        }

        cong.update_user = user.id;
        if (cong.options && typeof cong.options === 'object') {
          cong.options = JSON.stringify(cong.options);
        }

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation UpdateCongregation($cong: CongregationInput!) {
              updateCongregation(cong: $cong) {
                ...CongregationModel
              }
            }
            ${model}`),
            variables: {
              cong,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { updateCongregation } = get(response, 'data.data');
        dispatch('auth/authorize', user.username, { root: true });
        commit(UPDATE_CONGREGATION, updateCongregation);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(UPDATE_CONGREGATION_FAIL, error);
        console.error(GET_CONGREGATION_FAIL, error);
      }
    },
    async startCampaign({ commit, rootGetters }, { name }) {
      commit('auth/LOADING', true, { root: true });

      const user = rootGetters['auth/user'];
      const { congregation: cong } = user;

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation StartCampaign($name: String!, $congId: Int!, $publisherId: Int) {
              startCampaign(name: $name, congId: $congId, publisherId: $publisherId) {
                id
                name
                congregation_id
                publisher_id
                start_date
                end_date
              }
            }`),
            variables: {
              name,
              congId: cong.id,
              publisherId: user.id,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        const { startCampaign: currentCampaign } = get(response, 'data.data');
        commit(START_CAMPAIGN, currentCampaign);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(START_CAMPAIGN_FAIL, error);
        throw error;
      }
    },
    async endCampaign({ commit }, { campaignId }) {
      commit('auth/LOADING', true, { root: true });
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation EndCampaign($campaignId: Int!) {
              endCampaign(campaignId: $campaignId)
            }`),
            variables: {
              campaignId,
            },
          },
        });

        const { errors } = get(response, 'data');
        if (errors && errors.length) {
          throw new Error(errors[0].message);
        }
        commit(END_CAMPAIGN);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(END_CAMPAIGN_FAIL, error);
        throw error;
      }
    },
  },
};
