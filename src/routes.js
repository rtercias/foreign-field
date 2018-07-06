import VueRouter from 'vue-router';
import Home from './components/Home';
import Checkout from './components/Checkout';

const routes = [
  { path: '/', component: Home },
  { path: '/checkout', component: Checkout }
];

export const router = new VueRouter({
  routes
});
