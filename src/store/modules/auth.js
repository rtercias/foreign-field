import Vue from 'vue';
import axios from 'axios';
import { getAuth, signOut } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import { config } from '../../../firebase.config';
import { router } from '../../routes';
import { IncompleteRegistrationError, UnauthorizedUserError, DisabledUserError } from '../exceptions/custom-errors';
import { model as congregationModel } from './models/CongregationModel';

const AUTHENTICATE_SUCCESS = 'AUTHENTICATE_SUCCESS';
const AUTHORIZE = 'AUTHORIZE';
const FORCEOUT = 'FORCEOUT';
const VERIFYING = 'VERIFYING';
const ERROR_MESSAGE = 'ERROR_MESSAGE';
const RESET = 'RESET';
const LOADING = 'LOADING';
const USER_TERRITORIES_LOADING = 'USER_TERRITORIES_LOADING';
const UPDATE_TOKEN = 'UPDATE_TOKEN';
const USER_TERRITORIES_ADDED = 'USER_TERRITORIES_ADDED';
const WINDOW_RESIZE = 'WINDOW_RESIZE';
const COLLAPSE_NAV = 'COLLAPSE_NAV';
const SET_SCROLL_Y_POSITION = 'SET_SCROLL_Y_POSITION';
const SET_TERRITORY_LAST_ACTIVITY = 'SET_TERRITORY_LAST_ACTIVITY';
const GENERATE_PUBLISHER_TOKEN = 'GENERATE_PUBLISHER_TOKEN';
const GENERATE_SHORT_LINK = 'GENERATE_SHORT_LINK';
const SMS_SENT = 'SMS_SENT';
const UPDATE_COORDINATES = 'UPDATE_COORDINATES';

function initialState() {
  return {
    isAuthenticated: false,
    isPending: false,
    isForcedOut: false,
    isVerifying: false,
    errorMessage: '',
    isSwitchedToDesktop: false,
    name: '',
    email: '',
    user: undefined,
    photoUrl: '',
    congId: 0,
    congregation: {},
    loading: false,
    token: '',
    options: null,
    myTerritoriesLoading: false,
    userTerritories: [],
    scrollYPosition: { home: 0 },
    publisherToken: '',
    shortLink: '',
  };
}

