module.exports = {
  extends: ["next", "prettier"],
  plugins: ["prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
    "prettier/prettier": "error",
    "no-console": [
      "error",
      {
        allow: ["warn", "error"],
      },
    ],
    "brace-style": [2, "1tbs"],
    curly: [2, "all"],
    eqeqeq: [2, "allow-null"],
  },
};
