<template>
  <div class="territory">
    <Loading v-if="territoryIsLoading" />
    <div v-else>
      <div v-if="collaborate" class="collaboration-mode">Collaboration Mode</div>
      <header class="page-header sticky-top w-100 pt-2 pb-0" :sticky="true">
        <div class="w-100">
          <div class="w-100 px-2">
            <div class="text-left">{{ territoryName }}</div>
            <div class="d-flex justify-content-between">
              <div class="d-inline-flex align-items-center">
                <h4 class="text-truncate font-weight-bold">
                  {{territoryDescription}}
                </h4>
                <b-badge
                  variant="warning"
                  class="ml-2"
                  v-if="displayType !== 'Regular'"
                >
                  {{displayType}}
                </b-badge>
              </div>
              <b-dropdown variant="light" right>
                <template #button-content>
                  <font-awesome-icon icon="ellipsis-h" />
                </template>
                <b-dropdown-item
                  v-if="$route.name === 'map-view'"
                  @click="optimizeNearMe"
                >
                  Reorder Addresses
                </b-dropdown-item>
                <b-dropdown-divider
                  v-if="$route.name === 'map-view'"
                  class="d-block">
                </b-dropdown-divider>
                <b-dropdown-item
                  @click="checkIn(true)"
                  v-if="isCheckedOut"
                >
                  Check-in Territory
                </b-dropdown-item>
                <b-dropdown-item v-if="canWrite"
                  :to="{
                    name: 'address-new-terr',
                    params: { territoryId, mode: 'add' },
                    query: { origin: $route.name },
                  }"
                >
                  Add New Address
                </b-dropdown-item>
                <b-dropdown-item
                  v-if="isAuthenticated"
                  v-clipboard:copy="href"
                  v-clipboard:success="urlCopied"
                >
                  Copy Link To Territory
                </b-dropdown-item>
                <b-dropdown-item
                  @click="toggleCollaborate"
                  v-if="isCheckedOut"
                >
                  <span v-if="collaborate">Turn Off</span>
                  <span v-else>Turn On</span>
                  Collaborate Mode
                </b-dropdown-item>
                <b-dropdown-item v-if="canManage" variant="danger" @click="reset">
                  Reset Territory
                </b-dropdown-item>
              </b-dropdown>
            </div>
            <div class="checkout-info d-flex justify-content-between my-1">
              <span>{{currentPublisher}}</span>
            </div>
          </div>
          <div class="header-buttons w-100 d-flex justify-content-between pt-2 pl-2">
            <b-nav tabs fill>
              <b-nav-item
                :to="{ name: 'address-list', params: { territoryId } }"
                :pressed="viewMode === 'address-list'"
              >
                <font-awesome-icon icon="bars" />
                <span class="pl-2">List ({{ addressCount }})</span>
              </b-nav-item>
              <b-nav-item
                :to="{ name: 'map-view', params: { territoryId } }"
                :pressed="viewMode==='map-view'"
              >
                <font-awesome-icon icon="map-marked-alt" />
                <span class="pl-2">Map ({{ addressCount }})</span>
              </b-nav-item>
              <b-nav-item
                :to="{ name: 'phone-list', params: { territoryId } }"
                :pressed="viewMode === 'phone-list'"
              >
                <font-awesome-icon icon="mobile-alt" />
                <span class="pl-2">Phone ({{ phoneCount }})</span>
              </b-nav-item>
            </b-nav>
          </div>
        </div>
      </header>
      <router-view
        :ref="viewMode"
        class="router-view"
        :disabled="!isCheckedOut"
        :options="{ showSortOrder: true, editable: true }"
        @update-count="updateCount"
        @locating="onLocating"
        @location-found="onLocationFound"
        @location-error="onLocationError"
        @on-end-here-clicked="locate"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import Loading from './Loading';
import { store, defaultOptions, TerritoryType, AddressStatus } from '../store';
import { displayName, displayShortName } from '../utils/publisher';
import { CongDefault } from '../store/modules/models/CongDefaultOptions';
import { subscription } from '../main';
import { unmask } from '../utils/phone';


