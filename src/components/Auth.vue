<template lang="html">
  <div>
    <div v-if="isVerifying" class="px-5 pt-4">
      <div>
        A sign-in email with additional instructions was sent to {{ email }}. Check your
        email to complete sign-in.
      </div>
      <b-button @click="reload">Reload</b-button>
    </div>
    <div class="p-5">
      <GoogleLogin
        v-show="!isFirebaseSigninOpen"
        class="border-light bg-white"
        :params="params"
        :onSuccess="googleLogin"
      >
        <img
          src="../assets/g.svg"
          width="22"
          height="22"
        />
        <span>Sign in with Google</span>
      </GoogleLogin>
      <div
        ref="firebaseUI"
        v-show="!isVerifying && !isAuthenticated"
        id="firebaseui-auth-container"
        @click="isFirebaseSigninOpen = !isFirebaseSigninOpen"
      >
      </div>
    </div>
  </div>
</template>

<script>
import GoogleLogin from 'vue-google-login';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseCompat from 'firebase/compat/app';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'auth',
  components: {
    GoogleLogin,
  },
  data() {
    return {
      isFirebaseSigninOpen: false,
    };
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isVerifying: 'auth/isVerifying',
      email: 'auth/email',
    }),
    params() {
      return {
        client_id: process.env.VUE_APP_CLIENT_ID,
      };
    },
  },
  methods: {
    ...mapActions({
      verify: 'auth/verify',
    }),
    reload() {
      this.$router.go();
    },
    onSignInSuccess: async ({ user }) => {
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
      const result = await signInWithPopup(auth, provider);
      this.onSignInSuccess(result);
    },
  },
  mounted() {
    // const observer = new MutationObserver(() => {
    //   const firebaseUI = get(this.$refs, 'firebaseUI');
    //   const header = firebaseUI && firebaseUI.querySelector('.firebaseui-card-header');
    //   const style = header && window.getComputedStyle(header);
    //   // eslint-disable-next-line
    //   console.log('style display', style ? style.display : false);
    //   this.isFirebaseSigninOpen = style ? style.display === 'block' : false;
    // });

    // observer.observe(this.$refs.firebaseUI, { childList: true });

    const uiConfig = {
      signInOptions: [
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
<style lang="scss">
#google-signin-btn-0 {
  width: 200px;
  border-radius: 0;
  font-size: 14px;
  min-height: 40px;

  img {
    margin-left: -12px;
  }
  span {
    margin-left: 12px;
  }
}

.firebaseui-container {
  &.mdl-card {
    margin-top: -40px;
  }
}

</style>
