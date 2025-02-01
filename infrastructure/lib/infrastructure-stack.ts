import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import { prodConfig, type EnvConfig } from '../config/env';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface HakNewsStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
  apiKeyName: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Ensure config is fully typed
    const config: Required<EnvConfig> = {
      ...prodConfig,
      // Production environment values
      STAGE: 'prod',
      NODE_ENV: 'production',
      API_KEY_NAME: 'HakNewsApiKey',
      // Provide defaults for optional values
      RATE_LIMIT: prodConfig.RATE_LIMIT ?? 100,
      BURST_LIMIT: prodConfig.BURST_LIMIT ?? 200,
      LAMBDA_MEMORY: prodConfig.LAMBDA_MEMORY ?? 2048,
      LAMBDA_TIMEOUT: prodConfig.LAMBDA_TIMEOUT ?? 60,
      HN_API_BASE_URL:
        prodConfig.HN_API_BASE_URL ?? 'https://hacker-news.firebaseio.com/v0',
      HN_API_RATE_LIMIT: prodConfig.HN_API_RATE_LIMIT ?? 500,
      // These must be provided through environment variables
      LLM_API_KEY: process.env.LLM_API_KEY ?? '',
      LLM_API_ENDPOINT: process.env.LLM_API_ENDPOINT ?? '',
      LLM_MODEL: process.env.LLM_MODEL ?? '',
      SMTP_HOST: process.env.SMTP_HOST ?? '',
      SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
      SMTP_USER: process.env.SMTP_USER ?? '',
      SMTP_PASS: process.env.SMTP_PASS ?? '',
    };

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'HakNewsApi', {
      restApiName: 'hak-news-api',
      description: 'Hacker News API with summarization capabilities',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
      },
    });

    // Create API Key and Usage Plan
    const apiKey = api.addApiKey('HakNewsApiKey', {
      apiKeyName: config.API_KEY_NAME,
      description: 'API Key for Hak News API',
    });

    const usagePlan = api.addUsagePlan('HakNewsUsagePlan', {
      name: 'hak-news-usage-plan',
      throttle: {
        rateLimit: config.RATE_LIMIT,
        burstLimit: config.BURST_LIMIT,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'HakNewsLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Hak News Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    // Create Lambda function
    const handler = new lambda.Function(this, 'HakNewsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist/lambda')),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(config.LAMBDA_TIMEOUT),
      memorySize: config.LAMBDA_MEMORY,
      environment: {
        NODE_ENV: config.NODE_ENV,
        HN_API_BASE_URL: config.HN_API_BASE_URL,
        HN_API_RATE_LIMIT: config.HN_API_RATE_LIMIT.toString(),
        LLM_API_KEY: process.env.LLM_API_KEY || '',
        LLM_API_ENDPOINT: process.env.LLM_API_ENDPOINT || '',
        LLM_MODEL: process.env.LLM_MODEL || '',
        LLM_BASE_URL: process.env.LLM_BASE_URL || '',
        LLM_MAX_TOKENS: process.env.LLM_MAX_TOKENS || '500',
        LLM_TEMPERATURE: process.env.LLM_TEMPERATURE || '0.7',
        LLM_RATE_LIMIT_PER_MINUTE:
          process.env.LLM_RATE_LIMIT_PER_MINUTE || '60',
        LLM_THINKING_TAG: process.env.LLM_THINKING_TAG || 'think',
        SMTP_HOST: process.env.SMTP_HOST || '',
        SMTP_PORT: process.env.SMTP_PORT || '587',
        SMTP_USER: process.env.SMTP_USER || '',
        SMTP_PASS: process.env.SMTP_PASS || '',
      },
    });

    // Create API Gateway integration
    const integration = new apigateway.LambdaIntegration(handler, {
      proxy: true,
      allowTestInvoke: true,
    });

    // Add proxy resource to handle all routes with API key requirement
    api.root.addProxy({
      defaultIntegration: integration,
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
    });

    // Export important values
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
