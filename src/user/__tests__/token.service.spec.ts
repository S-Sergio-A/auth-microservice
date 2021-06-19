import {TokenService} from "../services/auth/token.service";
import {RefreshSessionDocument} from "../schemas/refreshSession.schema";
import {Model} from "mongoose";
import {Test, TestingModule} from "@nestjs/testing";
import {JWTTokens} from "../services/auth/interfaces/auth.service.interface";
import {INestApplication} from "@nestjs/common";

describe('TokenService', () => {
  let app: INestApplication;
  let testingModule: TestingModule;
  let spyService: TokenService;
  let refreshSessionModel: Model<RefreshSessionDocument>
  
  beforeEach(() => {
    spyService = new TokenService(refreshSessionModel);
  
    testingModule = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [
        {
          provide: TokenService,
          useFactory: () => ({
            findAll: jest.fn((obj) => [catMock]),
            save: jest.fn((cat) => cat)
          }),
        },
      ],
    }).compile();
  
    spyService = testingModule.get(TokenService);
  
    app = testingModule.createNestApplication();
    await app.init();
  });
  
  describe('generateJWT', () => {
    it('should generate jwt', async () => {
      const body: JWTTokens = {
        token: '',
        refreshToken: ''
      };
      const success = true;
      const errorCode = 100;
      
      const userData = {
        userId: '',
        username: ''
      };
      const sessionData = {
        ip: '',
        userAgent: '',
        fingerprint: '',
        expiresIn: 0,
        createdAt: 0
      };
      
      let result = {body, success, errorCode};
      
      const spy = jest.spyOn(spyService, 'generateJWT')
        // .mockImplementation(async () => result);
      const isGenerated = spyService.generateJWT(userData, sessionData);
      expect(spy).toReturn();
      // expect(isGenerated).toReturn();
  
      spy.mockRestore();
    });
  });
});
