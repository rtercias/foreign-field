<template>
  <div class="territory">
    <header>
      <h3>{{getCities()}}</h3>
      <h3>{{getTerritoryName()}}</h3>
    </header>
    <b-list-group class="flex-row flex-wrap">
      <b-list-group-item class="col-md-6" v-for="address in addresses" v-bind:key="address.id" data-toggle="collapse">
        <p class="addresses">
          {{address.addr1}} {{address.addr2}}<br/>
          {{address.city}} {{address.state}} {{address.postalCode}}
        </p>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios';
import { flatten, uniq } from 'lodash';

export default {
  name: 'Territory',
  data() {
    return {
      terrId: this.$route.params.id,
      addresses: [],
    };
  },
  methods: {
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
    const response = await axios({
      url: 'http://localhost:4000/graphql',
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        query: `{ addresses (terrId: ${this.terrId}) { id addr1 addr2 city state postalCode phone longitude latitude territory { name } }}`
      }
    });

    this.addresses = response.data.data.addresses;
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
a {
  color: #42b983;
}
header {
  display: flex;
  justify-content: space-between;
  padding: 0 1.25rem 1.25rem;
}
.addresses {
  text-align: left;
}
</style>
