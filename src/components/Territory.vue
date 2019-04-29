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
          <div class="w-100 row justify-content-between pl-4 pb-4">
            <b-button v-if="canAssignTerritory" class="p-0" variant="link" @click="resetNH(true)">Reset</b-button>
          </div>
        </header>
        <b-list-group class="columns">
          <b-list-group-item
            class="col-sm-12"
            v-for="address in territory.addresses"
            v-bind:key="address.id"
            data-toggle="collapse">
            <AddressCard v-bind="{address, reset}"></AddressCard>
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
import AddressCard from './AddressCard.vue';
import Loading from './Loading.vue';

export default {
  name: 'Territory',
  components: {
    AddressCard,
    Loading,
  },

  async mounted() {
    await this.getTerritory(this.terrId);
    setTimeout(() => this.isLoading = false, 300);
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
  },
  watch: {
    user() {
      // Ensures the current user's congregation owns the current territory.
      // This ensures navigation to a territory via url are valid.
      if (this.user.congregation.id !== this.territory.congregationid) {
        this.$router.push('/welcome');
      }
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
