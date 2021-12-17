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
    <footer v-if="isDesktop || isPWA" class="app-footer w-100 d-flex justify-content-end">
      <b-navbar :class="isDesktop ? 'w-80' : 'w-100'"
        class="desktop-nav alert-secondary d-flex justify-content-end border-medium
          border-top border-bottom-0 border-left-0 border-right-0 px-4 pt-1 pb-2">
        <b-link class="button" v-if="isAuthenticated" v-clipboard:copy="location.href" v-clipboard:success="urlCopied">
          <font-awesome-icon icon="link"></font-awesome-icon>
        </b-link>
      </b-navbar>
    </footer>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import throttle from 'lodash/throttle';
import { channel } from './main';
import Masthead from './components/Masthead';
import NavMenu from './components/NavMenu';
import { AddressStatus } from './store';
import { unmask } from './utils/phone';
import { UnauthorizedUserError } from './store/exceptions/custom-errors';

export default {
  name: 'app',
  components: {
    Masthead,
    NavMenu,
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

    channel.bind('add-address', (address) => {
      if (address && this.territory.id === address.territory_id) {
        this.addAddress(address);
      }
    });
    channel.bind('update-address', (address) => {
      if (address && this.territory.id === address.territory_id) {
        if (address.status !== AddressStatus.Active) {
          this.deleteAddress(address);
        } else {
          this.updateAddress(address);
        }
      }
    });
    channel.bind('change-address-status', (address) => {
      if (address && this.territory.id === address.territory_id) {
        if (address.status !== AddressStatus.Active) {
          this.deleteAddress(address);
        } else {
          this.updateAddress(address);
        }
      }
    });
    channel.bind('add-phone', (phone) => {
      if (phone && this.territory.id === phone.territory_id) {
        phone.phone = unmask(phone.phone);
        this.addPhone(phone);
      }
    });
    channel.bind('update-phone', (phone) => {
      if (phone && this.territory.id === phone.territory_id) {
        if (phone.status !== AddressStatus.Active) {
          this.deletePhone(phone);
        } else {
          phone.phone = unmask(phone.phone);
          this.updatePhone(phone);
        }
      }
    });
    channel.bind('change-phone-status', (phone) => {
      if (phone && this.territory.id === phone.territory_id) {
        if (phone.status !== AddressStatus.Active) {
          this.deletePhone(phone);
        } else {
          this.updatePhone(phone);
        }
      }
    });
    channel.bind('add-log', (log) => {
      if (log) {
        this.setAddressLastActivity({ addressId: log.address_id, lastActivity: log });
        this.setPhoneLastActivity({ phoneId: log.address_id, lastActivity: log });
        this.setTerritoryLastActivity({ territoryId: log.territory_id, lastActivity: log });
      }
    });
    channel.bind('add-note', (args) => {
      if (args && this.territory) {
        const { addressId, notes } = args;
        this.updateAddressNotes({ territoryId: this.territory.id, addressId, notes });
      }
    });
    channel.bind('remove-note', (args) => {
      if (args && this.territory) {
        const { addressId, notes } = args;
        this.updateAddressNotes({ territoryId: this.territory.id, addressId, notes });
      }
    });
    channel.bind('add-phone-tag', (args) => {
      if (args && this.territory) {
        const { phoneId, notes } = args;
        this.updatePhoneNotes({ territoryId: this.territory.id, phoneId, notes });
      }
    });
    channel.bind('remove-phone-tag', (args) => {
      if (args && this.territory) {
        const { phoneId, notes } = args;
        this.updatePhoneNotes({ territoryId: this.territory.id, phoneId, notes });
      }
    });
    channel.bind('checkout-territory', (args) => {
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
    channel.bind('checkin-territory', (args) => {
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
    channel.bind('reassign-territory', (args) => {
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
      return !!get(this.user, 'congregation.campaign') || false;
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
      addAddress: 'territory/addAddress',
      addPhone: 'territory/addPhone',
      updateAddress: 'territory/updateAddress',
      updatePhone: 'territory/updatePhone',
      deleteAddress: 'territory/deleteAddress',
      deletePhone: 'territory/deletePhone',
      updateAddressNotes: 'territory/updateAddressNotes',
      updatePhoneNotes: 'territory/updatePhoneNotes',
      setTerritoryLastActivity: 'territory/setTerritoryLastActivity',
      setAddressLastActivity: 'territory/setAddressLastActivity',
      setPhoneLastActivity: 'territory/setPhoneLastActivity',
      updateStatus: 'territory/updateStatus',
      collapseNav: 'auth/collapseNav',
      setTerritoryStatus: 'territories/setStatus',
      logout: 'auth/logout',
    }),
    async refresh() {
      if (this.user) {
        await this.authorize(get(this.user, 'username'));
        if (this.user.status === 'disabled') {
          this.logoutUser();
        }
      }
    },
    urlCopied() {
      this.$bvToast.toast(`Copied link: ${document.location.href}`, {
        variant: 'success',
        toaster: 'b-toaster-bottom-right mr-5',
        noCloseButton: true,
        autoHideDelay: 1000,
      });
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
