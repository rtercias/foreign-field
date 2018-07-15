<template>
  <div class="territories">
    <header>
      <b-dropdown class="group-codes m-md-2">
        <span slot="button-content">{{groupCode || "Group Code"}}</span>
        <b-dropdown-header>Select Group Code</b-dropdown-header>
        <b-dropdown-item v-for="group in groupCodes" v-bind:key="group" @click="setGroupCode(group)">
          {{group}}
        </b-dropdown-item>
      </b-dropdown>
    </header>
    <b-list-group class="flex-row flex-wrap">
      <b-list-group-item v-for="terr in territories" v-bind:key="terr.id" data-toggle="collapse" class="col-md-6">
        <b-link :to="`/territories/${terr.id}`">
          {{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span>
        </b-link>
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
      groupCode: '',
      territories: [],
      groupCodes: [],
      cities: [],
    };
  },
  methods: {
    async getTerritories() {
      const response = await axios({
        url: 'http://localhost:4000/graphql',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `{ territories (congId: ${this.congId}, group_code: "${this.groupCode}") { id name type city }}`
        }
      });

      return response.data.data.territories;
    },

    async getGroupCodes() {
      const response = await axios({
        url: 'http://localhost:4000/graphql',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `{ territories (congId: ${this.congId}) { group_code }}`
        }
      });

      const territories = response.data.data.territories;
      const group = sessionStorage.getItem('group-code');
      if (group) this.setGroupCode(group);

      return uniqBy(territories, 'group_code').map(g => g.group_code).sort();
    },

    async setGroupCode(value) {
      this.groupCode = value;
      this.territories = await this.getTerritories();
      sessionStorage.setItem('group-code', value);
    },
  },
  async mounted() {
    this.groupCodes = await this.getGroupCodes();
    // this.getTerritoriesByCong(1);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
header {
  display: flex;
}
.list-group {
  display: flex;
}
h3 {
  margin: 40px 0 0;
  text-align: left;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
.list-group-item {
  text-align: left;
}
</style>
