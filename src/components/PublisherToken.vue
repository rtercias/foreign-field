<template>
  <div class="p-5 text-left">
    <div v-if="publisherToken">
      <h4 class="mb-3">Help {{publisherName || username}} log in to Foreign Field</h4>
      <div class="mb-3 font-weight-bold font-italic text-break">Login Link: {{shortLink}}</div>
      <b-button v-if="isDesktop" variant="light" @click="copyLink">
        <span v-if="isCopied">Copied!</span>
        <span v-else>Copy Link</span>
      </b-button>
      <b-button v-else @click="sendLink">
        <font-awesome-icon class="text-primary d-xl-none" icon="sms" size="sm" />
        Send Login Link via SMS
      </b-button>
    </div>
    <div v-else>Token not available.</div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { displayName } from '../utils/publisher';

export default {
  name: 'PublisherToken',
  data() {
    return {
      isCopied: false,
    };
  },
  async mounted() {
    if (this.username) {
      await this.generateTokenAndLink();
    }
  },
  computed: {
    ...mapGetters({
      publisherToken: 'auth/publisherToken',
      shortLink: 'auth/shortLink',
      isDesktop: 'auth/isDesktop',
      publisher: 'publisher/publisher',
    }),
    username() {
      return this.$route.query.username;
    },
    publisherName() {
      return displayName(this.publisher);
    },
    link() {
      return `${window.location.origin}?token=${this.publisherToken}`;
    },
  },
  methods: {
    ...mapActions({
      generatePublisherToken: 'auth/generatePublisherToken',
      generateShortLink: 'auth/generateShortLink',
      fetchPublisherByUsername: 'publisher/fetchPublisherByUsername',
    }),
    async generateTokenAndLink() {
      await this.fetchPublisherByUsername(this.username);
      await this.generatePublisherToken(this.username);
      await this.generateShortLink(this.link);
    },
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.shortLink);
        this.isCopied = true;
      } catch (error) {
        console.error(error);
      }
    },
    sendLink() {
      window.open(`sms:&body=${this.shortLink}`, '_self');
      return false;
    },
  },
};
</script>
<style lang="sass" scoped>

</style>
