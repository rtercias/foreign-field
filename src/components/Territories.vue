<template>
  <div class="territories">
    <b-list-group>
      <b-list-group-item v-for="group in group_codes" v-bind:key="group">
        <h3>{{ group }}</h3>
        <b-list-group-item v-for="terr in territoriesByGroup(group)" v-bind:key="terr.id" data-toggle="collapse">
          <router-link :to="`/territories/${terr.id}`">{{terr.name}}</router-link>
        </b-list-group-item>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios';
import { uniqBy } from 'lodash';
// import { mapActions } from 'vuex';

export default {
  name: 'Territories',
  data() {
    return {
      congId: 1,
      territories: [],
      group_codes: [],
    };
  },
  methods: {
    territoriesByGroup(group) {
      return this.territories.filter(t => t.group_code === group);
    }
    // ...mapActions('territories', {
    //   getTerritoriesByCong: 'getTerritoriesByCong'
    // })
  },
  async mounted() {
    const response = await axios({
      url: 'http://localhost:4000/graphql',
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        query: `{ territories (congId: 1) { group_code id name type addresses { city } }}`
      }
    });

    this.territories = response.data.data.territories;
    this.group_codes = uniqBy(this.territories, 'group_code').map(g => g.group_code).sort();

    // this.getTerritoriesByCong(1);
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
