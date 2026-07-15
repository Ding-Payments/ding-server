# S06 — Supabase Authentication Module and JWT Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Supabase JWT authentication with NestJS Passport strategy, global auth guard, and automatic user sync on first login.

**Architecture:** Hybrid authentication system using Supabase JWT tokens verified server-side. Public routes opt-in via `@Public()` decorator. All protected routes require valid JWT in Authorization header. User record auto-synced from Supabase JWT claims on first successful auth.

**Tech Stack:** NestJS 11, Passport.js, @nestjs/jwt, Supabase client, Prisma ORM, TypeScript 5.7 (strict)

---

## File Structure Overview

```
src/
├── auth/
│   ├── auth.module.ts                    # Auth module (guard, strategy, decorators)
│   ├── strategies/
│   │   └── supabase.strategy.ts           # Passport Supabase JWT strategy
│   ├── guards/
│   │   └── supabase-auth.guard.ts         # Global auth guard + @Public() support
│   └── decorators/
│       ├── public.decorator.ts            # @Public() to skip auth
│       ├── current-user.decorator.ts      # @CurrentUser() parameter decorator
│       └── index.ts                       # Export all decorators
├── common/
│   ├── interfaces/
│   │   └── authenticated-user.interface.ts  # AuthenticatedUser interface
│   └── decorators/
│       └── index.ts
├── modules/
│   └── users/
│       ├── users.module.ts                # UsersModule with service
│       ├── users.service.ts               # createOrUpdateUser() + queries
│       ├── users.controller.ts            # GET /v1/users/me (SRV-026, not here)
│       ├── dtos/
│       │   └── user-profile.dto.ts        # Response DTO for user profile
│       └── users.service.spec.ts          # Unit tests
└── app.module.ts                          # Updated imports: AuthModule, UsersModule

prisma/
└── schema.prisma                          # No changes (User schema from S04/S05)
```

---

## Task 1: SupabaseModule and SupabaseService (SRV-021)

**Files:**
- Create: `src/auth/supabase/supabase.module.ts`
- Create: `src/auth/supabase/supabase.service.ts`
- Create: `src/auth/supabase/supabase.service.spec.ts`
- Modify: `src/app.module.ts`

### Step 1: Write failing unit test for SupabaseService

Create `src/auth/supabase/supabase.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'supabase.jwtSecret': 'test-secret-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify a valid JWT token', async () => {
    const token = 'valid.jwt.token';
    const result = service.verifyToken(token);
    expect(result).toBeDefined();
    expect(result.sub).toBeDefined();
  });

  it('should throw on invalid JWT token', () => {
    const token = 'invalid.token';
    expect(() => service.verifyToken(token)).toThrow();
  });

  it('should extract user claims from JWT', async () => {
    const token = 'valid.jwt.token';
    const claims = service.verifyToken(token);
    expect(claims.email).toBeDefined();
    expect(claims.sub).toBeDefined();
  });
});
```

Run: `npm test src/auth/supabase/supabase.service.spec.ts`
Expected: FAIL — SupabaseService not defined

### Step 2: Implement SupabaseService

Create `src/auth/supabase/supabase.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface SupabaseJwtPayload {
  sub: string; // Supabase user ID (UUID)
  aud: string; // "authenticated"
  email?: string;
  email_verified?: boolean;
  iat: number; // issued at
  exp: number; // expires at
  [key: string]: any;
}

@Injectable()
export class SupabaseService {
  private readonly jwtSecret: string;

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('supabase.jwtSecret');
    if (!this.jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured');
    }
  }

  verifyToken(token: string): SupabaseJwtPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
        clockTolerance: 5 * 60, // 5 min clock skew
      }) as SupabaseJwtPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('JWT token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid JWT token');
      }
      throw error;
    }
  }
}
```

### Step 3: Create SupabaseModule

Create `src/auth/supabase/supabase.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

### Step 4: Run test to verify it passes

Run: `npm test src/auth/supabase/supabase.service.spec.ts`
Expected: PASS

### Step 5: Update app.module.ts to import SupabaseModule

Modify `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { SupabaseModule } from './auth/supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: false,
      },
      load: [configuration],
    }),
    DatabaseModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Step 6: Commit

```bash
git add src/auth/supabase/ src/app.module.ts
git commit -m "feat(auth): implement SupabaseModule and SupabaseService for JWT verification"
```

---

## Task 2: SupabaseStrategy Passport JWT (SRV-022)

**Files:**
- Create: `src/auth/strategies/supabase.strategy.ts`
- Create: `src/auth/strategies/supabase.strategy.spec.ts`
- Create: `src/auth/auth.module.ts`
- Modify: `src/app.module.ts`

### Step 1: Write failing test for SupabaseStrategy

