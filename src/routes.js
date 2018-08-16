import VueRouter from 'vue-router';
import { store } from './store';
import Home from './components/Home';
import Territories from './components/Territories';
import Territory from './components/Territory';

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
];

export const router = new VueRouter({
  routes
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(r => r.meta.requiresAuth)) {
    const isAuthenticated = store.getters['auth/isAuthenticated'];
    const user = store.getters['auth/user'];
    let hasPermission = false;
    
    if (user) {
      hasPermission = to.meta.permissions.includes(user.role);
    }
      
    if (!isAuthenticated || !hasPermission) {
      store.dispatch('auth/forceout');
      next({
        name: 'home',
      });
    } else {
      next();
    }
  } else {
    next();
  }
});