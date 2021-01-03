import VueRouter from 'vue-router';
import Auth from './components/Auth';
import Welcome from './components/Welcome';
import Unauthorized from './components/Unauthorized';
import Signout from './components/Signout';
import Territories from './components/Territories';
import Territory from './components/Territory';
import TerritoryAddresses from './components/TerritoryAddresses';
import TerritoryMap from './components/TerritoryMap';
import SearchResults from './components/SearchResults';
import AssignmentReport from './components/AssignmentReport';
import AddressLinks from './components/AddressLinks';
import ActivityHistory from './components/ActivityHistory';
import AddressForm from './components/AddressForm';
import Optimize from './components/Optimize';
import ChangeLog from './components/ChangeLog';
import PhoneWitnessing from './components/PhoneWitnessing';
import TerritoryForm from './components/TerritoryForm';
import CongregationForm from './components/CongregationForm';
import GroupForm from './components/GroupForm';
import PublisherForm from './components/PublisherForm';

const routes = [
  { name: 'home', path: '/', component: Welcome },
  { name: 'auth', path: '/auth', component: Auth },
  { name: 'welcome', path: '/welcome', component: Welcome },
  { name: 'unauthorized', path: '/unauthorized', component: Unauthorized },
  {
    name: 'signout', path: '/signout', component: Signout, props: true,
  },
  {
    name: 'congregation-edit',
    path: '/congregation/:congregationId(\\d+)',
    component: CongregationForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      back: 'home',
    },
  },
  {
    name: 'congregation-add',
    path: '/congregation/add',
    component: CongregationForm,
    props: true,
    meta: {
      permissions: ['Admin'],
      back: 'home',
    },
  },
  {
    name: 'territories',
    path: '/territories',
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'GO', 'SO', 'RP-E'],
    },
    redirect: '/groups/0',
  },
  {
    name: 'group-add',
    path: '/groups/add',
    component: GroupForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO'],
      back: 'congregation-edit',
    },
  },
  {
    name: 'group-edit',
    path: '/groups/:groupId/edit',
    component: GroupForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO'],
      back: 'congregation-edit',
    },
  },
  {
    name: 'group',
    path: '/groups/:groupId',
    component: Territories,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'GO', 'SO', 'RP-E'],
      back: 'home',
    },
  },
  {
    path: '/territories/:territoryId(\\d+)',
    component: Territory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      back: 'group',
    },
    children: [{
      name: 'address-list',
      path: '/',
      component: TerritoryAddresses,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
        back: 'group',
      },
    }, {
      name: 'map-view',
      path: 'map',
      component: TerritoryMap,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
        back: 'group',
      },
    }, {
      name: 'phone-list',
      path: 'phone',
      component: PhoneWitnessing,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
        back: 'group',
      },
    }, {
      name: 'optimize',
      path: 'optimize',
      component: Optimize,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO'],
        back: 'map-view',
      },
    }],
  },
  {
    name: 'territory-edit',
    path: '/territories/:territoryId/edit',
    component: TerritoryForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      back: 'group',
    },
  },
  {
    name: 'territory-group',
    path: '/territories/:groupId/:territoryId',
    props: true,
    redirect: (to) => {
      if (to.params.territoryId && Number.isSafeInteger(Number(to.params.territoryId))) {
        return '/territories/:territoryId';
      }
      if (to.params.groupId) {
        return '/groups/:groupId';
      }
      return '';
    },
    meta: {
      permissions: ['Admin', 'TS', 'GO', 'SO', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'search',
    path: '/search/:keyword',
    component: SearchResults,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'assignment-report',
    path: '/reports/assignment-report/:congregationId',
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
    path: '/territories/:territoryId/:type/:recordId/logs',
    component: ChangeLog,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      back: 'address-links',
    },
  },
  {
    name: 'address-links',
    path: '/territories/:territoryId/addresses/:addressId/detail',
    component: AddressLinks,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      back: 'address-list',
    },
  },
  {
    name: 'activity-history',
    path: '/territories/:territoryId/addresses/:addressId/history',
    component: ActivityHistory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      back: 'address-links',
    },
  },
  {
    name: 'activity-history-checkout',
    path: '/territories/:territoryId/addresses/:addressId/history/:checkoutId',
    component: ActivityHistory,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      back: 'address-list',
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
    path: '/territories/:territoryId/addresses/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      back: 'address-list',
    },
  },
  {
    name: 'address-edit',
    path: '/territories/:territoryId/addresses/:addressId/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      back: 'address-links',
    },
  },
  {
    name: 'phone-new',
    path: '/territories/:territoryId/addresses/:addressId/phones/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E'],
    },
  },
  {
    name: 'phone-edit',
    path: '/territories/:territoryId/addresses/:addressId/phones/:phoneId/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
    },
  },
  {
    name: 'territory-new',
    path: '/territories/add',
    component: TerritoryForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      back: 'group',
    },
  },
  {
    name: 'publisher-add',
    path: '/publishers/add',
    component: PublisherForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO'],
      back: 'congregation-edit',
    },
  },
  {
    name: 'publisher-edit',
    path: '/publishers/:publisherId/edit',
    component: PublisherForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO'],
      back: 'congregation-edit',
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
  try {
    convertIdsToNumber(to);
    next();
  } catch (e) {
    console.warn('route beforeEach guard error', e);
  }
});