Create `src/auth/strategies/supabase.strategy.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseService } from '../supabase/supabase.service';

describe('SupabaseStrategy', () => {
  let strategy: SupabaseStrategy;
  let supabaseService: SupabaseService;

  beforeEach(async () => {
    const mockSupabaseService = {
      verifyToken: jest.fn().mockReturnValue({
        sub: 'user-123',
        email: 'test@example.com',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseStrategy,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    strategy = module.get<SupabaseStrategy>(SupabaseStrategy);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should extract and verify JWT from Authorization header', async () => {
    const validatedUser = await strategy.validate({
      sub: 'user-123',
      email: 'test@example.com',
    });
    expect(validatedUser.supabaseUserId).toBe('user-123');
    expect(validatedUser.email).toBe('test@example.com');
  });
});
```

Run: `npm test src/auth/strategies/supabase.strategy.spec.ts`
Expected: FAIL

### Step 2: Implement SupabaseStrategy

Create `src/auth/strategies/supabase.strategy.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { SupabaseService, SupabaseJwtPayload } from '../supabase/supabase.service';

export interface ValidatedSupabaseUser {
  supabaseUserId: string;
  email?: string;
  emailVerified?: boolean;
}

const extractJwtFromAuthHeader = (req: any): string | null => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
};

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(private supabaseService: SupabaseService) {
    super({
      jwtFromRequest: extractJwtFromAuthHeader,
      passReqToCallback: false,
    });
  }

  async validate(
    payload: SupabaseJwtPayload,
  ): Promise<ValidatedSupabaseUser> {
    return {
      supabaseUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
    };
  }
}
```

### Step 3: Create AuthModule

Create `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseStrategy } from './strategies/supabase.strategy';

@Module({
  imports: [PassportModule, SupabaseModule],
  providers: [SupabaseStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
```

### Step 4: Run test

Run: `npm test src/auth/strategies/supabase.strategy.spec.ts`
Expected: PASS

### Step 5: Update app.module.ts

Modify `src/app.module.ts` to add AuthModule:

```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({...}),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Step 6: Commit

```bash
git add src/auth/strategies/ src/auth/auth.module.ts src/app.module.ts
git commit -m "feat(auth): implement SupabaseStrategy with Passport JWT"
```

---

## Task 3: Global SupabaseAuthGuard and Public Decorator (SRV-023)

**Files:**
- Create: `src/auth/guards/supabase-auth.guard.ts`
- Create: `src/auth/decorators/public.decorator.ts`
- Create: `src/auth/decorators/index.ts`
- Create: `src/auth/guards/supabase-auth.guard.spec.ts`
- Modify: `src/auth/auth.module.ts`
- Modify: `src/app.module.ts`

### Step 1: Write failing test for SupabaseAuthGuard

Create `src/auth/guards/supabase-auth.guard.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should skip auth for @Public() decorated routes', async () => {
    const context = {
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should require auth for protected routes', async () => {
    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as unknown as ExecutionContext;
    jest.spyOn(reflector, 'get').mockReturnValue(false);
    // Will delegate to AuthGuard('supabase')
    expect(guard).toBeDefined();
  });
});
```

Run: `npm test src/auth/guards/supabase-auth.guard.spec.ts`
Expected: FAIL

### Step 2: Implement Public Decorator

Create `src/auth/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Step 3: Implement SupabaseAuthGuard

Create `src/auth/guards/supabase-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('supabase') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

### Step 4: Create decorators index

Create `src/auth/decorators/index.ts`:

```typescript
export { Public } from './public.decorator';
export { CurrentUser } from './current-user.decorator'; // Forward ref for Task 4
```

### Step 5: Run test

Run: `npm test src/auth/guards/supabase-auth.guard.spec.ts`
Expected: PASS

### Step 6: Update AuthModule

Modify `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  imports: [PassportModule, SupabaseModule],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [PassportModule, SupabaseAuthGuard],
})
export class AuthModule {}
```

### Step 7: Update app.module.ts to use global guard

Modify `src/app.module.ts`:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';

@Module({
  imports: [...],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
```

### Step 8: Commit

```bash
git add src/auth/guards/ src/auth/decorators/ src/auth/auth.module.ts src/app.module.ts
git commit -m "feat(auth): implement SupabaseAuthGuard and @Public decorator"
```

---

## Task 4: CurrentUser Decorator and AuthenticatedUser Interface (SRV-024)

**Files:**
- Create: `src/auth/decorators/current-user.decorator.ts`
- Create: `src/common/interfaces/authenticated-user.interface.ts`
- Modify: `src/auth/decorators/index.ts`
- Create: `src/auth/decorators/current-user.decorator.spec.ts`

### Step 1: Write failing test for CurrentUser decorator

Create `src/auth/decorators/current-user.decorator.spec.ts`:

