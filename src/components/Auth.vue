<template lang="html">
  <div :class="{ visible: !isAuthenticated, hidden: isAuthenticated }" id="firebaseui-auth-container" class="p-5"></div>
</template>

<script>
import firebase from 'firebase/app';
import firebaseui from 'firebaseui';
import { mapGetters } from 'vuex';

export default {
  name: 'auth',
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
    }),
  },
  mounted() {
    const uiConfig = {
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => {
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
