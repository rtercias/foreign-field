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
    CHECKIN(state) {
      state.status = 'Recently Worked';
    },
  },

  actions: {
    async checkinTerritory({ commit }, args) {
      console.log('user', args.username);
      console.log('territory', args.territoryId);
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

      commit(CHECKIN);
    },
  }
}

