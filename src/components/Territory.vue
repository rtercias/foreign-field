<template>
  <div class="territory">
    <Loading v-if="territoryIsLoading" />
    <div v-else>
      <header class="page-header sticky-top w-100 pt-2 px-2 pb-0 bg-white border-bottom" :sticky="true">
        <div class="w-100">
          <div class="w-100">
            <div class="d-flex justify-content-between">
              <h4 class="text-truncate" :class="{ 'text-medium': !isDesktop && territory.description.length > 10 }">
                {{territory.description}}
                <font-awesome-icon icon="circle-notch" spin class="text-info" v-if="isTerritoryBusy" />
              </h4>
              <h4 class="text-right">
                <font-awesome-icon
                  class="text-primary d-xl-none"
                  icon="sms"
                  size="sm"
                  @click="openSMSMobile()">
                </font-awesome-icon> {{territoryName}}
              </h4>
            </div>
            <div class="d-flex justify-content-between">
              <div>
                <span class="small">{{filteredCount || displayCount}}</span>
                <b-badge variant="warning" class="ml-2">{{displayType}}</b-badge>
              </div>
              <span class="small">{{currentPublisher}}</span>
            </div>
          </div>
          <div class="header-buttons w-100 d-flex justify-content-between py-2">
            <b-button-group size="sm" class="badge px-0">
              <b-button
                variant="outline-info"
                :to="{ name: 'address-list', params: { territoryId } }"
                :pressed="viewMode === 'address-list'">
                Address
              </b-button>
              <b-button
                variant="outline-info"
                :to="{ name: 'phone-list', params: { territoryId } }"
                :pressed="viewMode === 'phone-list'">
                Phone
              </b-button>
              <b-button variant="outline-info" :to="`/territories/${territoryId}/map`" :pressed="viewMode==='map-view'">
                Map
              </b-button>
            </b-button-group>
            <b-button-group size="sm" class="badge px-0">
              <b-button
                v-if="viewMode==='map-view'"
                variant="success"
                class="text-white"
                @click="optimizeNearMe"
                :disabled="isOptimizing"
              >
                <font-awesome-icon v-if="isOptimizing" icon="circle-notch" spin />
                <font-awesome-icon v-else :icon="nearMeIcon" />
                <span v-if="isDesktop" class="ml-2">{{nearMeText}}</span>
              </b-button>
              <b-button
                v-if="canManage && viewMode==='map-view'"
                variant="primary"
                :to="`/territories/${territoryId}/optimize`"
              >
                <font-awesome-icon icon="compass" />
                <span v-if="isDesktop" class="ml-2">Optimize</span>
              </b-button>
              <b-button v-if="canManage && isCheckedOut" variant="danger" @click="reset">
                <font-awesome-icon v-if="isResetting" class="text-primary" icon="circle-notch" spin />
                <font-awesome-icon v-else icon="backward" />
                <span v-if="isDesktop" class="ml-2">Reset</span>
              </b-button>
              <b-button v-if="showCheckInButton" variant="warning" @click="checkIn(true)">
                <font-awesome-icon v-if="isCheckingIn" class="text-primary" icon="circle-notch" spin />
                <font-awesome-icon v-else icon="check" />
                <span class="ml-2" :class="{ 'd-none': canManage && !isDesktop }">Check In</span>
              </b-button>
              <b-button
                v-if="canWrite"
                variant="success"
                :to="`/territories/${territoryId}/addresses/add?origin=map-view`">
                <font-awesome-icon icon="plus"></font-awesome-icon>
                <span v-if="isDesktop" class="ml-2">Address</span>
              </b-button>
            </b-button-group>
          </div>
        </div>
      </header>
      <router-view
        :ref="viewMode"
        class="router-view"
        :disabled="!isCheckedOut"
        :territory="territory"
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
    };
  },
  async mounted() {
    await this.refresh();
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
      isTerritoryBusy: 'territory/isBusy',
      isDesktop: 'auth/isDesktop',
      cancelTokens: 'territory/cancelTokens',
      userTerritories: 'auth/userTerritories',
      optimized: 'addresses/optimized',
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
    count() {
      if (this.viewMode === 'phone-list') {
        const addresses = get(this.territory, 'addresses', []).map(a => get(a, 'phones.length')) || [];
        if (addresses.length) {
          const addressCount = addresses.length;
          const phoneCount = addresses.reduce((acc, current) => (acc || 0) + current);
          if (this.isDesktop) {
            return `${addressCount} addresses, ${phoneCount} phones`;
          }
          return `${addressCount}, ${phoneCount}`;
        }
        return 0;
      }
      return get(this.territory, 'addresses.length', 0);
    },
    displayCount() {
      return `Count: ${this.count}`;
    },
    displayType() {
      return this.territory.type === 'Active' ? '' : get(TerritoryType[this.territory.type], 'text');
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
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritoryActivities: 'territory/resetTerritoryActivities',
      saveSeenTerritory: 'territories/saveSeenTerritory',
      fetchLastActivities: 'territory/fetchLastActivities',
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

    async refresh() {
      if (this.territory.id === this.territoryId && !!this.territory.addresses) {
        if (!this.cancelTokens.FETCH_LAST_ACTIVITY) {
          await this.fetchLastActivities(this.territory);
        }
      } else {
        await this.getTerritory({ id: this.territoryId, getLastActivity: true });
      }

      if (this.user && get(this.user, 'congregation.id') !== get(this.territory, 'congregationid')) {
        this.$router.replace('/unauthorized');
      }
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
          if (address.status !== AddressStatus.Active) {
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
          if (address.status !== AddressStatus.Active) {
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
      if (this.territory.name !== '' && !this.userTerritories.find(t => t.id === this.territory.id)) {
        this.saveSeenTerritory(this.territory);
      }
    },
    async user() {
      await this.refresh();
    },
  },
};
</script>

<style scoped lang="scss">
.territory {
  .header-buttons {
    .btn {
      font-size: 12px;
    }
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
