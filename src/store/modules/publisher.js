import axios from 'axios';
import gql from 'graphql-tag';
import get from 'lodash/get';
import { print } from 'graphql/language/printer';
import { model, validate } from './models/PublisherModel';
import { InvalidPublisherError } from '../exceptions/custom-errors';

const SET_PUBLISHER = 'SET_PUBLISHER';
const ADD_PUBLISHER = 'ADD_PUBLISHER';
const ADD_PUBLISHER_FAIL = 'ADD_PUBLISHER_FAIL';
const UPDATE_PUBLISHER = 'UPDATE_PUBLISHER';
const UPDATE_PUBLISHER_FAIL = 'UPDATE_PUBLISHER_FAIL';
const DELETE_PUBLISHER = 'DELETE_PUBLISHER';
const DELETE_PUBLISHER_FAIL = 'DELETE_PUBLISHER_FAIL';

export const publisher = {
  namespaced: true,
  state: {
    publisher: {},
  },
  getters: {
    publisher: state => state.publisher,
  },
  mutations: {
    SET_PUBLISHER: (state, pub) => {
      state.publisher = pub;
    },
    ADD_PUBLISHER(state, cong) {
      state.congregation = cong;
    },
    ADD_PUBLISHER_FAIL(state, exception) {
      state.error = exception;
      console.error(ADD_PUBLISHER_FAIL, exception);
    },
    UPDATE_PUBLISHER(state, cong) {
      state.congregation = cong;
    },
    UPDATE_PUBLISHER_FAIL(state, exception) {
      state.error = exception;
      console.error(UPDATE_PUBLISHER_FAIL, exception);
    },
    DELETE_PUBLISHER() {},
    DELETE_PUBLISHER_FAIL(state, exception) {
      state.error = exception;
      console.error(DELETE_PUBLISHER_FAIL, exception);
    },
  },
  actions: {
    async fetchPublisher({ commit }, { id, congId }) {
      if (!id) {
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query Publisher($id: Int, $congId: Int) {
            publisher (publisherId: $id, congId: $congId) {
              id
              firstname
              lastname
              congregationid
              username
              status
              role
            }
          }`),
          variables: {
            id,
            congId,
          },
        },
      });

      const { publisher: pub } = get(response, 'data.data');
      if (pub) {
        pub.status = pub.status === 'active';
      }
      commit(SET_PUBLISHER, pub);
    },
    async fetchPublisherByUsername({ commit }, username) {
      if (!username) {
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query User($username: String) {
            user (username: $username) {
              id
              firstname
              lastname
              congregationid
              username
              status
              role
            }
          }`),
          variables: {
            username,
          },
        },
      });

      const { user } = get(response, 'data.data');
      if (user) {
        user.status = user.status === 'active';
      }
      commit(SET_PUBLISHER, user);
    },
    async addPublisher({ commit, rootGetters }, _publisher) {
      commit('auth/LOADING', true, { root: true });

      const user = rootGetters['auth/user'];
      const pub = validate(_publisher);

      if (!user) {
        throw new Error('No authorized user');
      }

      pub.create_user = user.id;

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`mutation addPublisher($publisher: PublisherInput!) {
            addPublisher(publisher: $publisher) {
              ...PublisherModel
            }
          }
          ${model}`),
          variables: {
            publisher: pub,
          },
        },
      });

      const { data, errors } = get(response, 'data');
      const { addPublisher } = data;
      if (!addPublisher) {
        const { message } = errors[0];
        commit(ADD_PUBLISHER_FAIL, message);
        commit('auth/LOADING', false, { root: true });
        if (message.includes('ER_DUP_ENTRY')) {
          throw new InvalidPublisherError(`Duplicate entry found for ${pub.username}`);
        }
        throw new InvalidPublisherError('Unexpected error. ADD_PUBLISHER_FAIL');
      }
      commit(ADD_PUBLISHER, addPublisher);
      commit('auth/LOADING', false, { root: true });
    },

    async updatePublisher({ commit, rootGetters }, _publisher) {
      try {
        commit('auth/LOADING', true, { root: true });

        const user = rootGetters['auth/user'];
        const pub = validate(_publisher);

        if (!user) {
          throw new Error('No authorized user');
        }

        pub.update_user = user.id;

        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation updatePublisher($publisher: PublisherInput!) {
              updatePublisher(publisher: $publisher) {
                ...PublisherModel
              }
            }
            ${model}`),
            variables: {
              publisher: pub,
            },
          },
        });

        const { updatePublisher } = get(response, 'data.data');
        commit(UPDATE_PUBLISHER, updatePublisher);
        commit('auth/LOADING', false, { root: true });
      } catch (error) {
        commit(UPDATE_PUBLISHER_FAIL, error);
      }
    },

    async deletePublisher({ commit, rootGetters }, id) {
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
            query: print(gql`mutation DeletePublisher($id: Int!) {
              deletePublisher(id: $id)
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
        commit(DELETE_PUBLISHER);
      } catch (e) {
        commit(DELETE_PUBLISHER_FAIL, e);
      } finally {
        commit('auth/LOADING', false, { root: true });
      }
    },
  },
};
