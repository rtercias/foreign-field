<template>
  <div class="territory">
    <Loading v-if="territoryIsLoading" />
    <div v-else>
      <header class="page-header sticky-top w-100 pt-2 px-2 pb-0 bg-white border-bottom" :sticky="true">
        <div class="w-100">
          <div class="w-100 d-flex justify-content-between pt-3">
            <div class="text-left w-50">
              <h4>
                {{territory.description}}
                <font-awesome-icon icon="circle-notch" spin class="text-info" v-if="isTerritoryBusy" />
              </h4>
              <span class="small">{{filteredCount || displayCount}}</span>
            </div>
            <div class="text-right w-50">
              <h4>
                <font-awesome-icon
                  class="text-primary d-xl-none"
                  icon="sms"
                  size="sm"
                  @click="openSMSMobile()">
                </font-awesome-icon> {{territoryName}}
              </h4>
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
            <b-button-group v-if="viewMode==='map-view'" size="sm" class="badge px-0">
              <b-button variant="primary" :to="`/territories/${territoryId}/optimize`">
                Optimize
              </b-button>
            </b-button-group>
            <b-button-group v-else size="sm" class="badge px-0">
              <b-button v-if="canManage" variant="danger" @click="reset">
                <font-awesome-icon v-if="isResetting" class="text-primary" icon="circle-notch" spin />
                <span v-else>Reset</span>
              </b-button>
              <b-button v-if="showCheckInButton" variant="warning" @click="checkIn(true)">
                <font-awesome-icon v-if="isCheckingIn" class="text-primary" icon="circle-notch" spin />
                <span v-else>Check In</span>
              </b-button>
              <b-button
                v-if="canWrite && ['address-list', 'phone-list'].includes(viewMode)"
                variant="success"
                :to="`/territories/${territoryId}/addresses/add`">
                <font-awesome-icon icon="plus"></font-awesome-icon>Address
              </b-button>
            </b-button-group>
          </div>
        </div>
      </header>
      <router-view :disabled="!isCheckedOut" :territory="territory" @update-count="updateCount"></router-view>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import TerritoryMap from './TerritoryMap.vue';
import Loading from './Loading';
import { store, defaultOptions } from '../store';
import { displayName, displayShortName } from '../utils/publisher';
import { CongDefault } from '../store/modules/models/CongDefaultOptions';

export default {
  name: 'Territory',
  components: {
    TerritoryMap,
    Loading,
  },
  props: ['territoryId'],
  beforeRouteEnter(to, from, next) {
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
    };
  },
  async mounted() {
    await this.refresh();
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      authIsLoading: 'auth/loading',
      user: 'auth/user',
      canViewReports: 'auth/canViewReports',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      ownedBy: 'territory/isOwnedByUser',
      options: 'auth/options',
      token: 'auth/token',
      territoryIsLoading: 'territory/isLoading',
      isTerritoryBusy: 'territory/isBusy',
      isDesktop: 'auth/isDesktop',
      cancelTokens: 'territory/cancelTokens',
      userTerritories: 'auth/userTerritories',
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
      return this.viewMode !== 'optimize' && this.isCheckedOut && (this.canWrite || this.isOwnedByUser);
    },
    count() {
      if (this.viewMode === 'phone-list') {
        const addresses = get(this.territory, 'addresses', []).map(a => get(a, 'phones.length')) || [];
        if (addresses.length) {
          return addresses.reduce((acc, current) => (acc || 0) + current);
        }
        return 0;
      }
      return get(this.territory, 'addresses.length', 0);
    },
    displayCount() {
      return `Count: ${this.count}`;
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritoryActivities: 'territory/resetTerritoryActivities',
      saveSeenTerritory: 'territories/saveSeenTerritory',
      fetchLastActivities: 'territory/fetchLastActivities',
    }),

    async refresh() {
      if (this.territory.id === this.territoryId && !!this.territory.addresses) {
        if (!this.cancelTokens.FETCH_LAST_ACTIVITY) {
          await this.fetchLastActivities(this.territory);
        }
      } else {
        await this.getTerritory({ id: this.territoryId, getLastActivity: true });
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
      await this.checkinTerritory({
        checkout_id: get(this.territory, 'status.checkout_id'),
        territoryId: this.territoryId,
        publisher: get(this.territory, 'status.publisher') || {},
        username: this.user.username,
      });

      await this.resetTerritoryActivities({
        checkoutId: this.territory.status.checkout_id,
        userid: this.user.id,
        tzOffset: new Date().getTimezoneOffset().toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      this.saveSeenTerritory(this.territory);

      this.isCheckingIn = false;
      await this.$router.push({ name: 'home' });
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
@media (min-width: 769px) {
  .columns {
    columns: 2;
  }
}
@media print {
  .columns {
    columns: 2;
  }
}
</style>
