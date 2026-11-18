import { Types } from 'mongoose';

/**
 * In-memory stand-ins for the Wallet and WalletTransaction models that apply updates the way
 * Mongo does for the operators WalletService uses: a filter match and its update happen as one
 * step, so conditional updates ($gte balance, $ne reference) behave atomically under Promise.all.
 */
const WALLET_DEFAULTS = {
  transactional: 0,
  promotional: 0,
  authentication: 0,
  totalTransactionalAdded: 0,
  totalPromotionalAdded: 0,
  totalAuthenticationAdded: 0,
  totalTransactionalUsed: 0,
  totalPromotionalUsed: 0,
  totalAuthenticationUsed: 0,
  lowTransactionalThreshold: 100,
  lowPromotionalThreshold: 100,
  lowAuthenticationThreshold: 20,
  lowTransactionalAlertSent: false,
  lowPromotionalAlertSent: false,
  lowAuthenticationAlertSent: false,
  blockOnEmpty: true,
};

const same = (a: any, b: any) => String(a) === String(b);

function matches(doc: any, filter: Record<string, any>): boolean {
  return Object.entries(filter).every(([k, cond]) => {
    const v = doc[k];
    if (cond && typeof cond === 'object' && !(cond instanceof Types.ObjectId)) {
      if ('$gte' in cond) return v >= cond.$gte;
      if ('$ne' in cond) {
        return Array.isArray(v)
          ? !v.some((x) => same(x, cond.$ne))
          : !same(v, cond.$ne);
      }
      if ('$in' in cond) return cond.$in.some((x: any) => same(x, v));
    }
    return same(v, cond);
  });
}

function apply(doc: any, update: any) {
  for (const [k, v] of Object.entries(update.$inc ?? {}))
    doc[k] = (doc[k] ?? 0) + (v as number);
  for (const [k, v] of Object.entries(update.$set ?? {})) doc[k] = v;
  for (const [k, v] of Object.entries<any>(update.$push ?? {})) {
    doc[k] = [...(doc[k] ?? []), ...v.$each];
    if (v.$slice) doc[k] = doc[k].slice(v.$slice);
  }
}

export function fakeWalletModels() {
  const wallets: any[] = [];
  const txs: any[] = [];

  const walletModel: any = {
    findOne: jest.fn(
      async (f: any) => wallets.find((w) => matches(w, f)) ?? null,
    ),
    create: jest.fn(async (doc: any) => {
      if (wallets.some((w) => same(w.organization, doc.organization))) {
        throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
      }
      const w = {
        _id: new Types.ObjectId(),
        ...WALLET_DEFAULTS,
        topupRefs: [],
        ...doc,
      };
      wallets.push(w);
      return w;
    }),
    findOneAndUpdate: jest.fn(async (f: any, u: any) => {
      const w = wallets.find((x) => matches(x, f));
      if (!w) return null;
      apply(w, u);
      return { ...w };
    }),
    updateOne: jest.fn(async (f: any, u: any) => {
      const w = wallets.find((x) => matches(x, f));
      if (!w) return { modifiedCount: 0 };
      apply(w, u);
      return { modifiedCount: 1 };
    }),
  };

  const txModel: any = {
    findOne: jest.fn(async (q: any) => txs.find((t) => matches(t, q)) ?? null),
    create: jest.fn(async (doc: any) => {
      const row = { _id: new Types.ObjectId(), ...doc };
      txs.push(row);
      return row;
    }),
    insertMany: jest.fn(async (docs: any[]) => {
      const rows = docs.map((d) => ({ _id: new Types.ObjectId(), ...d }));
      txs.push(...rows);
      return rows;
    }),
  };

  const wallet = (orgId: string) =>
    wallets.find((w) => same(w.organization, orgId));
  const seed = (orgId: string, values: Record<string, any>) =>
    walletModel.create({ organization: new Types.ObjectId(orgId), ...values });

  return { walletModel, txModel, wallets, txs, wallet, seed };
}
