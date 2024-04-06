module.exports = {
  identifier: "getting-started",
  name: "Getting Started",
  baseUrl: process.env.BASE_URL,
  logo: "/logo.svg",
  authentication: {
    type: "crowdin_app",
    clientId: process.env.CLIENT_ID
  },
  events: {
    installed: "/installed",
    uninstall: "/uninstall",
  },  
  scopes: ["project"],
  modules: {
    "project-menu": [
      {
        key: "menu",
        name: "Getting Started",
        url: "/project-menu"
      }
    ],
  }
}