const map = {
  'add-address': 'address/ADD_ADDRESS',
  'update-address': 'address/UPDATE_ADDRESS',
  'change-address-status': 'address/CHANGE_STATUS',
  'add-log': 'address/ADD_LOG',
  'add-note': 'address/ADD_TAG',
  'remove-note': 'address/REMOVE_TAG',
  'add-phone': 'phone/ADD_PHONE',
  'update-phone': 'phone/UPDATE_PHONE',
  'change-phone-status': 'phone/CHANGE_STATUS',
  'add-phone-tag': 'phone/ADD_TAG',
  'remove-phone-tag': 'phone/REMOVE_TAG',
  'checkout-territory': 'territory/CHANGE_STATUS',
  'checkin-territory': 'territory/CHANGE_STATUS',
  'reassign-territory': 'territory/CHANGE_STATUS',
  'check-in-all': 'territories/CHECKIN_ALL',
  'copy-checkouts': 'territories/COPY_CHECKOUTS',
};

export function mutationMapper(eventName) {
  return map[eventName];
}
