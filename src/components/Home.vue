<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      This is the home page
    </p>
    <button @click="login">Login</button>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'Home',
  data: () => {
    return {
      authenticated: false,
    };
  },
  props: {
    msg: String
  },
  methods: {
    login() {
      Vue.googleAuth().directAccess();
      Vue.googleAuth().signIn((authorizationCode) => { 
        // things to do when sign-in succeeds
        this.authenticated = true;
        console.log('Yes, I am now authenticated', authorizationCode);
          
      }, function (error) {
        // things to do when sign-in fails
        this.authenticated = false;
        console.log('Nope, authentication failed', error);
      });
    }
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
router-link {
  cursor: pointer;
}
</style>
