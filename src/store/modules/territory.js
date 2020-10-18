import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import { store } from '..';
import maxBy from 'lodash/maxBy';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';

const CHANGE_STATUS = 'CHANGE_STATUS';
const SET_TERRITORY = 'SET_TERRITORY';
const GET_TERRITORY_FAIL = 'GET_TERRITORY_FAIL';
const GET_TERRITORY_SUCCESS = 'GET_TERRITORY_SUCCESS';
const RESET_TERRITORY = 'RESET_TERRITORY';

export const territory = {
  namespaced: true,
  state: {
    territory: {
      addresses: [],
    },
  },

  getters: {
    territory: state => state.territory,
    congId: state => state.territory.congregationid,
    isCheckedOut: state => state.territory && state.territory.status && state.territory.status.status === 'Checked Out',
    isOwnedByUser: (state, getters, rootState, rootGetters) => {
      const user = rootGetters['auth/user'];

      if (user) {
        return get(state.territory, 'status.publisher.username');
      }

      return false;
    },
    maxSort: (state) => {
      const addresses = state.territory && state.territory.addresses || [];
      const max = maxBy(addresses, a => a.sort);
      return max && max.sort || 0;
    },
    address: state => id => state.territory.addresses.find(a => a.id === id),
    error: state => state.error,
  },

  mutations: {
    CHANGE_STATUS(state, newStatus) {
      state.territory.status = newStatus;
      store.cache.clear();
    },
    SET_TERRITORY(state, terr) {
      state.territory = terr;
    },
    GET_TERRITORY_FAIL(state, exception) {
      state.error = exception;
      console.error(GET_TERRITORY_FAIL, exception);
    },
    GET_TERRITORY_SUCCESS(state) {
      state.error = null;
    },
    RESET_TERRITORY(state) {
      state.territory = {};
    },
  },

  actions: {
    async checkinTerritory({ commit }, args) {
      try {
        if (!args) {
          throw new Error('Unable to check in territory because the required arguments were not provided');
        }

        const response = await axios({
          data: {
            query: print(gql`mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  checkout_id
                  status
                  date
                }
              }
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            },
          },
        });

        if (response && response.data && response.data.data) {
          const { status } = response.data.data;
          commit(CHANGE_STATUS, status);
        }
      } catch (e) {
        console.error('Unable to check in territory', e);
      }
    },

    async checkoutTerritory({ commit }, args) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: print(gql`mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  checkout_id
                  status
                  date
                }
              }
            }`),
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            },
          },
        });

        if (response && response.data && response.data.data) {
          const { status } = response.data.data;
          commit(CHANGE_STATUS, status);
        }
      } catch (e) {
        console.error('Unable to checkout territory', e);
      }
    },

    async getTerritory({ commit, getters, rootGetters }, id) {
      if (!id) {
        commit(GET_TERRITORY_FAIL, 'id is required');
        return;
      }
      const token = rootGetters['auth/token'];
      if (!token) {
        commit(GET_TERRITORY_FAIL, 'Token is missing');
        return;
      }

      if (getters.error) {
        console.warn('Token is ready');
      }

      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          data: {
            query: print(gql`query Territory($terrId: Int) { 
              territory (id: $terrId) {
                group_code id congregationid name description type city
                lastActivity {
                  address_id
                  timestamp
                }
                addresses {
                  id addr1 addr2 city state_province postal_code
                  phone longitude latitude notes sort
                  territory_id congregationId status
                  activityLogs {
                    id checkout_id address_id value tz_offset
                    timestamp timezone publisher_id notes
                  }
                  lastActivity {
                    timestamp
                    value
                    publisher_id
                  }
                  phones {
                    id
                    congregationId
                    territory_id
                    parent_id
                    type
                    status
                    phone
                    notes
                    sort
                    create_user
                  }
                }
                status {
                  checkout_id
                  status
                  date
                  publisher {
                    id username firstname lastname
                  }
                }
              }
            }`),
            variables: {
              terrId: id,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.territory) {
          return;
        }
        const { territory: terr } = response.data.data;
        terr.addresses = orderBy(terr.addresses, 'sort');
        commit(SET_TERRITORY, terr);
        commit(GET_TERRITORY_SUCCESS);
      } catch (exception) {
        commit(GET_TERRITORY_FAIL, exception);
      }
    },

    async setTerritory({ commit }, terr) {
      commit(SET_TERRITORY, terr);
    },

    resetTerritory({ commit }) {
      commit(RESET_TERRITORY);
    },

    async resetNHRecords({ dispatch, state }, territoryId) {
      await dispatch('getTerritory', territoryId);
      const { addresses } = state.territory;

      for (const address of addresses) {
        if (address.activityLogs && address.activityLogs.length > 0) {
          await dispatch('address/addLog', { addressId: address.id, value: 'START' }, { root: true });
        }
      }
    },
  },
};
