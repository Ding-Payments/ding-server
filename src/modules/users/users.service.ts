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
