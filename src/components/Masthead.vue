<template>
  <div class="masthead lead sticky-top">
    <vue-pull-refresh class="bg-primary" :on-refresh="onPageRefresh" :config="refreshOptions">
      <b-navbar
        class="py-0 sticky-top"
        :class="{
          'alert-secondary border-bottom border-secondary': isDesktop,
          'border-warning': !isDesktop }"
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
        <b-nav-text
          class="campaign-mode text-uppercase"
          :class="{ 'text-truncate': !isDesktop, 'w-auto': isDesktop }"
          v-if="isSearchHidden || isDesktop">
          <span v-if="isCampaignMode" class="text-nowrap">{{campaignName}}</span>
        </b-nav-text>
        <b-nav-text id="nav-search-bar" class="py-1 mx-0" :class="{
          'mx-0': !isSearchHidden,
          'w-25': isDesktop,
          'w-75': !isSearchHidden && !isDesktop,
          }">
          <search-bar
            v-if="(!isSearchHidden || isDesktop) && isAuthorized && !isForcedOut"
            class="search-bar w-100"
            :search-text="'Search address, phone or territory'"
            @on-click="search"
            :no-padding="true"
          />
          <font-awesome-icon
            v-if="isSearchHidden && !isDesktop && isAuthorized"
            icon="search"
            class="mt-2"
            @click="showMenu = isSearchHidden = false"
          />
        </b-nav-text>
        <b-navbar-toggle class="px-1" v-if="!isDesktop" target="nav_dropdown_collapse" @click="toggleClick" />
        <b-collapse is-nav id="nav_dropdown_collapse" v-model="showMenu" @input="toggleMenuComplete">
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
import { subscription } from '../main';
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
  beforeRouteEnter(to, from, next) {
    next(vm => vm.prevRoute = from);
  },
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
      prevRoute: undefined,
    };
  },
  async mounted() {
    subscription.bind('check-in-all', async (congId) => {
      if (this.congId === congId) {
        this.$bvToast.toast('All territories have been checked in.', {
          variant: 'success',
          noAutoHide: true,
        });
      }
    });
    subscription.bind('copy-checkouts', async (congId) => {
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
      back: 'auth/back',
    }),
    get,
    goBack() {
      this.showMenu = false;
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
      let origin = get(this.$route, 'query.origin');
      if (origin === get(this.$route, 'name')) {
        origin = '';
      }
      const back = get(this.$route, 'meta.back');
      const backRoute = this.$router.resolve({ name: origin || back || !this.prevRoute || 'home' });
      this.backLabel = this.$route.name === 'home' ? '' : get(backRoute, 'route.meta.label') || 'Home';
    },
    search(keyword) {
      this.showMenu = false;
      if (!keyword) {
        this.isSearchHidden = true;
        return;
      }
      this.isSearchHidden = true;
      this.$router.push({ name: 'search', params: { keyword } });
    },
    toggleClick() {
      window.scrollTo({ top: 0 });
      if (!this.showMenu) this.toggleMenuComplete(false);
    },
    toggleMenuComplete(visible) {
      if (visible) {
        this.$emit('hide-complete');
      }
    },
  },

  computed: {
    ...mapGetters({
      isAuthorized: 'auth/isAuthorized',
      isForcedOut: 'auth/isForcedOut',
      user: 'auth/user',
      canWrite: 'auth/canWrite',
      congId: 'auth/congId',
      groups: 'group/groups',
      territory: 'territory/territory',
      congregation: 'auth/congregation',
      isDesktop: 'auth/isDesktop',
    }),
    showLeftNav() {
      return this.$route.name !== 'home' && this.$route.name !== 'unauthorized';
    },
    isCampaignMode() {
      return !!get(this.user, 'congregation.currentCampaign');
    },
    campaignName() {
      return get(this.user, 'congregation.currentCampaign.name') || '';
    },
    routeLabel() {
      return get(this.$route, 'meta.label');
    },
    isHome() {
      return this.$route.name === 'home';
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
  text-overflow: initial;
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
