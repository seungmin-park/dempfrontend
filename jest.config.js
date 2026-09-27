module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest'
  }
}
