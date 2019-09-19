const presets = [
  "@babel/preset-flow",
  [
    "@babel/preset-env",
    {
      targets: {
        "node": "6.14"
      }
    }
  ],
];


module.exports = {presets, babelrcRoots: ["."]};
