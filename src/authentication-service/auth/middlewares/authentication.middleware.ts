import {HttpException} from '@nestjs/common/exceptions/http.exception';
import {NestMiddleware, HttpStatus, Injectable} from '@nestjs/common';
import {Request, Response, NextFunction} from 'express';

@Injectable()
export class ClientAuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeaders = req.headers.authorization;
    if (authHeaders && (authHeaders as string).split(' ')[1]) {
      const token = (authHeaders as string).split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET);
      const user = await this.userService.findById(decoded.id);
      
      if (!user) {
        throw new HttpException('User not found.', HttpStatus.UNAUTHORIZED);
      }
      
      req.user = user.user;
      next();
      
    } else {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }
    
  }
}
