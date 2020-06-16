<template>
  <div class="reports">
    <div class="lead">Available Reports</div>
    <b-link :to="`/reports/assignment-report/${congId}`" class="pr-4 column">
      S-13 Assignment Record
    </b-link>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Reports',
  computed: {
    ...mapGetters({
      congId: 'auth/congId',
    }),
  },
};
</script>
<style scoped>

</style>
