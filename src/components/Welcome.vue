<template>
  <div class="hello d-flex align-items-center flex-column p-5">
    <h3 v-if="!isAuthenticated">Welcome to Foreign Field territory management</h3>
    <Auth v-if="!isAuthenticated"></Auth>
    <div v-else>
      <h3>Dashboard (coming soon!)</h3>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Auth from './Auth';

export default {
  name: 'Home',
  components: {
    Auth,
  },
  methods: {
    
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
    })
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
router-link {
  cursor: pointer;
}
</style>
