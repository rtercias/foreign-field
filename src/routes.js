import VueRouter from 'vue-router';
import { store } from './store';
import Home from './components/Home';
import Territories from './components/Territories';
import Territory from './components/Territory';
import Dnc from './components/Dnc';
import { getToken, isTokenExpired } from './store/modules/auth';

const routes = [
  { name: 'home', path: '/', component: Home },
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
  routes
});

router.beforeEach(async (to, from, next) => {
  const token = getToken();
  if (to.matched.some(r => r.meta.requiresAuth) || !isTokenExpired(token)) {
    await store.dispatch('auth/login');
    const isAuthenticated = store.getters['auth/isAuthenticated'];
    const user = store.getters['auth/user'];
    let hasPermission = false;
    
    if (user) {
      hasPermission = to.meta.permissions && to.meta.permissions.includes(user.role) || true;
    }
      
    if (!isAuthenticated || !hasPermission) {
      store.dispatch('auth/forceout');
      if (to.name !== 'home') {
        next({
          name: 'home',
        });
      }
    } else {
      next();
    }
  } else {
    next();
  }
});