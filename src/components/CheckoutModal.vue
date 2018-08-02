<template>
  <b-modal id="checkoutModal" title="Territory Checkout">{{congId}}
    <label>To:</label>
    <b-dropdown class="publishers-list" right variant="outline-secondary">
        <span slot="button-content">{{selectedPublisher.name}}</span>
        <b-dropdown-item v-for="pub in publishers" v-bind:key="pub.id" @click="selectPublisher(pub)">
          {{pub.firstname}} {{pub.lastname}}
        </b-dropdown-item>
      </b-dropdown>
  </b-modal>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CheckoutModal',
  props: ['congId'],
  data() {
    return {
      selectedPublisher: {
        name: 'me',
      },
      publishers: [],
    };
  },

  methods: {
    selectPublisher(id) {
      const pub = { id }; // = getPublisher(id);
      this.selectedPublisher = { 
        ...pub,
        name: pub.firstname & ' ' & pub.lastname,
      };
    },
    async getPublishers() {
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
      return response.data.data.publishers.filter(t => t.status === 'active');
    },
  },

  async mounted() {
    this.publishers = await this.getPublishers();
  }
}
</script>

<style>
  .publishers-list .dropdown-menu {
    height: 31rem;
    overflow-y: auto;
  }
</style>