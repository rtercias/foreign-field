import Vue from 'vue';
import axios from 'axios';
import firebase from 'firebase/app';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import { config } from '../../../firebase.config';
import { router } from '../../routes';
import { IncompleteRegistrationError, UnauthorizedUserError } from '../exceptions/custom-errors';

const AUTHENTICATE_SUCCESS = 'AUTHENTICATE_SUCCESS';
const AUTHORIZE = 'AUTHORIZE';
const FORCEOUT = 'FORCEOUT';
const RESET = 'RESET';
const LOADING = 'LOADING';
const USER_TERRITORIES_LOADING = 'USER_TERRITORIES_LOADING';
const MASTHEAD_LEFT_NAV_ROUTE = 'MASTHEAD_LEFT_NAV_ROUTE';
const UPDATE_TOKEN = 'UPDATE_TOKEN';
const USER_TERRITORIES_ADDED = 'USER_TERRITORIES_ADDED';

function initialState() {
  return {
    isAuthenticated: false,
    isPending: false,
    isForcedOut: false,
    name: '',
    user: undefined,
    photoUrl: '',
    congId: 0,
    congregation: {},
    loading: false,
    mastheadLeftNavRoute: '',
    token: '',
    options: null,
    myTerritoriesLoading: false,
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
    congregation: state => state.congregation,
    isAdmin: state => state.user && ['Admin'].includes(state.user.role),
    loading: state => state.loading,
    canViewReports: state => state.user && ['Admin', 'TS', 'SO', 'GO'].includes(state.user.role),
    canCheckout: state => state.user && ['Admin', 'TS', 'SO', 'GO', 'RP-E'].includes(state.user.role),
    canWrite: state => state.user && ['Admin', 'TS', 'SO', 'GO', 'RP-E'].includes(state.user.role),
    canRead: (state, getters) => getters.canWrite || state.user && ['RP', 'RP-E', 'TS'].includes(state.user.role),
    canManage: state => state.user && (state.user.role === 'TS' || state.user.role === 'Admin'),
    canLead: state => state.user && state.user.role === 'SO',
    mastheadLeftNavRoute: state => state.mastheadLeftNavRoute,
    token: state => state.token,
    isDesktop: () => window.matchMedia('(min-width: 801px)').matches,
    options: state => state.options,
    myTerritoriesLoading: state => state.myTerritoriesLoading,
  },

  mutations: {
    AUTHENTICATE(state) {
      state.isPending = true;
      state.name = '';
    },

    AUTHENTICATE_SUCCESS(state, authenticatedUser) {
      state.isAuthenticated = true;
      state.isForcedOut = false;
      state.name = authenticatedUser.name;
      state.photoUrl = authenticatedUser.photoUrl;
      state.token = authenticatedUser.token;
    },

    AUTHORIZE(state, user) {
      state.user = user;
      if (!state.name) {
        state.name = `${user.firstname} ${user.lastname}`;
      }
      state.congId = state.user && state.user.congregation && state.user.congregation.id || 0;
      state.congregation = state.user && state.user.congregation;
      state.options = state.congregation && state.congregation.options;
      state.isPending = false;
    },

    FORCEOUT(state) {
      state.isForcedOut = true;
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
    USER_TERRITORIES_LOADING(state, value) {
      state.myTerritoriesLoading = value;
    },

    MASTHEAD_LEFT_NAV_ROUTE(state, value) {
      state.mastheadLeftNavRoute = value;
    },

    UPDATE_TOKEN(state, value) {
      state.token = value;
    },

    USER_TERRITORIES_ADDED(state, territories) {
      Vue.set(state.user, 'territories', territories);
      Vue.set(state, 'myTerritoriesLoading', false);
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

    async authorize({ commit, dispatch }, username) {
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
                firstname
                lastname
                role
                status
                congregation {
                  id
                  name
                  description
                  language
                  admin_email
                  campaign
                  options
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
        const options = JSON.parse(get(user, 'congregation.options', '{}'));
        const congregation = user && { ...user.congregation, options };
        const userRoles = get(user, 'role', '').split(',');
        const { permissions = [] } = router.currentRoute.meta;
        const hasPermission = permissions.length ? intersection(permissions, userRoles).length > 0 : true;
        if (hasPermission) {
          commit(AUTHORIZE, { ...user, congregation });
          dispatch('congregation/setCongregation', congregation, { root: true });
          resolve();
        } else {
          reject(new UnauthorizedUserError('Unauthorized'));
        }

        commit(LOADING, false);
      });
    },

    async getUserTerritories({ commit }, username) {
      commit(USER_TERRITORIES_LOADING, true);
      return new Promise(async (resolve, reject) => {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Publisher($username: String) {
              user (username: $username) {
                territories {
                  id
                  name
                  description
                  group_id
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
                  lastActivity {
                    id
                    address_id
                    checkout_id
                    value
                    timestamp
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
          reject(new Error('user not found'));
        }

        const { territories } = (response && response.data && response.data.data.user) || {};
        commit(USER_TERRITORIES_ADDED, territories);
        commit(USER_TERRITORIES_LOADING, false);
      });
    },

    forceout({ commit }) {
      commit(FORCEOUT);
    },

    async login({ dispatch, state }, user) {
      try {
        await dispatch('authenticate', user);
        if (user.emailVerified && !!user.email) {
          await dispatch('authorize', user.email);
        } else {
          await dispatch('authorize', user.phoneNumber);
        }

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

      if (state.congId) {
        dispatch('group/getGroups', { congId: state.congId }, { root: true });
      }
    },

    async firebaseInit({ dispatch, state, commit }) {
      const tempToken = sessionStorage.getItem('firebaseui::token');
      axios.defaults.headers.common.Authorization = `Bearer ${tempToken}`;
      commit(UPDATE_TOKEN, tempToken);

      return new Promise((resolve, reject) => {
        firebase.initializeApp(config);
        firebase.auth().onAuthStateChanged(async (user) => {
          if (user) {
            user.token = await user.getIdToken();
            if (!user.token) {
              reject();
              throw new Error('Unable to retrieve token from Firebase');
            }

            commit(UPDATE_TOKEN, user.token);
            sessionStorage.setItem('firebaseui::token', user.token);

            axios.interceptors.request.use(async (cfg) => {
              const token = await user.getIdToken();
              sessionStorage.setItem('firebaseui::token', user.token);
              cfg.headers.Authorization = `Bearer ${token}`;
              commit(UPDATE_TOKEN, token);
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
          resolve();
        });
      });
    },

    setLeftNavRoute({ commit }, value) {
      commit(MASTHEAD_LEFT_NAV_ROUTE, value);
    },
  },
};
