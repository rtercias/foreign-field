import VueRouter from 'vue-router';
import { store } from './store';
import Home from './components/Home';
import Territories from './components/Territories';
import Territory from './components/Territory';

const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'group', path: '/territories/:group', component: Territories, props: true, meta: { requiresAuth: true } },
  { name: 'territory', path: '/territories/:group/:id', component: Territory, props: true, meta: { requiresAuth: true } },
];

export const router = new VueRouter({
  routes
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(r => r.meta.requiresAuth)) {
    if (!store.getters['auth/isAuthenticated']) {
      next({
        path: '/',
      });
    }
  } else {
    next();
  }
});