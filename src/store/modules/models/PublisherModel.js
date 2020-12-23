import gql from 'graphql-tag';
import clone from 'lodash/clone';
import { InvalidPublisherError } from '../../exceptions/custom-errors';

export const model = gql`fragment PublisherModel on Publisher {
  id
  congregationid
  firstname
  lastname
  username
  status
  role
}`;

export function validate(_publisher, isNew) {
  const publisher = clone(_publisher);

  if (isNew && publisher.id) {
    throw new InvalidPublisherError('Publisher ID must be empty when adding a new publisher');
  }
  if (!publisher.congregationid) {
    throw new InvalidPublisherError('Congregation ID is required');
  }
  if (!publisher.username) {
    throw new InvalidPublisherError('Username is required');
  }
  if (!publisher.role) {
    throw new InvalidPublisherError('Role is required');
  }

  // convert nullable fields to empty string when null
  if (publisher.firstname === null) {
    publisher.firstname = '';
  }

  if (publisher.lastname === null) {
    publisher.lastname = 0;
  }

  publisher.status = publisher.status ? 'active' : 'disabled';
  return publisher;
}
