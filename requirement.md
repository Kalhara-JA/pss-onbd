Profit Shareholder™ System (PSS) – Technical Evaluation Test
Purpose:
To evaluate your ability to implement a backend module based on our architecture principles:

Zero Trust compliance

Strict adherence to OpenAPI spec

Audit-readiness

Clean, scalable code structure

Test Module: ONBD (Contributor Onboarding – Tier 2)
Objective:
Build a contributor onboarding API that allows a company admin to invite users or enables users to self-register with role-based tagging.

Key Requirements
Functionality:
Endpoint 1: POST /invite-contributor

Accepts contributor email, role ("pgc" or "npgc"), optional department

Sends invitation token (simulated logic; no need for real email)

Stores token in DB with expiry (24h)

Endpoint 2: POST /register

Accepts token and contributor info (name, password, role override if allowed)

Validates token, creates contributor, sets status to pending_approval

Endpoint 3: GET /registration-status/:id

Returns contributor status (e.g., pending_approval, approved, rejected)

Security & Compliance
All endpoints must validate input using DTOs

RBAC: only Admin can call invite-contributor

Use JWT authentication (simulated is fine)

Apply basic rate limiting logic (e.g., max 5 requests/minute per IP)

Sanitize and validate all user input

Tech & Tools
Framework: NestJS

DB: PostgreSQL (simulated with Prisma or in-memory okay for test)

Deliverable: GitHub repo or zip file

Include:

OpenAPI annotations (@ApiTags, @ApiOperation, etc.)

Clear README

Short notes explaining any assumptions

Evaluation Criteria
Area Requirement
Code Structure Follows NestJS module/service/controller pattern
Security JWT, RBAC, input validation, ZT principles
Clean Architecture Reusable services, no logic in controllers
Documentation OpenAPI annotations, README
Compliance Hooks Simulated audit logging / token expiry checks
Response Handling Standardized, secure, well-typed responses

We have one additional task for candidates being considered for Tier 4 module implementation — since these modules involve advanced security, audit, and compliance logic, we need to verify your alignment with our strict Zero Trust standards.

If you're open to moving forward, here's the follow-up task:

PSS Advanced Security Layer Test (Tier 4 Readiness)
Please update or supplement your existing test module to include the following:

Multi-Role Access Logic
Add support for multiple roles (e.g., Admin, Contributor, Auditor) with route-level control using NestJS Guards.

Rate Limiting
Implement basic request throttling (e.g., 10 requests per minute per user/IP).

Audit Trail Service
Create a service that logs every request to a DB table with:

Timestamp

User ID

IP address

Endpoint hit

Response status

AES-256 Encryption for Sensitive Payloads
Encrypt a specific field (e.g., contributor bank account) at rest using AES-256, with secure key management.

.env Secrets Handling
Use environment variables for all secrets (e.g., JWT keys, encryption secrets). No hardcoding.

Non-Root Docker Build
Confirm your Dockerfile runs using a non-root user and does not expose sensitive layers.
----

// test/contributor.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ContributorService } from '../src/contributor/contributor.service';
import { PrismaService } from '../src/prisma/prisma.service';
import \* as bcrypt from 'bcrypt';

describe('ContributorService', () => {
let service: ContributorService;
const mockPrisma = {
invitation: {
create: jest.fn(),
findUnique: jest.fn(),
update: jest.fn(),
},
contributor: {
create: jest.fn(),
findUnique: jest.fn(),
},
} as unknown as PrismaService;

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
providers: \[
ContributorService,
{ provide: PrismaService, useValue: mockPrisma },
],
}).compile();

```
service = module.get<ContributorService>(ContributorService);
```

});

afterEach(() => jest.clearAllMocks());

it('generates an invitation token and expiry', async () => {
mockPrisma.invitation.create.mockResolvedValue({});
const dto = { email: '[user@example.com](mailto:user@example.com)', role: 'pgc', department: 'dev' } as any;

```
const result = await service.invite(dto);

expect(result).toHaveProperty('token');
expect(result).toHaveProperty('expiresAt');
expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
  expect.objectContaining({ data: expect.objectContaining({ email: dto.email, role: dto.role }) }),
);
```

});

it('registers a contributor with valid token', async () => {
const token = 'valid-token';
const invitation = {
token,
used: false,
expiresAt: new Date(Date.now() + 10000),
email: '[new@example.com](mailto:new@example.com)',
role: 'npgc',
department: null,
};
mockPrisma.invitation.findUnique.mockResolvedValue(invitation);
mockPrisma.contributor.create.mockResolvedValue({ id: 'uuid', password: 'hashed', status: 'pending\_approval' });
mockPrisma.invitation.update.mockResolvedValue({});

```
const contributor = await service.register({ token, name: 'Alice', password: 'password123' } as any);

expect(contributor).toMatchObject({ id: 'uuid', status: 'pending_approval' });
expect(mockPrisma.invitation.update).toHaveBeenCalledWith({ where: { token }, data: { used: true } });
```

});

