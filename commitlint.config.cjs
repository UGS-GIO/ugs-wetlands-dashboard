module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Max 100 characters
    'header-max-length': [2, 'always', 100],

    // No body allowed
    'body-empty': [2, 'always'],

    // No footer allowed (no co-authors, etc)
    'footer-empty': [2, 'always'],

    // Enforce lowercase
    'subject-case': [2, 'always', 'lower-case'],

    // No trailing period
    'subject-full-stop': [2, 'never', '.'],
  },
};
