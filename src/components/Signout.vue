<template>
  <div class="d-flex align-items-center flex-column p-5">
    <h3>You have been signed out of Foreign Field.</h3><h4 v-if="isForcedOut">You are not authorized to use this app.</h4>
    <b-button @click="$router.push('/')">Home</b-button>
    <h4>
      <p class="p-5 text-left">
        Using a google account? <a href="https://accounts.google.com/Logout?hl=en">Sign out here</a>
      </p>
    </h4>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
    })
  },
}
</script>
