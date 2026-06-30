import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { UserProfileDto, WalletResponseDto } from './dto/user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * SRV-026 — GET /v1/users/me
   * Returns the authenticated user's profile and linked wallets.
   * Syncs the user record on first access (upsert-on-login).
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the authenticated user profile including all linked Stellar wallets. ' +
      'Creates the user record on first access (upsert-on-login).',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'User profile with wallets',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.usersService.getProfile(user);
  }

  /**
   * SRV-027 + SRV-028 — POST /v1/users/me/wallet
   * Links a Stellar public key to the authenticated user's account.
   * The key is validated against the Stellar G... format (SRV-028).
   * Returns 201 with the created wallet, or 409 if already linked.
   */
  @Post('me/wallet')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Link Stellar wallet',
    description:
      'Links a Stellar Ed25519 public key to the authenticated user. ' +
      'The first wallet linked on a given network is automatically set as primary.',
  })
  @ApiCreatedResponse({
    type: WalletResponseDto,
    description: 'Wallet linked successfully',
  })
  @ApiConflictResponse({
    description: 'Wallet already linked (WALLET_ALREADY_LINKED)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async linkWallet(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkWalletDto,
  ): Promise<WalletResponseDto> {
    return this.usersService.linkWallet(user, dto);
  }
}
