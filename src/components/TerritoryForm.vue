<template>
  <div class="territory-form">
    <div class="territory-header justify-content-around align-items-center lead py-3">
      <span v-if="mode===modes.add" class="lead font-weight-bold w-100">Add New Territory</span>
      <div v-else-if="mode===modes.edit" class="lead font-weight-bold w-100 d-flex justify-content-between px-4">
        <div>Edit Territory: {{territory.name}}</div>
        <div>{{territory.description}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
    <Loading v-if="isLoading"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submitTerritory">
      <b-form-group label="Territory Name" class="mt-3">
        <b-form-input v-model="model.name"></b-form-input>
      </b-form-group>
      <b-form-group label="Description" class="mt-3">
        <b-form-input v-model="model.description"></b-form-input>
      </b-form-group>
      <b-form-group label="Group Code" class="mt-3">
        <b-form-select v-model="model.group_code"
          :options="groupOptions" required>
        </b-form-select>
      </b-form-group>
      <b-form-group label="Type" class="mt-3">
        <b-form-select v-model="model.type"
          :options="typeOptions" required>
        </b-form-select>
      </b-form-group>
      <b-form-group label="Tags" class="mt-3">
        <b-form-input v-model="model.tags"></b-form-input>
      </b-form-group>
      <div class="buttons py-4 justify-content-between">
        <b-button type="button" variant="light" @click="cancel">Cancel</b-button>
        <b-button
          :disabled="!isFormComplete || isSaving"
          class="submit-button"
          type="submit"
          variant="primary">
          <font-awesome-icon v-if="isSaving" icon="circle-notch" spin></font-awesome-icon>
          <span v-else>Submit</span>
        </b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import Loading from './Loading';
import { InvalidTerritoryError } from '../store/exceptions/custom-errors';

const Modes = {
  add: 'add',
  edit: 'edit',
};

const Types = [
  { text: 'Regular', value: 'Regular' },
  { text: 'Survey', value: 'SEARCH' },
  { text: 'Business', value: 'BUSINESS' },
  { text: 'Test', value: 'Test' },
];
// const required = ['congregationId', 'name', 'group_code', 'type'];

export default {
  name: 'TerritoryForm',
  props: ['id'],
  components: {
    Loading,
  },
  data() {
    return {
      modes: Modes,
      isLoading: false,
      isSaving: false,
      isFormComplete: false,
      model: {},
      error: '',
      useGeocodedAddress: true,
      geocodedAddress: {},
      showTerrHelp: true,
    };
  },
  async mounted() {
    window.scrollTo(0, 0);
    // this.setLeftNavRoute(this.returnRoute);
    await this.refresh();
  },
  methods: {
    ...mapActions({
      getTerritoryInfo: 'territory/getTerritoryInfo',
      fetchAllTerritories: 'territories/fetchAllTerritoriss',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      getGroupCodes: 'auth/getGroupCodes',
    }),
    async submitAddress() {
      try {
        this.isSaving = true;
        if (this.mode === Modes.add) {
          await this.addTerritory(this.model);
        } else if (this.mode === Modes.edit) {
          await this.updateTerritory(this.model);
        }
      } catch (err) {
        if (err instanceof InvalidTerritoryError) {
          this.error = err.message;
          window.scrollTo(0, 0);
        } else {
          console.error(err.message);
        }
      }
      this.isSaving = false;
    },

    cancel() {
      this.model = {};
      if (this.leftNavRoute) {
        this.$router.push(this.leftNavRoute);
      } else {
        this.$router.go(-1);
      }
    },

    async refresh() {
      this.isLoading = true;
      if (!this.groups) {
        await this.getGroupCodes(this.congId);
      }

      if (this.mode === Modes.edit) {
        await this.getTerritoryInfo({ id: this.id });
        this.model = this.territory;
      } else {
        this.model = {
          congregationid: this.congId,
          group_code: this.defaultGroup,
          type: 'Regular',
          create_user: this.user && this.user.username,
        };
      }
      this.isLoading = false;
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      congId: 'auth/congId',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      isAdmin: 'auth/isAdmin',
      groupCodes: 'auth/groupCodes',
      territory: 'territory/territory',
      territories: 'territories/territories',
      leftNavRoute: 'auth/mastheadLeftNavRoute',
    }),
    mode() {
      return this.id ? Modes.edit : Modes.add;
    },
    defaultGroup() {
      return get(this.$route, 'query.group') || '';
    },
    typeOptions() {
      return Types;
    },
    groupOptions() {
      return this.groupCodes.map(g => ({ text: g, value: g }));
    },
  },
};
</script>
<style lang="scss" scoped>

</style>
