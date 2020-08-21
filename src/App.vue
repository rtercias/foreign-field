<template>
  <div id="app" class="d-flex flex-column h-100">
    <Masthead></Masthead>
    <router-view class="view"></router-view>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Masthead from './components/Masthead';

export default {
  name: 'app',
  components: {
    Masthead,
  },
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
    }),
  },
};

</script>

<style lang="scss">
@import 'assets/foreign-field-theme.scss';
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';

html, body {
  height: 100%;
}

h3 {
  margin: 40px 0 0;
}

router-link {
  cursor: pointer;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $dark;
}
.view {
  height: calc(100% - 1.5em);
}
</style>
