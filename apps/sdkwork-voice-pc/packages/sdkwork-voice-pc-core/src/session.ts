export interface SessionSnapshot {
  authToken?: string;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };
  context?: {
    tenantId: string;
    userId: string;
    organizationId?: string;
    sessionId?: string;
    appId?: string;
    environment?: string;
    deploymentMode?: string;
    actorId?: string;
    actorKind?: string;
    deviceId?: string;
    dataScope?: string[];
    permissionScope?: string[];
    authLevel?: string;
  };
  updatedAt?: string;
}
