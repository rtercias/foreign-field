import gql from 'graphql-tag';

export const model = gql`fragment ActivityModel on ActivityLog {
  id
  checkout_id
  address_id
  value
  tz_offset
  timestamp
  timezone
  publisher_id
  notes
}`;

export function createActivityLog(id, addressId, value, checkoutId, user) {
  return {
    id,
    checkout_id: checkoutId,
    address_id: addressId,
    value,
    tz_offset: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    publisher_id: user.id,
  };
}
