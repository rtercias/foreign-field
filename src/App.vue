<template>
  <div id="app" class="d-flex flex-column h-100">
    <vue-pull-refresh :on-refresh="onRefresh" :config="refreshOptions">
      <Masthead></Masthead>
      <router-view class="view"></router-view>
    </vue-pull-refresh>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import VuePullRefresh from 'vue-pull-refresh';
import Masthead from './components/Masthead';

export default {
  name: 'app',
  components: {
    VuePullRefresh,
    Masthead,
  },
  data() {
    return {
      refreshOptions: {
        errorLabel: 'Unable to reload',
        startLabel: 'Starting reload',
        readyLabel: 'Ready',
        loadingLabel: 'Reloading',
      },
    };
  },
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
    }),
  },
  methods: {
    async onRefresh() {
      this.$router.go();
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    },
  },
};

</script>

<style>
html, body {
  height: 100%;
}

h3 {
  margin: 40px 0 0;
}
/* ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
} */
a {
  color: #42b983;
}
router-link {
  cursor: pointer;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #696969;
}
.view {
  height: calc(100% - 1.5em);
}
</style>
