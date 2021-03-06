<template>
  <div class="masthead lead sticky-top">
    <vue-pull-refresh class="bg-primary" :on-refresh="onPageRefresh" :config="refreshOptions">
      <b-navbar
        class="py-0"
        :class="{ 'alert-secondary border-bottom border-secondary': isDesktop, 'border-warning gold-bottom': !isDesktop }"
        :type="isDesktop ? 'light' : 'dark'"
        :variant="isDesktop ? 'none' : 'primary'"
        toggleable
        fill>
        <b-nav-text>
          <div v-if="isDesktop" class="app-breadcrumb d-flex align-items-center">
            <b-button variant="link" class="back-button button p-0" @click="goBack" v-show="showLeftNav">
              <font-awesome-icon icon="chevron-left"></font-awesome-icon>
              <span v-if="canWrite">{{backLabel}}</span>
            </b-button>
            <span v-if="!!backLabel && canWrite" class="px-1">/</span>
            <span v-if="canWrite">{{routeLabel}}</span>
          </div>
          <div v-else>
            <b-link class="button text-white-50" @click="goBack" v-show="showLeftNav">
              <font-awesome-icon icon="chevron-left"></font-awesome-icon>
            </b-link>
          </div>
        </b-nav-text>
        <b-nav-text class="campaign-mode" v-if="isSearchHidden || isDesktop">
          <span v-if="isCampaignMode">CAMPAIGN MODE</span>
        </b-nav-text>
        <b-nav-text id="nav-search-bar" class="py-1 mx-0" :class="{
          'mx-0': !isSearchHidden,
          'w-25': isDesktop,
          'w-75': !isSearchHidden && !isDesktop,
          }">
          <search-bar
            v-if="(!isSearchHidden || isDesktop) && isAuthorized"
            class="search-bar w-100"
            :search-text="'Search address, phone or territory'"
            @on-click="search"
            :no-padding="true"
          />
          <font-awesome-icon
            v-if="isSearchHidden && !isDesktop && isAuthorized"
            icon="search"
            class="mt-2"
            @click="isSearchHidden = false"
          />
        </b-nav-text>
        <b-navbar-toggle v-if="!isDesktop" target="nav_dropdown_collapse" @click="toggleClick" />
        <b-collapse is-nav id="nav_dropdown_collapse" v-model="showMenu">
          <nav-menu />
        </b-collapse>
      </b-navbar>
    </vue-pull-refresh>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import VuePullRefresh from 'vue-pull-refresh';
import get from 'lodash/get';
import { channel } from '../main';
import NavMenu from './NavMenu';
import SearchBar from './SearchBar';

export default {
  name: 'Masthead',
  components: {
    VuePullRefresh,
    NavMenu,
    SearchBar,
  },
  props: ['hideMenu'],
  data() {
    return {
      permissions: {
        territories: ['Admin', 'TS', 'GO', 'SO'],
      },
      refreshOptions: {
        errorLabel: 'Unable to reload',
        startLabel: 'Starting reload',
        readyLabel: 'Ready',
        loadingLabel: 'Reloading',
      },
      isSearchHidden: true,
      backLabel: '',
      showMenu: false,
    };
  },
  async mounted() {
    channel.bind('check-in-all', async (congId) => {
      if (this.congId === congId) {
        this.$bvToast.toast('All territories have been checked in.', {
          variant: 'success',
          noAutoHide: true,
        });
      }
    });
    channel.bind('copy-checkouts', async (congId) => {
      if (this.congId === congId) {
        this.$bvToast.toast('Territory checkouts have been preserved.', {
          variant: 'success',
          noAutoHide: true,
        });
      }
    });
    await this.refresh();
  },
  methods: {
    ...mapActions({
      checkinAll: 'territories/checkinAll',
      copyCheckouts: 'territories/copyCheckouts',
      back: 'auth/back',
      updateCongregation: 'congregation/updateCongregation',
    }),
    get,
    goBack() {
      this.back({ vm: this });
    },
    async onPageRefresh() {
      this.$router.go();
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    },
    async refresh() {
      const back = get(this.$route, 'meta.back');
      const backRoute = this.$router.resolve({ name: back });
      this.backLabel = back ? get(backRoute, 'route.meta.label') : '';
    },
    search(keyword) {
      if (!keyword) {
        this.isSearchHidden = true;
        return;
      }
      this.isSearchHidden = true;
      this.$router.push({ name: 'search', params: { keyword } });
    },
    toggleClick(e) {
      window.scrollTo({ top: 0 });
      if (e.returnValue) {
        this.$emit('hide-complete');
      }
    },
  },

  computed: {
    ...mapGetters({
      isAuthorized: 'auth/isAuthorized',
      user: 'auth/user',
      canWrite: 'auth/canWrite',
      congId: 'auth/congId',
      groups: 'group/groups',
      territory: 'territory/territory',
      congregation: 'auth/congregation',
      isDesktop: 'auth/isDesktop',
    }),
    showLeftNav() {
      return this.$route.name !== 'home';
    },
    isCampaignMode() {
      return get(this.user, 'congregation.campaign') || false;
    },
    routeLabel() {
      return get(this.$route, 'meta.label');
    },
  },
  watch: {
    async $route() {
      await this.refresh();
    },
    hideMenu() {
      this.showMenu = !this.hideMenu;
    },
  },
};
</script>

<style lang="scss">
@import "../assets/foreign-field-theme.scss";
.masthead {
  .navbar {
    min-height: $header-height;
  }
}
.pull-down-header {
  background-color: unset;
}
.gold-bottom {
  border-bottom: solid 6px;
}
.dropdown-item {
  width: 100%;
}
.campaign-mode {
  width: 172px;
}
#nav-search-bar {
  &.w-full {
    width: 300px;
  }

  .search-bar {
    .search-btn {
      top: 0;
    }
  }
}
</style>
