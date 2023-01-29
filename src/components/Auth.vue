<template lang="html">
  <div>
    <div v-if="isVerifying" class="px-5 pt-4">
      <div>A sign-in email with additional instructions was sent to {{email}}. Check your email to complete sign-in.</div>
      <b-button @click="reload">Reload</b-button>
    </div>
    <div class="p-5">
      <b-button class="btn-google" @click="googleLogin">Sign in with Google</b-button>
      <div v-show="!isVerifying && !isAuthenticated" id="firebaseui-auth-container"></div>
    </div>
  </div>
</template>

<script>
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseCompat from 'firebase/compat/app';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
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
    onSignInSuccess: ({ user }) => {
      if (user.email && !user.emailVerified) {
        this.verify(user);
      }

      const redirectUrl = this.$router.currentRoute.query.redirect;
      this.$router.push(redirectUrl || '/welcome');
      // Do not automatically redirect.
      return false;
    },
    async googleLogin() {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        // This gives you a Google Access Token. You can use it to access the Google API.
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential.accessToken;
        this.onSignInSuccess(result);
      } catch (error) {
        // Handle Errors here.
        // const errorCode = error.code;
        // const errorMessage = error.message;
        // The email of the user's account used.
        // const email = error.customData.email;
        // The AuthCredential type that was used.
        // const credential = GoogleAuthProvider.credentialFromError(error);
      }
    },
    // async emailAndPasswordLogin() {
    //   try {
    //     const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    //     const user = userCredential.user;
    //     // ...
    //   } catch(error) {
    //     const errorCode = error.code;
    //     const errorMessage = error.message;
    //     // ..
    //   }
    // },
    // async phoneNumberLogin(phoneNumber, verifier) {
    //   try {
    //     const result = await signInWithPhoneNumber(auth, phoneNumber, verifier)
    //     // SMS sent. Prompt user to type the code from the message, then sign the
    //     // user in with result.confirm(code).
    //     // result.confirm(code);
    //     // ...
    //   } catch(error) {
    //     // Error; SMS not sent
    //     // ...
    //   }
    // },
    // recaptchaVerify() {
    //   const verifier = new RecaptchaVerifier('sign-in-button', {
    //     size: 'invisible',
    //     callback: (response) => {
    //       // reCAPTCHA solved, allow signInWithPhoneNumber.
    //       this.phoneNumberLogin(verifier);
    //     }
    //   }, auth);
    // },
  },
  mounted() {
    const uiConfig = {
      signInOptions: [
        // firebaseCompat.auth.GoogleAuthProvider.PROVIDER_ID,
        firebaseCompat.auth.EmailAuthProvider.PROVIDER_ID,
        firebaseCompat.auth.PhoneAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: this.onSignInSuccess,
      },
    };

    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(firebaseCompat.auth());
    }
    ui.start('#firebaseui-auth-container', uiConfig);
  },
  destroy() {
    firebaseui.auth.destroy();
  },
};
</script>
<style>
.btn-google {
  width: 200px;
  border-radius: 0;
}
</style>
