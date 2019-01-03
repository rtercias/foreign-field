<template lang="html">
  <div id="firebaseui-auth-container" class="p-5"></div>
</template>

<script>
import firebase from 'firebase/app';
import firebaseui from 'firebaseui';

export default {
  name: 'auth',
  mounted() {
    const uiConfig = {
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccess: (currentUser) => {
          this.$store.dispatch('auth/login', currentUser);
          const redirectUrl = this.$router.currentRoute.query.redirect;
          this.$router.push(redirectUrl || '/welcome');
          // Do not automatically redirect.
          return false;
        },
      }
    };

    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(firebase.auth());
    }
    ui.start('#firebaseui-auth-container', uiConfig);
  },
  destroy() {
    firebaseui.auth.destroy();
  }
}
</script>
