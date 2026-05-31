/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "fund17",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: { region: "us-west-2" },
      }
    };
  },
  async run() {
    new sst.aws.TanStackStart("web");
  },
  console: {
    autodeploy: {
      target(event) {
        // Force 'main' branch to deploy to 'production' stage
        if (event.type === "branch" && event.branch === "main") {
          return { stage: "production" };
        }
      }
    }
  }
});
