<template>
  <div>
    Hello from the Address vue!<br />
    <b-list-group>
      <b-list-group-item v-for="index in territory.addresses" v-bind:key="index.id">
        <div>
          <!-- try a v-if thing here. if the addr1 matches the address at route params show that stuff -->
        </div>
        <h1>{{ index.addr1 }}</h1>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Address',

  data(){
    return {
      addressId: this.$route.params.addressId,
    }
  },

  async mounted() {
    await this.fetchAddress(this.addressId);
  },

  computed: {
    ...mapGetters({
      address: 'address/address',
    })
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
    })
  },

}

</script>

