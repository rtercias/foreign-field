<template>
  <div class="optimize">
    <Loading v-if="saving"></Loading>
    <div v-else>
      <div class="optimize-header w-100 p-2">
        <div class="d-flex justify-content-center align-items-center">
          <h5>Territory Optimizer</h5>
          <font-awesome-icon class="help ml-1 text-info" icon="question-circle" @click="showHelp=!showHelp" />
        </div>
        <hr class="mt-0" />
        <div class="text-left" v-if="showHelp">
          <p>
            Use <b>Manual Sort</b><span v-if="canManage"> or <b>Optimize</b></span> to sort addresses.
          </p>
        </div>
        <div class="d-flex justify-content-end">
          <b-button-group v-if="state===''" size="sm">
            <b-button variant="outline-success" @click="switchToManual">Manual Sort</b-button>
            <b-button variant="primary" @click="runOptimizer">Optimize</b-button>
          </b-button-group>
          <b-button-group v-else size="sm">
            <b-button variant="outline-info" @click="reset">Cancel</b-button>
            <b-button variant="primary" @click="finalize" :disabled="!hasChanges">Finalize</b-button>
          </b-button-group>
        </div>
        <div v-if="isManual">
            <hr/>
          <div v-if="hasChanges">
            You have pending changes. Click <b>Finalize</b> to save.
          </div>
          <div v-else>
            Drag and drop address cards...
          </div>
        </div>
        <div v-if="isOptimize">
          <hr/>
          <div v-if="optimizing">
            Optimizing.
          </div>
          <div v-else-if="hasChanges" class="text-primary font-weight-bold">
            🎉 Success! Here's a preview of the optimized addresses.<br/>
            Drag and drop to make further changes or click <b>Finalize</b> to save.
          </div>
          <div v-else-if="isError" class="text-danger font-weight-bold">
            <font-awesome-icon icon="exclamation-triangle" />
            Something went wrong. Optimize service may be down. Try again a bit later.
          </div>
          <div v-else>
            No changes. Click <b>Cancel</b> to abort.
          </div>
        </div>
      </div>
      <Loading v-if="optimizing"></Loading>
      <div class="optimize-body h-50" v-else>
        <div class="optimize-map-buttons text-primary d-flex justify-content-start p-2">
          <b-badge variant="outline" class="toggle-map" @click="showMap = !showMap">
            <div v-if="showMap"><font-awesome-icon icon="eye-slash" class="mr-1" />Hide Map</div>
            <div v-else><font-awesome-icon icon="map" class="mr-1" />Show Map</div>
          </b-badge>
          <b-badge v-if="showMap && isDesktop" variant="outline" @click="fullscreen = !fullscreen">
            <div v-if="fullscreen"><font-awesome-icon icon="compress-alt" class="mr-1" />Half Screen</div>
            <div v-else><font-awesome-icon icon="expand-alt" class="mr-1" />Full Screen</div>
          </b-badge>
        </div>
        <div class="row mx-0">
          <TerritoryMap
            class="optimize-map px-0 col-sm-12"
            :class="{ 'col-md-6': !fullscreen }"
            v-show="showMap"
            :territory="{ addresses: mappedAddresses }"
            :options="{ showSortOrder: true, simple: true }">
          </TerritoryMap>
          <div class="d-flex px-0 col-sm-12" :class="{ 'col-md-6': showMap, 'col-md-12': fullscreen }">
            <b-list-group class="columns pr-0" :class="{ 'col-12': isStart || isManual, 'col-6': isOptimize }">
              <div v-if="isOptimize" class="bg-info text-white">Old Position</div>
              <draggable
                :list="manualAddresses"
                class="list-group"
                ghost-class="ghost"
                handle=".grip"
                @update="onDragUpdate"
              >
                <b-list-group-item
                  class="p-0"
                  v-for="(address, index) in manualAddresses"
                  v-bind:key="address.id"
                  data-toggle="collapse">
                  <OptimizeCard :address="address" mode="manual" :state="state" :pos="index + 1">
                  </OptimizeCard>
                </b-list-group-item>
              </draggable>
            </b-list-group>
            <b-list-group class="columns col-6 pr-0" v-if="isOptimize">
              <div class="bg-info text-white">New Position</div>
              <draggable
                :list="optimizedAddresses"
                class="list-group"
                ghost-class="ghost"
                handle=".grip"
                @update="onDragUpdate"
              >
                <b-list-group-item
                  class="p-0"
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
      <div class="d-flex justify-content-end py-3 px-2">
        <b-button-group v-if="state===''" size="sm">
          <b-button variant="outline-success" @click="switchToManual">Manual Sort</b-button>
          <b-button variant="primary" @click="runOptimizer">Optimize</b-button>
        </b-button-group>
        <b-button-group v-else size="sm">
          <b-button variant="outline-info" @click="reset">Cancel</b-button>
          <b-button variant="primary" @click="finalize" :disabled="!hasChanges">Finalize</b-button>
        </b-button-group>
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
  props: ['groupId', 'territoryId', 'territory'],
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
      fullscreen: false,
      isError: false,
    };
  },
  async mounted() {
    if (this.territory && this.territory.id !== this.territoryId) {
      await this.getTerritory({ id: this.id });
    }
    this.reset();
  },
  methods: {
    ...mapActions({
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
      try {
        this.state = 'optimize';
        this.optimizing = true;
        await this.optimize(this.territoryId);
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
      } catch (e) {
        this.isError = true;
        this.optimizing = false;
        this.hasChanges = false;
      }
    },
    reset() {
      this.state = '';
      this.optimizing = false;
      this.hasChanges = false;
      this.saving = false;
      this.manualAddresses = this.territory && cloneDeep(this.territory.addresses);
      this.optimizedAddresses = this.territory && cloneDeep(this.territory.addresses);
      this.mappedAddresses = this.territory && this.territory.addresses;
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
        const addressIds = this.territory && this.territory.addresses.map(a => a.id);
        if (addressIds) {
          await this.updateSort({ addressIds, userid: this.user.id });
        }
        await this.getTerritory({ id: this.id });
        this.reset();
      }
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      token: 'auth/token',
      canManage: 'auth/canManage',
      optimized: 'addresses/optimized',
      isDesktop: 'auth/isDesktop',
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
};
</script>
<style lang="scss" scoped>
  .help {
    margin-top: -10px;
  }
  .optimize-map {
    height: 300px;
  }
  .optimize-map-buttons {
    font-size: 20px;
    .badge {
      cursor: pointer;
    }
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
