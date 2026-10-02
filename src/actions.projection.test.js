import { describe, it, expect, vi } from 'vitest';

vi.mock('@openimis/fe-core', () => ({
  baseApiUrl: '/api',
  decodeId: (id) => id,
  dispatchMutationDefault: vi.fn(),
  dispatchMutationErr: vi.fn(),
  dispatchMutationReq: vi.fn(),
  dispatchMutationResp: vi.fn(),
  formatGQLString: (s) => s,
  formatGraphQLError: vi.fn(),
  formatMutation: vi.fn(),
  formatPageQuery: vi.fn(() => 'page-query'),
  formatPageQueryWithCount: vi.fn(() => 'page-query-with-count'),
  formatQuery: vi.fn(),
  formatServerError: vi.fn(),
  graphql: vi.fn(() => ({ type: 'GRAPHQL' })),
  graphqlWithVariables: vi.fn(),
  pageInfo: vi.fn(),
  parseData: vi.fn(),
  prepareMutation: vi.fn(),
}));

const { formatPageQuery, formatPageQueryWithCount } = await import('@openimis/fe-core');
const { fetchIndividual, fetchIndividuals } = await import('./actions');

const CONTRIBUTED = 'groupindividuals(isDeleted: false) { edges { node { recipientType } } }';
const modulesManager = (contribs = []) => ({
  getConf: (module, key, defaultValue) => defaultValue,
  getRef: () => null,
  getProjection: () => '{id}',
  getContribs: (key) => (key === 'individual.Individual.projection' ? contribs : []),
});

describe('individual projection contributions', () => {
  it('appends the contributed fields to the individuals searcher projection', () => {
    fetchIndividuals(modulesManager([CONTRIBUTED]), ['first: 10']);

    const [, , projection] = formatPageQueryWithCount.mock.calls.at(-1);
    expect(projection.at(-1)).toBe(CONTRIBUTED);
  });

  it('appends the contributed fields to the individual page projection', () => {
    fetchIndividual(modulesManager([CONTRIBUTED]), ['id: "1"']);

    const [, , projection] = formatPageQuery.mock.calls.at(-1);
    expect(projection.at(-1)).toBe(CONTRIBUTED);
  });

  it('leaves the projection unchanged without contributions', () => {
    fetchIndividuals(modulesManager(), ['first: 10']);
    const [, , plain] = formatPageQueryWithCount.mock.calls.at(-1);

    fetchIndividuals(modulesManager([CONTRIBUTED]), ['first: 10']);
    const [, , contributed] = formatPageQueryWithCount.mock.calls.at(-1);

    expect(contributed.slice(0, -1)).toEqual(plain);
  });
});
