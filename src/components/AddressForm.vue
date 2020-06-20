<template>
  <div class="address-form">
    <Loading v-if="loading"></Loading>
    <div v-else>
      <div class="address-header justify-content-around align-items-center lead pt-3 pb-3">
        <b-link class="button pl-4" :to="returnRoute">
          <font-awesome-icon icon="chevron-left"></font-awesome-icon>
        </b-link>
        <span v-if="mode===modes.add" class="lead font-weight-bold w-100 pr-5">Add New Address</span>
        <div v-else class="lead font-weight-bold w-100 pr-5">
          <div>{{address.addr1}} {{address.addr2}}</div>
          <div>{{address.city}} {{address.state_province}} {{address.postal_code}}</div>
        </div>
      </div>
      <div class="error" v-if="error">{{error}}</div>
      <b-form class="pl-4 pr-4 pb-4 text-left" @submit="submitAddress">
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
          <b-form-group label="City" class="mt-3">
            <b-form-input v-model="model.city" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="State" class="mt-3">
            <b-form-input v-model="model.state_province" :readonly="readOnly"></b-form-input>
          </b-form-group>
          <b-form-group label="Zip" class="mt-3">
            <b-form-input v-model="model.postal_code" :readonly="readOnly"></b-form-input>
          </b-form-group>
        </div>
        <b-form-group label="Phone" class="mt-3">
          <b-form-input type="tel" ref="phone" v-model="model.phone" :readonly="readOnly" v-mask="'+1 (###) ###-####'">
          </b-form-input>
        </b-form-group>
        <div v-if="isAdmin">
          <b-form-group label="Notes" class="mt-3">
            <b-form-input v-model="model.notes"></b-form-input>
          </b-form-group>
          <b-form-group label="Sort" class="mt-3">
            <b-form-input v-model="model.sort"></b-form-input>
          </b-form-group>
        </div>
        <div class="buttons justify-content-between pt-4">
          <b-button type="submit" variant="primary">Submit</b-button>
          <b-button type="button" variant="light" :to="returnRoute">Cancel</b-button>
        </div>
      </b-form>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { mask } from 'vue-the-mask';
import Loading from './Loading';
import { InvalidAddressError } from '../store/exceptions/custom-errors';

const Modes = {
  add: 'add',
  edit: 'edit',
};

const status = {
  Active: 'Active',
  NF: 'NF',
  DNC: 'DNC',
  Moved: 'Moved',
};

export default {
  name: 'AddressForm',
  props: ['group', 'territoryId', 'addressId', 'mode', 'phone'],
  components: {
    Loading,
  },
  directives: {
    mask,
  },
  data() {
    return {
      modes: Modes,
      status,
      readOnly: false,
      model: {
        id: 0,
        congregationId: this.congId,
        territory_id: Number(this.territoryId),
        status: 'Active',
      },
      error: '',
      returnRoute: this.mode === Modes.add
        ? `/territories/${this.group}/${this.territoryId}`
        : `/addresses/${this.addressId}/detail`,
    };
  },
  async mounted() {
    if (this.mode === Modes.edit) {
      await this.fetchAddress(this.addressId);
      this.model = this.address;
      delete this.model.activityLogs;
    } else {
      await this.getTerritory(this.territoryId);
      this.model.congregationId = this.congId;
      this.model.sort = this.maxSort + 1;
    }
    this.$nextTick(() => {
      this.$refs.phone.$emit('input');
    });
  },
  methods: {
    ...mapActions({
      addAddress: 'address/addAddress',
      updateAddress: 'address/updateAddress',
      fetchAddress: 'address/fetchAddress',
      getTerritory: 'territory/getTerritory',
    }),
    async submitAddress(e) {
      try {
        if (this.mode === Modes.add) {
          this.model.create_user = this.user.id;
          await this.addAddress(this.model);
          await this.getTerritory(this.territoryId);
        } else if (this.mode === Modes.edit) {
          this.model.update_user = this.user.id;
          await this.updateAddress(this.model);
        }
        e.preventDefault();
        this.$router.push(this.returnRoute);
      } catch (err) {
        if (err instanceof InvalidAddressError) {
          this.error = err.message;
        } else {
          console.error(err.message);
        }
      }
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      user: 'auth/user',
      congId: 'auth/congId',
      canWrite: 'auth/canWrite',
      isAdmin: 'auth/isAdmin',
      address: 'address/address',
      territory: 'territory/territory',
      maxSort: 'territory/maxSort',
    }),
  },
  watch: {
    user() {
      const unauthAddressCongId = this.mode === Modes.edit && this.congId !== this.address.congregationId;
      const unauthTerritoryCongId = this.mode === Modes.add && this.congId !== this.territory.congregationid;

      if (unauthAddressCongId || unauthTerritoryCongId) {
        this.$router.push('/unauthorized');
      }
    },
  },
};
</script>
<style>
  .buttons {
    display: flex;
  }
</style>
