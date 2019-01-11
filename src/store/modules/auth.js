import axios from 'axios';
import firebase from 'firebase/app';
import { config } from '../../../firebase.config';
import { router } from './../../routes';
import uniqBy from 'lodash/uniqBy';

const AUTHENTICATE_SUCCESS = 'AUTHENTICATE_SUCCESS';
const AUTHORIZE = 'AUTHORIZE';
const FORCEOUT = 'FORCEOUT';
const SET_GROUP_CODES = 'SET_GROUP_CODES';
const RESET = 'RESET';

function initialState() {
  return {
    isAuthenticated: false,
    isPending: false,
    isForcedOut: false,
    name: '',
    user: undefined,
    photoUrl: '',
    congId: 0,
    groupCodes: [],
  };
}

export const auth = {
  namespaced: true,
  state: initialState(),
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

    AUTHENTICATE_SUCCESS(state, authenticatedUser) {
      state.isAuthenticated = true;
      state.isPending = false;
      state.isForcedOut = false;
      state.name = authenticatedUser.name;
      state.photoUrl = authenticatedUser.photoUrl;
    },

    AUTHORIZE(state, user) {
      state.user = user;
      state.congId = state.user && state.user.congregation && state.user.congregation.id || 0;
    },

    FORCEOUT(state) {
      state.isForcedOut = true;
    },

    SET_GROUP_CODES(state, groupCodes) {
      state.groupCodes = groupCodes;
    },

    RESET (state) {
      const s = initialState();
      Object.keys(s).forEach(key => {
        state[key] = s[key];
      });
    }
  },

  actions: {
    authenticate({ commit }, params) {
      return new Promise((resolve) => {
        commit(AUTHENTICATE_SUCCESS, { name: params.displayName, photoUrl: params.photoUrl });
        resolve(params);
      });
    },

    async logout({ commit }) {
      return new Promise((resolve) => {
        firebase.auth().signOut();
        commit(RESET);
        resolve();
      });
    },

    async authorize({ commit }, username) {
      return new Promise(async (resolve, reject) => {
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
          reject('Unauthorized');
        }

        const user = response.data.data.user;
        const { permissions = [] } = router.currentRoute.meta;
        const hasPermission = permissions.length === 0 || permissions.includes(user.role);
        if (hasPermission) {
          commit(AUTHORIZE, user);
          resolve();
        } else {
          reject('Unauthoried');
        }
      });
    },

    forceout({ commit }) {
      commit(FORCEOUT);
    },

    async login({ dispatch, state }, user) {
      try {
        await dispatch('authenticate', user);
        await dispatch('authorize', user.email);
      
        if (!state.user) {
          // unauthorized
          await dispatch('logout');
          dispatch('forceout');
        }

      } catch (exception) {
        await dispatch('logout');
        dispatch('forceout');
      }
    
      dispatch('getGroupCodes', state.congId);
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

    firebaseInit({ dispatch, state }) {
      firebase.initializeApp(config);
      firebase.auth().onAuthStateChanged(async (user) => {
        if(user) {
          await dispatch('login', user);
        } else {
          if (state.isForcedOut) {
            router.push({ name: 'signout', params: { unauthorized: true } });
          }

          if (location.pathname !== '/' && location.pathname !== '/auth' && location.pathname !== '/signout') {
            router.push({ name: 'auth', query: { redirect: location.pathname } });
          }
        }
      });
    }
  }
}

