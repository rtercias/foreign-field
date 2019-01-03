import VueRouter from 'vue-router';
import Auth from './components/Auth';
import Welcome from './components/Welcome';
import Signout from './components/Signout';
import Territories from './components/Territories';
import Territory from './components/Territory';
import Dnc from './components/Dnc';

const routes = [
  { name: 'home', path: '/', component: Auth },
  { name: 'auth', path: '/auth', component: Auth },
  { name: 'welcome', path: '/welcome', component: Welcome },
  { name: 'signout', path: '/signout', component: Signout, props: true },
  { 
    name: 'group', 
    path: '/territories/:group', 
    component: Territories, 
    props: true, 
    meta: { 
      requiresAuth: true,
      permissions: ['Admin', 'TS'],
    } 
  },
  { 
    name: 'territory', 
    path: '/territories/:group/:id', 
    component: Territory, 
    props: true, 
    meta: {} 
  },
  {
    name: 'dnc',
    path: '/dnc/:id',
    component: Dnc,
    props: true,
    meta: {},
  },
];

export const router = new VueRouter({
  mode: 'history',
  routes
});
