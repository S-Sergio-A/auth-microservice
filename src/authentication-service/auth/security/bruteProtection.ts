import rateLimiterFlexiblePKG from 'rate-limiter-flexible';
import redisClient from '../config/redis.config.js';
import {errorCodes} from '../utils/errorCodes.js';

const {RateLimiterRedis, RateLimiterMemory} = rateLimiterFlexiblePKG;

const options = {
  points: 5, // 5 points
  duration: 1, // Per second
  blockDuration: 300, // block for 5 minutes if more than points consumed
};

const rateLimiter = new RateLimiterMemory(options);

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.connection.remoteAddress)
    .then(() => {
      res.set({
        'Retry-After': rateLimiter.msBeforeNext / 1000,
        'X-RateLimit-Limit': options.points,
        'X-RateLimit-Remaining': rateLimiter.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + rateLimiter.msBeforeNext)
      });
      next();
    })
    .catch((e) => {
      res.status(500).send({code: errorCodes.TOO_MANY_LOGIN_TRIES});
      console.log(e.stack)
    });
};

const MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY = 20;
const MAX_CONSECUTIVE_FAILS_BY_EMAIL_AND_IP = 40;

const limiterByIP = new RateLimiterRedis({
  redis: redisClient.client,
  keyPrefix: 'login_fail_ip_per_day',
  points: MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});

const limiterEmailAndIP = new RateLimiterRedis({
  redis: redisClient.client,
  keyPrefix: 'consecutive_login_fail_by_email_and_ip',
  points: MAX_CONSECUTIVE_FAILS_BY_EMAIL_AND_IP,
  duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
  blockDuration: 60 * 60 * 24 * 365 * 200 // Block for infinity after consecutive fails
});

const getEmailIpKey = (email, ip) => `${email}_${ip}`;

export {
  rateLimiterMiddleware,
  MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY,
  MAX_CONSECUTIVE_FAILS_BY_EMAIL_AND_IP,
  limiterByIP,
  limiterEmailAndIP,
  getEmailIpKey,
}
