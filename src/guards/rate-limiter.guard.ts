import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express'; // Import Request type
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private rateLimiter: RateLimiterMemory;

  constructor() {
    this.rateLimiter = new RateLimiterMemory({
      points: 5, // Number of points
      duration: 1, // Per second
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>(); // Specify Request type
    const { ip } = request;

    try {
      if (!ip) return false;
      await this.rateLimiter.consume(ip); // Consume a point
      return true; // Allow the request
    } catch {
      return false; // Reject the request
    }
  }
}
