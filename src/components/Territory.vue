<template>
  <div class="territory">
    <header>
      <div class="w-100 row justify-content-between pl-4 pt-4">
        <h3>{{getCities()}}</h3>
        <h3 class="text-right">{{getTerritoryName()}}</h3>
      </div>
      <div class="w-100 row justify-content-between pl-4 pb-4">
        <b-button class="p-0" variant="link" @click="cleanLocalStorage(true)">Reset</b-button>
      </div>
    </header>
    <b-list-group class="columns">
      <b-list-group-item class="col-sm-12" v-for="address in territory.addresses" v-bind:key="address.id" data-toggle="collapse">
        <AddressCard v-bind="{address, reset}"></AddressCard>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import AddressCard from './AddressCard.vue';
import differenceInDays from 'date-fns/difference_in_days';


export default {
  name: 'Territory',
  components: {
    AddressCard,
  },
  mounted() {
    this.$store.dispatch('territory/getTerritory', this.terrId);
  },
  data() {
    return {
      terrId: this.$route.params.id,
      reset: false,
      workInProgress: {},
    };
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
    }),
  },
  methods: {
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
    cleanLocalStorage(force) {
      if (force && !confirm('Are you sure you want to reset your records?')) {
        return;
      }

      const keysToRemove = [];
      this.reset = true;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const item = localStorage.getItem(key);
        const timestamp = item.split('-')[1];
        if (key.includes('foreignfield-') && 
        (force || differenceInDays(new Date(Number(timestamp)), new Date()) > 0)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    },
  },
}
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
</style>
