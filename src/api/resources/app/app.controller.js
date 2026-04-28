/**
 * App metadata controller - e.g. version check for mobile app updates
 */

/**
 * GET /api/app/version
 * Returns latest app version info for update checks. Public (no auth).
 * Env: APP_LATEST_VERSION, APP_MIN_VERSION (optional), APP_UPDATE_URL (optional)
 */
const getVersion = (req, res, next) => {
  const latestVersion = process.env.APP_LATEST_VERSION || '13.0.0';
  const minVersion = process.env.APP_MIN_VERSION || latestVersion;
  const updateUrl = process.env.APP_UPDATE_URL || '';

  return res.json({
    success: true,
    data: {
      latestVersion,
      minVersion,
      updateUrl: updateUrl || null,
    },
  });
};

module.exports = {
  getVersion,
};
