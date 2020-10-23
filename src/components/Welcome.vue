<template>
  <b-container class="dashboard lead">
    <h3 v-if="!isAuthenticated">Welcome to Foreign Field</h3>
    <Auth v-if="!isAuthenticated"></Auth>
    <b-row v-else class="main justify-content-center">
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
      <div class="col-sm-12 mb-3">
        <h3 class="align-items-center d-flex justify-content-center">
          <img class="logo pr-5" :src="require('../assets/wheat-x.png')" />
          <span class="title w-100">Dashboard</span>
        </h3>
        <Loading v-if="loading"></Loading>
        <b-button-group class="pt-4">
          <b-button v-if="canWrite" variant="success" size="sm" :to="`/addresses/add`">
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
      <div v-if="!loading" class="panel col-sm-12 col-md-5 pt-3 pb-3 border-info m-2">
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
      <div v-if="!loading" class="panel col-sm-12 col-md-5 text-left pt-3 pb-3 border-info m-2">
        <span class="small">Other territories I've recently seen:</span>
        <div v-if="seenTerritories.length">
          <b-list-group>
            <b-list-group-item v-for="terr in seenTerritories" :key="terr.id" class="pl-2 pr-2">
              <div class="d-flex justify-content-between align-items-center">
                <MyTerritory :territory="terr"></MyTerritory>
                <b-button class="text-danger"
                  variant="link" @click="removeSeenTerritory(terr.id)"
                  >
                  <font-awesome-icon icon="times"></font-awesome-icon>
                </b-button>
              </div>

            </b-list-group-item>
          </b-list-group>
        </div>
      </div>
      <div v-if="!loading && canManage" class="panel text-left pt-3 pb-3 col-sm-12 col-md-5 border-info m-2">
        <ChangeLog :type="'addresses'" :fullscreen="false" />
      </div>
      <div v-if="!loading && canWrite" class="panel text-left pt-3 pb-3 scol-sm-12 col-md-5 border-info m-2">
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
      seenTerritories: [],

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
      return this.user && this.user.territories || [];
    },
    isPWA() {
      return window.matchMedia('(display-mode: standalone)').matches;
    },
  },
  methods: {
    getSeenTerritories() {
      if (localStorage.getItem('seenTerritories')) {
        try {
          const seen = JSON.parse(localStorage.getItem('seenTerritories')).filter(s => 'id' in s);
          this.seenTerritories = seen.filter(s => this.territories.some(t => t.id !== s.id));
        } catch (e) {
          localStorage.removeItem('seenTerritories');
        }
      }
    },
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
    removeSeenTerritory(id) {
      const filtered = this.seenTerritories.filter(t => t.id !== id);
      localStorage.setItem('seenTerritories', JSON.stringify(filtered));
      this.seenTerritories = filtered;
    },
  },
  mounted() {
    this.advertiseMsg();
    this.getSeenTerritories();
  },
  watch: {
    territories() {
      this.getSeenTerritories();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.firebaseui-idp-list {
  text-align: center;
  .firebaseui-list-item {
    width: 200px;
  }
}
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
.panel {
  border-radius: 10px;
  border-style: double;
}

</style>
