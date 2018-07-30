<template>
  <div class="territories">
    <header class="row align-items-center justify-content-between">
      <h4>Service Group: {{groupCode}}</h4>
      <b-dropdown right>
        <span slot="button-content">{{availability}}</span>
        <b-dropdown-item v-for="avail in availabilityFilters" v-bind:key="avail" @click="setAvailability(avail)">
          <font-awesome-icon icon="check" v-if="availability === avail" /> {{avail}}
        </b-dropdown-item>
      </b-dropdown>
    </header>
    <b-list-group class="flex-row flex-wrap">
      <b-list-group-item v-for="terr in territories" v-bind:key="terr.id" data-toggle="collapse" class="col-md-6">
        <b-link :to="`/territories/${groupCode}/${terr.id}`">
          {{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span>
        </b-link>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios';
// import { mapActions } from 'vuex';

export default {
  name: 'Territories',
  async beforeRouteUpdate (to, from, next) {
    this.groupCode = to.params.group;
    this.territories = await this.getTerritories();
    next();
  },
  data() {
    return {
      congId: 1,
      groupCode: '',
      territories: [],
      cities: [],
      availability: 'All',
      availabilityFilters: [
        'All',
        'Available',
        'Checked Out',
        'Recently Worked',
      ],
    };
  },
  methods: {
    async getTerritories() {
      const response = await axios({
        url: 'http://api.foreignfield.com/graphql',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `{ territories (congId: ${this.congId}, group_code: "${this.groupCode}") { id name type city status }}`
        }
      });

      if (this.availability === 'All') {
        return response.data.data.territories;
      }

      return response.data.data.territories.filter(t => t.status === this.availability);
    },

    async setAvailability(value) {
      this.availability = value;
      this.territories = await this.getTerritories();
      sessionStorage.setItem('availability', value);
    }
  },

  async mounted() {
    this.groupCode = this.$route.params.group;
    this.availability = sessionStorage.getItem('availability');
    this.territories = await this.getTerritories();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
header {
  padding: 1.25rem 2rem;
}
.list-group {
  display: flex;
}
h4 {
  margin: 0;
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

.dropdown-item.active, .dropdown-item:active {
  padding-left: 0;
}

@media print {
  .columns {
    columns: 2;
  }
}
</style>
