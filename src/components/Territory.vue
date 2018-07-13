<template>
  <div class="territory">
    <b-list-group>
      <b-list-group-item v-for="address in addresses" v-bind:key="address.id" data-toggle="collapse">
        {{address.addr1}} {{address.addr2}}
        {{address.city}} {{address.state}} {{address.postalCode}}
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Territory',
  data() {
    console.log(this.$route.params.id);
    return {
      terrId: this.$route.params.id,
      addresses: [],
    };
  },
  async mounted() {
    const response = await axios({
      url: 'http://localhost:4000/graphql',
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        query: `{ addresses (terrId: ${this.terrId}) { id addr1 addr2 city state postalCode phone longitude latitude }}`
      }
    });

    console.log(response);
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
</style>
