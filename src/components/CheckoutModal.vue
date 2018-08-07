<template>
  <b-modal id="checkoutModal" :title="`Territory Checkout ${territoryId}`" @shown="clearName" @ok="checkoutTerritory">
    <label>To:&nbsp;</label>
    <b-dropdown class="publishers-list" right variant="outline-secondary">
        <span slot="button-content">{{selectedPublisher.name || 'Select Publisher'}}</span>
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
  props: ['congId', 'territoryId'],
  data() {
    return {
      publishers: [],
      selectedPublisher: { name: 'me' },
    };
  },

  methods: {
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

    selectPublisher(publisher) {
      this.selectedPublisher = {
        ...publisher,
        name: `${publisher.firstname} ${publisher.lastname}`,
      }
    },

    clearName() {
      this.selectedPublisher = {};
    },

    async checkoutTerritory() {
      await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
            checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
              status 
            }
          }`,
          variables: {
            terrId: Number(this.territoryId),
            pubId: this.selectedPublisher.id,
            user: 'Anonymous' // TODO: set to current user when we have logged-in user info
          }
        }
      });
      
      this.$emit('territory-checkedout');
      return 'Checked Out';
    },
  },

  async mounted() {
    this.publishers = await this.getPublishers();

    // TODO: set to "me" once we have logged-in user info
    // this.selectedPublisher = {
    //   name: 'me',
    // };
  }
}
</script>

<style>
  .publishers-list .dropdown-menu {
    height: 31rem;
    overflow-y: auto;
  }
</style>