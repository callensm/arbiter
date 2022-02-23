const withLess = require('next-with-less')

/** @type {import('next').NextConfig} */
module.exports = withLess({
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: {
        'primary-color': 'rgb(111, 116, 201)'
      }
    }
  },
  reactStrictMode: true,
  poweredByHeader: false,
  webpack: config => {
    config.experiments.asyncWebAssembly = true
    return config
  }
})
