const { default: axios } = require("axios");

const getActiveAccessToken = async (organization) => {
  if (organization.accessTokenExpires > Math.round(new Date().getTime() / 1000)) {
    return organization.accessToken;
  }

  const oauthPayload = {
    grant_type: "crowdin_app",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    app_id: organization.appId,
    app_secret: organization.appSecret,
    domain: organization.domain,
    user_id: organization.userId,
  };

  const response = await axios.post(process.env.AUTH_URL, oauthPayload);

  organization = await organization.update({
    accessToken: response.data.access_token,
    accessTokenExpires: Math.round(new Date().getTime() / 1000) + response.data.expires_in
  });

  return organization.accessToken;
};

module.exports = async (organization) => {
  const apiClient = axios.create({
    baseURL: `${ organization.baseUrl }/api/v2/`,
  });

  apiClient.interceptors.request.use(async (config) => {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${ await getActiveAccessToken(organization) }`,
    };

    return config;
  });

  return apiClient;
}
