import Vue from 'vue';
import VueRouter from 'vue-router';
import BootstrapVue from 'bootstrap-vue';
import App from './App.vue';
import GoogleAuth from 'vue-google-auth';
import { router } from './routes';
import VueRouterUserRoles from 'vue-router-user-roles';
import { store } from './store';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheck, faBan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCheck, faBan);
Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.config.productionTip = false;
Vue.use(GoogleAuth, { client_id: process.env.VUE_APP_CLIENT_ID });
Vue.use(VueRouter); 
Vue.use(BootstrapVue); 
Vue.use(VueRouterUserRoles, { router });
Vue.googleAuth().load();

const guest = { role: 'guest' };
Vue.prototype.$user.set(guest);

new Vue({
  render: h => h(App),
  router,
  store,
}).$mount('#app');
