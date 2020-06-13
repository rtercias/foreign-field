<template>
  <div>
    <div>
      <div>Add New Address</div>
      <b-form class="p-4 text-left" @submit="onCreateAddress">
        <b-form-group label="Congregation ID" class="mt-3">
          <b-form-input v-model="addressToCreate.congregationId" disabled></b-form-input>
        </b-form-group>
        <b-form-group label="Territory ID" class="mt-3">
          <b-form-input v-model="addressToCreate.territory_id" disabled></b-form-input>
        </b-form-group>
        <b-form-group label="Status" class="mt-3">
          <b-form-input v-model="addressToCreate.status"></b-form-input>
        </b-form-group>
        <b-form-group label="Address 1" class="mt-3">
          <b-form-input v-model="addressToCreate.addr1"></b-form-input>
        </b-form-group>
        <b-form-group label="City" class="mt-3">
          <b-form-input v-model="addressToCreate.city"></b-form-input>
        </b-form-group>
        <b-form-group label="State" class="mt-3">
          <b-form-input v-model="addressToCreate.state_province"></b-form-input>
        </b-form-group>
        <b-form-group label="Zip" class="mt-3">
          <b-form-input v-model="addressToCreate.postal_code"></b-form-input>
        </b-form-group>
        <b-button type="submit" variant="primary">Add New Address</b-button>
      </b-form>
    </div>
    <hr />
    <div>
      <div>Update Address</div>
      <b-form class="p-4 text-left" @submit="onUpdateAddress">
        <b-form-group label="ID" class="mt-3">
          <b-form-input v-model="addressToUpdate.id" disabled></b-form-input>
        </b-form-group>
        <b-form-group label="Congregation ID" class="mt-3">
          <b-form-input v-model="addressToUpdate.congregationId" disabled></b-form-input>
        </b-form-group>
        <b-form-group label="Territory ID" class="mt-3">
          <b-form-input v-model="addressToUpdate.territory_id" disabled></b-form-input>
        </b-form-group>
        <b-form-group label="Status" class="mt-3">
          <b-form-input v-model="addressToUpdate.status"></b-form-input>
        </b-form-group>
        <b-form-group label="Address 1" class="mt-3">
          <b-form-input v-model="addressToUpdate.addr1"></b-form-input>
        </b-form-group>
        <b-form-group label="City" class="mt-3">
          <b-form-input v-model="addressToUpdate.city"></b-form-input>
        </b-form-group>
        <b-form-group label="State" class="mt-3">
          <b-form-input v-model="addressToUpdate.state_province"></b-form-input>
        </b-form-group>
        <b-form-group label="Zip" class="mt-3">
          <b-form-input v-model="addressToUpdate.postal_code"></b-form-input>
        </b-form-group>
        <b-button type="submit" variant="primary">Update Address</b-button>
      </b-form>
    </div>
    <div>
      <div>NF Address</div>

    </div>
    <div>
      <div>DNC Address</div>

    </div>
    <div>
      <div>Add Note</div>

    </div>
    <div>
      <div>Remove Note</div>

    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'AddressMutationsTest',
  data() {
    return {
      addressToCreate: {
        congregationId: 1,
        territory_id: 484,
        status: 'Active',
        addr1: '2 Fake St',
        city: 'Faketown',
        state_province: 'NJ',
        postal_code: '07070',
      },
      createdAddressId: 0,
    };
  },
  methods: {
    ...mapActions({
      addAddress: 'address/addAddress',
      updateAddress: 'address/updateAddress',
    }),
    onCreateAddress(e) {
      this.addAddress(this.addressToCreate);
      e.preventDefault();
    },
    onUpdateAddress(e) {
      this.updateAddress(this.addressToUpdate);
      e.preventDefault();
    },
  },
  computed: {
    ...mapGetters({
      addressToUpdate: 'address/address',
    }),
  },
};
</script>
<style>

</style>
