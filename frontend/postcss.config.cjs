const stripTailwindDirectivesUntilDependencyIsAvailable = {
  postcssPlugin: 'strip-tailwind-directives-until-dependency-is-available',
  AtRule(atRule) {
    if (atRule.name === 'tailwind') {
      atRule.remove()
    }
  },
}

module.exports = {
  plugins: [stripTailwindDirectivesUntilDependencyIsAvailable],
}
