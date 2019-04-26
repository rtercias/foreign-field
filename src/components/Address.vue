<template>
  <div class="main-body">
    <div class="address-info">
      <div class="house-icon">
        <font-awesome-icon icon="home" class="fa-2x"></font-awesome-icon>
      </div>
      <div class="address-title">
        <h3>{{ address.addr1 }}</h3>
        <h5>{{ address.city }}</h5>
      </div>
    </div>

    <div class="notes">
      <b-list-group-item v-for="(note, index) in notes" :key="note.id" class="notes-list">
        <div class="row align-items-center">
          <b-col cols='10'>
            {{ note }}  
          </b-col>
          <b-col>
            <font-awesome-icon class="delete-button" icon="times" @click="deleteTag(index)"></font-awesome-icon>
          </b-col>
        </div>
      </b-list-group-item>
    </div>

    <div class="address-notes" ref="note-card">
      <div class="form-submit row align-items-center">
        <b-col cols="9">
          <b-form-input
          @focus="animateCard()"
          @blur="hideCard()"
          v-model="formText"
          maxlength="100"
          placeholder="please keep notes brief...">
          </b-form-input>
        </b-col>
        <b-col cols="3">
          <b-button @click="submitForm()" variant="primary" size="lg" >+</b-button>
        </b-col>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Address',

  data(){
    return {
      addressId: this.$route.params.addressId,
      formText: '',
      notes: [],
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
    }),
    submitForm(){
      this.notes.unshift(this.formText);
      this.formText = '';
    },
    deleteTag(index){
      this.notes.splice(index, 1);
    },
    animateCard(){
      this.$refs['note-card'].style.transform = 'translateY(-400px)';
    },
    hideCard(){
      this.$refs['note-card'].style.transform = 'translateY(0px)';
    }
  }
}

</script>

<style scoped>
.main-body {
  overflow: hidden;
}
.address-info {
  color: black;
  height: 250px;
}
h3 {
  margin-top: 30px;
  font-weight: 700;
}
.house-icon {
  padding-top: 50px;
  font-size: 1.6em;
}
.address-notes {
  background-color: white;
  height: 1000px;
  width: 100%;
  border-radius: 30px;
  box-shadow: 0 -4px 6px 0 hsla(0, 0%, 14%, 0.1);
  transition: all .3s ease-in-out;
}
.form-submit {
  margin: 0 20px;
  padding-top: 30px;
}
.notes {
  overflow: scroll;
  height: 300px;
}
.notes-list {
  text-align: left;
  padding: 20px;
  overflow-wrap: break-word
}
.delete-button {
  float: right;
  color: rgb(201, 201, 201);
}


input {
  border: none;
  box-shadow: none !important;
}

</style>
