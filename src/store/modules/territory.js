import axios from 'axios';

const CHANGE_STATUS = 'CHANGE_STATUS';
const GET_TERRITORY_SUCCESS = 'GET_TERRITORY_SUCCESS';
const GET_TERRITORY_FAIL = 'GET_TERRITORY_FAIL';

export const territory = {
  namespaced: true,
  state: {
    territory: {}
  },

  getters: {
    territory: state => {
      return state.territory;
    },
    congId: state => {
      return state.territory.congregationid;
    },
    isCheckedOut: state => {
      return state.territory && state.territory.status && state.territory.status.status === 'Checked Out';
    }
  },

  mutations: {
    CHANGE_STATUS(state, newStatus) {
      state.status = newStatus;
    },
    GET_TERRITORY_SUCCESS(state, territory) {
      state.territory = territory;
    },
    GET_TERRITORY_FAIL(state, exception) { /* eslint-disable-line no-unused-vars */
      // console.log(GET_TERRITORY_FAIL, exception);
    },
  },

  actions: {
    async checkinTerritory({ commit }, args) {
      try {
        if (!args) {
          throw new Error('Unable to check in territory because the required arguments were not provided');
        }

        await axios({
          data: {
            query: `mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  status
                }
              }
            }`,
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            }
          }
        });

        commit(CHANGE_STATUS, { status: 'Recently Worked' });

      } catch (e) {
        console.error('Unable to check in territory', e);
      }
    },

    async checkoutTerritory({ commit }, args) {
      try {
        await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  status
                }
              }
            }`,
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            }
          }
        });

        commit(CHANGE_STATUS, { status: 'Checked Out' });

      } catch (e) {
        console.error('Unable to checkout territory', e);
      }
    },

    async getTerritory({ commit }, id) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `query Territory($terrId: Int) { 
              territory (id: $terrId) {
                group_code id congregationid name description type 
                addresses {
                  id addr1 addr2 city state_province postal_code
                  phone longitude latitude notes
                }
                status {
                  status
                  date
                  publisher {
                    username firstname lastname
                  }
                }
              }
            }`,
            variables: {
              terrId: id,
            }
          }
        });

        if (!response || !response.data || !response.data.data || !response.data.data.territory) {
          return null;
        }        
        const territory = response.data.data.territory;
        commit(GET_TERRITORY_SUCCESS, territory);

      } catch (exception) {
        commit(GET_TERRITORY_FAIL, exception);
      }
    },
  }
}

