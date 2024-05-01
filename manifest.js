module.exports = {
  identifier: "getting-started",
  name: "Lyre-AI",
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
        name: "Lyre-AI",
        url: "/project-menu"
      }
    ],
    "file-post-import": [
      {
        key: "translation-preparation",
        url: "/prepare-translation",
        signaturePatterns: {
          "fileName": "^.+\\.xml$",
          "fileContent": "<properties>\\s*<property\\s+name=.*value=.*/>"
        }
      }
    ],
    "custom-file-format": [
      {
        "key": "custom-file-format",
        "type": "custom-file-format",
        "url": "/process",
        "signaturePatterns": {
          "fileName": ".+\\.json$",
          "fileContent": "\"hello_world\":"
        }
      }
    ]
  }
}