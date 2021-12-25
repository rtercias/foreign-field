<template>
  <div class="group-form">
    <div class="group-header justify-content-around align-items-center lead py-3">
      <span v-if="isAdmin && mode===modes.add" class="lead font-weight-bold w-100">Add New Publisher</span>
      <div v-else-if="mode===modes.edit" class="lead w-100 d-flex justify-content-between px-4">
        <div class="font-weight-bold">{{self ? 'Profile' : 'Edit Publisher'}}</div>
        <div>{{model.displayName}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
    <Loading v-if="isLoading"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submit">
      <b-form-group label="User Name" class="mt-3">
        <b-form-input v-model="model.username" maxlength="50"></b-form-input>
      </b-form-group>
      <b-form-group label="First Name" class="mt-3">
        <b-form-input v-model="model.firstname" maxlength="50"></b-form-input>
      </b-form-group>
      <b-form-group label="Last Name" class="mt-3">
        <b-form-input v-model="model.lastname" maxlength="50"></b-form-input>
      </b-form-group>
      <b-form-group class="mt-3">
        <b-form-checkbox :checked="model.status" v-model="model.status" :disabled="self">
          Active
        </b-form-checkbox>
      </b-form-group>
      <b-form-group label="Role" class="mt-3">
        <b-form-input v-if="self" v-model="model.role" :disabled="self"></b-form-input>
        <b-form-select v-else :options="roleOptions" v-model="model.role"></b-form-select>
      </b-form-group>
      <hr />
      <div class="buttons justify-content-between">
        <b-button type="button" variant="light" @click="cancel">Cancel</b-button>
        <b-button type="button" v-if="mode===modes.edit && isAdmin" variant="danger" @click="remove">
          Delete
        </b-button>
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
import { InvalidPublisherError } from '../store/exceptions/custom-errors';
import { Modes } from '../utils/modes';
import { RoleOptions } from '../store/modules/models/RoleOptions';
import get from 'lodash/get';

const required = ['firstname', 'lastname', 'username', 'role'];

export default {
  name: 'PublisherForm',
  props: ['publisherId'],
  components: {
    Loading,
  },
  data() {
    return {
      modes: Modes,
      isLoading: true,
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
      fetchPublisher: 'publisher/fetchPublisher',
      addPublisher: 'publisher/addPublisher',
      updatePublisher: 'publisher/updatePublisher',
      deletePublisher: 'publisher/deletePublisher',
      resetPublishers: 'publishers/resetPublishers',
      back: 'auth/back',
    }),
    async submit() {
      try {
        const message = this.mode === Modes.add
          ? 'Add new publisher?'
          : 'Are you sure you want to save your changes?';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: this.displayName,
          centered: true,
        });
        if (confirm) {
          this.isSaving = true;
          if (this.mode === Modes.add) {
            this.model.congregationid = get(this.congregation, 'id');
            await this.addPublisher(this.model);
          } else if (this.mode === Modes.edit) {
            await this.updatePublisher(this.model);
          }
          this.resetPublishers();
          this.$bvToast.toast('Publisher saved.', {
            title: this.displayName,
            solid: true,
          });
        }
      } catch (err) {
        if (err instanceof InvalidPublisherError) {
          this.error = err.message;
          window.scrollTo(0, 0);
        } else {
          console.error(err.message);
        }
        this.isSaving = false;
        return;
      }
      this.isSaving = false;
      this.cancel();
    },

    cancel() {
      this.model = {};
      this.$router.go(-1);
    },

    async remove() {
      const message = 'Are you sure you want to delete this publisher?';
      const confirm = await this.$bvModal.msgBoxConfirm(message, {
        title: this.displayName,
        centered: true,
      });
      if (confirm) {
        await this.deletePublisher(this.publisher.id);
        this.resetPublishers();
        this.cancel();
      }
    },

    async refresh() {
      if (!this.canManage && get(this.user, 'id') !== this.publisherId) {
        this.$router.replace({ name: 'unauthorized' });
      } else if (!this.isLoading && !this.self && !this.canWrite) {
        this.$router.replace({ name: 'unauthorized' });
      } else {
        this.isLoading = true;
        if (this.mode === Modes.edit) {
          await this.fetchPublisher({ id: this.publisherId, congId: get(this.congregation, 'id') });
          this.model = this.publisher;
        }
        this.isLoading = false;
      }
    },

  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      isAdmin: 'auth/isAdmin',
      publisher: 'publisher/publisher',
      congregation: 'congregation/congregation',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
    }),
    mode() {
      return this.publisherId ? Modes.edit : Modes.add;
    },
    isFormComplete() {
      for (const field of required) {
        if (!this.model[field]) return false;
      }
      return true;
    },
    displayName() {
      if (this.model.firstname && this.model.lastname) {
        return `${this.model.firstname} ${this.model.lastname}`;
      }
      return this.model.username;
    },
    self() {
      return get(this.model, 'id') === get(this.user, 'id');
    },
    roleOptions() {
      if (this.isAdmin) return RoleOptions;
      return RoleOptions.filter(r => !r.adminOnly);
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
