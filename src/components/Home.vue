<template>
  <div class="hello">
    <p>
      <span v-if="isAuthenticated && isAuthorized">Hello {{name}}</span>
      <span v-if="!isAuthenticated && !isForcedOut">Welcome to Foreign Field territory management</span>
      <br/>
      <span v-if="isForcedOut">Sorry {{name}}, you are not authorized to use this app.</span>
    </p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Home',
  methods: {
    
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isAuthorized: 'auth/isAuthorized',
      isForcedOut: 'auth/isForcedOut',
      name: 'auth/name'
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
