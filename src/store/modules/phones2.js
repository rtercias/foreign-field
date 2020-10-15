// import axios from 'axios';
// import gql from 'graphql-tag';
// import orderBy from 'lodash/orderBy';
// import { print } from 'graphql/language/printer';
const PHONES = [
  {
    id: 0,
    phone: '111-111-1111',
    status: 'some description',
  },
  {
    id: 1,
    phone: '222-222-2222',
    status: 'some description',
  },
  {
    id: 2,
    phone: '510-222-2222',
    status: 'some description',
  },
];

export const phones = {
  namespaced: true,
  state: {
    phones: [],
  },
  getters: {
    phones: () => PHONES,
  },
  mutations: {
  },
  actions: {
  },
};
