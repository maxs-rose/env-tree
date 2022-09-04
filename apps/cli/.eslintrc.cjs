module.exports = {
  root: true,
  extends: ['custom'],
  overrides: [
    {
      files: '*.ts',
      rules: {
        'no-console': ['off'],
      },
    },
  ],
};
