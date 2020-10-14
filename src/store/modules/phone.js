// import axios from 'axios';
// import gql from 'graphql-tag';
// import { print } from 'graphql/language/printer';


export const PHONE_STATUS = {
  Active: 'Active',
  NF: 'NF',
  DNC: 'DNC',
};

const SET_ADDRESS = 'SET_ADDRESS';

// const ADD_ADDRESS = 'ADD_ADDRESS';

const ACTION_BUTTON_LIST = [
  {
    type: 'fa-icon',
    value: 'START',
    text: '',
    icon: '',
    color: 'success',
  },
  {
    type: 'fa-icon',
    value: 'NH',
    text: 'NH',
    icon: 'circle',
    color: 'warning',
  },
  {
    type: 'fa-icon',
    value: 'HOME',
    text: '',
    icon: 'house-user',
    color: 'primary',
  },
  {
    type: 'fa-icon',
    value: 'PH',
    text: '',
    icon: 'phone',
    color: 'info',
  },
  {
    type: 'fa-icon',
    value: 'LW',
    text: '',
    icon: 'envelope',
    color: 'primary',
  },
];

export const phone = {
  namespaced: true,
  state: {
    phone: {},
  },

  getters: {
    phone: state => state.phone,
    actionButtonList: () => ACTION_BUTTON_LIST,

  },

  mutations: {

    ADD_PHONE(state, addr) {
      state.address = addr;
    },
  },

  actions: {
    setAddress({ commit }, addr) {
      commit(SET_ADDRESS, addr);
    },

    async fetchPhone({ commit }) {
      commit('auth/LOADING', true, { root: true });
    },
    // async addPhone({ commit, rootGetters }, _address) {
    // },
  },
};
