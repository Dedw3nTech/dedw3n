import * as schema from "@shared/schema";
import * as fraudSchema from "@shared/fraud-schema";

// Fallback database implementation when connection fails
export const fallbackStorage = {
  users: new Map(),
  products: new Map(),
  posts: new Map(),
  messages: new Map(),
  orders: new Map(),
  vendors: new Map()
};

// Mock database client for development/testing
export const mockDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([]),
        offset: () => Promise.resolve([])
      }),
      limit: () => Promise.resolve([]),
      offset: () => Promise.resolve([])
    }),
    limit: () => Promise.resolve([]),
    offset: () => Promise.resolve([])
  }),
  insert: () => ({
    into: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 1 }])
      })
    })
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([])
      })
    })
  }),
  delete: () => ({
    from: () => ({
      where: () => Promise.resolve([])
    })
  })
};

export const fallbackPool = {
  connect: () => Promise.resolve({
    release: () => {},
    query: () => Promise.resolve({ rows: [] })
  }),
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve(),
  on: () => {}
};

console.log('Database fallback initialized - app will run with limited functionality');