it('throws error for invalid or expired token', async () => {
mockPrisma.invitation.findUnique.mockResolvedValue(null);
await expect(service.register({ token: 'bad', name: 'X', password: 'pw' } as any))
.rejects.toThrow('Invalid or expired token');
});

it('returns contributor status', async () => {
mockPrisma.contributor.findUnique.mockResolvedValue({ id: 'xyz', status: 'approved' });
const res = await service.status('xyz');
expect(res).toEqual({ status: 'approved' });
});

it('throws if contributor not found', async () => {
mockPrisma.contributor.findUnique.mockResolvedValue(null);
await expect(service.status('none')).rejects.toThrow();
});
});

// test/contributor.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ContributorController } from '../src/contributor/contributor.controller';
import { ContributorService } from '../src/contributor/contributor.service';

describe('ContributorController', () => {
let controller: ContributorController;
const mockService = { invite: jest.fn(), register: jest.fn(), status: jest.fn() };

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
controllers: \[ContributorController],
providers: \[{ provide: ContributorService, useValue: mockService }],
}).compile();

```
controller = module.get<ContributorController>(ContributorController);
```

});

afterEach(() => jest.clearAllMocks());

it('invite() should call service.invite', async () => {
mockService.invite.mockResolvedValue({ token: 't', expiresAt: new Date() });
const dto = { email: '[a@b.com](mailto:a@b.com)', role: 'pgc' };
const res = await controller.invite(dto as any);
expect(mockService.invite).toHaveBeenCalledWith(dto);
expect(res).toHaveProperty('token');
});

it('register() should call service.register', async () => {
mockService.register.mockResolvedValue({ id: 'id' });
const dto = { token: 't', name: 'Bob', password: 'pw' };
const res = await controller.register(dto as any);
expect(mockService.register).toHaveBeenCalledWith(dto);
expect(res).toEqual({ id: 'id' });
});

it('status() should call service.status', async () => {
mockService.status.mockResolvedValue({ status: 'pending\_approval' });
const res = await controller.status('uuid');
expect(mockService.status).toHaveBeenCalledWith('uuid');
expect(res).toEqual({ status: 'pending\_approval' });
});
});

// test/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
let service: AuthService;
let jwt: JwtService;

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
providers: \[
AuthService,
{ provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
],
}).compile();

```
service = module.get<AuthService>(AuthService);
jwt = module.get<JwtService>(JwtService);
```

});

it('signPayload() should return signed token', () => {
const token = service.signPayload('1', 'Admin');
expect(jwt.sign).toHaveBeenCalledWith({ sub: '1', role: 'Admin' });
expect(token).toBe('token');
});
});

// test/roles.guard.spec.ts
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/roles.guard';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
let guard: RolesGuard;
let reflector: Reflector;

beforeEach(() => {
reflector = new Reflector();
guard = new RolesGuard(reflector);
});

function createContext(role?: string) {
return {
getHandler: () => {},
getClass: () => {},
switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
} as ExecutionContext;
}

it('allows when no roles metadata', () => {
jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
expect(guard.canActivate(createContext('Admin'))).toBe(true);
});

it('denies when no user present', () => {
jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(\['Admin']);
expect(guard.canActivate(createContext())).toBe(false);
});

it('denies when role not permitted', () => {
jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(\['Admin']);
expect(guard.canActivate(createContext('Guest'))).toBe(false);
});

it('allows when role permitted', () => {
jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(\['Guest', 'Admin']);
expect(guard.canActivate(createContext('Guest'))).toBe(true);
});
});

// test/audit.middleware.spec.ts
import { AuditService } from '../src/audit/audit.service';
import { EventEmitter } from 'events';

describe('AuditService Middleware', () => {
let service: AuditService;
const mockPrisma = { auditLog: { create: jest.fn() } } as any;

beforeEach(() => {
service = new AuditService(mockPrisma);
});

it('should create auditLog on response finish', (done) => {
const req: any = { ip: '10.0.0.1', originalUrl: '/test', user: { userId: 'u1' } };
const res = new EventEmitter() as any;
res.statusCode = 200;

```
service.use(req, res, () => {});
res.emit('finish');

setImmediate(() => {
  expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({ data: {
    userId: 'u1', ip: '10.0.0.1', endpoint: '/test', statusCode: 200
  }});
  done();
});
```

});
});
