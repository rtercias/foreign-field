import Vue from 'vue';
import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import { model, validate } from './models/GroupModel';

const ADD_GROUP = 'ADD_GROUP';
const ADD_GROUP_FAIL = 'ADD_GROUP_FAIL';
const UPDATE_GROUP = 'UPDATE_GROUP';
const UPDATE_GROUP_FAIL = 'UPDATE_GROUP_FAIL';
const GET_GROUP_FAIL = 'GET_GROUP_FAIL';
const GET_GROUP_SUCCESS = 'GET_GROUP_SUCCESS';
const RESET_ERROR = 'RESET_ERROR';

const initialState = {
  group: {
    id: 0,
    congregation_id: 0,
    code: '',
    description: '',
    overseer: '',
  },
  error: null,
};

export const group = {
  namespaced: true,
  state: {
    ...initialState,
  },

  getters: {
    group: state => state.group,
    error: state => state.error,
  },

  mutations: {
    GET_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_GROUP_FAIL, exception);
    },
    GET_GROUP_SUCCESS(state, group) {
      state.group = group;
      state.error = null;
    },
    ADD_GROUP(state, group) {
      state.group = group;
    },
    ADD_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(ADD_GROUP_FAIL, exception);
    },
    UPDATE_GROUP(state, group) {
      state.group = group;
    },
    UPDATE_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(UPDATE_GROUP_FAIL, exception);
    },
    RESET_ERROR(state) {
      state.error = null;
    },
  },

  actions: {
    async getGroup({ commit, getters, rootGetters, dispatch }, { id }) {
      if (!id) {
        commit(GET_GROUP_FAIL, 'id is required');
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_GROUP_FAIL, 'Token is missing');
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
            query: print(gql`query Group($groupId: Int) { 
              group (id: $groupId) {
                ...GroupModel
              }
            },
            ${model}`),
            variables: {
              groupId: id,
            },
          },
        });

        const { group } = get(response, 'data.data');
        commit(GET_GROUP_SUCCESS, group);
      } catch (exception) {
        commit(GET_GROUP_FAIL, exception);
        throw exception;
      }
    },

    async addGroup({ commit, rootGetters }, _group) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const grp = validate(_group);

        if (!user) {
          throw new Error('No authorized user');
        }

        grp.create_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation AddGroup($group: GroupInput!) { 
              addGroup(group: $group) { 
                ...GroupModel
              }
            }
            ${model}`),
            variables: {
              group: grp,
            },
          },
        });

        const { addGroup } = get(response, 'data.data');
        commit(ADD_GROUP, addGroup);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(ADD_GROUP_FAIL, error);
      }
    },

    async updateGroup({ commit, rootGetters }, _group) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const grp = validate(_group);

        if (!user) {
          throw new Error('No authorized user');
        }

        grp.update_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation UpdateGroup($group: GroupInput!) { 
              updateGroup(group: $group) { 
                ...GroupModel
              }
            }
            ${model}`),
            variables: {
              group: grp,
            },
          },
        });

        const { updateGroup } = get(response, 'data.data');
        commit(UPDATE_GROUP, updateGroup);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(UPDATE_GROUP_FAIL, error);
      }
    },
  },
};
