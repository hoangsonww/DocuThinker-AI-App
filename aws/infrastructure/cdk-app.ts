#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DocuThinkerStack } from "./lib/docuthinker-stack";

const app = new cdk.App();
new DocuThinkerStack(app, "DocuThinkerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});
