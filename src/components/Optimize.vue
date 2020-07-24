<template>
  <div class="optimize">
    <div class="optimize-header w-100 p-2">
      <div v-if="mode===''" class="d-flex justify-content-between">
        <b-button variant="warning" @click="switchToManual">Manual</b-button>
        <b-button variant="success" @click="switchToOptimize">Optimize</b-button>
      </div>
      <div v-else class="d-flex justify-content-between">
        <b-button variant="secondary" @click="cancel">Cancel</b-button>
        <b-button variant="primary" @click="optimize">Finalize</b-button>
      </div>
    </div>
    <b-list-group class="columns">
      <b-list-group-item
        class="col-sm-12 overflow-auto p-0"
        v-for="address in territory.addresses"
        v-bind:key="address.id"
        data-toggle="collapse">
        <OptimizeCard :address="address" :territoryId="id" :group="group" :mode="mode"></OptimizeCard>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
import OptimizeCard from './OptimizeCard';

export default {
  name: 'Optimize',
  props: ['group', 'id'],
  components: {
    OptimizeCard,
  },
  data() {
    return {
      mode: '',
    };
  },
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
  },
  methods: {
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
      getTerritory: 'territory/getTerritory',
    }),
    switchToManual() {
      this.mode = 'manual';
    },
    switchToOptimize() {
      this.mode = 'optimize';
    },
    cancel() {
      this.mode = '';
    },
    optimize() {
      // TODO
      this.mode = '';
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      token: 'auth/token',
    }),
  },
  watch: {
    async token() {
      await this.getTerritory(this.id);
    },
    immediate: true,
  },
};
</script>
<style scoped>

</style>
