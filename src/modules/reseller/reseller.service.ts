import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrganizationDocument } from '../organizations/schemas/organization.schema';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import {
  TransactionReason,
  WalletCategory,
} from '../wallet/schemas/wallet.schema';
import { WalletTxQueryDto } from '../wallet/dto/wallet.dto';
import { OrgStatus } from '../../common/enums';
import {
  ClientListQueryDto,
  CreateClientDto,
  TransferCreditsDto,
  UpdateClientDto,
} from './dto/reseller.dto';

const CATEGORIES = Object.values(WalletCategory);

@Injectable()
export class ResellerService {
  private readonly logger = new Logger(ResellerService.name);

  constructor(
    private readonly orgsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  // ── Dashboard ──────────────────────────────────────────────────────
  async dashboard(reseller: OrganizationDocument) {
    const resellerId = reseller._id.toString();
    const [credits, clients, transfers] = await Promise.all([
      this.walletService.getCredits(resellerId),
      this.orgsService.countClientsByStatus(resellerId),
      this.walletService.getTransferTotals(resellerId),
    ]);
    return {
      reseller: {
        id: resellerId,
        name: reseller.name,
        slug: reseller.slug,
        status: reseller.status,
      },
      credits,
      clients,
      transfers,
    };
  }

  // ── Clients ────────────────────────────────────────────────────────
  async createClient(
    reseller: OrganizationDocument,
    dto: CreateClientDto,
    userId: string,
  ) {
    const resellerId = reseller._id.toString();
    const { initialCredits, ...orgDto } = dto;

    // Check the reseller can cover the opening credits before creating anything.
    const wanted = CATEGORIES.filter((c) => (initialCredits?.[c] ?? 0) > 0);
    if (wanted.length) {
      const available = await this.walletService.getCredits(resellerId);
      const short = wanted.filter(
        (c) => (initialCredits![c] as number) > available[c],
      );
      if (short.length) {
        throw new BadRequestException(
          `Not enough credits for the opening balance: ` +
            short
              .map(
                (c) =>
                  `${c} needs ${initialCredits![c]}, you have ${available[c]}`,
              )
              .join('; '),
        );
      }
    }

    const client = await this.orgsService.create(orgDto, {
      createAdminUser: true,
      resellerId,
      source: 'reseller',
      // The reseller has already sold this client a plan; there is no trial to run.
      status: OrgStatus.ACTIVE,
    });
    const clientId = client._id.toString();

    // Balances were checked above, but the reseller's own sends can still race this. A failure
    // here leaves the client created with whatever did transfer, and says so.
    const creditErrors: string[] = [];
    for (const category of wanted) {
      try {
        await this.moveCredits(
          reseller,
          client,
          {
            category,
            credits: initialCredits![category] as number,
            note: 'Opening balance',
          },
          userId,
          'allocate',
        );
      } catch (e: any) {
        creditErrors.push(`${category}: ${e?.message ?? 'transfer failed'}`);
      }
    }

    this.logger.log(
      `Reseller ${resellerId} created client ${clientId} (${client.name})`,
    );
    return {
      organization: client,
      credits: await this.walletService.getCredits(clientId),
      ...(creditErrors.length ? { creditErrors } : {}),
    };
  }

  async listClients(resellerId: string, query: ClientListQueryDto) {
    const page = await this.orgsService.findClientsPage(resellerId, query);
    const balances = await this.walletService.getBalancesForOrgs(
      page.data.map((o) => o._id.toString()),
    );
    return {
      ...page,
      data: page.data.map((o) => ({
        ...o.toObject(),
        credits: balances.get(o._id.toString()) ?? {
          transactional: 0,
          promotional: 0,
          authentication: 0,
        },
      })),
    };
  }

  async getClient(resellerId: string, clientId: string) {
    const client = await this.orgsService.findClientOf(resellerId, clientId);
    const [credits, users] = await Promise.all([
      this.walletService.getCredits(clientId),
      this.usersService.findAllByOrganization(clientId),
    ]);
    return { organization: client, credits, users };
  }

  async updateClient(
    resellerId: string,
    clientId: string,
    dto: UpdateClientDto,
  ) {
    await this.orgsService.findClientOf(resellerId, clientId);
    return this.orgsService.update(clientId, dto);
  }

  async setClientStatus(
    resellerId: string,
    clientId: string,
    status: OrgStatus.ACTIVE | OrgStatus.SUSPENDED,
  ) {
    await this.orgsService.findClientOf(resellerId, clientId);
    return status === OrgStatus.SUSPENDED
      ? this.orgsService.suspend(clientId)
      : this.orgsService.activate(clientId);
  }

  async clientTransactions(
    resellerId: string,
    clientId: string,
    query: WalletTxQueryDto,
  ) {
    await this.orgsService.findClientOf(resellerId, clientId);
    return this.walletService.getTransactions(clientId, query);
  }

  async clientSummary(resellerId: string, clientId: string) {
    await this.orgsService.findClientOf(resellerId, clientId);
    return this.walletService.getUsageSummary(clientId);
  }

  // ── Credits ────────────────────────────────────────────────────────
  async allocate(
    reseller: OrganizationDocument,
    clientId: string,
    dto: TransferCreditsDto,
    userId: string,
  ) {
    const client = await this.orgsService.findClientOf(
      reseller._id.toString(),
      clientId,
    );
    return this.moveCredits(reseller, client, dto, userId, 'allocate');
  }

  async revoke(
    reseller: OrganizationDocument,
    clientId: string,
    dto: TransferCreditsDto,
    userId: string,
  ) {
    const client = await this.orgsService.findClientOf(
      reseller._id.toString(),
      clientId,
    );
    return this.moveCredits(reseller, client, dto, userId, 'revoke');
  }

  /** The reseller's own transfer history (both directions). */
  async transfers(resellerId: string, query: WalletTxQueryDto) {
    return this.walletService.getTransactions(resellerId, {
      ...query,
      reason: TransactionReason.TRANSFER,
    });
  }

  private async moveCredits(
    reseller: OrganizationDocument,
    client: OrganizationDocument,
    dto: TransferCreditsDto,
    userId: string,
    direction: 'allocate' | 'revoke',
  ) {
    const resellerId = reseller._id.toString();
    const clientId = client._id.toString();
    const { category, credits } = dto;
    const note = dto.note ? ` — ${dto.note}` : '';

    const result =
      direction === 'allocate'
        ? await this.walletService.transferCredits(resellerId, clientId, {
            category,
            credits,
            performedBy: userId,
            netAddedOn: 'receiver',
            fromDescription: `Allocated ${credits} ${category} credits to ${client.name}${note}`,
            toDescription: `${credits} ${category} credits added by ${reseller.name}${note}`,
          })
        : await this.walletService.transferCredits(clientId, resellerId, {
            category,
            credits,
            performedBy: userId,
            netAddedOn: 'sender',
            fromDescription: `${credits} ${category} credits withdrawn by ${reseller.name}${note}`,
            toDescription: `Took back ${credits} ${category} credits from ${client.name}${note}`,
          });

    const [resellerCredits, clientCredits] =
      direction === 'allocate'
        ? [result.from, result.to]
        : [result.to, result.from];

    return {
      transferId: result.transferId,
      direction,
      category,
      credits,
      resellerCredits,
      clientCredits,
    };
  }
}
