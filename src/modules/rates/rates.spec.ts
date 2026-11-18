import { Types } from 'mongoose';
import { priceItems, totals } from './rates.util';
import { RatesService } from './rates.service';

jest.mock('../organizations/organizations.service', () => ({
  OrganizationsService: class {},
}));

const NONE = { transactional: null, promotional: null, authentication: null };

describe('priceItems / totals', () => {
  it('1000 transactional at 13 paise is ₹130, plus 18% GST', () => {
    const items = priceItems(
      { ...NONE, transactional: 13 },
      { transactional: 1000 },
    );
    expect(items).toEqual([
      {
        category: 'transactional',
        quantity: 1000,
        ratePaise: 13,
        amountPaise: 13000,
      },
    ]);
    expect(totals(items, 18)).toEqual({
      subtotalPaise: 13000,
      gstPaise: 2340,
      totalPaise: 15340,
    });
  });

  it('handles fractional paise and rounds once per line', () => {
    // 333 × 11.25p = 3746.25p → 3746p
    const [item] = priceItems(
      { ...NONE, promotional: 11.25 },
      { promotional: 333 },
    );
    expect(item.amountPaise).toBe(3746);
    // 7 × 0.1p = 0.7p → 1p; float maths would give 0.7000000000000001
    expect(
      priceItems({ ...NONE, authentication: 0.1 }, { authentication: 7 })[0]
        .amountPaise,
    ).toBe(1);
  });

  it('skips zero quantities and refuses missing rates and empty orders', () => {
    const rates = { transactional: 13, promotional: null, authentication: 13 };
    expect(
      priceItems(rates, { transactional: 10, promotional: 0 }),
    ).toHaveLength(1);
    expect(() => priceItems(rates, { promotional: 5 })).toThrow(
      /Promotional messages are not available/,
    );
    expect(() => priceItems(rates, {})).toThrow(/how many messages/);
    expect(() => priceItems(rates, { transactional: 1.5 })).toThrow(
      /whole number/,
    );
  });
});

describe('RatesService.effectiveRates', () => {
  const settings = {
    defaultRates: { transactional: 13, promotional: 85, authentication: null },
    gstPercent: 18,
    minPurchase: 100,
  };
  const service = new RatesService({} as any, {} as any);

  it('direct customer: own rate first, then the default', async () => {
    const org: any = { reseller: null, rates: { transactional: 11 } };
    const r = await service.effectiveRates(org, settings);
    expect(r.rates).toEqual({
      transactional: 11,
      promotional: 85,
      authentication: null,
    });
    expect(r.source).toEqual({
      transactional: 'custom',
      promotional: 'default',
      authentication: 'unset',
    });
  });

  it("reseller client: only the reseller's rates, never our defaults", async () => {
    const org: any = {
      reseller: new Types.ObjectId(),
      rates: { transactional: 18 },
    };
    const r = await service.effectiveRates(org, settings);
    expect(r.rates).toEqual({
      transactional: 18,
      promotional: null,
      authentication: null,
    });
  });
});
