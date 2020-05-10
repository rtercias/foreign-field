<template>
  <div class="dashboard lead d-flex align-items-center flex-column p-3 pt-5">
    <h3 v-if="!isAuthenticated">Welcome to Foreign Field territory management</h3>
    <Auth v-if="!isAuthenticated"></Auth>
    <div v-else class="w-100">
      <h3 class="pt-0 mt-0">Dashboard</h3>

      <div class="d-flex p-2 text-left justify-content-center">
        <div>
          <Loading v-if="loading"></Loading>
          <span v-else-if="!(territories && territories.length)">I have no territories checked out.</span>
          <div v-else>
            <span>Territories I have checked out:</span>
            <ul class="d-flex flex-column">
              <li class="pt-3 ml-0 font-weight-bold" v-for="terr in territories" :key="terr.id">
                <a :href="url(terr)">{{terr.name}} ({{terr.city}})</a>
                <div>Checked out on {{terr.status && checkoutDate(terr.status.date)}}</div>
                <hr/>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import format from 'date-fns/format';
import Auth from './Auth';
import Loading from './Loading.vue';

export default {
  name: 'Home',
  components: {
    Auth,
    Loading,
  },
  methods: {
    checkoutDate(date) {
      return format(new Date(date), 'MM/dd/yyyy');
    },

    url(terr) {
      return `/territories/${terr.group_code}/${terr.id}`;
    },
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      user: 'auth/user',
      loading: 'auth/loading',
    }),

    territories() {
      return this.user && this.user.territories;
    },
  },
};
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
router-link {
  cursor: pointer;
}
</style>
