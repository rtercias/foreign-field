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
const GET_GROUPS_FAIL = 'GET_GROUPS_FAIL';
const GET_GROUPS_SUCCESS = 'GET_GROUPS_SUCCESS';
const DELETE_GROUP = 'DELETE_GROUP';
const DELETE_GROUP_FAIL = 'DELETE_GROUP_FAIL';
const RESET_ERROR = 'RESET_ERROR';

const initialState = {
  group: {
    id: 0,
    congregation_id: 0,
    code: '',
    description: '',
    overseer: '',
  },
  groups: [],
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
    groups: state => state.groups,
  },

  mutations: {
    GET_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_GROUP_FAIL, exception);
    },
    GET_GROUP_SUCCESS(state, _group) {
      state.group = _group;
      state.error = null;
    },
    GET_GROUPS_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_GROUP_FAIL, exception);
    },
    GET_GROUPS_SUCCESS(state, _groups) {
      state.groups = _groups;
      state.error = null;
    },
    ADD_GROUP(state, _group) {
      state.group = _group;
    },
    ADD_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(ADD_GROUP_FAIL, exception);
    },
    UPDATE_GROUP(state, _group) {
      state.group = _group;
    },
    UPDATE_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(UPDATE_GROUP_FAIL, exception);
    },
    DELETE_GROUP() {},
    DELETE_GROUP_FAIL(state, exception) {
      state.error = exception;
      console.error(DELETE_GROUP_FAIL, exception);
    },
    RESET_ERROR(state) {
      state.error = null;
    },
  },

  actions: {
    async getGroup({ commit, getters, rootGetters }, { id }) {
      if (!id) {
        if (id === 0) {
          commit(GET_GROUP_SUCCESS, 'ALL group selected');
          return;
        }
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

        const { group: _group } = get(response, 'data.data');
        commit(GET_GROUP_SUCCESS, _group);
      } catch (exception) {
        commit(GET_GROUP_FAIL, exception);
        console.error(GET_GROUP_FAIL, exception);
      }
    },

    async getGroups({ commit, getters, rootGetters }, { congId }) {
      if (!congId) {
        commit(GET_GROUPS_FAIL, 'cong id is required');
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_GROUPS_FAIL, 'Token is missing');
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
            query: print(gql`query Groups($congId: Int) { 
              groups (congId: $congId) {
                ...GroupModel
              }
            },
            ${model}`),
            variables: {
              congId,
            },
          },
        });

        const { groups } = get(response, 'data.data');
        commit(GET_GROUPS_SUCCESS, groups);
      } catch (exception) {
        commit(GET_GROUPS_FAIL, exception);
        console.error(GET_GROUPS_FAIL, exception);
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

    async deleteGroup({ commit, rootGetters }, id) {
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
            query: print(gql`mutation DeleteGroup($id: Int!) { 
              deleteGroup(id: $id)
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
        commit(DELETE_GROUP);
      } catch (e) {
        commit(DELETE_GROUP_FAIL, e);
        throw new Error(e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },
  },
};
