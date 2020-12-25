import gql from 'graphql-tag';
import clone from 'lodash/clone';
import { InvalidTerritoryError } from '../../exceptions/custom-errors';

export const model = gql`fragment TerritoryModel on Territory {
  id
  group_id
  congregationid
  name
  description
  type
  status {
    checkout_id
    status
    date
    publisherid
    campaign
  }
  tags
}`;

export function validate(_terr, isNew) {
  const terr = clone(_terr);

  if (isNew && terr.id) {
    throw new InvalidTerritoryError('Territory ID must be empty when adding a new territory');
  }
  if (!terr.congregationid) {
    throw new InvalidTerritoryError('Congregation id is required');
  }
  if (!terr.group_id) {
    throw new InvalidTerritoryError('Group id is required');
  }
  if (!terr.name) {
    throw new InvalidTerritoryError('Territory name is required');
  }
  if (!terr.description) {
    throw new InvalidTerritoryError('Territory description is required');
  }
  if (!terr.type) {
    throw new InvalidTerritoryError('Territory type is required');
  }

  // convert nullable fields to empty string when null
  if (terr.description === null) {
    terr.description = '';
  }

  if (terr.tags === null) {
    terr.tags = '';
  }

  if (Number.isInteger(Number(terr.group_id))) {
    terr.group_id = Number(terr.group_id);
  }

  const ignoredProperties = [
    'addresses', 'inactiveAddresses', 'status', 'lastActivity', 'phones',
  ];

  for (const ignored of ignoredProperties) {
    if (ignored in terr) {
      delete terr[ignored];
    }
  }

  return terr;
}