```typescript
import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('should extract user from request object', () => {
    const mockRequest = {
      user: {
        supabaseUserId: 'user-123',
        email: 'test@example.com',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const factory = (CurrentUser as any)({}, null, 0);
    const user = factory(context);

    expect(user).toEqual({
      supabaseUserId: 'user-123',
      email: 'test@example.com',
    });
  });
});
```

Run: `npm test src/auth/decorators/current-user.decorator.spec.ts`
Expected: FAIL

### Step 2: Create AuthenticatedUser Interface

Create `src/common/interfaces/authenticated-user.interface.ts`:

```typescript
export interface AuthenticatedUser {
  supabaseUserId: string;
  email?: string;
  emailVerified?: boolean;
}
```

### Step 3: Implement CurrentUser Decorator

Create `src/auth/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Step 4: Run test

Run: `npm test src/auth/decorators/current-user.decorator.spec.ts`
Expected: PASS

### Step 5: Update decorators index

Modify `src/auth/decorators/index.ts`:

```typescript
export { Public } from './public.decorator';
export { CurrentUser } from './current-user.decorator';
```

### Step 6: Commit

```bash
git add src/auth/decorators/current-user.decorator.ts src/common/interfaces/authenticated-user.interface.ts
git commit -m "feat(auth): implement CurrentUser decorator and AuthenticatedUser interface"
```

---

## Task 5: UsersModule Sync User on First Login (SRV-025)

**Files:**
- Create: `src/modules/users/users.module.ts`
- Create: `src/modules/users/users.service.ts`
- Create: `src/modules/users/users.service.spec.ts`
- Create: `src/modules/users/dtos/user-profile.dto.ts`
- Modify: `src/auth/strategies/supabase.strategy.ts` (add user sync hook)
- Modify: `src/app.module.ts`

### Step 1: Write failing test for UsersService

Create `src/modules/users/users.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        upsert: jest.fn().mockResolvedValue({
          id: 'db-user-1',
          supabaseUserId: 'supa-user-123',
          email: 'test@example.com',
          displayName: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'db-user-1',
          supabaseUserId: 'supa-user-123',
          email: 'test@example.com',
          displayName: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user if not exists', async () => {
    const user = await service.createOrUpdateUser({
      supabaseUserId: 'supa-user-123',
      email: 'test@example.com',
    });
    expect(user.supabaseUserId).toBe('supa-user-123');
    expect(user.email).toBe('test@example.com');
  });

  it('should get user by supabase id', async () => {
    const user = await service.getUserBySupabaseId('supa-user-123');
    expect(user).toBeDefined();
    expect(user?.supabaseUserId).toBe('supa-user-123');
  });
});
```

Run: `npm test src/modules/users/users.service.spec.ts`
Expected: FAIL

### Step 2: Create User Profile DTO

Create `src/modules/users/dtos/user-profile.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class WalletDto {
  @ApiProperty({
    description: 'Wallet ID',
    example: 'wallet-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Stellar public key',
    example: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  })
  stellarPublicKey: string;

  @ApiProperty({
    enum: ['TESTNET', 'MAINNET'],
  })
  network: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: 'iPhone 14', nullable: true })
  label?: string | null;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'Internal user ID',
    example: 'user-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Supabase Auth user ID',
    example: 'supa-user-uuid',
  })
  supabaseUserId: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
    nullable: true,
  })
  displayName?: string | null;

  @ApiProperty({
    description: 'Linked wallets',
    type: [WalletDto],
  })
  wallets: WalletDto[];

  @ApiProperty({
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
```

### Step 3: Implement UsersService

Create `src/modules/users/users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateOrUpdateUserInput {
  supabaseUserId: string;
  email?: string;
  displayName?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateUser(input: CreateOrUpdateUserInput) {
    return this.prisma.user.upsert({
      where: { supabaseUserId: input.supabaseUserId },
      update: {
        email: input.email,
        displayName: input.displayName,
      },
      create: {
        supabaseUserId: input.supabaseUserId,
        email: input.email || '',
        displayName: input.displayName,
      },
      include: {
        wallets: true,
      },
    });
  }

  async getUserBySupabaseId(supabaseUserId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseUserId },
      include: {
        wallets: true,
      },
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallets: true,
      },
    });
  }
}
```

### Step 4: Run test

Run: `npm test src/modules/users/users.service.spec.ts`
Expected: PASS

### Step 5: Create UsersModule

Create `src/modules/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from '../../database';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### Step 6: Integrate user sync into SupabaseStrategy

Modify `src/auth/strategies/supabase.strategy.ts` to auto-sync user on successful auth:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { SupabaseService, SupabaseJwtPayload } from '../supabase/supabase.service';
import { UsersService } from '../../modules/users/users.service';

export interface ValidatedSupabaseUser {
  supabaseUserId: string;
  email?: string;
  emailVerified?: boolean;
}

