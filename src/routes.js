import VueRouter from 'vue-router';
import Home from './components/Home';
import Territories from './components/Territories';
import Territory from './components/Territory';

const routes = [
  { path: '/', component: Home },
  { path: '/territories', component: Territories },
  { 
    path: '/territories/:id', 
    component: Territory, 
  }
];

export const router = new VueRouter({
  routes
});
