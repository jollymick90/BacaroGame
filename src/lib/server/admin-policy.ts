export function emailList(value: string | undefined): string[] {
  const emails = (value ?? '').split(',').map(email => email.trim().toLowerCase());
  return [...new Set(emails.filter(Boolean))];
}

export function isSuperadmin(
  email: string,
  permanentEmails: string[],
  allowedEmails: string[],
  delegatedEmails: string[],
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (permanentEmails.includes(normalizedEmail)) {
    return true;
  }
  return allowedEmails.includes(normalizedEmail) && delegatedEmails.includes(normalizedEmail);
}

export function updateDelegatedAdmins(
  permanentEmails: string[],
  allowedEmails: string[],
  delegatedEmails: string[],
  email: string,
  enabled: boolean,
): string[] {
  const normalizedEmail = email.trim().toLowerCase();
  if (permanentEmails.includes(normalizedEmail)) {
    throw new Error('I superadmin permanenti si gestiscono nella configurazione del server.');
  }
  if (enabled && !allowedEmails.includes(normalizedEmail)) {
    throw new Error('Puoi nominare solo un membro già autorizzato ad accedere.');
  }

  const updatedEmails = delegatedEmails.filter(candidate => candidate !== normalizedEmail);
  if (enabled) {
    updatedEmails.push(normalizedEmail);
  }
  const effectiveEmails = updatedEmails.filter(candidate => allowedEmails.includes(candidate));
  if (permanentEmails.length === 0 && effectiveEmails.length === 0) {
    throw new Error('Non puoi revocare l’ultimo superadmin.');
  }
  return [...new Set(updatedEmails)].sort();
}

export function canDeleteMember(memberId: string, userId: string, superadmin: boolean): boolean {
  return superadmin || memberId === userId;
}

export function registrationMode(
  mode: unknown,
  superadmin: boolean,
  otherConsent: unknown,
): 'self' | 'other' {
  if (mode === undefined || mode === 'self') {
    return 'self';
  }
  if (mode !== 'other') {
    throw new Error('Modalità di registrazione non valida.');
  }
  if (!superadmin) {
    throw new Error('Solo un superadmin può registrare altre persone.');
  }
  if (otherConsent !== true) {
    throw new Error('Conferma il consenso esplicito della persona ritratta.');
  }
  return 'other';
}
