<template>
  <div class="d-flex align-items-center flex-column p-5">
    <h3>You have been signed out. <span v-if="isForcedOut">You are not authorized to use this app.</span></h3>
    <b-button @click="$router.push('/')">Home</b-button>
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
