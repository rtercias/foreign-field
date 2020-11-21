<template>
  <div class="optimize">
    <Loading v-if="saving"></Loading>
    <div v-else>
      <div class="optimize-header w-100 p-2">
        <div class="d-flex justify-content-center align-items-center">
          <h5>Territory Optimizer</h5>
          <font-awesome-icon class="help ml-1 text-info" icon="question-circle" @click="showHelp=!showHelp">
          </font-awesome-icon>
        </div>
        <hr class="mt-0" />
        <div class="text-left" v-if="showHelp">
          <p>
            Use <b>Manual Sort</b><span v-if="canManage"> or <b>Optimize</b></span> to sort addresses.
          </p>
        </div>
        <b-button-group v-if="state===''" size="sm" class="w-100">
          <b-button variant="outline-success" @click="switchToManual">Manual Sort</b-button>
          <b-button variant="primary" @click="runOptimizer">Optimize</b-button>
        </b-button-group>
        <b-button-group v-else size="sm" class="w-100">
          <b-button variant="outline-secondary" @click="reset">Cancel</b-button>
          <b-button variant="primary" @click="finalize" :disabled="!hasChanges">Finalize</b-button>
        </b-button-group>
        <div v-if="isManual">
          <div v-if="hasChanges">
            <hr/>
            <p>You have pending changes. Click <b>Finalize</b> to save.</p>
          </div>
          <div v-else>
            <hr/>
            <p>Drag and drop address cards...</p>
          </div>
        </div>
        <div v-if="isOptimize">
          <div v-if="hasChanges">
            <hr/>
            <p class="text-left">
              This is a preview of the optimized addresses.<br/>
              Drag and drop to make further changes or click <b>Finalize</b> to save.
            </p>
          </div>
          <div v-else>
            <hr/>
            <p>Optimizing</p>
          </div>
        </div>
      </div>
      <Loading v-if="optimizing"></Loading>
      <div class="optimize-body h-50" v-else>
        <div class="d-flex justify-content-end pt-2 pr-2 small">
          <span class="toggle-map" @click="toggleMap">
            <span v-if="showMap">hide</span><span v-else>show</span> map
            <font-awesome-icon :icon="mapToggleIcon"></font-awesome-icon>
          </span>
        </div>
        <TerritoryMap
          class="optimize-map p-0"
          v-show="showMap"
          :addresses="mappedAddresses"
          :options="{ showSortOrder: true, simple: true }">
        </TerritoryMap>
        <div class="d-flex p-0">
          <b-list-group class="columns pr-0" :class="{ 'col-12': isStart || isManual, 'col-5': isOptimize }">
            <div v-if="isOptimize" class="bg-secondary text-white">Old Position</div>
            <draggable
              :list="manualAddresses"
              class="list-group"
              ghost-class="ghost"
              handle=".grip"
              @update="onDragUpdate"
            >
              <b-list-group-item
                class="col-sm-12 overflow-auto p-0"
                v-for="(address, index) in manualAddresses"
                v-bind:key="address.id"
                data-toggle="collapse">
                <OptimizeCard :address="address" mode="manual" :state="state" :pos="index + 1">
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
              @update="onDragUpdate"
            >
              <b-list-group-item
                class="col-sm-12 overflow-auto p-0"
                v-for="(address, index) in optimizedAddresses"
                v-bind:key="address.id"
                data-toggle="collapse">
                <OptimizeCard :address="address" mode="optimize" :state="state" :pos="index + 1"></OptimizeCard>
              </b-list-group-item>
            </draggable>
          </b-list-group>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import cloneDeep from 'lodash/cloneDeep';
import orderBy from 'lodash/orderBy';
import { mapActions, mapGetters } from 'vuex';
import Draggable from 'vuedraggable';
import OptimizeCard from './OptimizeCard';
import Loading from './Loading';
import TerritoryMap from './TerritoryMap';

export default {
  name: 'Optimize',
  props: ['group', 'id'],
  components: {
    OptimizeCard,
    Draggable,
    Loading,
    TerritoryMap,
  },
  data() {
    return {
      state: '',
      manualAddresses: [],
      optimizedAddresses: [],
      saving: false,
      optimizing: false,
      hasChanges: false,
      showHelp: false,
      mappedAddresses: [],
      showMap: true,
      mapToggleIcon: 'chevron-up',
    };
  },
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    await this.getTerritory({ id: this.id });
    this.reset();
  },
  methods: {
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
      getTerritory: 'territory/getTerritory',
      updateSort: 'addresses/updateSort',
      optimize: 'addresses/optimize',
    }),
    switchToManual() {
      this.state = 'manual';
      this.mappedAddresses = this.manualAddresses;
    },
    onDragUpdate() {
      this.hasChanges = true;
    },
    async runOptimizer() {
      this.state = 'optimize';
      this.optimizing = true;
      await this.optimize(this.id);
      if (this.optimized && this.optimized.length) {
        const optimized = this.optimizedAddresses.map((address) => {
          const opt = this.optimized.find(o => o.id === address.id) || {};
          return {
            ...address,
            sort: opt.sort,
          };
        });

        this.optimizedAddresses = orderBy(optimized, 'sort');
        this.mappedAddresses = this.optimizedAddresses;
        this.hasChanges = true;
      }
      this.optimizing = false;
    },
    reset() {
      this.state = '';
      this.optimizing = false;
      this.hasChanges = false;
      this.saving = false;
      this.manualAddresses = cloneDeep(this.territory.addresses);
      this.optimizedAddresses = cloneDeep(this.territory.addresses);
      this.mappedAddresses = this.territory.addresses;
    },
    async finalize() {
      const value = await this.$bvModal.msgBoxConfirm('Save the new sort order?', {
        title: `${this.territory.name}`,
        centered: true,
      });

      if (value) {
        if (this.isOptimize) {
          this.territory.addresses = this.optimizedAddresses;
        } else if (this.isManual) {
          this.territory.addresses = this.manualAddresses;
        }

        this.saving = true;
        const addressIds = this.territory.addresses.map(a => a.id);
        await this.updateSort({ addressIds, userid: this.user.id });
        await this.getTerritory({ id: this.id });
        this.reset();
      }
    },
    toggleMap() {
      this.showMap = !this.showMap;
      this.mapToggleIcon = this.mapToggleIcon === 'chevron-up' ? 'chevron-down' : 'chevron-up';
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      user: 'auth/user',
      token: 'auth/token',
      canManage: 'auth/canManage',
      optimized: 'addresses/optimized',
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
  },
  watch: {
    async token() {
      await this.getTerritory({ id: this.id });
      this.reset();
    },
    immediate: true,
  },
};
</script>
<style scoped>
  .help {
    margin-top: -10px;
  }
  .optimize-map {
    height: 300px;
  }
  .toggle-map {
    cursor: pointer;
  }
  @media (min-width: 769px) {
  .optimize-map {
    height: calc(100vh - 450px);
  }
}
</style>
