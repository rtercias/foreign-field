import VueRouter from 'vue-router';
import Auth from './components/Auth';
import Welcome from './components/Welcome';
import Signout from './components/Signout';
import Territories from './components/Territories';
import Territory from './components/Territory';
import Dnc from './components/Dnc';
import Address from './components/Address';
import AssignmentReport from './components/AssignmentReport';
import ActivityHistory from './components/ActivityHistory';

const routes = [
  { name: 'home', path: '/', component: Welcome },
  { name: 'auth', path: '/auth', component: Auth },
  { name: 'welcome', path: '/welcome', component: Welcome },
  {
    name: 'signout', path: '/signout', component: Signout, props: true,
  },
  {
    name: 'address',
    path: '/territories/:group/:id/address/:addressId',
    component: Address,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'PUB'],
    },
  },
  {
    name: 'group',
    path: '/territories/:group',
    component: Territories,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'GO', 'SO'],
    },
  },
  {
    name: 'territory',
    path: '/territories/:group/:id',
    component: Territory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'PUB'],
    },
  },
  {
    name: 'dnc',
    path: '/dnc/:id',
    component: Dnc,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'PUB'],
    },
  },
  {
    name: 'assignment-report',
    path: '/assignment-report/:id',
    component: AssignmentReport,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO'],
    },
  },
  {
    name: 'activity-history',
    path: '/addresses/:addressId/history',
    component: ActivityHistory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'PUB'],
    },
  },
];

export const router = new VueRouter({
  mode: 'history',
  routes,
});
