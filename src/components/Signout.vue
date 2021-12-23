<template>
  <div class="d-flex align-items-center flex-column p-5">
    <h3 class="mb-4">You have been signed out.</h3>
    <div class="mb-4" v-if="isForcedOut">Ask your administrator to create a publisher account for you.</div>
    <b-button @click="$router.push('/')">Home</b-button>
    <!-- <h4>
      <p class="pt-5 text-left">
        Using a google account? <a :href="`https://accounts.google.com/Logout?hl=en&continue=${redirect}`">Sign out here</a>
      </p>
    </h4> -->
  </div>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
    }),
    redirect() {
      return `https://appengine.google.com/_ah/logout?continue=${window.location.protocol}//${window.location.host}`;
    },
  },
};
</script>
