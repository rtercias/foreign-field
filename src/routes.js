import VueRouter from 'vue-router';
import Home from './components/Home';
import Territories from './components/Territories';
import Territory from './components/Territory';

const routes = [
  { path: '/', component: Home },
  { path: '/territories/:group', component: Territories, props: true },
  { path: '/territories/:group/:id', component: Territory, props: true },
];

export const router = new VueRouter({
  routes
});
