<template>
  <div class="address-form">
    <div class="address-header justify-content-around align-items-center lead py-3">
      <span v-if="mode===modes.add" class="lead font-weight-bold w-100">Add New Address</span>
      <div v-else-if="mode===modes.edit" class="lead font-weight-bold w-100">
        <div>{{model.addr1}} {{model.addr2}}</div>
        <div>{{model.city}} {{model.state_province}} {{model.postal_code}}</div>
      </div>
    </div>
    <div class="text-danger font-weight-bold" v-if="error">ERROR: {{error}}</div>
    <Loading v-if="isLoading || isSearching"></Loading>
    <b-form v-else class="form px-4 pb-4 text-left" @submit.prevent="submitAddress">
      <div v-if="step === 1">
        <div v-if="canWrite && mode !== modes.phoneAdd && mode !== modes.phoneEdit">
          <b-form-group>
            <div class="d-flex align-items-center">
              <b-form-checkbox v-model="useGeocodedAddress" class="text-nowrap">Auto-fix address</b-form-checkbox>
              <font-awesome-icon class="help ml-1 text-info" icon="info-circle" @click="showGeocodeHelp=!showGeocodeHelp" />
            </div>
            <div v-if="showGeocodeHelp">
              This will update your entry based on its geocoded location.<br/>
              Uncheck if you want to preserve existing GPS coordinates for this address.
            </div>
          </b-form-group>
          <b-form-group>
            <b-badge variant="danger" v-if="model.status !== 'Active'">{{statusText(address.status)}}</b-badge>
          </b-form-group>
          <b-form-group label="Status" class="mt-3" v-if="canManage">
            <b-form-select v-model="model.status"
              :options="statusOptions" required>
            </b-form-select>
          </b-form-group>
          <b-form-group label="Address 1" class="mt-3">
            <b-form-input
             v-model="model.addr1"
             :class="{ 'alert-success font-weight-bold': isGeocoded('addr1') }"
             :readonly="readOnly"
             @change="geocodeAddress"
             maxlength="50">
            </b-form-input>
          </b-form-group>
          <b-form-group label="Address 2" class="mt-3">
            <b-form-input
             v-model="model.addr2"
             :class="{ 'alert-success font-weight-bold': isGeocoded('addr2') }"
             :readonly="readOnly"
             maxlength="50">
             </b-form-input>
          </b-form-group>
          <b-form-group label="City" class="mt-3">
            <b-form-input
             v-model="model.city"
             :class="{ 'alert-success font-weight-bold': isGeocoded('city') }"
             :readonly="readOnly"
             @change="geocodeAddress"
             maxlength="50">
            </b-form-input>
          </b-form-group>
          <b-form-group label="State" class="mt-3">
            <b-form-input
             v-model="model.state_province"
             :class="{ 'alert-success font-weight-bold': isGeocoded('state_province') }"
             :readonly="readOnly"
             @change="geocodeAddress"
             maxlength="50">
            </b-form-input>
          </b-form-group>
          <b-form-group label="Zip" class="mt-3">
            <b-form-input
             v-model="model.postal_code"
             :class="{ 'alert-success font-weight-bold': isGeocoded('postal_code') }"
             :readonly="readOnly"
             @change="geocodeAddress"
             maxlength="15">
            </b-form-input>
          </b-form-group>
          <b-button variant="outline-warning" size="sm" @click="undoGeocode" v-if="isGeocoded()">
            Don't fix my address
          </b-button>
          <b-button variant="success" size="sm" @click="geocodeAddress" v-else-if="!!enteredAddress">
            Fix my address
          </b-button>
        </div>
        <div v-if="canWrite" class="mt-5">
          <div class="text-left" v-if="showTerrHelp">
            <hr/>
            <p>
              <font-awesome-icon class="help ml-1 text-info" icon="info-circle">
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
          <b-form-group label="Notes" class="mt-3" v-if="canManage">
            <b-form-input v-model="model.notes"></b-form-input>
          </b-form-group>
        </div>
        <div v-if="isAdmin" class="mt-5">
          <hr />
          <label class="mb-0">ADMIN ONLY</label>
          <b-form-group label="Congregation ID" class="mt-3">
            <b-form-input v-model="model.congregationId"></b-form-input>
          </b-form-group>
          <b-form-group label="Sort" class="mt-3">
            <b-form-input v-model="model.sort"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div v-else-if="step === 1.5">
        <p>
          <font-awesome-icon icon="exclamation-triangle" class="text-danger"></font-awesome-icon>
          Similar address(es) found. Please make sure the address you entered is unique.
        </p>
        <b-list-group>
          <b-list-group-item v-for="(search, index) in searchedAddresses" :key="index">
            {{search.addr1}} {{search.addr2}} {{search.city}} {{search.state_province}} {{search.postal_code}}
            <b-link :to="`/territories/${search.territory.id}`">
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
        <AddressMap :address="model" :zoom="17" :step="step" :key="step" @updated="updateCoordinates" />
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
      <div v-else-if="step === 4" class="step-4 pb-5">
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
        <b-button v-if="canManage" variant="info" :to="`/territories/${model.territory_id}/optimize`">
          Optimize
        </b-button>
      </div>
      <div class="buttons py-4 justify-content-between">
        <b-button v-if="step === 1" type="button" variant="light" @click="done">Cancel</b-button>
        <b-button v-if="canManage && step === 1 && mode===modes.edit" type="button" variant="danger" @click="remove">
          Delete
        </b-button>
        <b-button v-else v-show="step > 1" type="button" variant="light" @click="prev">Previous</b-button>
        <b-button v-if="canWrite && (step === 1 || step === 1.5)" type="button" variant="light" @click="applyGeocode">
          Locate on Map
        </b-button>
        <b-button v-if="canWrite && step === 2" type="button" variant="light" @click="goToSelectTerritory">
          Select Territory
        </b-button>
        <b-button
          v-if="step !== 4"
          :disabled="!isFormComplete || isSaving"
          class="submit-button"
          type="submit"
          variant="primary">
          <font-awesome-icon v-if="isSaving" icon="circle-notch" spin></font-awesome-icon>
          <span v-else-if="step === 1.5">Confirm</span>
          <span v-else>Submit</span>
        </b-button>
        <b-button v-if="step === 4" type="button" variant="success" @click="done">Done</b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { TheMask } from 'vue-the-mask';
