<template>
  <b-container>
    <b-row>
      <b-col md="12" :lg="mode === modes.edit ? 7 : 12" class="cong-form">
        <div class="cong-header justify-content-around align-items-center lead py-4">
          <span v-if="isAdmin && mode===modes.add" class="lead font-weight-bold w-100">Add New Congregation</span>
          <div v-else-if="mode===modes.edit" class="lead w-100 d-flex justify-content-between px-4">
            <div class="font-weight-bold" v-if="!readOnly">Edit Congregation</div>
            <div class="font-weight-bold" v-else>Congregation</div>
            <div v-if="readOnly && canManage" class="d-flex justify-content-end">
              <b-button type="button" variant="success" @click="edit">Edit</b-button>
            </div>
          </div>
        </div>
        <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
        <Loading v-if="isLoading"></Loading>
        <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submit">
          <b-form-group label="Congregation Name" class="mt-3" :disabled="readOnly">
            <b-form-input v-model="model.name" maxlength="50"></b-form-input>
          </b-form-group>
          <b-form-group label="Description" class="mt-3" :disabled="readOnly">
            <b-form-input v-model="model.description" maxlength="255"></b-form-input>
          </b-form-group>
          <b-form-group label="Circuit" class="mt-3" :disabled="readOnly">
            <b-form-input v-model="model.circuit" maxlength="45"></b-form-input>
          </b-form-group>
          <b-form-group label="Language" class="mt-3" :disabled="readOnly">
            <b-form-input v-model="model.language" maxlength="45"></b-form-input>
          </b-form-group>
          <b-form-group label="Admin Email" class="mt-3" :disabled="readOnly">
            <b-form-input v-model="model.admin_email" maxlength="255"></b-form-input>
          </b-form-group>
          <b-form-group class="mt-3" :disabled="readOnly">
            <label>Campaign Mode:</label>
            <span class="ml-2">{{model.campaign ? 'Yes' : 'No'}}</span>
          </b-form-group>
          <hr />
          <span class="d-block pb-2">Options</span>
          <option-tree
            v-for="node in getNodes()"
            :key="node.key"
            :node="node"
            :depth="0"
            :disabled="readOnly"
            @option-updated="updateOption"
          />
          <div v-if="!readOnly" class="buttons justify-content-between pt-5">
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
          <hr />
        </b-form>
      </b-col>
      <b-col v-if="mode === modes.edit" md="12" lg="5" class="border-left">
        <group-list :congregation-id="congregationId" class="border-bottom pb-5 p-4"></group-list>
        <publisher-list :congregation-id="congregationId" class="p-4"></publisher-list>
      </b-col>
    </b-row>
  </b-container>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import startCase from 'lodash/startCase';
import get from 'lodash/get';
import set from 'lodash/set';
import has from 'lodash/has';
import Loading from './Loading';
import OptionTree from './OptionTree';
import { InvalidCongregationError } from '../store/exceptions/custom-errors';
import { CongDefault } from '../store/modules/models/CongDefaultOptions';
import PublisherList from './PublisherList';
import GroupList from './GroupList';
import { Modes } from '../utils/modes';

const required = ['name', 'language', 'admin_email'];

export default {
  name: 'CongregationForm',
  props: ['congregationId'],
  components: {
    Loading,
    OptionTree,
    PublisherList,
    GroupList,
  },
  data() {
    return {
      modes: Modes,
      isLoading: false,
      isSaving: false,
      model: {},
      error: '',
      readOnly: true,
    };
  },
  async mounted() {
    this.readOnly = this.mode === Modes.edit;
    await this.refresh();
  },
  methods: {
    ...mapActions({
      getCongregation: 'congregation/getCongregation',
      addCongregation: 'congregation/addCongregation',
      updateCongregation: 'congregation/updateCongregation',
      back: 'auth/back',
    }),
    edit() {
      this.readOnly = false;
    },
    async submit() {
      try {
        const message = 'Are you sure you want to save your changes?';
        const confirm = await this.$bvModal.msgBoxConfirm(message, {
          title: this.congregation.name,
          centered: true,
        });
        if (confirm) {
          this.isSaving = true;
          if (this.mode === Modes.add) {
            await this.addCongregation(this.model);
          } else if (this.mode === Modes.edit) {
            await this.updateCongregation(this.model);
          }
          this.$bvToast.toast('Congregation saved.', {
            title: this.congregation.name,
            solid: true,
          });
        }
      } catch (err) {
        if (err instanceof InvalidCongregationError) {
          this.error = err.message;
          window.scrollTo(0, 0);
        } else {
          console.error(err.message);
        }
      }
      this.isSaving = false;
      this.readOnly = true;
    },

    async cancel() {
      await this.refresh();
      this.readOnly = true;
    },

    async refresh() {
      this.isLoading = true;
      if (this.mode === Modes.edit) {
        await this.getCongregation({ id: this.congregationId });
        this.model = this.congregation;
      }
      this.isLoading = false;
    },
    getNodes(_path) {
      const path = _path || 'options';
      const nodes = [];
      const node = get(CongDefault, path);
      if (typeof node === 'object') {
        for (const [key] of Object.entries(node)) {
          if (key === 'options') return undefined;
          const fullPath = `${path}.${key}`;
          nodes.push({
            key: fullPath,
            nodes: this.getNodes(fullPath),
            value: get(this.model, fullPath),
            label: startCase(key),
            options: this.congOptions(fullPath),
          });
        }
        return nodes;
      }
      return undefined;
    },
    proper(text) {
      return startCase(text);
    },
    congOptions(key) {
      const node = get(CongDefault, key) || {};
      if (Array.isArray(node.options)) {
        return node.options;
      }
      return null;
    },
    updateOption({ key, value }) {
      if (has(this.model, key)) {
        set(this.model, key, value);
      } else {
        set(this.model, key.split('.'), value);
      }
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      isAdmin: 'auth/isAdmin',
      canManage: 'auth/canManage',
      congregation: 'congregation/congregation',
    }),
    canEditCongregation() {
      return this.isAdmin || this.user.congregation.id === this.congregationId;
    },
    mode() {
      return this.congregationId ? Modes.edit : Modes.add;
    },
    isFormComplete() {
      for (const field of required) {
        if (!this.model[field]) return false;
      }
      return true;
    },
  },
  watch: {
    async user() {
      await this.refresh();
      if (this.mode === Modes.edit && this.user && this.user.congregation.id !== this.congregationId) {
        this.$router.replace('/unauthorized');
      } else {
        this.isLoading = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
</style>
