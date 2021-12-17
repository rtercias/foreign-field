export const CongDefault = {
  options: {
    publishers: {
      loginHelperAccess: {
        options: [
          { value: null, text: 'Servants and elders only' },
          { value: 'RP-E', text: 'Include Assistants (RP-E)' },
        ],
      },
    },
    territories: {
      defaultSort: {
        options: [
          'Description',
          'Name',
        ],
      },
      cycle: 30,
    },
    territory: {
      defaultView: {
        options: [
          { value: 'address-list', text: 'Address List' },
          { value: 'phone-list', text: 'Phone List' },
        ],
      },
      redirectAfterCheckout: {
        options: [
          { value: true, text: 'Yes' },
          { value: false, text: 'No' },
        ],
      },
    },
    address: {
      customTags: '',
    },
    phone: {
      customTags: '',
    },
  },
};
