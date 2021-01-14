/**
 * Copyright 2018 Foreign Field
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
 * OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import Vue from 'vue';
import VueRouter from 'vue-router';
import BootstrapVue from 'bootstrap-vue';
import App from './App.vue';
import Pusher from 'pusher-js';
import { router } from './routes';
import { store } from './store';
import '../node_modules/firebaseui/dist/firebaseui.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'vue-swipe-actions/dist/vue-swipe-actions.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, FontAwesomeLayers, FontAwesomeLayersText } from '@fortawesome/vue-fontawesome';
import {
  faCheck,
  faBan,
  faCheckCircle,
  faCircle,
  faInfoCircle,
  faSpinner,
  faSearch,
  faTimes,
  faCircleNotch,
  faPencilAlt,
  faPlusSquare,
  faMinusSquare,
  faSquare,
  faHome,
  faHistory,
  faEllipsisV,
  faPhone,
  faEnvelope,
  faHouseUser,
  faPlayCircle,
  faPhoneAlt,
  faDirections,
  faEdit,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faPlus,
  faGripLines,
  faQuestionCircle,
  faFilter,
  faSortAmountDownAlt,
  faSms,
  faRedoAlt,
  faArchive,
  faComment,
  faSmile,
  faVoicemail,
  faCommentSlash,
  faPhoneSlash,
  faTrashAlt,
  faMinusCircle,
  faSave,
  faSlash,
  faUser,
  faBolt,
  faExclamationTriangle,
  faMap,
  faEyeSlash,
  faExpandAlt,
  faCompressAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Icon } from 'leaflet';

library.add(
  faCheck,
  faBan,
  faCheckCircle,
  faCircle,
  faInfoCircle,
  faSpinner,
  faSearch,
  faTimes,
  faCircleNotch,
  faPencilAlt,
  faPlusSquare,
  faMinusSquare,
  faSquare,
  faHome,
  faHistory,
  faEllipsisV,
  faPhone,
  faEnvelope,
  faHouseUser,
  faPlayCircle,
  faPhoneAlt,
  faDirections,
  faEdit,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faPlus,
  faGripLines,
  faQuestionCircle,
  faFilter,
  faSortAmountDownAlt,
  faSms,
  faRedoAlt,
  faArchive,
  faComment,
  faSmile,
  faVoicemail,
  faCommentSlash,
  faPhoneSlash,
  faTrashAlt,
  faMinusCircle,
  faSave,
  faSlash,
  faUser,
  faBolt,
  faExclamationTriangle,
  faMap,
  faEyeSlash,
  faExpandAlt,
  faCompressAlt,
);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);
Vue.component('font-awesome-layers-text', FontAwesomeLayersText);

Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(BootstrapVue);

/* eslint-disable */
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
/* eslint-enable */
const pusher = new Pusher(process.env.VUE_APP_PUSHER_KEY, {
  cluster: 'us2',
});

export const channel = pusher.subscribe('foreign-field');

function init() {
  new Vue({
    render: h => h(App),
    router,
    store,
    async created() {
      try {
        await this.$store.dispatch('auth/firebaseInit');
      } catch (e) {
        console.error(e);
      }
    },
  }).$mount('#app');
}

init();
