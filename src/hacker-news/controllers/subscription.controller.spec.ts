import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from '../services/subscription.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: {
            isSubscribed: jest.fn(),
            addSubscription: jest.fn(),
            removeSubscription: jest.fn(),
            getSubscribers: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('subscribe', () => {
    const request = {
      email: 'test@example.com',
      subscriptionType: 'hakdaily',
    };

    it('should subscribe a new email successfully', async () => {
      jest.spyOn(service, 'isSubscribed').mockResolvedValue(false);
      jest.spyOn(service, 'addSubscription').mockResolvedValue(undefined);

      const result = await controller.subscribe(request);

      expect(result).toEqual({
        message: 'Successfully subscribed to newsletter',
        email: request.email,
        subscriptionType: request.subscriptionType,
        status: 'subscribed',
      });
      expect(service.isSubscribed).toHaveBeenCalledWith(
        request.email,
        request.subscriptionType,
      );
      expect(service.addSubscription).toHaveBeenCalledWith(
        request.email,
        request.subscriptionType,
      );
    });

    it('should throw conflict exception for already subscribed email', async () => {
      jest.spyOn(service, 'isSubscribed').mockResolvedValue(true);

      await expect(controller.subscribe(request)).rejects.toThrow(
        new HttpException(
          'Email is already subscribed to this newsletter',
          HttpStatus.CONFLICT,
        ),
      );
      expect(service.addSubscription).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    const request = {
      email: 'test@example.com',
      subscriptionType: 'hakdaily',
    };

    it('should unsubscribe an email successfully', async () => {
      jest.spyOn(service, 'isSubscribed').mockResolvedValue(true);
      jest.spyOn(service, 'removeSubscription').mockResolvedValue(undefined);

      const result = await controller.unsubscribe(request);

      expect(result).toEqual({
        message: 'Successfully unsubscribed from newsletter',
        email: request.email,
        subscriptionType: request.subscriptionType,
        status: 'unsubscribed',
      });
      expect(service.isSubscribed).toHaveBeenCalledWith(
        request.email,
        request.subscriptionType,
      );
      expect(service.removeSubscription).toHaveBeenCalledWith(
        request.email,
        request.subscriptionType,
      );
    });

    it('should throw not found exception for non-subscribed email', async () => {
      jest.spyOn(service, 'isSubscribed').mockResolvedValue(false);

      await expect(controller.unsubscribe(request)).rejects.toThrow(
        new HttpException(
          'Email is not subscribed to this newsletter',
          HttpStatus.NOT_FOUND,
        ),
      );
      expect(service.removeSubscription).not.toHaveBeenCalled();
    });
  });

  describe('getSubscribers', () => {
    const subscriptionType = 'hakdaily';
    const subscribers = ['test1@example.com', 'test2@example.com'];

    it('should return all subscribers for a subscription type', async () => {
      jest.spyOn(service, 'getSubscribers').mockResolvedValue(subscribers);

      const result = await controller.getSubscribers(subscriptionType);

      expect(result).toEqual({
        subscriptionType,
        subscribers,
        count: subscribers.length,
      });
      expect(service.getSubscribers).toHaveBeenCalledWith(subscriptionType);
    });

    it('should return empty array when no subscribers exist', async () => {
      jest.spyOn(service, 'getSubscribers').mockResolvedValue([]);

      const result = await controller.getSubscribers(subscriptionType);

      expect(result).toEqual({
        subscriptionType,
        subscribers: [],
        count: 0,
      });
    });
  });
});
