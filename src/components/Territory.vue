<template>
  <div class="territory">
    <div v-if="isLoading" class="font-weight-bold m-0 mt-2 mr-2 ml-2 medium">
      Please wait <font-awesome-icon icon="circle-notch" spin></font-awesome-icon>
    </div>
    <div v-else>
      <header class="w-100 pl-2 pr-2">
        <div class="w-100">
          <div class="w-100 d-flex justify-content-between pt-3">
            <div class="text-left">
              <h4 class="mb-0">{{primaryCity}}</h4>
              <span>{{secondaryCities}}</span>
            </div>
            <h4 class="text-right d-xl-none">
                <font-awesome-icon
                  class="text-primary"
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
                :to="{ name: 'address-list', params: { group, id }}"
                :pressed="viewMode === 'address-list'">
                Address
              </b-button>
              <b-button
                variant="outline-info"
                :to="{ name: 'phone-list', params: { group, id }}"
                :pressed="viewMode === 'phone-list'">
                Phone
              </b-button>
              <b-button variant="outline-info" :to="`/territories/${group}/${id}/map`" :pressed="viewMode==='map-view'">
                Map
              </b-button>
            </b-button-group>
            <b-button-group v-if="viewMode==='map-view'" size="sm">
              <b-button variant="primary" :to="`/territories/${group}/${id}/optimize`">
                Optimize
              </b-button>
            </b-button-group>
            <b-button-group v-else size="sm">
              <b-button v-if="isCheckedOut && (canWrite || isOwnedByUser)" variant="warning" @click="checkIn(true)">
                Check In
              </b-button>
              <b-button
                v-if="canWrite && viewMode === 'address-list'"
                variant="success"
                :to="`/territories/${group}/${id}/addresses/add`">
                <font-awesome-icon icon="plus"></font-awesome-icon> New Address
              </b-button>
            </b-button-group>
          </div>
        </div>
      </header>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import TerritoryMap from './TerritoryMap.vue';
import { store, defaultOptions } from '../store';

export default {
  name: 'Territory',
  components: {
    TerritoryMap,
  },
  props: ['group', 'id'],
  beforeRouteEnter(to, from, next) {
    if (from.name) next();

    const { options = defaultOptions } = store.state.auth;
    const name = get(options, 'territory.defaultView');
    const { group, id } = to.params;
    if (name !== to.name) {
      next({ name, params: { group, id } });
    }
    next();
  },
  data() {
    return {
      isLoading: true,
      reset: false,
      workInProgress: {},
      viewMode: this.defaultView,
    };
  },
  async mounted() {
    if (this.token) {
      await this.getTerritory(this.id);
    }
    this.isLoading = false;
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
    }),
    isCheckedOut() {
      return this.territory && this.territory.status && this.territory.status.status === 'Checked Out';
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
        return `also: ${this.cityNames.slice(1).join(',')}`;
      }
      if (this.cityNames.length > 3) {
        return `also: ${this.cityNames.length} cities`;
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
      this.isLoading = true;
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

      this.isLoading = false;
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

<style scoped>
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
