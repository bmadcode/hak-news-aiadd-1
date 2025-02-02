import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionService],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    ddbMock.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addSubscription', () => {
    it('should add a subscription successfully', async () => {
      const email = 'test@example.com';
      const subscriptionType = 'hakdaily';

      ddbMock.on(PutCommand).resolves({});

      await service.addSubscription(email, subscriptionType);

      expect(ddbMock.calls()).toHaveLength(1);
      const putCall = ddbMock.commandCalls(PutCommand)[0];
      const { TableName, Item } = putCall.args[0].input;

      expect(TableName).toBe('hak-news-subscriptions');
      expect(Item?.pk).toBe('sub:hakdaily');
      expect(Item?.sk).toBe(email);
      expect(Item?.createdAt).toBeDefined();
      expect(Item?.updatedAt).toBeDefined();
    });
  });

  describe('removeSubscription', () => {
    it('should remove a subscription successfully', async () => {
      const email = 'test@example.com';
      const subscriptionType = 'hakdaily';

      ddbMock.on(DeleteCommand).resolves({});

      await service.removeSubscription(email, subscriptionType);

      expect(ddbMock.calls()).toHaveLength(1);
      const deleteCall = ddbMock.commandCalls(DeleteCommand)[0];
      const { TableName, Key } = deleteCall.args[0].input;

      expect(TableName).toBe('hak-news-subscriptions');
      expect(Key?.pk).toBe('sub:hakdaily');
      expect(Key?.sk).toBe(email);
    });
  });

  describe('isSubscribed', () => {
    it('should return true for subscribed email', async () => {
      const email = 'test@example.com';
      const subscriptionType = 'hakdaily';

      ddbMock.on(GetCommand).resolves({
        Item: {
          pk: `sub:${subscriptionType}`,
          sk: email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const result = await service.isSubscribed(email, subscriptionType);

      expect(result).toBe(true);
      expect(ddbMock.calls()).toHaveLength(1);
      const getCall = ddbMock.commandCalls(GetCommand)[0];
      const { TableName, Key } = getCall.args[0].input;

      expect(TableName).toBe('hak-news-subscriptions');
      expect(Key?.pk).toBe('sub:hakdaily');
      expect(Key?.sk).toBe(email);
    });

    it('should return false for unsubscribed email', async () => {
      const email = 'test@example.com';
      const subscriptionType = 'hakdaily';

      ddbMock.on(GetCommand).resolves({});

      const result = await service.isSubscribed(email, subscriptionType);

      expect(result).toBe(false);
    });
  });

  describe('getSubscribers', () => {
    it('should return all subscribers for a subscription type', async () => {
      const subscriptionType = 'hakdaily';
      const subscribers = [
        { sk: 'test1@example.com' },
        { sk: 'test2@example.com' },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: subscribers,
      });

      const result = await service.getSubscribers(subscriptionType);

      expect(result).toEqual(['test1@example.com', 'test2@example.com']);
      expect(ddbMock.calls()).toHaveLength(1);
      const queryCall = ddbMock.commandCalls(QueryCommand)[0];
      const { TableName, KeyConditionExpression, ExpressionAttributeValues } =
        queryCall.args[0].input;

      expect(TableName).toBe('hak-news-subscriptions');
      expect(KeyConditionExpression).toBe('pk = :pk');
      expect(ExpressionAttributeValues?.[':pk']).toBe('sub:hakdaily');
    });

    it('should return empty array when no subscribers exist', async () => {
      const subscriptionType = 'hakdaily';

      ddbMock.on(QueryCommand).resolves({
        Items: [],
      });

      const result = await service.getSubscribers(subscriptionType);

      expect(result).toEqual([]);
    });
  });
});
