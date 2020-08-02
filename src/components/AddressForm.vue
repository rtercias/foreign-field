<template>
  <div class="address-form">
    <div class="address-header justify-content-around align-items-center lead pt-3 pb-3">
      <span v-if="mode===modes.add" class="lead font-weight-bold w-100">Add New Address</span>
      <div v-else class="lead font-weight-bold w-100">
        <div>{{address.addr1}} {{address.addr2}}</div>
        <div>{{address.city}} {{address.state_province}} {{address.postal_code}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
    <b-form class="pl-4 pr-4 pb-4 text-left" @submit.prevent="submitAddress">
      <div v-if="step === 1">
        <div v-if="canWrite">
          <div v-if="isAdmin">
            <b-form-group label="Congregation ID" class="mt-3">
              <b-form-input v-model="model.congregationId"></b-form-input>
            </b-form-group>
            <b-form-group label="Territory ID" class="mt-3">
              <b-form-input v-model="model.territory_id"></b-form-input>
            </b-form-group>
            <b-form-group label="Status" class="mt-3">
              <b-form-input v-model="model.status" :readonly="readOnly"></b-form-input>
            </b-form-group>
          </div>
          <b-form-group label="Address 1" class="mt-3">
            <b-form-input v-model="model.addr1" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="Address 2" class="mt-3">
            <b-form-input v-model="model.addr2" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="Zip" class="mt-3">
            <b-form-input v-model="model.postal_code" :readonly="readOnly" @change="getCityState"></b-form-input>
          </b-form-group>
          <b-form-group label="City" class="mt-3">
            <b-form-input v-model="model.city" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="State" class="mt-3">
            <b-form-input v-model="model.state_province" :readonly="readOnly"></b-form-input>
          </b-form-group>
        </div>
        <b-form-group label="Phone" class="mt-3 position-relative">
          <the-mask
            class="form-control"
            type="tel"
            :mask="'###-###-####'"
            :masked="false"
            v-model="model.phone"
            :disabled="readOnly">
          </the-mask>
        </b-form-group>
        <div v-if="isAdmin">
          <b-form-group label="Notes" class="mt-3">
            <b-form-input v-model="model.notes"></b-form-input>
          </b-form-group>
          <b-form-group label="Sort" class="mt-3">
            <b-form-input v-model="model.sort"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <AddressMap v-else-if="step === 2"></AddressMap>
      <div class="buttons justify-content-between pt-4">
        <b-button v-if="step == 1" type="button" variant="light" :to="returnRoute">Cancel</b-button>
        <b-button v-else type="button" variant="light" @click="prev">Previous</b-button>
        <b-button v-if="!step < 3" type="button" variant="light" @click="next">Next</b-button>
        <b-button v-if="isFormComplete" class="submit-button" type="submit" variant="primary" :disabled="isSaving">
          <font-awesome-icon v-if="isSaving" icon="circle-notch" spin></font-awesome-icon>
          <span v-else>Submit</span>
        </b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { TheMask } from 'vue-the-mask';
import Loading from './Loading';
import AddressMap from './AddressMap';
import { InvalidAddressError } from '../store/exceptions/custom-errors';

const Modes = {
  add: 'add',
  edit: 'edit',
};

const required = ['congregationId', 'territory_id', 'addr1', 'city', 'state_province'];

export default {
  name: 'AddressForm',
  props: ['group', 'territoryId', 'addressId', 'mode', 'phone'],
  components: {
    Loading,
    TheMask,
    AddressMap,
  },
  data() {
    return {
      modes: Modes,
      step: 1,
      isSaving: false,
      readOnly: false,
      model: {
        id: 0,
        congregationId: this.congId,
        status: 'Active',
      },
      error: '',
      returnRoute: this.mode === Modes.add
        ? `/territories/${this.group}/${this.territoryId}`
        : `/territories/${this.group}/${this.territoryId}/addresses/${this.addressId}/detail`,
    };
  },
  async mounted() {
    this.setLeftNavRoute(this.returnRoute);
    await this.refresh();
  },
  methods: {
    ...mapActions({
      addAddress: 'address/addAddress',
      updateAddress: 'address/updateAddress',
      fetchAddress: 'address/fetchAddress',
      cityStateLookupByZip: 'address/cityStateLookupByZip',
      geoCodeAddress: 'address/geoCodeAddress',
      getTerritory: 'territory/getTerritory',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      setAddress: 'address/setAddress',
    }),
    async submitAddress() {
      try {
        await this.geocode();
        this.isSaving = true;

        if (this.mode === Modes.add) {
          await this.addAddress(this.model);
          await this.getTerritory(this.territoryId);
        } else if (this.mode === Modes.edit) {
          await this.updateAddress(this.model);
        }
        this.$router.push(this.returnRoute);
      } catch (err) {
        if (err instanceof InvalidAddressError) {
          this.error = err.message;
          window.scrollTo(0, 0);
        } else {
          console.error(err.message);
        }
      }
      this.isSaving = false;
    },

    async refresh() {
      if (this.mode === Modes.edit) {
        await this.fetchAddress(this.addressId);
        this.model = this.address;
        if (!this.model.sort) {
          this.model.sort = 0;
        }
        delete this.model.activityLogs;
      } else {
        await this.getTerritory(this.territoryId);
        await this.setAddress({});
        this.model.congregationId = this.congId;
        this.model.sort = this.maxSort + 1;
      }
    },
    async getCityState() {
      let response = true;

      if (this.model.city || this.model.state_province) {
        response = await this.$bvModal.msgBoxConfirm('Replace existing city and state/province?', {
          title: `${this.model.addr1} ${this.model.addr2}`,
          centered: true,
        });
      }

      if (response) {
        await this.cityStateLookupByZip({ zip: this.model.postal_code });
        this.$set(this.model, 'city', this.address.city);
        this.$set(this.model, 'state_province', this.address.state_province);
      }
    },

    async geocode() {
      const { addr1, addr2, city, state_province: state, postal_code: zip } = this.model;
      const fullAddress = `${addr1} ${addr2} ${city} ${state} ${zip}`;
      await this.geoCodeAddress({ fullAddress });

      this.$set(this.model, 'longitude', this.address.longitude);
      this.$set(this.model, 'latitude', this.address.latitude);
    },

    next() {
      if (this.step < 3) {
        this.step = this.step + 1;
      }
    },

    prev() {
      if (this.step > 0) {
        this.step = this.step - 1;
      }
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      congId: 'auth/congId',
      canWrite: 'auth/canWrite',
      isAdmin: 'auth/isAdmin',
      address: 'address/address',
      territory: 'territory/territory',
      maxSort: 'territory/maxSort',
    }),

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
      const unauthAddressCongId = this.mode === Modes.edit && this.congId !== this.address.congregationId;
      const unauthTerritoryCongId = this.mode === Modes.add && this.congId !== this.territory.congregationid;

      if (unauthAddressCongId || unauthTerritoryCongId) {
        this.$router.push('/unauthorized');
      }
    },
    congId() {
      this.model.congregationId = this.congId;
    },
  },
};
</script>
<style>
  .buttons {
    display: flex;
  }
  .submit-button {
    min-width: 76px;
  }
</style>