import get from 'lodash/get';
import addYears from 'date-fns/addYears';
import format from 'date-fns/format';
import AddressMap from './AddressMap';
import Loading from './Loading';
import { InvalidAddressError } from '../store/exceptions/custom-errors';
import { Modes as _Modes } from '../utils/modes';
import { ADDRESS_STATUS } from '../store/modules/models/AddressModel';
import { formatLanguage, NF_TAG, DNC_TAG } from '../utils/tags';

const Modes = {
  ..._Modes,
  phoneAdd: 'phone-add',
  phoneEdit: 'phone-edit',
};

const required = ['congregationId', 'territory_id', 'addr1', 'city', 'state_province'];
const requiredInactive = ['congregationId', 'addr1', 'city', 'state_province'];
const requiredAddress = ['addr1', 'city', 'state_province'];

export default {
  name: 'AddressForm',
  props: ['territoryId', 'addressId', 'mode', 'phoneId'],
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
      saveGPSCoordinates: false,
      enteredAddress: undefined,
      showTerrHelp: true,
      showGeocodeHelp: false,
    };
  },
  async mounted() {
    await this.refresh();
    this.enteredAddress = undefined;
  },
  methods: {
    ...mapActions({
      addAddress: 'address/addAddress',
      updateAddress: 'address/updateAddress',
      deleteAddress: 'address/deleteAddress',
      fetchAddress: 'address/fetchAddress',
      addressLookup: 'address/addressLookup',
      getTerritory: 'territory/getTerritory',
      setAddress: 'address/setAddress',
      fetchAllTerritories: 'territories/fetchAllTerritories',
      addressSearch: 'addresses/addressSearch',
      markAsDoNotCall: 'address/markAsDoNotCall',
      markAsNotForeign: 'address/markAsNotForeign',
    }),
    async submitAddress() {
      try {
        if (this.step !== 1.5) {
          const addressExists = await this.checkForExistingAddress();
          if (addressExists) {
            return;
          }
        }

        if (!this.model.longitude || !this.model.latitude) {
          await this.geocodeAddress();
        }

        if (this.mode === Modes.add) {
          this.isSaving = true;
          await this.addAddress(this.model);
          await this.getTerritory({ id: this.model.territory_id });
        } else if (this.mode === Modes.edit) {
          if (this.model.status !== ADDRESS_STATUS.Active.value) {
            const statusTag = ADDRESS_STATUS[this.model.status].value;
            this.model.notes = this.removeStatusTag(statusTag);
          }

          await this.updateAddress(this.model);

          if (this.model.status === ADDRESS_STATUS.NF.value) {
            await this.markAsNotForeign({ addressId: this.model.id, userid: this.user.id, tag: NF_TAG });
          } else if (this.model.status === ADDRESS_STATUS.DNC.value) {
            const dncTag = `${DNC_TAG} until ${format(addYears(new Date(), 1), 'P')}`;
            await this.markAsDoNotCall({ addressId: this.model.id, userid: this.user.id, tag: dncTag });
          }
        }

        this.enteredAddress = undefined;

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

    async checkForExistingAddress() {
      if (this.mode === Modes.add) {
        this.isSearching = true;
        await this.addressSearch({ congId: this.congId, searchTerm: this.model.addr1, status: '*' });
        if (this.searchedAddresses && this.searchedAddresses.length) {
          this.step = 1.5;
          this.isSearching = false;
          return true;
        }
        this.isSearching = false;
      }
      return false;
    },

    async refresh() {
      this.isLoading = true;
      if (!this.allTerritories.length) {
        await this.fetchAllTerritories({ congId: this.congId });
      }

      if (this.mode === Modes.edit) {
        await this.fetchAddress({ addressId: this.addressId, status: '*' });
        this.model = { ...this.address } || {};
        if (!this.model.sort) {
          this.model.sort = 0;
        }
        delete this.model.activityLogs;
      } else {
        if (this.user && this.territoryId && this.territory.id !== this.territoryId) {
          await this.getTerritory({ id: this.territoryId });
        }
        await this.setAddress({});
        this.model = {
          congregationId: this.congId,
          territory_id: this.territoryId,
          sort: this.territoryId ? this.maxSort + 1 : 0,
          status: 'Active',
        };
      }
      if (this.user && this.mode === Modes.edit
        && this.user.congregation.id !== this.address.congregationId) {
        this.$router.push('/unauthorized');
      }
      this.isLoading = false;
    },
    async geocodeAddress() {
      if (!this.useGeocodedAddress) return;
      if (!this.model.addr1) return;
      if (!this.model.city && !this.model.state_province && !this.model.postal_code) return;
      if (this.model.city && !this.model.state_province && !this.model.postal_code) return;
      if (this.model.state_province && !this.model.city && !this.model.postal_code) return;

      const { addr1, addr2, city, state_province: state, postal_code: zip } = this.model;
      const fullAddress = `${addr1 || ''}+${addr2 || ''}+${city || ''}+${state || ''}+${zip || ''}`;

      await this.addressLookup(fullAddress);
      this.enteredAddress = { ...this.model };
      this.model.addr1 = this.address.addr1;
      this.model.city = this.address.city;
      this.model.state_province = this.address.state_province;
      this.model.postal_code = this.address.postal_code;
      this.model.longitude = this.address.longitude;
      this.model.latitude = this.address.latitude;
    },

    isGeocoded(field) {
      if (!field) {
        return this.enteredAddress && this.enteredAddress !== this.model;
      }
      return this.enteredAddress && this.enteredAddress[field] !== this.model[field];
    },

    async applyGeocode() {
      if (!this.isAddressComplete) {
        this.$bvToast.toast('Complete the address fields first', {
          variant: 'danger',
        });
        return;
      }

      await this.geocodeAddress();
      this.step = 2;
    },

    undoGeocode() {
      this.model = this.enteredAddress;
    },

    async goToSelectTerritory() {
      this.step = 3;
    },

    prev() {
      if (this.step > 0) {
        this.step = Math.ceil(this.step) - 1;
      }
    },

    async updateTerritory(territoryId) {
      this.$set(this.model, 'territory_id', territoryId);
      await this.getTerritory({ id: territoryId });
    },

    done() {
      this.$router.go(-1);
    },

    async remove() {
      const message = 'Are you sure you want to delete this address?';
      const confirm = await this.$bvModal.msgBoxConfirm(message, {
        title: this.address.addr1,
        centered: true,
      });
      if (confirm) {
        await this.deleteAddress(this.address.id);
        this.$router.push(`/territories/${this.territoryId}`);
      }
    },

    updateCoordinates(coordinates) {
      if (coordinates) {
        this.model.longitude = coordinates.lng;
        this.model.latitude = coordinates.lat;
      }
    },
    statusText(status) {
      return formatLanguage(ADDRESS_STATUS[status].text, this.language);
    },
    removeStatusTag(status) {
      const notes = get(this.model, 'notes') || '';
      const tags = notes.split(',') || [];
      return tags.filter(t => t.includes(status)).join(',');
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      congId: 'auth/congId',
      congregation: 'congregation/congregation',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      isAdmin: 'auth/isAdmin',
      address: 'address/address',
      territory: 'territory/territory',
      maxSort: 'territory/maxSort',
      allTerritories: 'territories/allTerritories',
      territoriesLoading: 'territories/loading',
      searchedAddresses: 'addresses/search',
    }),

    returnRoute() {
      const { origin = '' } = this.$route.query;
      const queryParam = origin ? `?origin=${origin}` : '';
      const addMode = this.mode === Modes.add
        ? `/territories/${this.territoryId}`
        : `/territories/${this.territoryId}/addresses/${this.addressId}/detail${queryParam}`;
      if (this.$route.name === 'address-new') return '/';
      return addMode;
    },

    isFormComplete() {
      const isActive = get(this.model, 'status') === ADDRESS_STATUS.Active.value;
      const requiredSet = isActive ? required : requiredInactive;
      for (const field of requiredSet) {
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
      return this.allTerritories.map(t => ({ value: t.id, text: `${t.description} (${t.name})` }));
    },

    selectedTerritory() {
      return this.territoryOptions.find(t => t.value === this.model.territory_id);
    },

    statusOptions() {
      return Object.values(ADDRESS_STATUS).map(s => ({ ...s, text: formatLanguage(s.text, this.language) }));
    },
    language() {
      return (get(this.congregation, 'language') || 'Tagalog');
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
