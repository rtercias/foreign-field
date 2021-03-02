<template>
  <div id="app" class="d-flex min-vh-100" :class="{ 'flex-row': isDesktop, 'flex-column': !isDesktop }">
    <Masthead :class="{ 'w-25': isDesktop }"></Masthead>
    <div :class="{ 'w-75': isDesktop }">
      <b-navbar
        v-if="isDesktop"
        :sticky="true"
        :class="`desktop-nav alert-secondary d-flex justify-content-between
          border-medium border-bottom border-left-0 border-right-0 py-0`">
        <div class="app-breadcrumb d-flex align-items-center">
          <b-button variant="link" class="back-button button p-0" @click="goBack" v-show="showLeftNav">
            <font-awesome-icon icon="chevron-left"></font-awesome-icon>
            <span v-if="canWrite">{{backLabel}}</span>
          </b-button>
          <span v-if="!!backLabel && canWrite" class="px-1">/</span>
          <span v-if="canWrite">{{routeLabel}}</span>
        </div>
        <b-nav-text v-if="isCampaignMode"><font-awesome-icon icon="bolt" /> CAMPAIGN MODE</b-nav-text>
      </b-navbar>
      <router-view class="view" :key="key"></router-view>
    </div>
    <footer class="app-footer w-100 d-flex justify-content-end">
      <b-navbar :class="isDesktop ? 'w-75' : 'w-100'"
        class="desktop-nav alert-secondary d-flex justify-content-end border-medium
          border-top border-bottom-0 border-left-0 border-right-0 py-0">
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
import { channel } from './main';
import Masthead from './components/Masthead';
import { AddressStatus } from './store';
import { unmask } from './utils/phone';

export default {
  name: 'app',
  components: {
    Masthead,
  },
  data() {
    return {
      backLabel: '',
    };
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
        phone.phone = unmask(phone);
        this.addPhone(phone);
      }
    });
    channel.bind('update-phone', (phone) => {
      if (phone && this.territory.id === phone.territory_id) {
        if (phone.status !== AddressStatus.Active) {
          this.deletePhone(phone);
        } else {
          phone.phone = unmask(phone);
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
  },
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
      isDesktop: 'auth/isDesktop',
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
    routeLabel() {
      return get(this.$route, 'meta.label');
    },
    location() {
      return document.location;
    },
  },
  methods: {
    ...mapActions({
      back: 'auth/back',
      authorize: 'auth/authorize',
      addAddress: 'territory/addAddress',
      addPhone: 'territory/addPhone',
      updateAddress: 'territory/updateAddress',
      updatePhone: 'territory/updatePhone',
      deleteAddress: 'territory/deleteAddress',
      deletePhone: 'territory/deletePhone',
      updateAddressNotes: 'territory/updateAddressNotes',
      updatePhoneNotes: 'territory/updatePhoneNotes',
      setAddressLastActivity: 'territory/setAddressLastActivity',
      setPhoneLastActivity: 'territory/setPhoneLastActivity',
      updateStatus: 'territory/updateStatus',
    }),
    goBack() {
      this.back({ vm: this });
    },
    async refresh() {
      if (this.user) await this.authorize(get(this.user, 'username'));
      const back = get(this.$route, 'meta.back');
      const backRoute = this.$router.resolve({ name: back });
      this.backLabel = back ? get(backRoute, 'route.meta.label') : '';
    },
    urlCopied() {
      this.$bvToast.toast(`Copied link: ${document.location.href}`, {
        variant: 'success',
        toaster: 'b-toaster-bottom-right mr-5',
        noCloseButton: true,
        autoHideDelay: 1000,
      });
    },
  },
  watch: {
    async $route() {
      try {
        await this.refresh();
      } catch (e) {
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
    min-height: 52px;
    padding-top: 14px;
    border-bottom: solid 6px;
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
.view {
  height: calc(100% - 52px);
}
</style>
