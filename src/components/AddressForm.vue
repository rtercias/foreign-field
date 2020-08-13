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
    <b-form class="form pl-4 pr-4 pb-4 text-left" @submit.prevent="submitAddress">
      <div v-if="step === 1">
        <div v-if="canWrite">
          <b-form-group>
            <b-form-checkbox v-model="useGeocodedAddress">Use geocoded address</b-form-checkbox>
          </b-form-group>
          <b-form-group label="Address 1" class="mt-3">
            <b-form-input v-model="model.addr1" :readonly="readOnly" @change="geocodeAddress"></b-form-input>
          </b-form-group>
          <b-form-group label="Address 2" class="mt-3">
            <b-form-input v-model="model.addr2" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="City" class="mt-3">
            <b-form-input v-model="model.city" :readonly="readOnly" @change="geocodeAddress"></b-form-input>
          </b-form-group>
          <b-form-group label="State" class="mt-3">
            <b-form-input v-model="model.state_province" :readonly="readOnly" @change="geocodeAddress"></b-form-input>
          </b-form-group>
          <b-form-group label="Zip" class="mt-3">
            <b-form-input v-model="model.postal_code" :readonly="readOnly" @change="geocodeAddress"></b-form-input>
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
        <div v-if="canAdmin" class="mt-5">
          <hr />
          <b-form-group label="Territory" class="mt-3">
            <b-form-select v-model="model.territory_id"
              :options="territoryOptions" required>
            </b-form-select>
          </b-form-group>
        </div>
        <div v-if="isAdmin" class="mt-5">
          <hr />
          <label class="mb-0">ADMIN ONLY</label>
          <b-form-group label="Congregation ID" class="mt-3">
            <b-form-input v-model="model.congregationId"></b-form-input>
          </b-form-group>
          <b-form-group label="Status" class="mt-3">
            <b-form-input v-model="model.status" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="Notes" class="mt-3">
            <b-form-input v-model="model.notes"></b-form-input>
          </b-form-group>
          <b-form-group label="Sort" class="mt-3">
            <b-form-input v-model="model.sort"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div v-else-if="step === 2" class="step-2 h-100">
        <p>
          Check the address location. Drag-and-drop the marker to make adjustments.
        </p>
        <AddressMap :address="model" :zoom="17" :step="step" :key="step"></AddressMap>
      </div>
      <div v-else-if="step === 3" class="step-3 h-100">
        <div v-if="territoriesLoading" class="font-weight-bold m-0 mt-2 mr-2 ml-2 medium">
          Loading territories... <font-awesome-icon icon="circle-notch" spin></font-awesome-icon>
        </div>
        <p v-else>
          Select the territory for this address by clicking on one of the yellow markers.
          <b-form-select v-model="model.territory_id"
            :options="territoryOptions" required>
          </b-form-select>
        </p>
        <AddressMap :address="model" :zoom="14" :step="step" :key="step" @territory-selected="updateTerritory"></AddressMap>
      </div>
      <div class="buttons justify-content-between pt-4 pb-4">
        <b-button v-if="step === 1" type="button" variant="light" :to="returnRoute">Cancel</b-button>
        <b-button v-else type="button" variant="light" @click="prev">Previous</b-button>
        <b-button v-if="step === 1 && isAddressComplete" type="button" variant="light" @click="applyGeocode">
          Locate on Map
        </b-button>
        <b-button v-if="step === 2" type="button" variant="light" @click="selectTerritory">Select Territory</b-button>
        <b-button :disabled="!isFormComplete || isSaving" class="submit-button" type="submit" variant="primary">
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
import { TheMask } from 'vue-the-mask';
import AddressMap from './AddressMap';
import { InvalidAddressError } from '../store/exceptions/custom-errors';

const Modes = {
  add: 'add',
  edit: 'edit',
};

const required = ['congregationId', 'territory_id', 'addr1', 'city', 'state_province'];
const requiredAddress = ['addr1', 'city', 'state_province'];

export default {
  name: 'AddressForm',
  props: ['group', 'territoryId', 'addressId', 'mode', 'phone'],
  components: {
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
      useGeocodedAddress: true,
      geocodedAddress: {},
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
      addressLookup: 'address/addressLookup',
      getTerritory: 'territory/getTerritory',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      setAddress: 'address/setAddress',
      fetchAllTerritories: 'territories/fetchAllTerritories',
    }),
    async submitAddress() {
      try {
        if (!this.model.longitude || !this.model.latitude) {
          await this.geocode();
        }
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
      await this.fetchAllTerritories({ congId: this.congId });
      if (this.mode === Modes.edit) {
        await this.fetchAddress(this.addressId);
        this.model = this.address;
        if (!this.model.sort) {
          this.model.sort = 0;
        }
        delete this.model.activityLogs;
      } else {
        if (this.user) {
          await this.getTerritory(this.territoryId);
        }
        await this.setAddress({});
        this.model.congregationId = this.congId;
        this.model.sort = this.maxSort + 1;
      }
    },
    async geocodeAddress() {
      if (!this.model.addr1) return;
      if (!this.model.city && !this.model.state_province && !this.model.postal_code) return;
      if (this.model.city && !this.model.state_province && !this.model.postal_code) return;
      if (this.model.state_province && !this.model.city && !this.model.postal_code) return;

      const { addr1, addr2, city, state_province: state, postal_code: zip } = this.model;
      const fullAddress = `${addr1 || ''}+${addr2 || ''}+${city || ''}+${state || ''}+${zip || ''}`;

      await this.addressLookup(fullAddress);
      this.geocodedAddress = {
        addr1: startCase(this.address.addr1),
        city: startCase(this.address.city),
        state_province: startCase(this.address.state_province),
        postal_code: startCase(this.address.postal_code),
        longitude: this.address.longitude,
        latitude: this.address.latitude,
      };

      if (this.useGeocodedAddress) {
        this.model.addr1 = this.geocodedAddress.addr1;
        this.model.city = this.geocodedAddress.city;
        this.model.state_province = this.geocodedAddress.state_province;
        this.model.postal_code = this.geocodedAddress.postal_code;
        this.model.longitude = this.geocodedAddress.longitude;
        this.model.latitude = this.geocodedAddress.latitude;
      }
    },

    applyGeocode() {
      this.step = 2;
      this.model.longitude = this.geocodedAddress.longitude;
      this.model.latitude = this.geocodedAddress.latitude;
    },

    selectTerritory() {
      this.step = 3;
    },

    prev() {
      if (this.step > 0) {
        this.step = this.step - 1;
      }
    },

    updateTerritory(territoryId) {
      this.$set(this.model, 'territory_id', territoryId);
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      congId: 'auth/congId',
      canWrite: 'auth/canWrite',
      canAdmin: 'auth/canAdmin',
      isAdmin: 'auth/isAdmin',
      address: 'address/address',
      territory: 'territory/territory',
      maxSort: 'territory/maxSort',
      territories: 'territories/territories',
      territoriesLoading: 'territories/loading',
    }),

    isFormComplete() {
      for (const field of required) {
        if (!this.model[field]) return false;
      }

      return true;
    },

    isAddressComplete() {
      for (const field of requiredAddress) {
        if (!this.model[field]) return false;
      }

      return true;
    },

    territoryOptions() {
      return this.territories.map(t => ({ value: t.id, text: `${t.description} (${t.name})` }));
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
  .address-form .form {
    height: calc(100% - 123px);
  }
  .buttons {
    display: flex;
  }
  .submit-button {
    min-width: 76px;
  }
</style>
