import axios from 'axios';

const DNC_SUCCESS = 'DNC_SUCCESS';
const DNC_FAIL = 'DNC_FAIL';

export const addresses = {
  namespaced: true,
  state: {
    addresses: [],
    dnc: [],
  },
  getters: {
    dnc: state => state.dnc,
  },
  mutations: {
    DNC_SUCCESS(state, dnc) {
      state.dnc = dnc;
    },
    DNC_FAIL(state, exception) {
      console.error(DNC_FAIL, exception);
    },
  },
  actions: {
    async getDnc({ commit }, id) {
      try {
        if (!id) {
          return;
        }
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            query: `query Dnc($congId: Int) {
              dnc(congId:$congId) {
                addr1
                addr2
                city
                state_province
              }
            }`,
            variables: {
              congId: id,
            },
          },
        });

        if (!response || !response.data || !response.data.data || !response.data.data.dnc) {
          return;
        }

        const raw = response.data.data.dnc;

        const dnc = raw.map(d => ({
          address: `
              ${d.addr1} 
              ${d.addr2 ? `${d.addr2} ` : ''}
              ${d.city ? `${d.city} ` : ''}
              ${d.state_province ? `${d.state_province} ` : ''}`,
        }));

        commit(DNC_SUCCESS, dnc);
      } catch (exception) {
        commit(DNC_FAIL, exception);
      }
    },
  },
};
