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
      <b-form-group label="Campaign Mode" class="mt-3">
        <b-form-checkbox :checked="model.campaign" disabled></b-form-checkbox>
      </b-form-group>
      <b-form-group label="Admin Email" class="mt-3">
        <b-form-input v-model="model.admin_email"></b-form-input>
      </b-form-group>
      <hr />
      <!-- <div v-for="domain in domains" :key="domain.key">
        <b-form-group v-for="option in domainOptions(domain)" :key="option.key" class="mt-3">
          <b-form-select
            :options="congOptions(option.key)">
          </b-form-select>
        </b-form-group>
      </div> -->
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
import Loading from './Loading';
import { InvalidCongregationError } from '../store/exceptions/custom-errors';

const Modes = {
  add: 'add',
  edit: 'edit',
};

const CongOptions = [
  { defaultView: ['address-list', 'phone-list'] },
  { defaultSort: ['Description', 'Name'] },
];
// const required = ['name', 'language', 'admin_email'];

export default {
  name: 'CongregationForm',
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
    };
  },
  async mounted() {
    // window.scrollTo(0, 0);
    // this.setLeftNavRoute(this.returnRoute);
    await this.refresh();
  },
  methods: {
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
    async submitCong() {
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
        this.model = this.congregation;
      }
      this.isLoading = false;
    },
    congOptions(key) {
      return CongOptions[key];
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      isAdmin: 'auth/isAdmin',
      congregation: 'auth/congregation',
    }),
    mode() {
      return this.id ? Modes.edit : Modes.add;
    },
    domains() {
      const domains = [];
      if (this.model && this.model.option) {
        for (const [key, value] of Object.entries(this.model.option)) {
          domains.push({ [key]: value });
        }
      }
      return domains;
    },
    domainOptions(domain) {
      const options = [];
      if (domain) {
        for (const [key, value] of Object.entries(domain)) {
          options.push({ [key]: value });
        }
      }
      return options;
    },
  },
};
</script>
<style lang="scss" scoped>

</style>
