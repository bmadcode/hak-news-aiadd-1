import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import {
  SubscriptionRequest,
  SubscriptionRequestSchema,
  SubscriptionResponse,
  GetSubscribersResponse,
  SubscriptionTypeSchema,
} from '../dto/subscription.dto';
import { ApiKeyGuard } from '../../core/guards/api-key.guard';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';

@Controller('subscriptions')
@UseGuards(ApiKeyGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Subscribe to a newsletter
   * @param request - The subscription request containing email and type
   */
  @Post()
  async subscribe(
    @Body(new ZodValidationPipe(SubscriptionRequestSchema))
    request: SubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    try {
      const isSubscribed = await this.subscriptionService.isSubscribed(
        request.email,
        request.subscriptionType,
      );

      if (isSubscribed) {
        throw new HttpException(
          'Email is already subscribed to this newsletter',
          HttpStatus.CONFLICT,
        );
      }

      await this.subscriptionService.addSubscription(
        request.email,
        request.subscriptionType,
      );

      return {
        message: 'Successfully subscribed to newsletter',
        email: request.email,
        subscriptionType: request.subscriptionType,
        status: 'subscribed',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Unsubscribe from a newsletter
   * @param request - The subscription request containing email and type
   */
  @Delete()
  async unsubscribe(
    @Body(new ZodValidationPipe(SubscriptionRequestSchema))
    request: SubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    try {
      const isSubscribed = await this.subscriptionService.isSubscribed(
        request.email,
        request.subscriptionType,
      );

      if (!isSubscribed) {
        throw new HttpException(
          'Email is not subscribed to this newsletter',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.subscriptionService.removeSubscription(
        request.email,
        request.subscriptionType,
      );

      return {
        message: 'Successfully unsubscribed from newsletter',
        email: request.email,
        subscriptionType: request.subscriptionType,
        status: 'unsubscribed',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process unsubscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all subscribers for a subscription type
   * @param type - The subscription type to get subscribers for
   */
  @Get(':type')
  async getSubscribers(
    @Param('type', new ZodValidationPipe(SubscriptionTypeSchema))
    type: string,
  ): Promise<GetSubscribersResponse> {
    try {
      const subscribers = await this.subscriptionService.getSubscribers(type);

      return {
        subscriptionType: type,
        subscribers,
        count: subscribers.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve subscribers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
