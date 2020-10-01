<template>
  <b-container class="dashboard lead">
    <h3 v-if="!isAuthenticated">Welcome to Foreign Field</h3>
    <Auth v-if="!isAuthenticated"></Auth>
    <b-row v-else class="main">
      <div class="new-message bg-secondary text-dark align-items-center pt-2 pb-2 w-100 text-white"
      v-show='msgBoxOpen && !isPWA'>
        <div class="message text-left col-10">
          <span class="update-message">App version now available! To download, add this page to your home screen.</span>
        </div>
        <div class="col-2">
          <b-button class="dismiss-btn bg-primary text-light" pill @click="dismissMsg">
            <font-awesome-icon icon="times"></font-awesome-icon>
          </b-button>
        </div>
      </div>
      <div class="col-sm-12">
        <h3 class="align-items-center d-flex justify-content-center">
          <img class="logo pr-5" :src="require('../assets/wheat-x.png')" />
          <span class="title w-100">Dashboard</span>
        </h3>
        <Loading v-if="loading"></Loading>
        <b-button-group v-if="canManage" class="pt-4">
          <b-button v-if="canManage" variant="success" size="sm" :to="`/addresses/add`">
            <font-awesome-icon icon="plus"></font-awesome-icon> Address
          </b-button>
          <b-button v-if="canManage" variant="outline-light" size="sm" :to="`/addresses/add`" disabled>
            <font-awesome-icon icon="plus"></font-awesome-icon> Territory
          </b-button>
          <b-button v-if="canManage" variant="outline-light" size="sm" :to="`/addresses/add`" disabled>
            <font-awesome-icon icon="plus"></font-awesome-icon> Group
          </b-button>
          <b-button v-if="canManage" variant="outline-light" size="sm" :to="`/addresses/add`" disabled>
            <font-awesome-icon icon="plus"></font-awesome-icon> Publisher
          </b-button>
        </b-button-group>
      </div>
      <div v-if="!loading" class="col-sm-12 col-md-6 pt-3 pb-3">
        <span v-if="!(territories && territories.length)" class="text-center">I have no territories checked out.</span>
        <div v-else class="text-left">
          <span class="small">Territories I've checked out:</span>
          <b-list-group>
            <b-list-group-item v-for="terr in territories" :key="terr.id" class="pl-2 pr-2">
              <MyTerritory :territory="terr"></MyTerritory>
            </b-list-group-item>
          </b-list-group>
        </div>
      </div>
      <div v-if="!loading" class="col-sm-12 col-md-6 text-left pt-3 pb-3">
        <div v-if="seenTerritories.length">
          <span class="small">Other territories I've recently seen:</span>
          <b-list-group>
            <b-list-group-item v-for="terr in seenTerritories" :key="terr.id" class="pl-2 pr-2">
              <MyTerritory :territory="terr"></MyTerritory>
            </b-list-group-item>
          </b-list-group>
        </div>
      </div>
      <div v-if="!loading && canManage" class="text-left pt-3 pb-3 col-sm-12 col-md-6">
        <ChangeLog :type="'addresses'" :fullscreen="false" />
      </div>
      <div v-if="!loading && canWrite" class="text-left pt-3 pb-3 scol-sm-12 col-md-6">
        <Reports />
      </div>
    </b-row>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex';
import Auth from './Auth';
import Loading from './Loading.vue';
import Reports from './Reports';
import MyTerritory from './MyTerritory';
import ChangeLog from './ChangeLog';

export default {
  name: 'Welcome',
  components: {
    Auth,
    Loading,
    Reports,
    MyTerritory,
    ChangeLog,
  },
  data() {
    return {
      msgBoxOpen: '',
      msgDismissed: JSON.parse(localStorage.getItem('updateMsgDismissed')),
    };
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      user: 'auth/user',
      loading: 'auth/loading',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
    }),
    territories() {
      return this.user && this.user.territories;
    },
    seenTerritories() {
      let seenTerritories = [];
      if (localStorage.getItem('seenTerritories')) {
        try {
          seenTerritories = JSON.parse(localStorage.getItem('seenTerritories'));
        } catch (e) {
          localStorage.removeItem('seenTerritories');
        }
      }
      return seenTerritories.filter(s => !(this.territories && this.territories.some(t => t.id === s.id)));
    },
    isPWA() {
      return window.matchMedia('(display-mode: standalone)').matches;
    },
  },
  methods: {
    advertiseMsg() {
      if (!this.msgDismissed) {
        this.msgBoxOpen = true;
      } else {
        this.msgBoxOpen = false;
      }
    },
    dismissMsg() {
      localStorage.setItem('updateMsgDismissed', true);
      this.msgBoxOpen = false;
    },
  },
  mounted() {
    this.advertiseMsg();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
h3 {
  margin: 40px 0 0;
}
.logo {
  width: 100px;
}
.title {
  padding-right: 5.5rem;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
router-link {
  cursor: pointer;
}
.main {
  display: flex;
}
.new-message {
  display: flex;
  flex-direction: row;
}
.update-message {
  font-size: 0.95rem;
}
.firebaseui-list-item {
  width: 100%;
}
</style>
