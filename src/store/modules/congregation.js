import Vue from 'vue';
import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import { model, validate } from './models/CongregationModel';

const ADD_CONGREGATION = 'ADD_CONGREGATION';
const ADD_CONGREGATION_FAIL = 'ADD_CONGREGATION_FAIL';
const UPDATE_CONGREGATION = 'UPDATE_CONGREGATION';
const UPDATE_CONGREGATION_FAIL = 'UPDATE_CONGREGATION_FAIL';
const GET_CONGREGATION_FAIL = 'GET_CONGREGATION_FAIL';
const GET_CONGREGATION_SUCCESS = 'GET_CONGREGATION_SUCCESS';
const RESET_ERROR = 'RESET_ERROR';

const initialState = {
  congregation: {
    id: 0,
    name: '',
    description: '',
    territories: [],
    publishers: [],
    groups: [],
    language: '',
    campaign: '',
    admin_email: '',
    options: {},
  },
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
  },

  mutations: {
    GET_CONGREGATION_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_CONGREGATION_FAIL, exception);
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
      console.error(ADD_CONGREGATION_FAIL, exception);
    },
    UPDATE_CONGREGATION(state, cong) {
      state.congregation = cong;
    },
    UPDATE_CONGREGATION_FAIL(state, exception) {
      state.error = exception;
      console.error(UPDATE_CONGREGATION_FAIL, exception);
    },
    RESET_ERROR(state) {
      state.error = null;
    },
  },

  actions: {
    async getCongregation({ commit, getters, rootGetters, dispatch }, { id }) {
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
            query: print(gql`query Congregation($congId: Int) { 
              congregation (id: $congId) {
                ...CongregationModel
              }
            },
            ${model}`),
            variables: {
              congId: id,
            },
          },
        });

        const { congregation: cong } = get(response, 'data.data');
        commit(GET_CONGREGATION_SUCCESS, cong);
      } catch (exception) {
        commit(GET_CONGREGATION_FAIL, exception);
        throw exception;
      }
    },

    async addCongregation({ commit }, _cong) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const cong = validate(_cong);

        if (!user) {
          throw new Error('No authorized user');
        }

        cong.create_user = user.id;

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

        const { addCongregation } = get(response, 'data.data');
        commit(ADD_CONGREGATION, addCongregation);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(ADD_CONGREGATION_FAIL, error);
      }
    },

    async updateCongregation({ commit }, _cong) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const cong = validate(_cong);

        if (!user) {
          throw new Error('No authorized user');
        }

        cong.update_user = user.id;

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

        const { updateCongregation } = get(response, 'data.data');
        commit(UPDATE_CONGREGATION, updateCongregation);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(UPDATE_CONGREGATION_FAIL, error);
      }
    },
  },
};
