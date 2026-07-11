/**
 * Strip EAS Update config during local development.
 * runtimeVersion + updates.url cause Expo Go to fetch OTA bundles instead of
 * Metro, which leads to "Something went wrong" after the dev session drops.
 */
module.exports = ({ config }) => {
  if (process.env.EAS_BUILD === 'true') {
    return config;
  }

  const expo = { ...config.expo };
  delete expo.runtimeVersion;
  delete expo.updates;

  return { ...config, expo };
};
