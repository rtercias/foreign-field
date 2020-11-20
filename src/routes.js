import VueRouter from 'vue-router';
import Auth from './components/Auth';
import Welcome from './components/Welcome';
import Unauthorized from './components/Unauthorized';
import Signout from './components/Signout';
import Territories from './components/Territories';
import Territory from './components/Territory';
import TerritoryAddresses from './components/TerritoryAddresses';
import TerritoryMap from './components/TerritoryMap';
import Dnc from './components/Dnc';
import AssignmentReport from './components/AssignmentReport';
import AddressLinks from './components/AddressLinks';
import ActivityHistory from './components/ActivityHistory';
import AddressForm from './components/AddressForm';
import Optimize from './components/Optimize';
import ChangeLog from './components/ChangeLog';
import PhoneWitnessing from './components/PhoneWitnessing';

const routes = [
  { name: 'home', path: '/', component: Welcome },
  { name: 'auth', path: '/auth', component: Auth },
  { name: 'welcome', path: '/welcome', component: Welcome },
  { name: 'unauthorized', path: '/unauthorized', component: Unauthorized },
  {
    name: 'signout', path: '/signout', component: Signout, props: true,
  },
  {
    name: 'group',
    path: '/territories/:group',
    component: Territories,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'GO', 'SO', 'RP-E'],
    },
  },
  {
    name: 'territory',
    path: '/territories/:group/:id',
    component: Territory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
    children: [{
      name: 'address-list',
      path: '/',
      component: TerritoryAddresses,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      },
    }, {
      name: 'map-view',
      path: 'map',
      component: TerritoryMap,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      },
    }, {
      name: 'phone-list',
      path: 'phone',
      component: PhoneWitnessing,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      },
    }],
  },
  {
    name: 'optimize',
    path: '/territories/:group/:id/optimize',
    component: Optimize,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
    },
  },
  {
    name: 'dnc',
    path: '/dnc/:id',
    component: Dnc,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'assignment-report',
    path: '/reports/assignment-report/:id',
    component: AssignmentReport,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
    },
  },
  {
    name: 'change-logs',
    path: '/reports/logs/:type',
    component: ChangeLog,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
    },
  },
  {
    name: 'address-change-logs',
    path: '/territories/:group/:territoryId/:type/:recordId/logs',
    component: ChangeLog,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
    },
  },
  {
    name: 'address-links',
    path: '/territories/:group/:territoryId/addresses/:addressId/detail',
    component: AddressLinks,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'activity-history',
    path: '/territories/:group/:territoryId/addresses/:addressId/history',
    component: ActivityHistory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'address-new',
    path: '/addresses/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E'],
    },
  },
  {
    name: 'address-new-terr',
    path: '/territories/:group/:territoryId/addresses/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
    },
  },
  {
    name: 'address-edit',
    path: '/territories/:group/:territoryId/addresses/:addressId/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'phone-new',
    path: '/territories/:group/:territoryId/addresses/:addressId/phones/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E'],
    },
  },
  {
    name: 'phone-edit',
    path: '/territories/:group/:territoryId/addresses/:addressId/phones/:phoneId/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
];

export const router = new VueRouter({
  mode: 'history',
  routes,
});

function convertIdsToNumber(to) {
  const keys = Object.keys(to.params) || [];
  const keysWithId = keys.filter(k => k.toLowerCase().includes('id')) || [];

  keysWithId.forEach((k) => {
    const value = Number(to.params[k]);
    if (!Number.isNaN(value)) {
      to.params[k] = value;
    }
  });
}

router.beforeEach((to, from, next) => {
  convertIdsToNumber(to);
  next();
});
