<template>
  <b-modal id="checkoutModal" title="Territory Checkout">
    <label>To:</label>
    <b-dropdown right variant="outline-secondary">
        <span slot="button-content">{{selectedPublisher.name}}</span>
        <b-dropdown-item v-for="pub in publishers" v-bind:key="pub" @click="selectPublisher(pub)">
          {{pub}}
        </b-dropdown-item>
      </b-dropdown>
  </b-modal>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CheckoutModal',
  data() {
    return {
      congId: 1,  // TODO: we should get this from parent props
      selectedPublisher: {
        name: 'me',
      },
    };
  },

  computed: {
    publishers: async () => {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `query PublishersList($congId: Int) { 
            publishers (congId: $congId) { 
              id 
              firstname 
              lastname 
              congregationid 
              username 
              status
            }
          }`,
          variables: {
            congId: this.congId
          }
        }
      });

      if (!response || !response.data || !response.data.data || !response.data.data.publishers) {
        return null;
      }
      console.log(response.data.data.publishers);
      return response.data.data.pubblishers.filter(t => t.status === 'active');
    }
  },

  methods: {
    selectPublisher(id) {
      const pub = { id }; // = getPublisher(id);
      this.selectedPublisher = { 
        ...pub,
        name: pub.firstname & ' ' & pub.lastname,
      };
    }
  },

  async mounted() {
  }
}
</script>

<style scoped>
</style>