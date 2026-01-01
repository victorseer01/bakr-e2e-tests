import { request, APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

/**
 * Create an authenticated API context
 * @param username - User's username
 * @param password - User's password
 * @returns APIRequestContext with authentication token
 */
export async function createAuthenticatedContext(
  username: string,
  password: string
): Promise<APIRequestContext> {
  // Create API request context
  const context = await request.newContext({
    baseURL: API_BASE_URL,
  });

  // Login to get token
  const response = await context.post('/api/auth/login', {
    data: {
      username,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const body = await response.json();
  const token = body.accessToken || body.token;

  if (!token) {
    throw new Error('No access token in login response');
  }

  // Create new context with auth token
  const authenticatedContext = await request.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Dispose the old context
  await context.dispose();

  return authenticatedContext;
}

/**
 * Cleanup test data via API
 * @param context - Authenticated API context
 * @param resourceType - Type of resource to cleanup (e.g., 'products', 'raw-materials')
 * @param ids - Array of IDs to delete
 */
export async function cleanupTestData(
  context: APIRequestContext,
  resourceType: string,
  ids: number[]
): Promise<void> {
  for (const id of ids) {
    try {
      await context.delete(`/api/${resourceType}/${id}`);
    } catch (error) {
      console.error(`Failed to cleanup ${resourceType} ${id}:`, error);
    }
  }
}
