import axios from 'axios';

const CHECKIN = 'CHECKIN';
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
    }
  },

  mutations: {
    CHECKIN(state, newStatus) {
      state.status = newStatus;
    },
    GET_TERRITORY_SUCCESS(state, territory) {
      state.territory = territory;
    },
    GET_TERRITORY_FAIL(state, exception) {
      console.log(GET_TERRITORY_FAIL, exception);
    },
  },

  actions: {
    async checkinTerritory({ commit }, args) {
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

      commit(CHECKIN, {
        status: 'Recently Worked',
      });
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