export const auth = {
  namespaced: true,
  state: initialState(),
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    isPending: state => state.isPending,
    name: state => state.name,
    email: state => state.email,
    isAuthorized: state => !!state.user,
    isForcedOut: state => state.isForcedOut,
    isVerifying: state => state.isVerifying,
    errorMessage: state => state.errorMessage,
    user: state => state.user,
    congId: state => state.congId,
    congregation: state => state.congregation,
    isAdmin: state => state.user && ['Admin'].includes(state.user.role),
    loading: state => state.loading,
    canViewReports: state => state.user && ['Admin', 'TS', 'CO', 'SO', 'GO'].includes(state.user.role),
    canCheckout: state => state.user && ['Admin', 'TS', 'CO', 'SO', 'GO', 'RP-E'].includes(state.user.role),
    canWrite: state => state.user && ['Admin', 'TS', 'CO', 'SO', 'GO', 'RP-E'].includes(state.user.role),
    canRead: (state, getters) => getters.canWrite || state.user && ['RP', 'RP-E', 'TS'].includes(state.user.role),
    canManage: state => get(state.user, 'role') === 'TS' || get(state.user, 'role') === 'SO'
      || get(state.user, 'role') === 'Admin',
    canLead: state => get(state.user, 'role') === 'SO',
    canSwitchCong: state => state.user && ['Admin', 'CO'].includes(state.user.role),
    canHelpLogin: (state) => {
      const { loginHelperAccess } = get(state, 'congregation.options.publishers') || '';
      return state.user && ['Admin', 'SO', 'TS', 'GO', loginHelperAccess].includes(state.user.role);
    },
    isBasicAccessOnly: state => state.user && state.user.role === 'PUB',
    token: state => state.token,
    isDesktop: state => state.isSwitchedToDesktop || window.matchMedia('(min-width: 801px)').matches,
    isPWA: () => window.matchMedia('(display-mode: standalone)').matches,
    options: state => state.options,
    myTerritoriesLoading: state => state.myTerritoriesLoading,
    userTerritories: state => state.userTerritories,
    leftNavRouteParams: (state, getters, rootState, rootGetters) => ({
      congregationId: get(rootGetters['congregation/congregation'], 'id')
        || get(rootGetters['auth/user'], 'congregation.id'),
      groupId: get(rootGetters['group/group'], 'id'),
      territoryId: get(rootGetters['territory/territory'], 'id')
        || get(rootGetters['address/address'], 'territory_id'),
      addressId: get(rootGetters['address/address'], 'id'),
      phoneId: get(rootGetters['phone/phone'], 'id'),
      publisherId: get(rootGetters['publisher/publisher'], 'id'),
      checkoutId: get(rootGetters['territory/territory'], 'status.checkout_id'),
    }),
    scrollYPosition: state => state.scrollYPosition,
    publisherToken: state => state.publisherToken,
    shortLink: state => state.shortLink,
    coordinates: state => state.user.coordinates,
  },

  mutations: {
    AUTHENTICATE(state) {
      state.isPending = true;
      state.name = '';
    },

    AUTHENTICATE_SUCCESS(state, authenticatedUser) {
      state.isAuthenticated = true;
      state.isForcedOut = false;
      if (authenticatedUser) {
        state.name = authenticatedUser.name;
        state.photoUrl = authenticatedUser.photoUrl;
        state.token = authenticatedUser.token;
        state.email = authenticatedUser.email;
        state.isVerifying = !authenticatedUser.emailVerified;
      }
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

    VERIFYING(state, user) {
      if (user) {
        state.isVerifying = !user.emailVerified;
        state.email = user.email;
      }
    },

    ERROR_MESSAGE(state, message) {
      state.errorMessage = message;
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

    UPDATE_TOKEN(state, value) {
      state.token = value;
    },

    USER_TERRITORIES_ADDED(state, territories) {
      Vue.set(state.user, 'territories', territories);
      Vue.set(state, 'userTerritories', territories);
      Vue.set(state, 'myTerritoriesLoading', false);
    },
    WINDOW_RESIZE(state) {
      state.isSwitchedToDesktop = window.matchMedia('(min-width: 801px)').matches;
    },
    SET_SCROLL_Y_POSITION(state, scroll) {
      state.scrollYPosition[scroll.route] = scroll.yPos;
    },
    SET_TERRITORY_LAST_ACTIVITY(state, { id, lastActivity }) {
      const territories = get(state, 'user.territories') || [];
      const territory = territories.find(t => t.id === id);
      if (territory) {
        Vue.set(territory, 'lastActivity', lastActivity);
      }
    },
    GENERATE_PUBLISHER_TOKEN(state, token) {
      state.publisherToken = token;
    },
    GENERATE_SHORT_LINK(state, shortLink) {
      Vue.set(state, 'shortLink', shortLink);
    },
    SMS_SENT() {},
    UPDATE_COORDINATES(state, coordinates) {
      Vue.set(state.user, 'coordinates', coordinates);
    },
  },

  actions: {
    async authenticate({ commit }, { displayName, photoUrl, token, email, emailVerified } = {}) {
      commit(AUTHENTICATE_SUCCESS, { name: displayName, photoUrl, token, email, emailVerified });
    },

    logout({ commit }) {
      const googleAuth = getAuth();
      if (googleAuth) {
        signOut(googleAuth);
      }
      firebase.auth().signOut();
      sessionStorage.removeItem('firebaseui::token');
      sessionStorage.removeItem('firebaseui::pendingRedirect');
      commit(RESET);
    },

    async verify({ commit, dispatch }, user) {
      commit(VERIFYING, user);
      const authenticatedUser = await user.sendEmailVerification({ url: document.location.href });
      dispatch('login', authenticatedUser);
    },

    async authorize({ commit, getters, dispatch }, username) {
      commit(LOADING, true);
      if (!getters.isAuthorized) {
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
                  ...CongregationModel
                }
              }
            },
            ${congregationModel}`),
            variables: {
              username,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.user) {
          throw new IncompleteRegistrationError(
            'Account not found. Ask your administrator to create a publisher account for you.'
          );
        }

        const { user } = (response && response.data && response.data.data) || {};
        if (user.status === 'disabled') {
          throw new DisabledUserError('Your account is disabled.');
        }

        const options = JSON.parse(get(user, 'congregation.options', '{}'));
        const congregation = user && { ...user.congregation, options };

        if (user) {
          commit(AUTHORIZE, { ...user, congregation });
          dispatch('congregation/setCongregation', congregation, { root: true });
        } else {
          throw new UnauthorizedUserError('Unauthorized');
        }
      }

      const userRoles = get(getters.user, 'role', '').split(',');
      const { permissions } = router.currentRoute.meta;
      let hasPermission = true;
      if (typeof permissions === 'function') {
        hasPermission = permissions();
      } else if (Array.isArray(permissions)) {
        hasPermission = intersection(permissions, userRoles).length > 0;
      }

      if (!hasPermission) {
        throw new UnauthorizedUserError('Unauthorized');
      }

      commit(LOADING, false);
    },

    async getUserTerritories({ commit }, username) {
      commit(USER_TERRITORIES_LOADING, true);
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
                lastActivity {
                  value
                  territory_id
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

      const { territories } = (response && response.data && response.data.data.user) || {};
      commit(USER_TERRITORIES_ADDED, territories);
      commit(USER_TERRITORIES_LOADING, false);
    },

    async getTerritoryLastActivity({ commit }, id) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Territory($terrId: Int) {
              territory (id: $terrId) {
                id
                lastActivity {
                  id
                  address_id
                  checkout_id
                  value
                  timestamp
                }
              }
            }`),
            variables: {
              terrId: id,
            },
          },
        });

        const { territory = {} } = response.data.data;
        commit(SET_TERRITORY_LAST_ACTIVITY, territory);
      } catch (exception) {
        console.error('Unable to get last activity', exception);
      }
    },

    forceout({ commit }, errorMessage) {
      commit(FORCEOUT);
      if (errorMessage) {
        commit(ERROR_MESSAGE, errorMessage);
      }
    },

    async login({ dispatch }, user) {
      if (!user) return;

      try {
        await dispatch('authenticate', user);
        if (user.emailVerified && user.email) {
          await dispatch('authorize', user.email);
        } else if (user.phoneNumber) {
          await dispatch('authorize', user.phoneNumber);
        } else if (user.uid) {
          await dispatch('authorize', user.uid);
        }
      } catch (err) {
        if (err instanceof IncompleteRegistrationError || err instanceof DisabledUserError) {
          dispatch('logout');
          dispatch('forceout', err.message);
        } else if (err instanceof UnauthorizedUserError) {
          router.replace({ name: 'unauthorized' });
        } else {
          console.error(err);
        }
      }
    },

    async firebaseInit({ dispatch, state, commit }) {
      const tempToken = sessionStorage.getItem('firebaseui::token');
      axios.defaults.headers.common.Authorization = `Bearer ${tempToken}`;
      commit(UPDATE_TOKEN, tempToken);

      firebase.initializeApp(config);

      const authCallback = async (user) => {
        commit(UPDATE_TOKEN, user.token);
        sessionStorage.setItem('firebaseui::token', user.token);

        if (user && user.email && !user.emailVerified) {
          return;
        }

        axios.interceptors.request.use(async (cfg) => {
          const token = await user.getIdToken();
          sessionStorage.setItem('firebaseui::token', user.token);
          cfg.headers.Authorization = `Bearer ${token}`;
          commit(UPDATE_TOKEN, token);
          return cfg;
        });

        await dispatch('login', user);
      };

      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      if (tokenParam) {
        const { user } = await firebase.auth().signInWithCustomToken(tokenParam);
        await authCallback(user);
      } else {
        firebase.auth().onAuthStateChanged(async (user) => {
          if (user) {
            user.token = await user.getIdToken();
            if (!user.token) {
              throw new Error('Unable to retrieve token from Firebase');
            }
            await authCallback(user);
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
        firebase.auth().onIdTokenChanged((user) => {
          if (user && user.email && user.emailVerified) {
            dispatch('login', user);
          }
        });
      }
    },

    back({ getters, state }, params) {
      const { vm } = params;
      let { route } = params;
      if (route) {
        vm.$router.push(route);
        return;
      }
      route = route || vm.$route || Vue.$route;

      let origin = get(route, 'query.origin');
      if (origin === get(route, 'name')) {
        origin = '';
      }
      const back = get(route, 'query.back') || get(route, 'meta.back');
      const userRoles = get(state.user, 'role', '').split(',');
      const resolvedTo = vm.$router.resolve({ name: origin || back });
      const preserveQueryString = get(resolvedTo, 'route.meta.preserveQueryString');
      const permissions = get(resolvedTo, 'route.meta.permissions') || [];
      const hasPermission = permissions.length ? intersection(permissions, userRoles).length > 0 : true;

      let query = '';
      if (preserveQueryString) {
        const queryString = new URLSearchParams(document.location.search);
        query = Object.fromEntries(queryString);
      }

      if ((origin || back) && hasPermission) {
        vm.$router.push({ name: origin || back, params: getters.leftNavRouteParams, query });
      } else {
        vm.$router.back();
      }
    },

    changeWindowSize({ commit }) {
      commit(WINDOW_RESIZE);
    },

    collapseNav({ commit }) {
      commit(COLLAPSE_NAV);
    },

    setScrollYPosition({ commit }, yPos) {
      commit(SET_SCROLL_Y_POSITION, yPos);
    },

    async generatePublisherToken({ commit }, username) {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        data: {
          query: print(gql`query Token($username: String) {
            token(username:$username)
          }`),
          variables: {
            username,
          },
        },
      });

      const { token } = (response && response.data && response.data.data) || {};
      commit(GENERATE_PUBLISHER_TOKEN, token);
    },

    async generateShortLink({ commit }, link) {
      const instance = axios.create();
      delete instance.defaults.headers.common.Authorization;
      const response = await instance({
        url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${process.env.VUE_APP_WEB_API_KEY}`,
        method: 'post',
        data: {
          dynamicLinkInfo: {
            domainUriPrefix: process.env.VUE_APP_DYNAMIC_LINK_DOMAIN,
            link,
          },
        },
      });

      const { shortLink } = get(response, 'data');
      commit(GENERATE_SHORT_LINK, shortLink);
    },

    async sendSMS({ commit }, { text, number }) {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        data: {
          query: print(gql`mutation SendSMS($text: String! $number: String!) {
            sendSMS(text: $text, number: $number)
          }`),
          variables: {
            text,
            number,
          },
        },
      });

      const { data, errors } = get(response, 'data');
      const { sendSMS } = data;
      if (sendSMS === 'queued') {
        commit(SMS_SENT);
      } else {
        const { message } = errors[0];
        throw new Error('Unable to send SMS', message);
      }
    },

    updateCoordinates({ commit }, { latitude, longitude }) {
      commit(UPDATE_COORDINATES, { latitude, longitude });
    },
  },
};
