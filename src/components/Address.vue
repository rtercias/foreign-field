<template>
  <div class="main-body">
    <div class="row address-info m-0 align-items-center justify-content-center">
      <div class="address-title">
        <h3>{{ address.addr1 }}</h3>
        <h5>{{ address.city }}</h5>
      </div>
    </div>
    <h4>Notes</h4>
    <div class="notes">
      <li v-for="(note, index) in notes" :key="note.id" class="notes-list">
        <div class="row align-items-center">
          <b-col cols='10'>
            {{ note }}  
          </b-col>
          <b-col>
            <font-awesome-icon class="delete-button" icon="times" @click="deleteTag(index)"></font-awesome-icon>
          </b-col>
        </div>
      </li>
    </div>

    <div class="address-notes" ref="note-card">
      <div class="form-submit row align-items-center">
        <b-col cols="12">
          <b-form-input
          @focus="animateCard()"
          @blur="hideCard()"
          v-on:keyup.enter="submitForm()"
          v-model="formText"
          maxlength="100"
          placeholder="Add a note...">
          </b-form-input>
        </b-col>
      </div>
      <div class="submit-button">
        <b-button @click="submitForm()" variant="outline-primary">Add</b-button>
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
    deleteTag(index){
      this.notes.splice(index, 1);
    },
    animateCard(){
      this.$refs['note-card'].style.transform = 'translateY(-45%)';
    },
    hideCard(){
      this.$refs['note-card'].style.transform = 'translateY(0)';
    },
    submitForm(){
      this.notes.unshift(this.formText);
      this.formText = '';
      this.hideCard();
    },
  }
}

</script>

<style scoped>
.address-info {
  color: white;
  height: 200px;
  background-color: #007bff;
}
h3 {
  /* margin-top: 30px; */
  font-weight: 700;
}
h4 {
  color: #007bff;
  font-weight: 700;
  text-align: left;
  padding-left: 20px;
}
.address-notes {
  position: fixed;
  top: 85%;
  background-color: white;
  height: 1000px;
  width: 100%;
  border-radius: 30px;
  box-shadow: 0 -4px 6px 0 hsla(0, 0%, 14%, 0.1);
  transition: all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.form-submit {
  margin: 0 20px;
  padding-top: 30px;
}
.notes {
  overflow: scroll;
  height: 40%;
}
.notes-list {
  text-align: left;
  padding: 20px;
  overflow-wrap: break-word;
}
.delete-button {
  float: right;
  color: rgb(201, 201, 201);
}

.submit-button {
  margin-top: 30%;
}
li {
  list-style: none;
}
h4 {
  padding-top: 20px;
}

input {
  border: none;
  box-shadow: none !important;
}
</style>
