import axios from 'axios';

const CHECKIN = 'CHECKIN';

export const territory = {
  namespaced: true,
  state: {
    id: undefined,
    group_code: undefined,
    congregationid: undefined,
    name: undefined,
    description: undefined,
    type: undefined,
    addresses: undefined,
    city: undefined,
    status: undefined,
  },

  getters: {
  
  },

  mutations: {
    CHECKIN(state, newStatus) {
      state.status = newStatus;
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
              status 
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
  }
}

