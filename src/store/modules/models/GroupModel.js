import gql from 'graphql-tag';
import clone from 'lodash/clone';
import { InvalidGroupError } from '../../exceptions/custom-errors';

export const model = gql`fragment GroupModel on Group {
  id
  congregation_id
  code
  description
  overseer
}`;

export function validate(_group, isNew) {
  const group = clone(_group);

  if (isNew && group.id) {
    throw new InvalidGroupError('Group ID must be empty when adding a new group');
  }
  if (!group.congregation_id) {
    throw new InvalidGroupError('Congregation ID is required');
  }
  if (!group.code) {
    throw new InvalidGroupError('Group code is required');
  }

  // convert nullable fields to empty string when null
  if (group.description === null) {
    group.description = '';
  }

  if (group.overseer === null) {
    group.overseer = '';
  }

  return group;
}
