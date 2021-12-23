<template lang="html">
  <div>
    <div v-if="isVerifying" class="px-5 pt-4">
      <div>A sign-in email with additional instructions was sent to {{email}}. Check your email to complete sign-in.</div>
      <b-button @click="reload">Reload</b-button>
    </div>
    <div v-show="!isVerifying && !isAuthenticated" id="firebaseui-auth-container" class="p-5"></div>
  </div>
</template>

<script>
import firebase from 'firebase/app';
import firebaseui from 'firebaseui';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'auth',
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isVerifying: 'auth/isVerifying',
      email: 'auth/email',
    }),
  },
  methods: {
    ...mapActions({
      verify: 'auth/verify',
    }),
    reload() {
      this.$router.go();
    },
  },
  mounted() {
    const uiConfig = {
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: ({ user }) => {
          if (user.email && !user.emailVerified) {
            this.verify(user);
          }

          const redirectUrl = this.$router.currentRoute.query.redirect;
          this.$router.push(redirectUrl || '/welcome');
          // Do not automatically redirect.
          return false;
        },
      },
    };

    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(firebase.auth());
    }
    ui.start('#firebaseui-auth-container', uiConfig);
  },
  destroy() {
    firebaseui.auth.destroy();
  },
};
</script>
<style>
.visible {
  visibility: visible;
}
.hidden {
  visibility: hidden;
}
</style>