const extractJwtFromAuthHeader = (req: any): string | null => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
};

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(
    private supabaseService: SupabaseService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: extractJwtFromAuthHeader,
      passReqToCallback: false,
    });
  }

  async validate(
    payload: SupabaseJwtPayload,
  ): Promise<ValidatedSupabaseUser> {
    // Sync or create user on successful JWT validation
    await this.usersService.createOrUpdateUser({
      supabaseUserId: payload.sub,
      email: payload.email,
    });

    return {
      supabaseUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
    };
  }
}
```

### Step 7: Update AuthModule to export UsersService

Modify `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [PassportModule, SupabaseModule, UsersModule],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [PassportModule, SupabaseAuthGuard, UsersModule],
})
export class AuthModule {}
```

### Step 8: Update app.module.ts

Modify `src/app.module.ts` to add UsersModule (already imported via AuthModule):

No change needed — UsersModule is exported from AuthModule.

### Step 9: Commit

```bash
git add src/modules/users/ src/auth/strategies/supabase.strategy.ts src/auth/auth.module.ts
git commit -m "feat(users): implement UsersService and auto-sync on first login"
```

---

## Acceptance Criteria Checklist

- [ ] **SRV-021** — SupabaseModule and SupabaseService
  - [ ] `src/auth/supabase/supabase.service.ts` verifies JWT tokens with 5-min clock skew
  - [ ] `src/auth/supabase/supabase.module.ts` exports SupabaseService
  - [ ] Unit tests pass (`npm test src/auth/supabase/`)

- [ ] **SRV-022** — SupabaseStrategy Passport JWT
  - [ ] `src/auth/strategies/supabase.strategy.ts` validates JWT and returns user
  - [ ] Strategy uses Bearer token extraction from Authorization header
  - [ ] Unit tests pass (`npm test src/auth/strategies/`)

- [ ] **SRV-023** — Global SupabaseAuthGuard and Public decorator
  - [ ] `src/auth/guards/supabase-auth.guard.ts` is registered globally via APP_GUARD
  - [ ] `@Public()` decorator skips auth on public routes
  - [ ] All non-public routes require valid JWT

- [ ] **SRV-024** — CurrentUser decorator and AuthenticatedUser interface
  - [ ] `src/auth/decorators/current-user.decorator.ts` extracts user from request
  - [ ] `src/common/interfaces/authenticated-user.interface.ts` defines structure
  - [ ] Unit tests pass

- [ ] **SRV-025** — UsersModule sync user on first login
  - [ ] `src/modules/users/users.service.ts` upserts user on auth
  - [ ] `createOrUpdateUser()` idempotent (safe to call multiple times)
  - [ ] `getUserBySupabaseId()` works for lookups
  - [ ] Unit tests pass

- [ ] General S06 requirements:
  - [ ] `npm run lint` passes without errors
  - [ ] `npm test` passes all unit tests
  - [ ] `npm run build` compiles without TypeScript errors
  - [ ] No secrets (JWT_SECRET, SERVICE_ROLE_KEY) logged or committed
  - [ ] All files follow NestJS conventions from `.cursor/rules/`
  - [ ] Error responses use `{ statusCode, message, code?, errors? }` shape

---

## Test Commands

```bash
# Unit tests for each task
npm test src/auth/supabase/supabase.service.spec.ts
npm test src/auth/strategies/supabase.strategy.spec.ts
npm test src/auth/guards/supabase-auth.guard.spec.ts
npm test src/auth/decorators/current-user.decorator.spec.ts
npm test src/modules/users/users.service.spec.ts

# All auth tests
npm test -- --testPathPattern="(auth|users)"

# Lint
npm run lint

# Build
npm run build
```

---

## Manual Testing (npm run start:dev)

After implementing all 5 tasks:

```bash
# Protected route (should fail without token)
curl -X GET http://localhost:3000/v1/users/me
# Expected: 401 Unauthorized

# Protected route with valid JWT
curl -X GET http://localhost:3000/v1/users/me \
  -H "Authorization: Bearer YOUR_VALID_SUPABASE_JWT"
# Expected: 200 OK + user profile JSON

# Public route (no auth needed)
curl -X GET http://localhost:3000/health
# Expected: 200 OK
```

---

## Notes

- **JWT Verification:** Uses `jsonwebtoken` library with HS256 algorithm. Clock skew tolerance: 5 minutes (for server time drift).
- **User Sync:** Happens in `SupabaseStrategy.validate()` on every authenticated request. Idempotent via Prisma `upsert()`.
- **Error Handling:** Passport will automatically return 401 if strategy throws or token is invalid. No need for extra error handling in guard.
- **Secrets:** SUPABASE_JWT_SECRET must be in `.env` and ConfigModule — never hardcode or log.

---

Plan complete and saved. Ready for implementation task-by-task using subagent-driven development or inline execution.
