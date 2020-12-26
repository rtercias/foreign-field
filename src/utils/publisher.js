export function displayName(publisher) {
  if (publisher.firstname && publisher.lastname) {
    return `${publisher.firstname} ${publisher.lastname}`;
  }
  return publisher.username;
}
