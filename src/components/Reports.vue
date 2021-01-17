<template>
  <div class="reports">
    <div class="small">Available Reports:</div>
    <b-list-group>
      <b-list-group-item class="px-2">
        <b-link :to="`/reports/assignment-report/${congId}`" class="pr-4 column">
          S-13 Assignment Record
        </b-link>
      </b-list-group-item>
      <b-list-group-item class="px-2">
        <b-link :to="`/reports/dnc/${congId}`" class="pr-4 column">
          Do Not Call Report
        </b-link>
      </b-list-group-item>
    </b-list-group>
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
