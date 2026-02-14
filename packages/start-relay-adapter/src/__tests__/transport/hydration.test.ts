import type { PreloadedQuery } from "#@/preload/types.js";
import type { OperationType } from "relay-runtime";

import { createMockOperationDescriptor } from "#@/__tests__/utils/index.js";
import { createQueryCache } from "#@/query-cache.js";
import {
  dehydratePreloadedQuery,
  hydratePreloadedQuery,
} from "#@/transport/hydration.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("hydration", () => {
  // Mock StreamedPreloadedQuery for testing
  function createMockStreamedPreloadedQuery<
    TQuery extends OperationType = OperationType,
  >(
    overrides: Partial<{
      id: string;
      name: string;
      variables: TQuery["variables"];
      fetchPolicy: string;
    }> = {},
  ): PreloadedQuery<TQuery> {
    const operation = createMockOperationDescriptor({
      id: overrides.id ?? "TestQuery",
      name: overrides.name ?? "TestQuery",
      variables: (overrides.variables ?? {}) as Record<string, unknown>,
    });

    return {
      kind: "PreloadedQuery" as const,
      dispose: vi.fn(),
      environment: {} as any,
      isDisposed: false,
      source: undefined,
      environmentProviderOptions: undefined,
      fetchKey: "fetch-key-123",
      fetchPolicy: (overrides.fetchPolicy ?? "store-or-network") as any,
      networkCacheConfig: { force: false },
      id: overrides.id ?? "TestQuery",
      name: overrides.name ?? "TestQuery",
      variables: (overrides.variables ?? {}) as TQuery["variables"],
      $__relay_queryRef: {
        operation,
      },
    } as unknown as PreloadedQuery<TQuery>;
  }

  describe("dehydratePreloadedQuery", () => {
    it("removes non-serializable fields from preloaded query", () => {
      const preloadedQuery = createMockStreamedPreloadedQuery({
        id: "MyQuery",
        variables: { userId: "123" },
      });

      const dehydrated = dehydratePreloadedQuery(preloadedQuery);

      // Should NOT have these fields
      expect(dehydrated).not.toHaveProperty("dispose");
      expect(dehydrated).not.toHaveProperty("environment");
      expect(dehydrated).not.toHaveProperty("isDisposed");
      expect(dehydrated).not.toHaveProperty("networkError");
      expect(dehydrated).not.toHaveProperty("releaseQuery");
      expect(dehydrated).not.toHaveProperty("source");
    });

    it("preserves serializable fields", () => {
      const preloadedQuery = createMockStreamedPreloadedQuery({
        id: "MyQuery",
        name: "MyQuery",
        variables: { userId: "123", limit: 10 },
        fetchPolicy: "network-only",
      });

      const dehydrated = dehydratePreloadedQuery(preloadedQuery);

      expect(dehydrated.kind).toBe("PreloadedQuery");
      expect(dehydrated.id).toBe("MyQuery");
      expect(dehydrated.name).toBe("MyQuery");
      expect(dehydrated.variables).toEqual({ userId: "123", limit: 10 });
      expect(dehydrated.fetchPolicy).toBe("network-only");
      expect(dehydrated.fetchKey).toBe("fetch-key-123");
    });

    it("preserves operation descriptor reference", () => {
      const preloadedQuery = createMockStreamedPreloadedQuery({
        id: "TestQuery",
      });

      const dehydrated = dehydratePreloadedQuery(preloadedQuery);

      expect(dehydrated.$__relay_queryRef).toBeDefined();
      expect(dehydrated.$__relay_queryRef?.operation).toBe(
        preloadedQuery.$__relay_queryRef?.operation,
      );
    });

    it("preserves environmentProviderOptions", () => {
      const preloadedQuery = {
        ...createMockStreamedPreloadedQuery(),
        environmentProviderOptions: { customOption: true },
      };

      const dehydrated = dehydratePreloadedQuery(preloadedQuery);

      expect(dehydrated.environmentProviderOptions).toEqual({
        customOption: true,
      });
    });

    it("preserves networkCacheConfig", () => {
      const preloadedQuery = {
        ...createMockStreamedPreloadedQuery(),
        networkCacheConfig: { force: true },
      };

      const dehydrated = dehydratePreloadedQuery(preloadedQuery);

      expect(dehydrated.networkCacheConfig).toEqual({ force: true });
    });
  });

  describe("hydratePreloadedQuery", () => {
    let mockEnvironment: any;
    let queryCache: ReturnType<typeof createQueryCache>;

    beforeEach(() => {
      mockEnvironment = {
        getStore: vi.fn(),
        getNetwork: vi.fn(),
      };
      queryCache = createQueryCache({ isServer: false });
      // Suppress console.log during tests
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    it("creates a hydrated query from dehydrated data", () => {
      const originalQuery = createMockStreamedPreloadedQuery({
        id: "TestQuery",
        variables: { id: "1" },
      });
      const dehydrated = dehydratePreloadedQuery(originalQuery);

      const hydrated = hydratePreloadedQuery(
        mockEnvironment,
        dehydrated,
        queryCache,
      );

      expect(hydrated.kind).toBe("PreloadedQuery");
      expect(hydrated.id).toBe("TestQuery");
      expect(hydrated.variables).toEqual({ id: "1" });
      expect(hydrated.environment).toBe(mockEnvironment);
    });

    it("adds dispose function to hydrated query", () => {
      const originalQuery = createMockStreamedPreloadedQuery();
      const dehydrated = dehydratePreloadedQuery(originalQuery);

      const hydrated = hydratePreloadedQuery(
        mockEnvironment,
        dehydrated,
        queryCache,
      );

      expect(typeof hydrated.dispose).toBe("function");
    });

    it("dispose function is idempotent", () => {
      const originalQuery = createMockStreamedPreloadedQuery();
      const dehydrated = dehydratePreloadedQuery(originalQuery);

      const hydrated = hydratePreloadedQuery(
        mockEnvironment,
        dehydrated,
        queryCache,
      );

      // Should not throw when called multiple times
      hydrated.dispose();
      hydrated.dispose();
      hydrated.dispose();

      expect(hydrated.isDisposed).toBe(true);
    });

    it("tracks isDisposed state correctly", () => {
      const originalQuery = createMockStreamedPreloadedQuery();
      const dehydrated = dehydratePreloadedQuery(originalQuery);

      const hydrated = hydratePreloadedQuery(
        mockEnvironment,
        dehydrated,
        queryCache,
      );

      expect(hydrated.isDisposed).toBe(false);
      hydrated.dispose();
      expect(hydrated.isDisposed).toBe(true);
    });

    it("builds query in the query cache", () => {
      const originalQuery = createMockStreamedPreloadedQuery({
        id: "CachedQuery",
        variables: { x: 1 },
      });
      const dehydrated = dehydratePreloadedQuery(originalQuery);

      hydratePreloadedQuery(mockEnvironment, dehydrated, queryCache);

      // The query should now be in the cache
      const queryKey = 'CachedQuery:{"x":1}';
      expect(queryCache.get(queryKey)).toBeDefined();
    });

    it("preserves all metadata from dehydrated query", () => {
      const baseQuery = createMockStreamedPreloadedQuery({
        id: "MetadataQuery",
        name: "MetadataQuery",
        fetchPolicy: "store-and-network",
      });
      const originalQuery = {
        ...baseQuery,
        fetchKey: "unique-fetch-key",
        networkCacheConfig: { force: true },
        environmentProviderOptions: { test: true },
      };

      const dehydrated = dehydratePreloadedQuery(originalQuery);
      const hydrated = hydratePreloadedQuery(
        mockEnvironment,
        dehydrated,
        queryCache,
      );

      expect(hydrated.fetchKey).toBe("unique-fetch-key");
      expect(hydrated.fetchPolicy).toBe("store-and-network");
      expect(hydrated.networkCacheConfig).toEqual({ force: true });
      expect(hydrated.environmentProviderOptions).toEqual({ test: true });
    });
  });

  describe("round-trip serialization", () => {
    it("preserves query identity through dehydrate/hydrate cycle", () => {
      const queryCache = createQueryCache({ isServer: false });
      const mockEnvironment = {} as any;

      vi.spyOn(console, "log").mockImplementation(() => {});

      const original = createMockStreamedPreloadedQuery({
        id: "RoundTripQuery",
        variables: { limit: 5, offset: 10 },
      });

      const dehydrated = dehydratePreloadedQuery(original);
      const hydrated = hydratePreloadedQuery(
        mockEnvironment,
        dehydrated,
        queryCache,
      );

      expect(hydrated.id).toBe(original.id);
      expect(hydrated.name).toBe(original.name);
      expect(hydrated.variables).toEqual(original.variables);
      expect(hydrated.fetchPolicy).toBe(original.fetchPolicy);
    });
  });
});
