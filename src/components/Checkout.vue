<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <b-list-group>
      <b-list-group-item v-for="terr in territories" v-bind:key="terr.id">{{ terr.name }}</b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Checkout',
  props: {
    msg: String
  },
  computed: {
    ...mapState([
      'territories'
    ])
  }
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
