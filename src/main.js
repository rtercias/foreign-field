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
import { faCheck, faBan, faCheckCircle, faCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers, FontAwesomeLayersText } from '@fortawesome/vue-fontawesome'

library.add(faCheck, faBan, faCheckCircle, faCircle, faInfoCircle);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);
Vue.component('font-awesome-layers-text', FontAwesomeLayersText);

Vue.config.productionTip = false;
Vue.use(GoogleAuth, { client_id: process.env.VUE_APP_CLIENT_ID });
Vue.use(VueRouter); 
Vue.use(BootstrapVue); 
Vue.googleAuth().load();

new Vue({
  render: h => h(App),
  router,
  store,
}).$mount('#app');
