<template>
  <div class="territory-form">
    <div class="territory-header justify-content-around align-items-center lead py-3">
      <span v-if="mode===modes.add" class="lead font-weight-bold w-100">Add New Territory</span>
      <div v-else-if="mode===modes.edit" class="lead font-weight-bold w-100 d-flex justify-content-between px-4">
        <div>Edit Territory: {{territory.name}}</div>
        <div>{{territory.description}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">{{error}}</div>
    <Loading v-if="isLoading"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submit">
      <b-form-group
        label="Territory Name"
        class="mt-3"
        description="Hint: Territory names are usually enumerated, like 'NYC-001'">
        <b-form-input v-model="model.name"></b-form-input>
      </b-form-group>
      <b-form-group
        label="Description"
        class="mt-3"
        description="Hint: Use an easily recognizable description, like 'Manhattan'">
        <b-form-input v-model="model.description"></b-form-input>
      </b-form-group>
      <b-form-group label="Group" class="mt-3">
        <b-form-select v-model="model.group_id"
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
        <b-button type="button" v-if="mode===modes.edit" variant="danger" @click="remove">Delete</b-button>
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
import { Modes } from '../utils/modes';

const Types = [
  { text: 'Regular', value: 'Regular' },
  { text: 'Survey', value: 'SEARCH' },
  { text: 'Business', value: 'BUSINESS' },
  { text: 'Test', value: 'Test' },
];
const required = ['congregationid', 'group_id', 'name', 'description', 'type'];

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
      model: {},
      error: '',
    };
  },
  async mounted() {
    window.scrollTo(0, 0);
    await this.refresh();
  },
  methods: {
    ...mapActions({
      getTerritoryInfo: 'territory/getTerritoryInfo',
      addTerritory: 'territory/addTerritory',
      updateTerritory: 'territory/updateTerritory',
      deleteTerritory: 'territory/deleteTerritory',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      getGroups: 'group/getGroups',
    }),
    async submit() {
      try {
        const message = 'Are you sure you want to save your changes?';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: this.territory.name,
          centered: true,
        });
        if (confirm) {
          this.isSaving = true;
          if (this.mode === Modes.add) {
            await this.addTerritory(this.model);
          } else if (this.mode === Modes.edit) {
            await this.updateTerritory(this.model);
          }
          this.$bvToast.toast('Territory saved.', {
            title: this.territory.name,
            solid: true,
          });
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
      this.cancel();
    },

    cancel() {
      this.model = {};
      if (this.leftNavRoute) {
        this.$router.push(this.leftNavRoute);
      } else {
        this.$router.go(-1);
      }
    },

    async remove() {
      try {
        const message = 'Are you sure you want to delete this territory?';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: this.territory.name,
          centered: true,
        });
        if (confirm) {
          await this.deleteTerritory(this.territory.id);
          this.cancel();
        }
      } catch (err) {
        this.error = err.message;
        window.scrollTo(0, 0);
      }
    },

    async refresh() {
      this.isLoading = true;
      if (!this.groups) {
        await this.getGroups({ congId: this.congId });
      }

      if (this.mode === Modes.edit) {
        await this.getTerritoryInfo({ id: this.id });
        this.model = this.territory;
      } else {
        this.model = {
          congregationid: this.congId,
          group_id: this.defaultGroup,
          type: 'Regular',
          create_user: this.user && this.user.username,
        };
      }
      this.setLeftNavRoute(`/groups/${this.defaultGroup}`);
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
      groups: 'group/groups',
      territory: 'territory/territory',
      leftNavRoute: 'auth/mastheadLeftNavRoute',
    }),
    mode() {
      return this.id ? Modes.edit : Modes.add;
    },
    defaultGroup() {
      return get(this.$route, 'query.group') || this.territory.group_id;
    },
    typeOptions() {
      return Types;
    },
    groupOptions() {
      return this.groups.map(g => ({ text: g.code, value: g.id }));
    },
    isFormComplete() {
      for (const field of required) {
        if (!this.model[field]) return false;
      }
      return true;
    },
  },
};
</script>
<style lang="scss" scoped>

</style>
