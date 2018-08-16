import Vue from 'vue';
import axios from 'axios';

const LOGIN = 'LOGIN';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGOUT = 'LOGOUT';
const AUTHORIZE = 'AUTHORIZE';
const FORCEOUT = 'FORCEOUT';

export const auth = {
  namespaced: true,
  state: {
    isAuthenticated: false,
    isPending: false,
    isForcedOut: false,
    name: '',
    user: undefined,
    congId: 0,
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
      if (state.user && state.user.congregation) {
        return state.user.congregation.id;
      }

      return 0;
    }
  },

  mutations: {
    LOGIN(state) {
      state.isPending = true;
      state.name = '';
    },

    LOGIN_SUCCESS(state, name) {
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
    },

    FORCEOUT(state) {
      state.user = undefined;
      state.isAuthenticated = false;
      state.isPending = false;
      state.isForcedOut = true;
      state.name = '';
    }
  },

  actions: {
    login({ commit }) {
      commit(LOGIN);
      const auth = Vue.googleAuth();
      auth.directAccess();
      return new Promise((resolve) => {
        setTimeout(() => {
          auth.signIn(user => {
            const profile = user.getBasicProfile();
            commit(LOGIN_SUCCESS, profile.getName());
            console.log('login success');
            resolve(profile);
          }, error => {
            console.log('Nope, authentication failed', error);
          });
        }, 1000);
      });
    },

    logout({ commit }) {
      Vue.googleAuth().signOut(() => {
        commit(LOGOUT);
        console.log('logout success');
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
    }

  }
}

