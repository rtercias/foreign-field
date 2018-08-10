import Vue from 'vue';
import VueRouter from 'vue-router';
import BootstrapVue from 'bootstrap-vue';
import App from './App.vue';
import GoogleAuth from 'vue-google-auth';
import { router } from './routes';
import { store } from './store';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheck, faBan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

Vue.use(GoogleAuth, { client_id: '658139066753-0r04v3m8cpqlbj75rr3gc7gnm4ib1u6i.apps.googleusercontent.com' });
Vue.googleAuth().load();

library.add(faCheck, faBan);
Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.config.productionTip = false;
Vue.use(VueRouter); 
Vue.use(BootstrapVue); 

new Vue({
  render: h => h(App),
  router,
  store,
}).$mount('#app');
