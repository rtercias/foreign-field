<template>
  <div class="territory">
    <header>
      <h3>{{getCities()}}</h3>
      <h3>{{getTerritoryName()}}</h3>
    </header>
    <b-list-group class="columns">
      <b-list-group-item class="col-sm-12" v-for="address in addresses" v-bind:key="address.id" data-toggle="collapse">
        <AddressCard v-bind="{address}"></AddressCard>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import AddressCard from './AddressCard.vue';

export default {
  name: 'Territory',
  components: {
    AddressCard,
  },
  async beforeRouteUpdate (to) {
    await this.getTerritory(to.params.id);
  },
  data() {
    return {
      terrId: this.$route.params.id,
      addresses: [],
    };
  },
  methods: {
    async getTerritory(id) {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `{ addresses (terrId: ${id}) { id addr1 addr2 city state postalCode phone longitude latitude territory { name } notes }}`
        }
      });

      this.addresses = response.data.data.addresses;
    },

    getTerritoryName() {
      if (this.addresses.length) {
        return this.addresses[0].territory.name;
      }

      return '';
    },
    getCities() {
      const cities = this.addresses.map(a => a.city);
      return uniq(flatten(cities)).join(',');
    }
  },
  async mounted() {
    await this.getTerritory(this.terrId);
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
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
header {
  display: flex;
  justify-content: space-between;
  padding: 0 1.25rem 1.25rem;
}

@media (min-width: 769px) {
  .columns {
    columns: 2;
  }
}
</style>
