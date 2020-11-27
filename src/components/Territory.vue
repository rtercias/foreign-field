<template>
  <div class="territory">
    <Loading v-if="territoryIsLoading" />
    <div v-else>
      <header class="w-100 px-2">
        <div class="w-100">
          <div class="w-100 d-flex justify-content-between pt-3">
            <div class="text-left">
              <h4 class="mb-0">{{primaryCity}}</h4>
              <span>{{secondaryCities}}</span>
            </div>
            <h4 class="text-right">
                <font-awesome-icon
                  class="text-primary d-xl-none"
                  icon="sms"
                  size="sm"
                  @click="openSMSMobile()">
                </font-awesome-icon> {{territoryName}}
            </h4>
          </div>
          <div class="w-100 d-flex justify-content-between pb-3 pt-2">
            <b-button-group size="sm">
              <b-button
                variant="outline-info"
                :to="{ name: 'address-list', params: { id } }"
                :pressed="viewMode === 'address-list'">
                Address
              </b-button>
              <b-button
                variant="outline-info"
                :to="{ name: 'phone-list', params: { id } }"
                :pressed="viewMode === 'phone-list'">
                Phone
              </b-button>
              <b-button variant="outline-info" :to="`/territories/${id}/map`" :pressed="viewMode==='map-view'">
                Map
              </b-button>
            </b-button-group>
            <b-button-group v-if="viewMode==='map-view'" size="sm">
              <b-button variant="primary" :to="`/territories/${id}/optimize`">
                Optimize
              </b-button>
            </b-button-group>
            <b-button-group v-else size="sm">
              <b-button v-if="isCheckedOut && (canWrite || isOwnedByUser)" variant="warning" @click="checkIn(true)">
                <font-awesome-icon v-if="isCheckingIn" class="text-primary" icon="circle-notch" spin />
                <span v-else>Check In</span>
              </b-button>
              <b-button
                v-if="canWrite && ['address-list', 'phone-list'].includes(viewMode)"
                variant="success"
                :to="`/territories/${id}/addresses/add`">
                <font-awesome-icon icon="plus"></font-awesome-icon> New Address
              </b-button>
            </b-button-group>
          </div>
        </div>
      </header>
      <router-view :disabled="!isCheckedOut" :territory="territory"></router-view>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import TerritoryMap from './TerritoryMap.vue';
import Loading from './Loading';
import { store, defaultOptions } from '../store';
import { channel } from '../main';

export default {
  name: 'Territory',
  components: {
    TerritoryMap,
    Loading,
  },
  props: ['id'],
  beforeRouteEnter(to, from, next) {
    const { options = defaultOptions } = store.state.auth;
    const name = get(options, 'territory.defaultView');
    const { id } = to.params;
    if (name !== to.name) {
      next({ name, params: { id } });
    }
    next();
  },
  data() {
    return {
      reset: false,
      workInProgress: {},
      viewMode: this.defaultView,
      isCheckingIn: false,
    };
  },
  async mounted() {
    await this.getTerritory({ id: this.id, getLastActivity: true });
    channel.bind('add-log', (log) => {
      if (log && this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === log.address_id);
        if (address) {
          this.$set(address, 'lastActivity', log);
        }
      }
    });
    channel.bind('add-note', (args) => {
      if (this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === args.addressId);
        if (address && !address.notes.includes(args.note)) {
          const notesArray = address.notes ? address.notes.split(',') : [];
          notesArray.push(args.note);
          this.$set(address, 'notes', notesArray.join(','));
        }
      }
    });
    channel.bind('remove-note', (args) => {
      if (this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === args.addressId);
        if (address && address.notes.includes(args.note)) {
          const notesArray = address.notes ? address.notes.split(',') : [];
          const filtered = notesArray.filter(n => n !== args.note);
          this.$set(address, 'notes', filtered.join(','));
        }
      }
    });
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
    primaryCity() {
      return this.cityNames[0];
    },
    secondaryCities() {
      if (this.cityNames.length > 1 && this.cityNames.length <= 3) {
        const scrubbedCityNames = this.cityNames.slice(1).filter(c => c && c.trim() !== 'null');
        return scrubbedCityNames.length > 1 ? `also: ${this.cityNames.slice(1).join(',')}` : '';
      }
      if (this.cityNames.length > 3) {
        const scrubbedCityNames = this.cityNames.slice(1).filter(c => c && c.trim() !== 'null');
        return `also: ${scrubbedCityNames.length} cities`;
      }

      return '';
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
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritoryActivities: 'territory/resetTerritoryActivities',
    }),

    async checkIn() {
      const response = await this.$bvModal.msgBoxConfirm('Ready to check-in the territory?', {
        title: `${this.territory.name}`,
        centered: true,
      });

      if (response) {
        this.checkInAndReset();
      }
    },

    async checkInAndReset() {
      this.isCheckingIn = true;
      await this.checkinTerritory({
        territoryId: this.id,
        userId: get(this.territory, 'status.publisher.id'),
        username: this.user.username,
      });

      await this.resetTerritoryActivities({
        checkoutId: this.territory.status.checkout_id,
        userid: this.user.id,
        tzOffset: new Date().getTimezoneOffset().toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

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
  },
};
</script>

<style scoped lang="scss">
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
