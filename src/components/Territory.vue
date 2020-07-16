<template>
  <div class="territory">
    <Loading v-if="isLoading"></Loading>
    <div v-else>
      <!-- <div v-if="isOwnedByUser || isAdmin"> -->
        <header>
          <div class="w-100 row justify-content-between pl-4 pt-4">
            <div class="d-flex">
              <h3>{{getCities()}}</h3>
              <h3 class="font-weight-bold m-0 mr-2 ml-2" v-if="authIsLoading">
                <font-awesome-icon icon="circle-notch" spin></font-awesome-icon>
              </h3>
            </div>
            <h3 class="text-right">{{getTerritoryName()}}</h3>
          </div>
          <div v-if="canAssignTerritory" class="w-100 row justify-content-between pl-4 pb-4 pt-2">
            <b-button class="p-0" variant="link" @click="resetNH(true)">Reset</b-button>
            <b-button class="font-weight-bold" variant="success" :to="`/territories/${group}/${id}/addresses/add`">
              <font-awesome-icon icon="plus"></font-awesome-icon> New Address
            </b-button>
          </div>
          <TerritoryMap></TerritoryMap>
        </header>
        <b-list-group class="columns">
          <b-list-group-item
            class="col-sm-12 overflow-auto"
            v-for="address in territory.addresses"
            :class="isActiveAddress(address.id) ? ['bg-white', 'active'] : []"
            v-bind:key="address.id"
            data-toggle="collapse">
            <AddressCard
              v-bind="{address, reset}"
              :territoryId="terrId"
              :group="group"
              @address-updated="refreshTerritory">
            </AddressCard>
          </b-list-group-item>
        </b-list-group>
      <!-- </div>
      <h2 v-else-if="isCheckedOut" class="p-5">Please contact the owner of this territory.</h2>
      <h2 v-else-if="isRecentlyWorked" class="p-5">Please contact your Territory Servant.</h2>
      <div v-else class="p-5">
        <h2>Good news!</h2><br/>
        <h4>This territory is available for checkout. Please contact your Territory Servant.</h4>
      </div> -->
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import orderBy from 'lodash/orderBy';
import AddressCard from './AddressCard.vue';
import Loading from './Loading.vue';
import TerritoryMap from './TerritoryMap.vue';
import differenceInDays from 'date-fns/differenceInDays';

export default {
  name: 'Territory',
  components: {
    AddressCard,
    Loading,
    TerritoryMap,
  },
  props: ['group', 'id'],
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}`);
    if (this.token) {
      await this.loadTerritory();
    }
    this.isLoading = false;
  },
  data() {
    return {
      isLoading: true,
      terrId: this.$route.params.id,
      reset: false,
      workInProgress: {},
    };
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      isOwnedByUser: 'territory/isOwnedByUser',
      isAdmin: 'auth/isAdmin',
      authIsLoading: 'auth/loading',
      user: 'auth/user',
      canWrite: 'auth/canWrite',
      lastActivity: 'territory/lastActivity',
      token: 'auth/token',
    }),
    isCheckedOut() {
      return this.territory && this.territory.status && this.territory.status.status === 'Checked Out';
    },
    isRecentlyWorked() {
      return this.territory && this.territory.status && this.territory.status.status === 'Recently Worked';
    },
    canAssignTerritory() {
      const { role } = this.user || {};
      return ['Admin', 'TS'].includes(role);
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      resetNHRecords: 'territory/resetNHRecords',
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),

    getTerritoryName() {
      if (this.territory) {
        return this.territory.name;
      }

      return '';
    },
    getCities() {
      if (this.territory && this.territory.addresses) {
        const cities = this.territory.addresses.map(a => a.city);
        return uniq(flatten(cities)).join(',');
      }

      return null;
    },

    async resetNH() {
      if (window.confirm('Are you sure you want to reset NH records?')) {
        this.isLoading = true;
        await this.resetNHRecords(this.terrId);
        await this.getTerritory(this.terrId);
        this.isLoading = false;
      }
    },

    isActiveAddress(addressId) {
      return this.lastActivity ? addressId === this.lastActivity.address_id : false;
    },

    async refreshTerritory() {
      await this.getTerritory(this.terrId);
    },

    seenTerritories() {
      let seenTerritories = [];
      if (localStorage.getItem('seenTerritories')) {
        try {
          seenTerritories = JSON.parse(localStorage.getItem('seenTerritories'));
        } catch (e) {
          localStorage.removeItem('seenTerritories');
        }
      }
      return seenTerritories;
    },

    saveSeenTerritory() {
      // create a basic territory and save it to localstorage
      const city = this.territory.city.length ? this.territory.city.split(',')[0] : '';
      const basicTerritory = {
        name: this.territory.name,
        city,
        group_code: this.territory.group_code,
        id: this.territory.id,
        lastVisited: (new Date()).toISOString(),
      };
      let seenList = this.seenTerritories();
      const idx = seenList.findIndex(terr => terr.id === this.territory.id);
      if (idx >= 0) {
        seenList.splice(idx, 1, basicTerritory);
      } else {
        seenList.push(basicTerritory);
      }
      // filter out old ones
      seenList = seenList.filter(terr => differenceInDays(new Date(), new Date(terr.lastVisited)) < 60);
      seenList = orderBy(seenList, 'lastVisited', 'desc');
      seenList.length = seenList.length <= 5 ? seenList.length : 5;
      const parsed = JSON.stringify(seenList);
      localStorage.setItem('seenTerritories', parsed);
    },

    async loadTerritory() {
      await this.getTerritory(this.terrId);
      this.saveSeenTerritory();
    },
  },
  watch: {
    async token() {
      await this.loadTerritory();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
