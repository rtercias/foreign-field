<template>
  <div>
    <a :href="url(territory)">
      {{territory.name}} ({{territory.city}})
    </a> on {{territory.status && checkoutDate(territory.status.date)}}
    <div class="last-activity font-weight-normal">Last activity: {{this.lastTimestamp}}</div>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
import format from 'date-fns/format';

export default {
  name: 'MyTerritory',
  props: ['territory'],
  methods: {
    ...mapActions({
      setTerritory: 'territory/setTerritory',
    }),
    checkoutDate(date) {
      return format(new Date(date), 'MM/dd/yyyy');
    },
    url(terr) {
      return `/territories/${terr.group_code}/${terr.id}`;
    },
  },
  computed: {
    ...mapGetters({
      lastActivity: 'territory/lastActivity',
    }),
    lastTimestamp() {
      if (this.lastActivity) {
        const timestamp = Number(this.lastActivity.timestamp);
        if (!Number.isNaN(timestamp)) {
          return format(new Date(timestamp), 'E M/d p');
        }
      }
      return null;
    },
  },
  mounted() {
    this.setTerritory(this.territory);
  },
};
</script>
<style scoped>
  .last-activity {
    font-size: 16px;
  }
</style>
