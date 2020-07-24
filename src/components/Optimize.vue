<template>
  <div class="optimize">
    <Loading v-if="saving"></Loading>
    <div v-else>
      <div class="optimize-header w-100 p-2">
        <div v-if="state===''" class="d-flex justify-content-between">
          <b-button variant="outline-primary" @click="switchToManual">Manual</b-button>
          <b-button variant="primary" @click="switchToOptimize">Optimize</b-button>
        </div>
        <div v-else class="d-flex justify-content-between">
          <b-button variant="outline-secondary" @click="cancel">Cancel</b-button>
          <b-button variant="primary" @click="finalize" :disabled="noChanges">Finalize</b-button>
        </div>
      </div>
      <div class="d-flex">
        <b-list-group class="columns pr-0" :class="{ 'col-12': isStart || isManual, 'col-5': isOptimize }">
          <div v-if="isOptimize" class="bg-secondary text-white">Old Position</div>
          <draggable
            :list="territory.addresses"
            class="list-group"
            ghost-class="ghost"
            handle=".grip"
          >
            <b-list-group-item
              class="col-sm-12 overflow-auto p-0"
              v-for="(address, index) in territory.addresses"
              v-bind:key="address.id"
              data-toggle="collapse">
              <OptimizeCard :address="address" mode="manual" :state="state" :pos="index">
              </OptimizeCard>
            </b-list-group-item>
          </draggable>
        </b-list-group>
        <b-list-group class="columns col-7 pr-0" v-if="isOptimize">
          <div class="bg-info text-white">New Position</div>
          <draggable
            :list="optimizedAddresses"
            class="list-group"
            ghost-class="ghost"
            handle=".grip"
          >
            <b-list-group-item
              class="col-sm-12 overflow-auto p-0"
              v-for="(address, index) in optimizedAddresses"
              v-bind:key="address.id"
              data-toggle="collapse">
              <OptimizeCard :address="address" mode="optimize" :pos="index" :state="state"></OptimizeCard>
            </b-list-group-item>
          </draggable>
        </b-list-group>
      </div>
    </div>
  </div>
</template>
<script>
import clone from 'lodash/clone';
import isEqual from 'lodash/isEqual';
import { mapActions, mapGetters } from 'vuex';
import Draggable from 'vuedraggable';
import OptimizeCard from './OptimizeCard';
import Loading from './Loading';

export default {
  name: 'Optimize',
  props: ['group', 'id'],
  components: {
    OptimizeCard,
    Draggable,
    Loading,
  },
  data() {
    return {
      state: '',
      optimizedAddresses: [],
      saving: false,
    };
  },
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    await this.getTerritory(this.id);
    this.optimizedAddresses = clone(this.territory.addresses);
  },
  methods: {
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
      getTerritory: 'territory/getTerritory',
      updateAddress: 'address/updateAddress',
    }),
    switchToManual() {
      this.state = 'manual';
    },
    switchToOptimize() {
      this.state = 'optimize';
    },
    cancel() {
      this.state = '';
    },
    async finalize() {
      const value = await this.$bvModal.msgBoxConfirm('Save the new order?', {
        title: `${this.territory.name}`,
        centered: true,
      });

      if (value) {
        if (this.isOptimize) {
          this.territory.addresses = this.optimizedAddresses;
        }

        this.saving = true;
        for (const address of this.territory.addresses) {
          await this.updateAddress(address);
        }
      }

      this.saving = false;
      this.state = '';
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      token: 'auth/token',
    }),
    isManual() {
      return this.state === 'manual';
    },
    isOptimize() {
      return this.state === 'optimize';
    },
    isStart() {
      return this.state === '';
    },
    noChanges() {
      return isEqual(this.territory.addresses, this.optimizedAddresses);
    },
  },
  watch: {
    async token() {
      await this.getTerritory(this.id);
      this.optimizedAddresses = clone(this.territory.addresses);
    },
    immediate: true,
  },
};
</script>
<style scoped>
  .optimize-header {
    background-color: lightgrey;
  }
</style>
