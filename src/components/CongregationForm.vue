<template>
  <div class="cong-form">
    <div class="cong-header justify-content-around align-items-center lead py-3">
      <span v-if="isAdmin && mode===modes.add" class="lead font-weight-bold w-100">Add New Congregation</span>
      <div v-else-if="mode===modes.edit" class="lead font-weight-bold w-100 d-flex justify-content-between px-4">
        <div>Edit Congregation: {{model.name}}</div>
        <div>{{model.description}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
    <Loading v-if="isLoading"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submitCong">
      <b-form-group label="Congregation Name" class="mt-3">
        <b-form-input v-model="model.name"></b-form-input>
      </b-form-group>
      <b-form-group label="Description" class="mt-3">
        <b-form-input v-model="model.description"></b-form-input>
      </b-form-group>
      <b-form-group label="Language" class="mt-3">
        <b-form-input v-model="model.language"></b-form-input>
      </b-form-group>
      <b-form-group label="Admin Email" class="mt-3">
        <b-form-input v-model="model.admin_email"></b-form-input>
      </b-form-group>
      <b-form-group class="mt-3">
        <b-form-checkbox :checked="model.campaign">Campaign Mode</b-form-checkbox>
      </b-form-group>
      <hr />
      Preferences
      <option-tree
        v-for="node in getNodes()"
        :key="node.key"
        :node="node"
        :depth="0"
        @option-updated="updateOption"
      />
      <hr />
      <div class="buttons justify-content-between">
        <b-button type="button" variant="light" @click="cancel">Cancel</b-button>
        <b-button
          :disabled="!isFormComplete || isSaving"
          class="submit-button"
          type="submit"
          variant="primary"
          @click="submit">
          <font-awesome-icon v-if="isSaving" icon="circle-notch" spin></font-awesome-icon>
          <span v-else>Submit</span>
        </b-button>
      </div>
    </b-form>
  </div>
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

const Modes = {
  add: 'add',
  edit: 'edit',
};

const CongDefault = {
  options: {
    territories: {
      defaultSort: {
        options: [
          'Description',
          'Name',
        ],
      },
    },
    territory: {
      defaultView: {
        options: [
          { value: 'address-list', text: 'Address List' },
          { value: 'phone-list', text: 'Phone List' },
        ],
      },
    },
    level1: {
      level2: {
        level3: {
          options: [
            'test1',
            'test2',
          ],
        },
      },
    },
  },
};
const required = ['name', 'language', 'admin_email'];

export default {
  name: 'CongregationForm',
  props: ['id'],
  components: {
    Loading,
    OptionTree,
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
      getCongregation: 'congregation/getCongregation',
      addCongregation: 'congregation/addCongregation',
      updateCongregation: 'congregation/updateCongregation',
    }),
    async submit() {
      try {
        this.isSaving = true;
        if (this.mode === Modes.add) {
          await this.addCongregation(this.model);
        } else if (this.mode === Modes.edit) {
          await this.updateCongregation(this.model);
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
      if (this.mode === Modes.edit) {
        await this.getCongregation({ id: this.id });
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
      congregation: 'congregation/congregation',
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
