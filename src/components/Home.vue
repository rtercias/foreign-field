<template>
  <div class="hello">
    <p>
      <span v-if="isAuthenticated">Hello {{name}}</span>
      <span v-if="!isAuthenticated">Welcome to Foreign Field territory management</span>
    </p>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.auth.isAuthenticated;
    },
    name() {
      return this.$store.state.auth.name;
    }
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
