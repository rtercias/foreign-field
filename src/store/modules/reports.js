import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import { TEST_TERRITORIES } from './territories';

const SET_ASSIGNMENT_RECORDS = 'SET_ASSIGNMENT_RECORDS';

export const reports = {
  namespaced: true,
  state: {
    assignmentRecords: [],
  },
  getters: {
    assignmentRecords: state => state.assignmentRecords.filter(r => !TEST_TERRITORIES.includes(r.territory_name)),
  },
  mutations: {
    SET_ASSIGNMENT_RECORDS: (state, records) => {
      state.assignmentRecords = records;
    },
  },
  actions: {
    async fetchAssignmentRecords({ commit }, { congId, campaignMode }) {
      if (!congId) {
        console.error('congId is required');
        return;
      }

      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: print(gql`query AssignmentRecords($congId: Int $campaignMode: Boolean) {
            getAssignmentRecords (congId: $congId campaignMode: $campaignMode) {
              territory_name
              territory_description
              publisher_name
              out
              in
              timestamp
            }
          }`),
          variables: {
            congId,
            campaignMode,
          },
        },
      });

      if (response && response.data && response.data.data) {
        const records = response.data.data.getAssignmentRecords || [];
        commit(SET_ASSIGNMENT_RECORDS, records);
      }
    },
  },
};
