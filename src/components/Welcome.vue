<template>
  <b-container class="dashboard lead">
    <h3 v-if="!isAuthenticated">Welcome to Foreign Field</h3>
    <Auth v-if="!isAuthenticated"></Auth>
    <b-row v-else class="main justify-content-center">
      <div class="new-message bg-secondary text-dark align-items-center py-2 w-100 text-white"
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
      <div class="col-sm-12 pb-3">
        <h3 class="align-items-center d-flex justify-content-center" :class="{ 'flex-column': isDesktop }">
          <img class="logo" :class="{ 'pr-5': !isDesktop }" :src="require('../assets/wheat-x.png')" />
          <span class="title w-100" :class="{ 'pr-0': isDesktop }">Dashboard</span>
        </h3>
        <Loading v-if="loading"></Loading>
      </div>
      <div class="panel col-sm-12 col-md-5 py-3 border-info m-2 d-flex">
        <font-awesome-icon
          icon="circle-notch"
          spin
          v-if="myTerritoriesLoading"
          class="my-territories-loading text-info text-center w-100 align-self-center"
        />
        <span v-else-if="isUserError" class="text-center small">
          Unable to retrieve user data
          <b-button @click="refresh">Refresh</b-button>
        </span>
        <span v-else-if="!(territories && territories.length)" class="text-center small">
          I have no territories checked out.
        </span>
        <div v-else class="text-left w-100">
          <div class="d-flex justify-content-between align-items-center pb-1">
            <span class="small">Territories I've checked out:</span>
            <b-button class="p-0" variant="link">
              <font-awesome-icon icon="redo-alt" class="text-info fa-sm" @click="refreshTerritories" />
            </b-button>
          </div>
          <b-list-group>
            <b-list-group-item v-for="terr in territories" :key="terr.id" class="px-2">
              <MyTerritory :territory="terr"></MyTerritory>
            </b-list-group-item>
          </b-list-group>
        </div>
      </div>
      <div v-if="!loading" class="panel col-sm-12 col-md-5 text-left py-3 border-info m-2">
        <span v-if="!recentlySeenWithoutCheckout.length" class="text-center small">
          I have not visited any territories lately.
        </span>
        <div v-else>
          <span class="small">Other territories I've recently seen:</span>
          <b-list-group>
            <b-list-group-item v-for="terr in recentlySeenWithoutCheckout" :key="terr.id" class="px-2">
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
      <div v-if="!loading && canManage" class="panel text-left py-3 col-sm-12 col-md-5 border-info m-2">
        <ChangeLog :type="'addresses'" :fullscreen="false" />
      </div>
      <div v-if="!loading && canWrite" class="panel text-left py-3 scol-sm-12 col-md-5 border-info m-2">
        <Reports />
      </div>
    </b-row>
  </b-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import differenceBy from 'lodash/differenceBy';
import Auth from './Auth';
import Loading from './Loading.vue';
import Reports from './Reports';
import MyTerritory from './MyTerritory';
import ChangeLog from './ChangeLog';
import GroupsSelect from './GroupsSelect';

export default {
  name: 'Welcome',
  components: {
    Auth,
    Loading,
    Reports,
    MyTerritory,
    ChangeLog,
    GroupsSelect,
  },
  beforeRouteLeave(to, from, next) {
    const token = get(this.addressesCancelTokens, 'GET_CHANGE_LOG');
    if (token) token.cancel();
    next();
  },
  data() {
    return {
      msgBoxOpen: '',
      msgDismissed: JSON.parse(localStorage.getItem('updateMsgDismissed')),
      isUserError: false,
      forceUpdate: false,
    };
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      user: 'auth/user',
      loading: 'auth/loading',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      isDesktop: 'auth/isDesktop',
      myTerritoriesLoading: 'auth/myTerritoriesLoading',
      userTerritories: 'auth/userTerritories',
      recentlySeenTerritories: 'territories/recentlySeenTerritories',
      addressesCancelTokens: 'addresses/cancelTokens',
    }),
    username() {
      return get(this.user, 'username');
    },
    territories() {
      return this.userTerritories || [];
    },
    isPWA() {
      return window.matchMedia('(display-mode: standalone)').matches;
    },
    doUpdateTerritories() {
      return !this.userTerritories.length || this.forceUpdate;
    },
    recentlySeenWithoutCheckout() {
      return differenceBy(this.recentlySeenTerritories, this.userTerritories, 'id');
    },
  },
  methods: {
    ...mapActions({
      getUserTerritories: 'auth/getUserTerritories',
      setSeenTerritories: 'territories/setSeenTerritories',
      removeSeenTerritory: 'territories/removeSeenTerritory',
    }),
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
    async refresh() {
      this.isUserError = false;
      if (this.user) {
        if (this.user.username && this.doUpdateTerritories) {
          await this.getUserTerritories(this.user.username);
        }

        if (!get(this.userTerritories, 'length')) {
          this.isUserError = true;
        }
      }
      this.forceUpdate = false;
    },
    async refreshTerritories() {
      this.forceUpdate = true;
      await this.refresh();
    },
  },
  async mounted() {
    this.advertiseMsg();
    this.setSeenTerritories();
    await this.refresh();
  },
  watch: {
    async username() {
      await this.refresh();
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
.logo-big {
  width: 150px;
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
.my-territories-loading {
  font-size: 40px;
}

</style>
