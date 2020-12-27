<template>
  <div class="group-form">
    <div class="group-header justify-content-around align-items-center lead py-3">
      <span v-if="isAdmin && mode===modes.add" class="lead font-weight-bold w-100">Add New Group</span>
      <div v-else-if="mode===modes.edit" class="lead w-100 d-flex justify-content-between px-4">
        <div class="font-weight-bold">Edit Group</div>
        <div>{{model.description}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">{{error}}</div>
    <Loading v-if="isLoading"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submit">
      <b-form-group label="Group Code" class="mt-3">
        <b-form-input v-model="model.code"></b-form-input>
      </b-form-group>
      <b-form-group label="Description" class="mt-3">
        <b-form-input v-model="model.description"></b-form-input>
      </b-form-group>
      <b-form-group label="Overseer" class="mt-3">
        <b-form-select :options="overseerOptions" v-model="model.overseer"></b-form-select>
      </b-form-group>
      <hr />
      <div class="buttons justify-content-between">
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
import Loading from './Loading';
import { InvalidGroupError } from '../store/exceptions/custom-errors';
import { Modes } from '../utils/modes';
import { OVERSEER_OPTIONS } from '../store/modules/models/GroupModel';

const required = ['code', 'description'];

export default {
  name: 'GroupForm',
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
    await this.refresh();
  },
  methods: {
    ...mapActions({
      getGroup: 'group/getGroup',
      addGroup: 'group/addGroup',
      updateGroup: 'group/updateGroup',
      deleteGroup: 'group/deleteGroup',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      fetchPublishers: 'publishers/fetchPublishers',
    }),
    async submit() {
      try {
        const message = 'Are you sure you want to save your changes?';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: this.group.description,
          centered: true,
        });
        if (confirm) {
          this.isSaving = true;
          if (this.mode === Modes.add) {
            this.model.congregation_id = this.congregation.id;
            await this.addGroup(this.model);
          } else if (this.mode === Modes.edit) {
            await this.updateGroup(this.model);
          }
          this.$bvToast.toast('Group saved.', {
            title: this.group.description,
            solid: true,
          });
          this.cancel();
        }
      } catch (err) {
        if (err instanceof InvalidGroupError) {
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

    async remove() {
      try {
        const message = 'Are you sure you want to delete this group?';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: this.group.description,
          centered: true,
        });
        if (confirm) {
          await this.deleteGroup(this.group.id);
          this.cancel();
        }
      } catch (err) {
        this.error = err.message;
        window.scrollTo(0, 0);
      }
    },

    async refresh() {
      this.isLoading = true;
      if (this.mode === Modes.edit) {
        await this.getGroup({ id: this.id });
        this.model = this.group;
      }
      this.setLeftNavRoute(`/congregation/${this.congregation.id}`);
      await this.fetchPublishers(this.congregation.id);
      this.isLoading = false;
    },

  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      isAdmin: 'auth/isAdmin',
      group: 'group/group',
      congregation: 'congregation/congregation',
      publishers: 'publishers/publishers',
    }),
    mode() {
      return this.id ? Modes.edit : Modes.add;
    },
    isFormComplete() {
      for (const field of required) {
        if (!this.model[field]) return false;
      }
      return true;
    },
    overseerOptions() {
      const overseers = this.publishers.filter(p => OVERSEER_OPTIONS.includes(p.role))
        .map(p => ({ value: p.id, text: `${p.firstname} ${p.lastname}` }));

      return [
        { value: 0, text: 'Unassigned' },
        ...overseers,
      ];
    },
  },
  watch: {
    async user() {
      await this.refresh();
    },
  },
};
</script>
<style lang="scss" scoped>
</style>
