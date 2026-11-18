import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrganizationDocument } from '../organizations/schemas/organization.schema';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import {
  BalanceReason,
  TransactionReason,
  WalletCategory,
} from '../wallet/schemas/wallet.schema';
import { WalletTxQueryDto } from '../wallet/dto/wallet.dto';
import { OrgStatus } from '../../common/enums';
import { RatesService } from '../rates/rates.service';
import { RatesDto } from '../rates/dto/rates.dto';
import { readRates } from '../rates/rates.util';
import { BillingService } from '../billing/billing.service';
import { PageQueryDto, SalesQueryDto } from '../billing/dto/billing.dto';
import {
  BalanceChangeDto,
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
    private readonly ratesService: RatesService,
    private readonly billingService: BillingService,
  ) {}

  // ── Dashboard ──────────────────────────────────────────────────────
  async dashboard(reseller: OrganizationDocument) {
    const resellerId = reseller._id.toString();
    const [credits, clients, transfers, rates, settings, sales] =
      await Promise.all([
        this.walletService.getCredits(resellerId),
        this.orgsService.countClientsByStatus(resellerId),
        this.walletService.getTransferTotals(resellerId),
        this.ratesService.effectiveRates(reseller),
        this.ratesService.getSettings(),
        this.billingService.salesSummary(resellerId),
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
      // What the reseller pays us per message — its cost when its clients buy.
      rates: rates.rates,
      gstPercent: settings.gstPercent,
      sales,
    };
  }

  // ── Clients ────────────────────────────────────────────────────────
  async createClient(
    reseller: OrganizationDocument,
    dto: CreateClientDto,
    userId: string,
  ) {
    const resellerId = reseller._id.toString();
    const { initialCredits, rates, openingBalance, ...orgDto } = dto;

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
    let organization = client;
    if (rates) organization = await this.orgsService.setRates(clientId, rates);
    if (openingBalance && openingBalance > 0) {
      await this.walletService.changeBalance(clientId, {
        direction: 'credit',
        amountPaise: Math.round(openingBalance * 100),
        reason: BalanceReason.RESELLER_ADD,
        counterparty: resellerId,
        description: `Opening balance from ${reseller.name}`,
        performedBy: userId,
      });
    }

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
      organization,
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
      data: page.data.map((o) => {
        const w = balances.get(o._id.toString());
        return {
          ...o.toObject(),
          rates: readRates(o.rates),
          credits: w?.credits ?? {
            transactional: 0,
            promotional: 0,
            authentication: 0,
          },
          balance: (w?.balancePaise ?? 0) / 100,
        };
      }),
    };
  }

  async getClient(resellerId: string, clientId: string) {
    const client = await this.orgsService.findClientOf(resellerId, clientId);
    const [credits, users] = await Promise.all([
      this.walletService.getCredits(clientId),
      this.usersService.findAllByOrganization(clientId),
    ]);
    return {
      organization: client,
      credits,
      balance: credits.balance,
      rates: readRates(client.rates),
      users,
    };
  }

  // ── Client rates ───────────────────────────────────────────────────
  async setClientRates(resellerId: string, clientId: string, dto: RatesDto) {
    await this.orgsService.findClientOf(resellerId, clientId);
    const org = await this.orgsService.setRates(clientId, dto);
    this.logger.log(
      `Reseller ${resellerId} set rates for client ${clientId}: ${JSON.stringify(dto)}`,
    );
    return { rates: readRates(org.rates) };
  }

  // ── Client money balance ───────────────────────────────────────────
  /** The reseller collected money from its client and loads it so the client can buy messages. */
  async changeClientBalance(
    reseller: OrganizationDocument,
    clientId: string,
    dto: BalanceChangeDto,
    userId: string,
    direction: 'add' | 'deduct',
  ) {
    const resellerId = reseller._id.toString();
    const client = await this.orgsService.findClientOf(resellerId, clientId);
    const note = dto.note ? ` — ${dto.note}` : '';
    const res = await this.walletService.changeBalance(clientId, {
      direction: direction === 'add' ? 'credit' : 'debit',
      amountPaise: Math.round(dto.amount * 100),
      reason:
        direction === 'add'
          ? BalanceReason.RESELLER_ADD
          : BalanceReason.RESELLER_DEDUCT,
      counterparty: resellerId,
      description:
        direction === 'add'
          ? `Balance added by ${reseller.name}${note}`
          : `Balance deducted by ${reseller.name}${note}`,
      performedBy: userId,
    });
    this.logger.log(
      `Reseller ${resellerId} ${direction === 'add' ? 'added' : 'deducted'} ₹${dto.amount} ${direction === 'add' ? 'to' : 'from'} ${client.name}`,
    );
    return { balance: res.balancePaise / 100 };
  }

  async clientBalanceTransactions(
    resellerId: string,
    clientId: string,
    query: PageQueryDto,
  ) {
    await this.orgsService.findClientOf(resellerId, clientId);
    return this.walletService.getBalanceTransactions(clientId, query);
  }

  // ── Sales (client purchases from balance) ──────────────────────────
  async sales(resellerId: string, query: SalesQueryDto) {
    if (query.clientId)
      await this.orgsService.findClientOf(resellerId, query.clientId);
    return this.billingService.listSales(resellerId, query);
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
