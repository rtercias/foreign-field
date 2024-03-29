<template>
  <div id="app" class="d-flex min-vh-100" :class="{ 'flex-row': isDesktop, 'flex-column': !isDesktop }">
    <b-navbar
      v-if="isDesktop"
      class="align-items-start nav-footer-margin"
      :class="{ 'w-20': isDesktop }"
      type="dark"
      variant="primary">
      <nav-menu />
    </b-navbar>
    <div :class="{ 'w-80': isDesktop, 'mb-5': !isDesktop }">
      <Masthead :hide-menu="hideMenu" @hide-complete="resetHideMenu"></Masthead>
      <router-view class="h-100" :key="key"></router-view>
    </div>
    <footer class="app-footer w-100 d-flex justify-content-end"></footer>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { ToggleButton } from 'vue-js-toggle-button';
import get from 'lodash/get';
import throttle from 'lodash/throttle';
import { subscription } from './main';
import Masthead from './components/Masthead';
import NavMenu from './components/NavMenu';
import { UnauthorizedUserError } from './store/exceptions/custom-errors';

export default {
  name: 'app',
  components: {
    Masthead,
    NavMenu,
    ToggleButton,
  },
  data() {
    return {
      hideMenu: false,
    };
  },
  created() {
    window.addEventListener('resize', throttle(this.changeWindowSize, 0));
    window.addEventListener('scroll', throttle(this.handleScroll, 0));
  },
  destroyed() {
    window.removeEventListener('resize', throttle(this.changeWindowSize, 0));
    window.removeEventListener('scroll', throttle(this.handleScroll, 0));
  },
  async mounted() {
    await this.refresh();

    subscription.bind('checkout-territory', (args) => {
      if (args) {
        const { checkoutId, territoryId, publisher } = args;
        this.setTerritoryStatus({
          id: territoryId,
          status: {
            status: 'Checked Out',
            checkout_id: checkoutId,
            date: new Date().getTime(),
            publisher,
          },
        });
      }
    });
    subscription.bind('checkin-territory', (args) => {
      if (args) {
        const { checkoutId, territoryId, publisher } = args;
        this.setTerritoryStatus({
          id: territoryId,
          status: {
            status: 'Recently Worked',
            checkout_id: checkoutId,
            date: new Date().getTime(),
            publisher,
          },
        });
      }
    });
    subscription.bind('reassign-territory', (args) => {
      if (args) {
        const { checkoutId, territoryId, publisher } = args;
        this.setTerritoryStatus({
          id: territoryId,
          status: {
            status: 'Checked Out',
            checkout_id: checkoutId,
            date: new Date().getTime(),
            publisher,
          },
        });
      }
    });
  },
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
      isDesktop: 'auth/isDesktop',
      isPWA: 'auth/isPWA',
      user: 'auth/user',
      canWrite: 'auth/canWrite',
      territory: 'territory/territory',
      isAuthenticated: 'auth/isAuthenticated',
    }),
    isCampaignMode() {
      return !!get(this.user, 'congregation.currentCampaign') || false;
    },
    key() {
      return `${this.$route.name}-${JSON.stringify(this.$route.params)}`;
    },
    showLeftNav() {
      return this.$route.name !== 'home';
    },
    location() {
      return document.location;
    },
  },
  methods: {
    ...mapActions({
      back: 'auth/back',
      authorize: 'auth/authorize',
      changeWindowSize: 'auth/changeWindowSize',
      updateStatus: 'territory/updateStatus',
      collapseNav: 'auth/collapseNav',
      setTerritoryStatus: 'territories/setStatus',
      logout: 'auth/logout',
    }),
    async refresh() {
      if (this.user) {
        try {
          await this.authorize(get(this.user, 'username'));
        } catch (err) {
          if (err instanceof UnauthorizedUserError) {
            this.$router.replace({ name: 'unauthorized' });
          } else {
            console.error(err);
          }
        }
      }
    },
    handleScroll() {
      this.hideMenu = true;
    },
    resetHideMenu() {
      this.hideMenu = false;
    },
    logoutUser() {
      this.logout();
      this.$router.push({ name: 'unauthorized' });
      throw new UnauthorizedUserError('Unauthorized');
    },
  },
  watch: {
    async $route() {
      try {
        this.hideMenu = true;
        await this.refresh();
      } catch (e) {
        console.error(e);
        if (String(e).includes('Unauthorized')) {
          this.$router.replace({ name: 'unauthorized' });
        } else {
          this.$router.replace({ name: 'error' });
        }
      }
    },
  },
};

</script>

<style lang="scss">
@import 'assets/foreign-field-theme.scss';
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';

h3 {
  margin: 40px 0 0;
}

router-link {
  cursor: pointer;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $dark;

  .desktop-nav {
    min-height: $header-height;
    padding-top: 14px;
    border-bottom: solid 6px;
  }
  .nav-footer-margin {
    margin-bottom: -58px;
  }
  .app-breadcrumb {
    font-size: 20px;
    .back-button {
      font-size: 20px;
      &:focus {
        box-shadow: 0 0 0 rgb(255, 255, 255);
      }
    }
  }
}
@media print {
  .navbar {
    display: none !important;
  }
}
</style>
