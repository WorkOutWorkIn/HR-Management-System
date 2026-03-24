import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import env from '../config/env.js';

const passwordPolicy = {
  minLength: 12,
  maxLength: 128,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

const TEMP_PASSWORD_CHARSETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  number: '23456789',
  special: '!@#$%^&*',
};

export function validatePasswordPolicy(password) {
  if (typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < passwordPolicy.minLength) {
    return `Password must be at least ${passwordPolicy.minLength} characters`;
  }

  if (password.length > passwordPolicy.maxLength) {
    return `Password must be at most ${passwordPolicy.maxLength} characters`;
  }

  if (!passwordPolicy.uppercase.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!passwordPolicy.lowercase.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!passwordPolicy.number.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!passwordPolicy.special.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, env.security.bcryptSaltRounds);
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

function pickRandomCharacter(characters) {
  return characters[randomInt(0, characters.length)];
}

export function generateTemporaryPassword(length = 16) {
  const requiredCharacters = [
    pickRandomCharacter(TEMP_PASSWORD_CHARSETS.uppercase),
    pickRandomCharacter(TEMP_PASSWORD_CHARSETS.lowercase),
    pickRandomCharacter(TEMP_PASSWORD_CHARSETS.number),
    pickRandomCharacter(TEMP_PASSWORD_CHARSETS.special),
  ];

  const combinedCharacterSet = Object.values(TEMP_PASSWORD_CHARSETS).join('');
  const passwordCharacters = [...requiredCharacters];

  while (passwordCharacters.length < length) {
    passwordCharacters.push(pickRandomCharacter(combinedCharacterSet));
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join('');
}
