<template>
  <div>
    <div class="lead p-2 pt-5">
      {{ $route.query.error || 'Oops... something unexpected happened.' }}<br/>
      Click <b-button variant="link" @click="restart" class="p-0">HERE</b-button> to restart.</div>
    <div v-if="$route.query.expired">Your session token may have expired.</div>
  </div>
</template>
<script>
export default {
  name: 'Error',
  methods: {
    restart() {
      this.$router.replace({ name: 'home' });
      document.location.reload(false);
    },
  },
};
</script>
