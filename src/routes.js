import VueRouter from 'vue-router';
import Auth from './components/Auth';
import Welcome from './components/Welcome';
import Unauthorized from './components/Unauthorized';
import Error from './components/Error';
import Signout from './components/Signout';
import Territories from './components/Territories';
import Territory from './components/Territory';
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
import DNCReport from './components/DNCReport';
import CongregationSwitch from './components/CongregationSwitch.vue';
import PublisherToken from './components/PublisherToken.vue';
import { store } from './store';

const routes = [
  { name: 'home', path: '/', component: Welcome, meta: { label: 'Home' } },
  { name: 'auth', path: '/auth', component: Auth },
  { name: 'welcome', path: '/welcome', component: Welcome },
  { name: 'unauthorized', path: '/unauthorized', component: Unauthorized },
  { name: 'error', path: '/error', component: Error },
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
      label: 'Congregation Profile',
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
    name: 'group-add',
    path: '/groups/add',
    component: GroupForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO'],
      back: 'congregation-edit',
      label: 'Add Group',
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
      label: 'Edit Group',
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
      label: 'Territories',
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
      component: PhoneWitnessing,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
        back: 'group',
        label: 'Territory',
      },
    }, {
      name: 'map-view',
      path: 'map',
      component: TerritoryMap,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
        back: 'group',
        label: 'Territory Map',
      },
    }, {
      name: 'phone-list',
      path: 'phone',
      component: PhoneWitnessing,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
        back: 'group',
        label: 'Territory',
      },
    }, {
      name: 'optimize',
      path: 'optimize',
      component: Optimize,
      props: true,
      meta: {
        permissions: ['Admin', 'TS', 'SO', 'GO'],
        back: 'map-view',
        label: 'Territory Optimize',
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
      label: 'Edit Territory',
    },
  },
  {
    name: 'search',
    path: '/search/:keyword',
    component: SearchResults,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      label: 'Global Search',
    },
  },
  {
    name: 'assignment-report',
    path: '/reports/assignment-report/:congregationId',
    component: AssignmentReport,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      label: 'S-13 Assignment Report',
    },
  },
  {
    name: 'dnc-report',
    path: '/reports/dnc/:congregationId',
    component: DNCReport,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      label: 'Do Not Call Report',
    },
  },
  {
    name: 'change-logs',
    path: '/reports/logs/:type',
    component: ChangeLog,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO'],
      label: 'Change Log',
      preserveQueryString: true,
      back: 'home',
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
      label: 'Address Change Log',
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
      label: 'Address Info',
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
      label: 'Address Activity History',
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
      label: 'Current Checkout Activity History',
    },
  },
  {
    name: 'address-new',
    path: '/addresses/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E'],
      label: 'Add Address',
      preserveQueryString: true,
    },
  },
  {
    name: 'address-new-terr',
    path: '/territories/:territoryId/addresses/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP-E'],
      back: 'address-list',
      label: 'Add Address',
    },
  },
  {
    name: 'address-edit',
    path: '/territories/:territoryId/addresses/:addressId/:mode',
    component: AddressForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E'],
      back: 'address-links',
      label: 'Edit Address',
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
      label: 'Add Territory',
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
      label: 'Add Publisher',
    },
  },
  {
    name: 'publisher-edit',
    path: '/publishers/:publisherId/edit',
    component: PublisherForm,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP', 'RP-E', 'PUB'],
      back: 'congregation-edit',
      label: 'Edit Publisher',
    },
  },
  {
    name: 'publisher-token',
    path: '/publishers/token',
    component: PublisherToken,
    props: true,
    meta: {
      permissions: ['Admin', 'TS', 'SO', 'GO', 'RP-E'],
      label: 'Generate Token',
    },
  },
  {
    name: 'congregation-switch',
    path: '/congregation-switch',
    component: CongregationSwitch,
    props: true,
    meta: {
      permissions: ['Admin', 'CO'],
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
    store.dispatch('auth/setScrollYPosition', { route: from.path, yPos: window.scrollY }, { root: true });
    convertIdsToNumber(to);
    // const CANCELLABLE_ROUTES = ['phone-list', 'address-list'];
    // // eslint-disable-next-line
    // console.log('from.name', from.name);
    // if (CANCELLABLE_ROUTES.includes(from.name)) {
    //   axiosToken.cancel('API request aborted on route change');
    // }
    next();
  } catch (e) {
    console.warn('route beforeEach guard error', e);
  }
});
