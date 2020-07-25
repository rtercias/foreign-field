import axios from 'axios';
import firebase from 'firebase/app';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import uniqBy from 'lodash/uniqBy';
import { config } from '../../../firebase.config';
import { router } from '../../routes';
import { IncompleteRegistrationError, UnauthorizedUserError } from '../exceptions/custom-errors';

const AUTHENTICATE_SUCCESS = 'AUTHENTICATE_SUCCESS';
const AUTHORIZE = 'AUTHORIZE';
const FORCEOUT = 'FORCEOUT';
const SET_GROUP_CODES = 'SET_GROUP_CODES';
const RESET = 'RESET';
const LOADING = 'LOADING';
const MASTHEAD_LEFT_NAV_ROUTE = 'MASTHEAD_LEFT_NAV_ROUTE';

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
    loading: false,
    mastheadLeftNavRoute: '/',
    token: '',
  };
}

export const auth = {
  namespaced: true,
  state: initialState(),
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    isPending: state => state.isPending,
    name: state => state.name,
    isAuthorized: state => !!state.user,
    isForcedOut: state => state.isForcedOut,
    user: state => state.user,
    congId: state => state.congId,
    groupCodes: state => state.groupCodes,
    isAdmin: state => state.user && ['Admin'].includes(state.user.role),
    loading: state => state.loading,
    canAdmin: state => state.user && (state.user.role === 'Admin' || state.user.role === 'TS'),
    canWrite: state => state.user && (state.user.role === 'Admin'
      || state.user.role === 'TS'
      || state.user.role === 'SO'
      || state.user.role === 'GO'),
    canRead: (state, getters) => getters.canWrite
      || (state.user && (state.user.role === 'RP' || state.user.role === 'TS')),
    mastheadLeftNavRoute: state => state.mastheadLeftNavRoute,
    token: state => state.token,
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
      state.token = authenticatedUser.token;
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

    RESET(state) {
      const s = initialState();
      Object.keys(s).forEach((key) => {
        state[key] = s[key];
      });
    },

    LOADING(state, value) {
      state.loading = value;
    },

    MASTHEAD_LEFT_NAV_ROUTE(state, value) {
      state.mastheadLeftNavRoute = value;
    },
  },

  actions: {
    async authenticate({ commit }, params) {
      commit(AUTHENTICATE_SUCCESS, { name: params.displayName, photoUrl: params.photoUrl, token: params.token });
      return params;
    },

    async logout({ commit }) {
      return new Promise((resolve) => {
        firebase.auth().signOut();
        commit(RESET);
        resolve();
      });
    },

    async authorize({ commit }, username) {
      commit(LOADING, true);
      return new Promise(async (resolve, reject) => {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Publisher($username: String) {
              user (username: $username) {
                id 
                username
                role
                role_description
                status
                congregation {
                  id
                  name
                  description
                }
                territories {
                  id
                  name
                  city
                  group_code
                  type
                  status {
                    status
                    date
                  }
                  addresses {
                    addr1
                    addr2
                    city
                    state_province
                    postal_code
                    activityLogs {
                      publisher_id
                      value
                      timestamp
                    }
                  }
                }
              }
            }`),
            variables: {
              username,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.user) {
          reject(new IncompleteRegistrationError('Unauthorized'));
        }

        const { user } = (response && response.data && response.data.data) || {};
        const { permissions = [] } = router.currentRoute.meta;
        const hasPermission = permissions.length === 0 || permissions.includes(user.role);
        if (hasPermission) {
          commit(AUTHORIZE, user);
          resolve();
        } else {
          reject(new UnauthorizedUserError('Unauthorized'));
        }

        commit(LOADING, false);
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
      } catch (err) {
        if (err instanceof IncompleteRegistrationError) {
          await dispatch('logout');
          dispatch('forceout');
        } else if (err instanceof UnauthorizedUserError) {
          router.replace({ name: 'unauthorized' });
        } else {
          console.error(err);
        }
      }

      dispatch('getGroupCodes', state.congId);
    },

    async getGroupCodes({ commit }, congId) {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        data: {
          query: print(gql`{ territories (congId: ${congId}) { group_code }}`),
        },
      });

      const { territories } = (response && response.data && response.data.data) || [];
      // const group = sessionStorage.getItem('group-code');
      // if (group) this.setGroupCode(group);

      const groupCodes = uniqBy(territories, 'group_code').map(g => g.group_code).sort();
      commit(SET_GROUP_CODES, groupCodes);
    },

    async firebaseInit({ dispatch, state }) {
      firebase.initializeApp(config);
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          user.token = await user.getIdToken();
          if (!user.token) {
            throw new Error('Unable to retrieve token from Firebase');
          }

          axios.interceptors.request.use((cfg) => {
            cfg.headers.Authorization = `Bearer ${user.token}`;
            return cfg;
          });

          await dispatch('login', user);
        } else {
          if (state.isForcedOut) {
            router.replace({ name: 'signout', params: { unauthorized: true } });
          }

          const loc = window.location;
          if (loc.pathname !== '/' && loc.pathname !== '/auth' && loc.pathname !== '/signout') {
            router.replace({ name: 'auth', query: { redirect: loc.pathname } });
          }
        }
      });
    },

    setLeftNavRoute({ commit }, value) {
      commit(MASTHEAD_LEFT_NAV_ROUTE, value);
    },
  },
};
