<template>
  <div class="address-form">
    <div class="address-header justify-content-around align-items-center lead py-3">
      <span v-if="mode===modes.add" class="lead font-weight-bold w-100">Add New Address</span>
      <div v-else-if="mode===modes.edit" class="lead font-weight-bold w-100">
        <div>{{address.addr1}} {{address.addr2}}</div>
        <div>{{address.city}} {{address.state_province}} {{address.postal_code}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
    <Loading v-if="isLoading || isSearching"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submitAddress">
      <div v-if="step === 1">
        <div v-if="canWrite && mode !== modes.phoneAdd && mode !== modes.phoneEdit">
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
        <div v-if="canManage" class="mt-5">
          <div class="text-left" v-if="showTerrHelp">
            <hr/>
            <p>
              <font-awesome-icon class="help ml-1 text-info" icon="info-circle" @click="showTerrHelp=!showTerrHelp">
              </font-awesome-icon>
              Select a territory for this address from the dropdown,
              or click on <b>Locate on Map</b> to find the nearest territories.
            </p>
          </div>
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
            <b-form-select v-model="model.status"
              :options="statusOptions" required>
            </b-form-select>
          </b-form-group>
          <b-form-group label="Notes" class="mt-3">
            <b-form-input v-model="model.notes"></b-form-input>
          </b-form-group>
          <b-form-group label="Sort" class="mt-3">
            <b-form-input v-model="model.sort"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div v-else-if="step === 1.5">
        <p>Similar addresses found. Please make sure the address you entered is unique.</p>
        <b-list-group>
          <b-list-group-item v-for="(search, index) in searchedAddresses" :key="index">
            {{search.addr1}} {{search.addr2}} {{search.city}} {{search.state_province}} {{search.postal_code}}
            <b-link :to="`/territories/${search.territory.group_code}/${search.territory.id}`">
              Edit
            </b-link>
          </b-list-group-item>
        </b-list-group>
      </div>
      <div v-else-if="step === 2" class="step-2">
        <p>
          First, let's check the address location. Drag and drop the marker to make adjustments.
          Click on <b>Select Territory</b> when finished.
        </p>
        <AddressMap :address="model" :zoom="17" :step="step" :key="step"></AddressMap>
      </div>
      <div v-else-if="step === 3" class="step-3">
        <div v-if="territoriesLoading" class="font-weight-bold m-0 mt-2 mr-2 ml-2 medium">
          Loading territories... <font-awesome-icon icon="circle-notch" spin></font-awesome-icon>
        </div>
        <p v-else>
          Now, select the territory for this address by clicking on one of the circle territory markers.
          <b-form-select v-model="model.territory_id"
            :options="territoryOptions" required>
          </b-form-select>
        </p>
        <AddressMap :address="model" :zoom="14" :step="step" :key="step" @territory-selected="updateTerritory"></AddressMap>
      </div>
      <div v-else-if="step === 4" class="step-4">
        <div v-if="mode === 'add'">
          <div>{{model.addr1}} {{model.addr2}}</div>
          <div>{{model.city}} {{model.state_province}} {{model.postal_code}}</div>
        </div>
        <hr />
        <div>Selected territory: {{selectedTerritory.text}}</div>
        <hr />
        <p>It is recommended that the selected territory be re-optimized with
          <span v-if="mode === 'add'">the addition of this new address.</span>
          <span v-if="mode === 'edit'">this address update.</span>
        </p>
        <b-button v-if="canManage" variant="info" :to="`/territories/${territory.group_code}/${territory.id}/optimize`">
          Optimize
        </b-button>
      </div>
      <div class="buttons py-4" :class="{ 'justify-content-between': step!==4, 'justify-content-end': step===4 }">
        <b-button v-if="step === 1" type="button" variant="light" @click="done">Cancel</b-button>
        <b-button v-else v-show="step !== 4" type="button" variant="light" @click="prev">Previous</b-button>
        <b-button v-if="canManage && (step === 1 || step === 1.5)" type="button" variant="light" @click="applyGeocode">
          Locate on Map
        </b-button>
        <b-button v-if="canManage && step === 2" type="button" variant="light" @click="goToSelectTerritory">
          Select Territory
        </b-button>
        <b-button
          v-if="step !== 4"
          :disabled="!isFormComplete || isSaving"
          class="submit-button"
          type="submit"
          variant="primary">
          <font-awesome-icon v-if="isSaving" icon="circle-notch" spin></font-awesome-icon>
          <span v-else>Submit</span>
        </b-button>
        <b-button v-if="step === 4" type="button" variant="success" @click="done">Done</b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import startCase from 'lodash/startCase';
import { TheMask } from 'vue-the-mask';
import AddressMap from './AddressMap';
import Loading from './Loading';
import { InvalidAddressError } from '../store/exceptions/custom-errors';

const Modes = {
  add: 'add',
  edit: 'edit',
  phoneAdd: 'phone-add',
  phoneEdit: 'phone-edit',
};

const required = ['congregationId', 'territory_id', 'addr1', 'city', 'state_province'];
const requiredAddress = ['addr1', 'city', 'state_province'];

export default {
  name: 'AddressForm',
  props: ['group', 'territoryId', 'addressId', 'mode', 'phoneId'],
  components: {
    TheMask,
    AddressMap,
    Loading,
  },
  data() {
    return {
      modes: Modes,
      step: 1,
      isLoading: false,
      isSaving: false,
      isSearching: false,
      readOnly: false,
      model: {
        id: 0,
        congregationId: this.congId,
        status: 'Active',
      },
      error: '',
      useGeocodedAddress: true,
      geocodedAddress: {},
      showTerrHelp: true,
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
      addressSearch: 'addresses/addressSearch',
    }),
    async submitAddress() {
      try {
        if (!this.model.longitude || !this.model.latitude) {
          await this.geocodeAddress();
        }
        this.isSaving = true;

        if (this.mode === Modes.add) {
          await this.addAddress(this.model);
          await this.getTerritory(this.model.territory_id);
        } else if (this.mode === Modes.edit) {
          await this.updateAddress(this.model);
        }

        if (this.canManage) {
          this.step = 4;
        } else {
          this.$router.push(this.returnRoute);
        }
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
      this.isLoading = true;
      await this.fetchAllTerritories({ congId: this.congId });
      if (this.mode === Modes.edit) {
        await this.fetchAddress(this.addressId);
        this.model = this.address;
        if (!this.model.sort) {
          this.model.sort = 0;
        }
        delete this.model.activityLogs;
      } else {
        if (this.user && this.territoryId) {
          await this.getTerritory(this.territoryId);
        }
        await this.setAddress({});
        this.model = {
          congregationId: this.congId,
          territory_id: this.territoryId,
          sort: this.territoryId ? this.maxSort + 1 : 0,
          status: 'Active',
        };
      }
      this.isLoading = false;
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

    async applyGeocode() {
      if (!this.isAddressComplete) {
        this.$bvToast.toast('Complete the address fields first', {
          variant: 'danger',
        });
        return;
      }

      if (this.mode === Modes.add) {
        this.isSearching = true;
        await this.addressSearch({ congId: this.congId, searchTerm: this.model.addr1 });
        if (this.searchedAddresses && this.searchedAddresses.length) {
          this.step = 1.5;
          this.isSearching = false;
          return;
        }
        this.isSearching = false;
      }

      if (!this.geocodedAddress.latitude || !this.geocodedAddress.longitude) {
        await this.geocodeAddress();
      }
      this.step = 2;
      this.model.longitude = this.geocodedAddress.longitude;
      this.model.latitude = this.geocodedAddress.latitude;
    },

    async goToSelectTerritory() {
      this.step = 3;
    },

    prev() {
      if (this.step > 0) {
        this.step = this.step - 1;
      }
    },

    async updateTerritory(territoryId) {
      this.$set(this.model, 'territory_id', territoryId);
      await this.getTerritory(territoryId);
    },

    done() {
      this.$router.push(this.returnRoute);
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      congId: 'auth/congId',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      isAdmin: 'auth/isAdmin',
      address: 'address/address',
      territory: 'territory/territory',
      maxSort: 'territory/maxSort',
      territories: 'territories/territories',
      territoriesLoading: 'territories/loading',
      searchedAddresses: 'addresses/search',
    }),

    returnRoute() {
      const { origin = '' } = this.$route.query;
      const queryParam = origin ? `?origin=${origin}` : '';
      const addMode = this.mode === Modes.add
        ? `/territories/${this.group}/${this.territoryId}`
        : `/territories/${this.group}/${this.territoryId}/addresses/${this.addressId}/detail${queryParam}`;
      if (this.$route.name === 'address-new') return '/';
      if (origin) return undefined;
      return addMode;
    },

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

    selectedTerritory() {
      return this.territoryOptions.find(t => t.value === this.model.territory_id);
    },

    statusOptions() {
      return ['Active', 'NF', 'DNC'].map(s => ({ value: s, text: s }));
    },
  },
  watch: {
    async user() {
      await this.refresh();
      const unauthAddressCongId = this.mode === Modes.edit && this.congId !== this.address.congregationId;
      const unauthTerritoryCongId = this.mode === Modes.add && this.territory && this.territory.congregationid
        && this.congId !== this.territory.congregationid;

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
