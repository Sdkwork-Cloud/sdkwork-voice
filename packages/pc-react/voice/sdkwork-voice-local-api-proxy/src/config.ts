import {
  VOICE_LOCAL_API_PROXY_DEFAULT_HOST,
  VOICE_LOCAL_API_PROXY_DEFAULT_PORT,
  VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA,
  VOICE_LOCAL_API_PROXY_SCHEMA_VERSION,
  type VoiceLocalApiClientProtocol,
  type VoiceLocalApiProxyBind,
  type VoiceLocalApiProxyCaptureConfig,
  type VoiceLocalApiProxyConfig,
  type VoiceLocalApiProxyConfigDraft,
  type VoiceLocalApiProxyDefaults,
  type VoiceLocalApiProxyExposure,
  type VoiceLocalApiProxyExposureDraft,
  type VoiceLocalApiProxyPolicies,
  type VoiceLocalApiProxyRoute,
  type VoiceLocalApiProxyRouteDraft,
  type VoiceLocalApiProxyRuntimeSettings,
  type VoiceProxyUpstreamIdentity,
  type VoiceRouteCapabilityBinding,
} from "./types.ts";

const DEFAULT_REDACT_HEADERS = ["authorization", "x-api-key"] as const;
const DEFAULT_EXPOSURE_TARGET: VoiceLocalApiProxyExposure = {
  enabled: true,
  label: "Desktop Clients",
  target: "desktop-clients",
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function normalizeIdentifier(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");

  return slug || fallback;
}

function normalizeStringList(values: readonly string[] | undefined, lowerCase = false) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const item = lowerCase ? normalizeString(value).toLowerCase() : normalizeString(value);
    if (!item || seen.has(item)) {
      continue;
    }
    seen.add(item);
    normalized.push(item);
  }

  return normalized;
}

function toTitleCase(value: string) {
  return value
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, "");
}

function buildPublicBaseUrl(bind: Pick<VoiceLocalApiProxyBind, "host" | "port">) {
  return `http://${bind.host}:${bind.port}`;
}

function normalizeBind(bind: VoiceLocalApiProxyConfigDraft["bind"]): VoiceLocalApiProxyBind {
  const host = normalizeString(bind?.host) || VOICE_LOCAL_API_PROXY_DEFAULT_HOST;
  const port = Number.isFinite(bind?.port) && Number(bind?.port) > 0
    ? Number(bind?.port)
    : VOICE_LOCAL_API_PROXY_DEFAULT_PORT;

  return {
    host,
    port,
    publicBaseUrl: normalizeString(bind?.publicBaseUrl) || buildPublicBaseUrl({ host, port }),
  };
}

function normalizeCapture(capture: VoiceLocalApiProxyConfigDraft["capture"]): VoiceLocalApiProxyCaptureConfig {
  const redactHeaders = normalizeStringList(capture?.redactHeaders, true);
  return {
    enabled: capture?.enabled ?? false,
    storeMessageContent: capture?.storeMessageContent ?? false,
    redactHeaders: redactHeaders.length > 0 ? redactHeaders : [...DEFAULT_REDACT_HEADERS],
    retentionDays:
      typeof capture?.retentionDays === "number" && capture.retentionDays > 0
        ? Math.floor(capture.retentionDays)
        : undefined,
  };
}

function normalizeStorage(storage: VoiceLocalApiProxyConfig["storage"]) {
  if (storage.dialect === "sqlite") {
    return {
      dialect: "sqlite" as const,
      sqlitePath: normalizeString(storage.sqlitePath),
    };
  }

  return {
    dialect: "postgresql" as const,
    postgresUrl: normalizeString(storage.postgresUrl),
    schema: normalizeString(storage.schema) || VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA,
  };
}

