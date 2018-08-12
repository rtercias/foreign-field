import Vue from 'vue';

const LOGIN = 'LOGIN';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGOUT = 'LOGOUT';

export const auth = {
  namespaced: true,
  state: {
    isAuthenticated: false,
    isPending: false,
    name: '',
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
  },

  mutations: {
    LOGIN(state) {
      state.isPending = true;
      state.name = '';
    },

    LOGIN_SUCCESS(state, name) {
      state.isAuthenticated = true;
      state.isPending = false;
      state.name = name;
    },

    LOGOUT(state) {
      state.isAuthenticated = false;
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

  }
}

