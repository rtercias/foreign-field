import Vue from 'vue';
import axios from 'axios';
import { isAfter } from 'date-fns';
import uniqBy from 'lodash/uniqBy';

const AUTHENTICATE = 'AUTHENTICATE';
const AUTHENTICATE_SUCCESS = 'AUTHENTICATE_SUCCESS';
const LOGOUT = 'LOGOUT';
const AUTHORIZE = 'AUTHORIZE';
const FORCEOUT = 'FORCEOUT';
const SET_GROUP_CODES = 'SET_GROUP_CODES';

export function getToken() {
  if (localStorage) {
    return JSON.parse(localStorage.getItem('token'));
  }

  return undefined;
}

export function isTokenExpired(token) {
  if (token && token.expires_at) {
    const now = new Date();
    const expiration = new Date(token.expires_at);
    return isAfter(now, expiration);
  }

  return true;
}

export const auth = {
  namespaced: true,
  state: {
    isAuthenticated: false,
    isPending: false,
    isForcedOut: false,
    name: '',
    user: undefined,
    congId: 0,
    groupCodes: [],
  },

  getters: {
    isAuthenticated: state => {
      return state.isAuthenticated;
    },
    isPending: state => {
      return state.isPending;
    },
    name: state => {
      return state.name;
    },
    isAuthorized: state => {
      return !!state.user;
    },
    isForcedOut: state => {
      return state.isForcedOut;
    },
    user: state => {
      return state.user;
    },
    congId: state => {
      return state.congId;
    },
    groupCodes: state => {
      return state.groupCodes;
    }
  },

  mutations: {
    AUTHENTICATE(state) {
      state.isPending = true;
      state.name = '';
    },

    AUTHENTICATE_SUCCESS(state, name) {
      state.isAuthenticated = true;
      state.isPending = false;
      state.isForcedOut = false;
      state.name = name;
    },

    LOGOUT(state) {
      state.isAuthenticated = false;
      state.name = '';
    },

    AUTHORIZE(state, user) {
      state.user = user;
      state.congId = state.user && state.user.congregation && state.user.congregation.id || 0;
    },

    FORCEOUT(state) {
      state.user = undefined;
      state.isAuthenticated = false;
      state.isPending = false;
      state.isForcedOut = true;
      state.name = '';
    },

    SET_GROUP_CODES(state, groupCodes) {
      state.groupCodes = groupCodes;
    }
  },

  actions: {
    authenticate({ commit }) {
      commit(AUTHENTICATE);
      
      const auth = Vue.googleAuth();
      auth.directAccess();
      return new Promise((resolve) => {
        setTimeout(() => {
          auth.signIn(user => {
            const profile = user.getBasicProfile();
            commit(AUTHENTICATE_SUCCESS, profile.getName());
            resolve(profile);

            localStorage.setItem('token', JSON.stringify({
              ...user.Zi,
              ...{
                name: profile.getName(),
                username: profile.getEmail(),
              }
            }));

          }, error => {
            console.log('Nope, authentication failed', error);
          });
        }, 1000);
      });
    },

    logout({ commit }) {
      Vue.googleAuth().signOut(() => {
        commit(LOGOUT);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    },

    async authorize({ commit }, username) {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `query Publisher($username: String) {
            user (username: $username) {
              id 
              username
              role
              role_description
              congregation {
                id
                name
              }
              status
            }
          }`,
          variables: {
            username: username,
          }
        }
      });
      
      if (!response || !response.data || !response.data.data || !response.data.data.user) {
        return null;
      }

      const user = response.data.data.user;
      commit(AUTHORIZE, user);
    },

    forceout({ commit }) {
      commit(FORCEOUT);
    },

    async login({ commit, dispatch, state }) {
      try {
        const token = getToken();
        let user, username;

        if (isTokenExpired(token)) {
          user = await dispatch('authenticate');
          username = user.getEmail();
        } else {
          username = token.username;
          commit(AUTHENTICATE_SUCCESS, token.name);
        }

        await dispatch('authorize', username);
        
        if (!state.user) {
          dispatch('forceout');
          throw new Error('User not found');
        }
        
        dispatch('getGroupCodes', state.congId);

        // if (localStorage && state.user) {
        //   localStorage.setItem('user', JSON.stringify(state.user));
        // }

      } catch (exception) {
        dispatch('forceout');
        console.error('User is unauthorized');
      }
    },

    async getGroupCodes({ commit }, congId) {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `{ territories (congId: ${congId}) { group_code }}`
        }
      });

      const territories = response.data.data.territories;
      // const group = sessionStorage.getItem('group-code');
      // if (group) this.setGroupCode(group);

      const groupCodes = uniqBy(territories, 'group_code').map(g => g.group_code).sort();
      commit(SET_GROUP_CODES, groupCodes);
    },
  }
}