function normalizeCapabilityBindings(
  bindings: VoiceLocalApiProxyRouteDraft["capabilities"],
): VoiceRouteCapabilityBinding[] {
  return (bindings ?? []).map((binding) => ({
    capability: binding.capability,
    enabled: binding.enabled ?? true,
    operationSet: normalizeStringList(binding.operationSet),
    streaming: binding.streaming ?? false,
    timeoutMs:
      typeof binding.timeoutMs === "number" && binding.timeoutMs > 0
        ? Math.floor(binding.timeoutMs)
        : undefined,
    pathOverride: normalizeOptionalString(binding.pathOverride),
    methodOverride: binding.methodOverride?.toUpperCase() as VoiceRouteCapabilityBinding["methodOverride"],
    requestPolicyRef: normalizeOptionalString(binding.requestPolicyRef),
    responsePolicyRef: normalizeOptionalString(binding.responsePolicyRef),
  }));
}

function normalizeModelBindings(modelBindings: VoiceLocalApiProxyRouteDraft["modelBindings"]) {
  return (modelBindings ?? []).map((binding) => ({
    role: binding.role,
    modelId: normalizeString(binding.modelId),
    capability: binding.capability,
    label: normalizeOptionalString(binding.label),
  }));
}

function normalizeExposureDraft(
  exposure: VoiceLocalApiProxyExposureDraft,
  routeId: string,
): VoiceLocalApiProxyExposure {
  const target = exposure.target;
  const rawConsumerId =
    target === "custom"
      ? normalizeString(exposure.consumerId || exposure.label) || routeId
      : undefined;
  const consumerId = rawConsumerId ? normalizeIdentifier(rawConsumerId, routeId) : undefined;
  const labelSource = normalizeString(exposure.label) || rawConsumerId || target;

  return {
    target,
    enabled: exposure.enabled ?? true,
    consumerId,
    label: toTitleCase(labelSource),
  };
}

