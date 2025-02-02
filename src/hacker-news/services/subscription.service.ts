import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

/**
 * Schema for subscription records in DynamoDB
 */
export const SubscriptionSchema = z.object({
  pk: z.string(),
  sk: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Service for managing email subscriptions in DynamoDB
 */
@Injectable()
export class SubscriptionService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const client = new DynamoDBClient(this.getDynamoDBConfig());
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName =
      process.env.SUBSCRIPTIONS_TABLE_NAME || 'hak-news-subscriptions';
  }

  /**
   * Get DynamoDB configuration based on environment
   */
  private getDynamoDBConfig() {
    const isLocal = process.env.NODE_ENV !== 'production';

    if (isLocal) {
      return {
        endpoint: 'http://localhost:8000',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      };
    }

    return {};
  }

  /**
   * Add a new subscription
   * @param email - The email address to subscribe
   * @param subscriptionType - The type of subscription (e.g., 'hakdaily')
   */
  async addSubscription(
    email: string,
    subscriptionType: string,
  ): Promise<void> {
    const now = Date.now();
    const subscription: Subscription = {
      pk: `sub:${subscriptionType}`,
      sk: email,
      createdAt: now,
      updatedAt: now,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: subscription,
      }),
    );
  }

  /**
   * Remove a subscription
   * @param email - The email address to unsubscribe
   * @param subscriptionType - The type of subscription (e.g., 'hakdaily')
   */
  async removeSubscription(
    email: string,
    subscriptionType: string,
  ): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          pk: `sub:${subscriptionType}`,
          sk: email,
        },
      }),
    );
  }

  /**
   * Check if an email is subscribed to a specific type
   * @param email - The email address to check
   * @param subscriptionType - The type of subscription (e.g., 'hakdaily')
   */
  async isSubscribed(
    email: string,
    subscriptionType: string,
  ): Promise<boolean> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          pk: `sub:${subscriptionType}`,
          sk: email,
        },
      }),
    );

    return !!result.Item;
  }

  /**
   * Get all subscribers for a subscription type
   * @param subscriptionType - The type of subscription (e.g., 'hakdaily')
   */
  async getSubscribers(subscriptionType: string): Promise<string[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `sub:${subscriptionType}`,
        },
      }),
    );

    return (result.Items || []).map((item) => item.sk);
  }
}