export default {
  name: 'Territory',
  components: {
    Loading,
  },
  props: ['territoryId'],
  beforeRouteEnter(to, from, next) {
    if (from.query.origin) {
      next();
      return;
    }

    try {
      const views = get(CongDefault.options, 'territory.defaultView.options', []).map(o => o.value);
      if (!views.includes(to.name)) {
        next();
      } else {
        const { options = defaultOptions } = store.state.auth;
        const name = get(options, 'territory.defaultView');
        const { territoryId } = to.params;
        if (name !== to.name) {
          next({ name, params: { territoryId } });
        } else {
          next();
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
  data() {
    return {
      workInProgress: {},
      viewMode: this.defaultView,
      isCheckingIn: false,
      isResetting: false,
      filteredCount: '',
      isOptimizing: false,
      isNearMeClicked: false,
      nearMeText: 'Near Me',
      nearMeIcon: 'location-arrow',
      collaborate: false,
    };
  },
  async mounted() {
    this.collaborate = sessionStorage.getItem('collaborate') === 'true';
    // await this.refresh();
    this.subscribe();
  },
  computed: {
    ...mapGetters({
      group: 'group/group',
      territory: 'territory/territory',
      authIsLoading: 'auth/loading',
      user: 'auth/user',
      canViewReports: 'auth/canViewReports',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      canCheckout: 'auth/canCheckout',
      ownedBy: 'territory/isOwnedByUser',
      options: 'auth/options',
      token: 'auth/token',
      territoryIsLoading: 'territory/isLoading',
      isAuthenticated: 'auth/isAuthenticated',
      isDesktop: 'auth/isDesktop',
      cancelTokens: 'territory/cancelTokens',
      userTerritories: 'auth/userTerritories',
      optimized: 'addresses/optimized',
      territoryError: 'territory/error',
      hasPhones: 'territory/hasPhones',
    }),
    isCheckedOut() {
      return (this.territory && this.territory.status && this.territory.status.status === 'Checked Out')
        || false;
    },
    isRecentlyWorked() {
      return this.territory && this.territory.status && this.territory.status.status === 'Recently Worked';
    },
    cityNames() {
      const arr = this.territory && this.territory.city ? this.territory.city.split(',') : [];
      return arr.filter(city => city.trim() !== '');
    },
    cities() {
      let cities = '';
      // show first two cities
      for (const c of this.cityNames.slice(0, 2)) {
        const city = c.trim();
        cities += city !== 'null' ? `${cities.length > 0 ? ', ' : ''}${city}` : '';
      }

      // count all others
      if (this.cityNames.length > 2) {
        cities += ` and ${this.cityNames.length - 2} other cities`;
      }

      return cities;
    },
    territoryName() {
      return this.territory && this.territory.name ? this.territory.name : '';
    },
    territoryDescription() {
      return get(this.territory, 'description') || '';
    },
    lastActivity() {
      return this.territory.lastActivity;
    },
    isOwnedByUser() {
      return this.ownedBy === get(this.user, 'username');
    },
    defaultView() {
      const options = this.options || defaultOptions;
      return get(options, 'territory.defaultView');
    },
    currentPublisher() {
      const status = get(this.territory, 'status.status');
      const publisher = get(this.territory, 'status.publisher');
      if (status === 'Checked Out') {
        return `Checked out to: ${this.isDesktop ? displayName(publisher) : displayShortName(publisher)}`;
      }
      return '';
    },
    showCheckInButton() {
      return this.isCheckedOut && (this.canWrite || this.isOwnedByUser);
    },
    addressCount() {
      return get(this.territory, 'addresses.length', 0);
    },
    phoneCount() {
      const addresses = (get(this.territory, 'addresses') || []).map(a => get(a, 'phones.length')) || [];
      const phoneCount = addresses.reduce((acc, current) => (acc || 0) + current, 0);
      if (phoneCount > 0) {
        return phoneCount;
      }
      if (this.$route.name !== 'phone-list') {
        return '*';
      }
      return 0;
    },
    displayType() {
      const { type } = this.territory || {};
      return type === 'Active' ? '' : get(TerritoryType[type], 'text');
    },
    isOptimized() {
      return this.optimized && !!this.optimized.length;
    },
    $locateButton() {
      const $map = this.$refs['map-view'].$el || {};
      const $locateContainer = $map.getElementsByClassName('leaflet-control-locate')[0];
      const $locateBtn = $locateContainer.children[0];
      return $locateBtn;
    },
    selectedAddress() {
      const firstAddress = get(this.territory, 'addresses[0]') || {};
      return this.address || firstAddress;
    },
    href() {
      return window.location.href;
    },
  },
  methods: {
    ...mapActions({
      // getTerritory: 'territory/getTerritory',
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritoryActivities: 'territory/resetTerritoryActivities',
      saveSeenTerritory: 'territories/saveSeenTerritory',
      fetchActivityLogs: 'territory/fetchActivityLogs',
      setTerritory: 'territories/setTerritory',
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
      optimize: 'addresses/optimize',
      reorderAddresses: 'territory/reorderAddresses',
    }),
    get,
    async refresh() {
      // if (this.territory.id === this.territoryId && !!this.territory.addresses) {
      //   if (!this.cancelTokens.FETCH_ACTIVITY_LOGS) {
      //     const checkoutId = get(this.territory, 'status.checkout_id');
      //     await this.fetchActivityLogs({ checkoutId });
      //   }
      // } else {
      // await this.getTerritory({ id: this.territoryId });
      // const checkoutId = get(this.territory, 'status.checkout_id');
      // await this.fetchActivityLogs({ checkoutId });
      // }

      // if (this.user && get(this.user, 'congregation.id') !== get(this.territory, 'congregationid')) {
      //   if (this.territoryError) {
      //     console.error(this.territoryError.message);
      //     this.$router.replace('/error');
      //   } else {
      //     this.$router.replace('/unauthorized');
      //   }
      // }
    },

    async checkIn() {
      const response = await this.$bvModal.msgBoxConfirm('Ready to check-in the territory?', {
        title: `${this.territory.name}`,
        centered: true,
      });

      if (response) {
        this.checkInAndReset();
      }
    },

    async reset() {
      const response = await this.$bvModal.msgBoxConfirm('Are you sure you want to reset this territory?', {
        title: `${this.territory.name}`,
        centered: true,
        okTitle: 'Reset',
      });

      if (response) {
        await this.resetTerritoryActivities({
          checkoutId: this.territory.status.checkout_id,
          userid: this.user.id,
          tzOffset: new Date().getTimezoneOffset().toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        this.$router.go();
      }
    },

    async checkInAndReset() {
      this.isCheckingIn = true;
      const checkoutId = get(this.territory, 'status.checkout_id');

      await this.checkinTerritory({
        checkoutId,
        territoryId: this.territoryId,
        publisher: get(this.territory, 'status.publisher') || {},
        username: this.user.username,
        date: Date.now(),
      });

      this.resetTerritoryActivities({
        checkoutId,
        userid: this.user.id,
        tzOffset: new Date().getTimezoneOffset().toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      this.saveSeenTerritory(this.territory);

      this.isCheckingIn = false;
      if (this.canCheckout) {
        this.$router.push({ name: 'group', params: { groupId: this.group.id } });
      } else {
        this.$router.push({ name: 'home' });
      }
      this.checkInToast('success');
    },

    checkInToast(variant = null) {
      this.$bvToast.toast('Territory checked in.', {
        title: 'Nice Work!',
        variant,
        solid: true,
      });
    },

    openSMSMobile() {
      window.open(`sms:&body=Work this territory with me!%0a%0a${window.location.href}`, '_self');
      return false;
    },

    updateCount(count) {
      this.filteredCount = `Count: ${count}`;
    },
    subscribe() {
      subscription.bind('add-address', (address) => {
        if (address && this.territory.id === address.territory_id) {
          this.addAddress(address);
        }
      });
      subscription.bind('update-address', (address) => {
        if (address) {
          if ([AddressStatus.Active, AddressStatus.DNC].includes(address.status)) {
            this.deleteAddress(address);
          } else {
            this.updateAddress(address);
          }
        }
      });
      subscription.bind('change-address-status', (address) => {
        if (!address) return;
        address.id = address.id || address.addressId;
        address.territory_id = address.territory_id || this.territory.id;
        const addresses = this.territory.addresses || [];
        if (addresses.some(a => a.id === address.id)) {
          if (![AddressStatus.Active, AddressStatus.DNC].includes(address.status)) {
            this.deleteAddress(address);
          } else {
            this.updateAddress(address);
          }
        }
      });
      subscription.bind('add-phone', (phone) => {
        if (phone && this.territory.id === phone.territory_id) {
          phone.phone = unmask(phone.phone);
          this.addPhone(phone);
        }
      });
      subscription.bind('update-phone', (phone) => {
        if (phone && this.territory.id === phone.territory_id) {
          if (phone.status !== AddressStatus.Active) {
            this.deletePhone(phone);
          } else {
            phone.phone = unmask(phone.phone);
            this.updatePhone(phone);
          }
        }
      });
      subscription.bind('change-phone-status', (phone) => {
        if (phone && this.territory.id === phone.territory_id) {
          if (phone.status !== AddressStatus.Active) {
            this.deletePhone(phone);
          } else {
            this.updatePhone(phone);
          }
        }
      });
      subscription.bind('add-log', (log) => {
        if (log) {
          this.setAddressLastActivity({ addressId: log.address_id, lastActivity: log });
          this.setPhoneLastActivity({ phoneId: log.address_id, lastActivity: log });
          this.setTerritoryLastActivity({ territoryId: log.territory_id || this.territory.id, lastActivity: log });
        }
      });
      subscription.bind('add-note', (args) => {
        if (args && this.territory) {
          const { addressId, notes } = args;
          this.updateAddressNotes({ territoryId: this.territory.id, addressId, notes });
        }
      });
      subscription.bind('remove-note', (args) => {
        if (args && this.territory) {
          const { addressId, notes } = args;
          this.updateAddressNotes({ territoryId: this.territory.id, addressId, notes });
        }
      });
      subscription.bind('add-phone-tag', (args) => {
        if (args && this.territory) {
          const { phoneId, notes } = args;
          this.updatePhoneNotes({ territoryId: this.territory.id, phoneId, notes });
        }
      });
      subscription.bind('remove-phone-tag', (args) => {
        if (args && this.territory) {
          const { phoneId, notes } = args;
          this.updatePhoneNotes({ territoryId: this.territory.id, phoneId, notes });
        }
      });
    },

    async optimizeNearMe() {
      if (this.nearMeText === 'Near Me') {
        const message = 'Temporarily reorder addresses based on your current location.';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: 'Reorder Addresses Near Me',
          centered: true,
          html: true,
        });

        if (!confirm) {
          return;
        }

        this.nearMeText = 'Revert';
        this.nearMeIcon = 'undo';
      } else {
        await this.reorderAddresses({ revert: true });
        this.nearMeText = 'Near Me';
        this.nearMeIcon = 'location-arrow';
      }

      this.locate();
    },

    locate() {
      this.isNearMeClicked = true;
      this.isOptimizing = true;
      const $popupCloseBtn = document.getElementsByClassName('leaflet-popup-close-button')[0];
      if ($popupCloseBtn) $popupCloseBtn.click();

      /*
       * traverse and call Leaflet Locate button and listen for
       * 'onLocating', 'onLocationFound' and 'onLocationError' events
       */
      this.$locateButton.click();
    },

    onLocating() {
      this.isOptimizing = true;
    },

    async onLocationFound(location) {
      try {
        await this.optimize({
          territory: this.territory,
          startLat: location.latitude,
          startLng: location.longitude,
        });
        const sortList = orderBy(this.optimized.map(o => ({ id: o.id })), ['sort']);

        await this.reorderAddresses({ sortList });

        // reset geolocation control button
        this.$locateButton.click();
      } catch (e) {
        console.warn('Unable to optimize the addresses', e);
        this.nearMeText = 'Near Me';
        this.nearMeIcon = 'location-arrow';
      }
      this.isOptimizing = false;
      this.isNearMeClicked = false;
    },

    async onLocationError() {
      this.isOptimizing = false;
    },

    toggleCollaborate() {
      this.collaborate = !this.collaborate;
      sessionStorage.setItem('collaborate', this.collaborate);
      if (this.collaborate) {
        this.$router.go();
      } else {
        subscription.disconnect();
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
  },
  watch: {
    '$route.name': {
      // vue watch handlers does not allow arrow function syntax
      // eslint-disable-next-line
      handler: function (value) {
        this.viewMode = value;
      },
      deep: true,
      immediate: true,
    },
    territory() {
      if (this.territory
        && this.territory.name !== ''
        && !this.userTerritories.find(t => t.id === this.territory.id)
      ) {
        this.saveSeenTerritory(this.territory);
      }
    },
    async user() {
      // await this.refresh();
    },
    async isCheckedOut() {
      // await this.refresh();
    },
  },
};
</script>

<style scoped lang="scss">
@import '../assets/foreign-field-theme.scss';

.territory {
  .page-header {
    z-index: 10;
  }
  h4 {
    font-size: 24px;
    margin-bottom: 0;
  }
  font-size: 14px;
  .collaboration-mode {
    color: #fff;
    height: 18px;
    background: #777;
  }
  .header-buttons {
    ul {
      border-bottom: none;
      li {
        font-size: 16px;
        margin: 0;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;

        &[pressed="true"] {
          font-weight: 700;
          background: $light;
        }
      }
    }
  }

  .checkout-info {
    height: 1em;
  }
}
.list-group {
  display: block;
}
.columns {
  columns: 1;
}
.columns > [class*="col-"] {
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  break-inside: avoid;
  width: 100%;
  float: none;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
.add-new {
  font-size: 24px;
}
.territory-name {
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline-block;
  overflow: hidden;
}
.cities {
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline-block;
  overflow: hidden;
}
.text-medium {
  font-size: 1.2rem;
}

@media print {
  body {
    margin: 25mm 25mm 25mm 25mm;

    * {
      font-size: 24px;
    }
  }
  .territory {
    width: 100% !important;
  }
  .header-buttons {
    display: none !important;
  }
  .router-view {
    padding-top: 40px !important;
  }
}
</style>