function normalizeExposureTargets(
  exposures: VoiceLocalApiProxyRouteDraft["exposures"],
  routeId: string,
) {
  if (!exposures || exposures.length === 0) {
    return [{ ...DEFAULT_EXPOSURE_TARGET }];
  }

  const seen = new Set<string>();
  const normalized: VoiceLocalApiProxyExposure[] = [];

  for (const exposure of exposures) {
    const nextExposure = normalizeExposureDraft(exposure, routeId);
    const key = `${nextExposure.target}:${nextExposure.consumerId ?? nextExposure.target}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(nextExposure);
  }

  return normalized.length > 0 ? normalized : [{ ...DEFAULT_EXPOSURE_TARGET }];
}

function normalizeProviderId(value: string) {
  return normalizeIdentifier(value, "custom");
}

function normalizeUpstream(upstream: VoiceLocalApiProxyRouteDraft["upstream"]): VoiceProxyUpstreamIdentity {
  return {
    providerId: normalizeProviderId(upstream.providerId),
    protocolKind: upstream.protocolKind,
    mirrorProtocolIdentity: normalizeOptionalString(upstream.mirrorProtocolIdentity),
    baseUrl: trimTrailingSlash(normalizeString(upstream.baseUrl)),
    credentialRef: normalizeOptionalString(upstream.credentialRef),
  };
}

function normalizeRouteName(route: VoiceLocalApiProxyRouteDraft, routeId: string) {
  return normalizeString(route.name) || toTitleCase(routeId);
}

export function normalizeVoiceLocalApiProxyRouteId(value: string, fallback = "route") {
  return normalizeIdentifier(value, fallback);
}

export function normalizeVoiceLocalApiProxyRoute(route: VoiceLocalApiProxyRouteDraft): VoiceLocalApiProxyRoute {
  const providerId = normalizeProviderId(route.providerId);
  const routeId = normalizeVoiceLocalApiProxyRouteId(
    normalizeString(route.id) || normalizeString(route.name) || providerId,
    "route",
  );

  return {
    id: routeId,
    name: normalizeRouteName(route, routeId),
    enabled: route.enabled ?? true,
    managedBy: route.managedBy ?? "user",
    providerId,
    clientProtocol: route.clientProtocol,
    upstreamProtocol: route.upstreamProtocol,
    upstream: normalizeUpstream(route.upstream),
    capabilities: normalizeCapabilityBindings(route.capabilities),
    modelBindings: normalizeModelBindings(route.modelBindings),
    runtimePolicy: route.runtimePolicy,
    exposures: normalizeExposureTargets(route.exposures, routeId),
    tags: normalizeStringList(route.tags),
    notes: normalizeOptionalString(route.notes),
  };
}

function normalizeDefaults(defaults: VoiceLocalApiProxyConfigDraft["defaults"]): VoiceLocalApiProxyDefaults {
  const defaultRouteByCapability = Object.fromEntries(
    Object.entries(defaults?.defaultRouteByCapability ?? {})
      .map(([capability, routeId]) => [capability, normalizeVoiceLocalApiProxyRouteId(routeId, "")])
      .filter(([, routeId]) => Boolean(routeId)),
  ) as VoiceLocalApiProxyDefaults["defaultRouteByCapability"];

  const defaultRouteByProtocol = Object.fromEntries(
    Object.entries(defaults?.defaultRouteByProtocol ?? {})
      .map(([protocol, routeId]) => [
        protocol as VoiceLocalApiClientProtocol,
        normalizeVoiceLocalApiProxyRouteId(routeId, ""),
      ])
      .filter(([, routeId]) => Boolean(routeId)),
  ) as VoiceLocalApiProxyDefaults["defaultRouteByProtocol"];

  return { defaultRouteByCapability, defaultRouteByProtocol };
}

function normalizePolicies(policies: VoiceLocalApiProxyConfigDraft["policies"]): VoiceLocalApiProxyPolicies {
  return {
    request: Object.fromEntries(
      Object.entries(policies?.request ?? {})
        .map(([key, value]) => [normalizeString(key), normalizeString(value)])
        .filter(([key, value]) => Boolean(key) && Boolean(value)),
    ),
    response: Object.fromEntries(
      Object.entries(policies?.response ?? {})
        .map(([key, value]) => [normalizeString(key), normalizeString(value)])
        .filter(([key, value]) => Boolean(key) && Boolean(value)),
    ),
  };
}

function normalizeRuntime(runtime: VoiceLocalApiProxyConfigDraft["runtime"]): VoiceLocalApiProxyRuntimeSettings {
  return {
    retryCount:
      typeof runtime?.retryCount === "number" && runtime.retryCount >= 0
        ? Math.floor(runtime.retryCount)
        : 1,
    cleanupIntervalMs:
      typeof runtime?.cleanupIntervalMs === "number" && runtime.cleanupIntervalMs > 0
        ? Math.floor(runtime.cleanupIntervalMs)
        : 300_000,
    maxConcurrentRequests:
      typeof runtime?.maxConcurrentRequests === "number" && runtime.maxConcurrentRequests > 0
        ? Math.floor(runtime.maxConcurrentRequests)
        : 4,
    startupProbeTimeoutMs:
      typeof runtime?.startupProbeTimeoutMs === "number" && runtime.startupProbeTimeoutMs > 0
        ? Math.floor(runtime.startupProbeTimeoutMs)
        : 15_000,
  };
}

export function normalizeVoiceLocalApiProxyConfig(draft: VoiceLocalApiProxyConfigDraft): VoiceLocalApiProxyConfig {
  const storage = normalizeStorage(draft.storage);
  const mode = draft.mode ?? (storage.dialect === "postgresql" ? "server-managed" : "desktop-local");

  return {
    schemaVersion:
      typeof draft.schemaVersion === "number" && draft.schemaVersion > 0
        ? Math.floor(draft.schemaVersion)
        : VOICE_LOCAL_API_PROXY_SCHEMA_VERSION,
    mode,
    bind: normalizeBind(draft.bind),
    storage,
    capture: normalizeCapture(draft.capture),
    routes: (draft.routes ?? []).map((route) => normalizeVoiceLocalApiProxyRoute(route)),
    defaults: normalizeDefaults(draft.defaults),
    policies: normalizePolicies(draft.policies),
    runtime: normalizeRuntime(draft.runtime),
  };
}

export function createDefaultVoiceLocalApiProxyConfig(
  draft: Pick<VoiceLocalApiProxyConfigDraft, "storage"> &
    Omit<Partial<VoiceLocalApiProxyConfigDraft>, "storage">,
) {
  return normalizeVoiceLocalApiProxyConfig({
    ...draft,
    routes: draft.routes ?? [],
  });
}
