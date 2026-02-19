import { useEffect, useState, useCallback } from "react";
import { Bot, Key, Play, Activity, ListOrdered } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import {
  fetchOpenAISettings,
  updateOpenAISettings,
  testOpenAI,
  fetchAdminHealth,
  fetchIntegrationEvents,
  getAdminHealthStreamUrl,
  type OpenAISettingsResponse,
  type AdminHealthSnapshot,
  type IntegrationEventItem,
} from "@/lib/api/admin";

export default function AdminIntegrationsOpenAI() {
  const [settings, setSettings] = useState<OpenAISettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number | null;
    model: string | null;
    sampleOutput: string | null;
    error: string | null;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<AdminHealthSnapshot | null>(null);
  const [events, setEvents] = useState<IntegrationEventItem[]>([]);
  const [form, setForm] = useState({
    model: "gpt-4o-mini",
    baseURL: "",
    maxTokens: 1024,
    temperature: 0.3,
    enabled: false,
    apiKey: "",
  });

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchOpenAISettings();
      setSettings(res);
      setForm((f) => ({
        ...f,
        model: res.model,
        baseURL: res.baseURL ?? "",
        maxTokens: res.maxTokens,
        temperature: res.temperature,
        enabled: res.enabled,
        apiKey: "",
      }));
    } catch {
      toast.error("Failed to load OpenAI settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetchAdminHealth();
      setHealth(res);
    } catch {
      setHealth({
        backend: "ok",
        database: "error",
        openai: { status: "unknown", lastSuccessAt: null },
        queue: "not_applicable",
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const list = await fetchIntegrationEvents();
      setEvents(list);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadHealth();
    loadEvents();
  }, [loadSettings, loadHealth, loadEvents]);

  // SSE health stream (with auth via fetch)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const url = getAdminHealthStreamUrl();
    const ac = new AbortController();
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.body || !mounted) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (mounted) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6)) as AdminHealthSnapshot;
                setHealth(data);
              } catch {
                /* ignore */
              }
            }
          }
        }
      } catch {
        if (mounted) loadHealth();
      }
    })();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [loadHealth]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Parameters<typeof updateOpenAISettings>[0] = {
        model: form.model,
        baseURL: form.baseURL.trim() || null,
        maxTokens: form.maxTokens,
        temperature: form.temperature,
        enabled: form.enabled,
      };
      if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim();
      const res = await updateOpenAISettings(payload);
      setSettings(res);
      setForm((f) => ({ ...f, apiKey: "" }));
      toast.success("Settings saved");
      loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testOpenAI();
      setTestResult(res);
      if (res.success) toast.success("OpenAI test passed");
      else toast.error(res.error ?? "Test failed");
      loadHealth();
      loadEvents();
    } catch (e) {
      setTestResult({
        success: false,
        latencyMs: null,
        model: null,
        sampleOutput: null,
        error: e instanceof Error ? e.message : "Request failed",
      });
      toast.error("Test request failed");
    } finally {
      setTesting(false);
    }
  };

  const statusColor = (status: string) =>
    status === "connected" || status === "configured"
      ? "text-green-600 dark:text-green-400"
      : status === "disconnected" || status === "not_configured"
        ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400";

  return (
    <div className="space-y-8">
      <AdminWaveSeparator />
      <section aria-label="OpenAI settings">
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" aria-hidden />
              OpenAI integration
            </AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="space-y-6">
            {loading ? (
              <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="openai-model">Model</Label>
                    <Input
                      id="openai-model"
                      value={form.model}
                      onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                      placeholder="gpt-4o-mini"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="openai-baseurl">Base URL (optional)</Label>
                    <Input
                      id="openai-baseurl"
                      value={form.baseURL}
                      onChange={(e) => setForm((f) => ({ ...f, baseURL: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="openai-maxtokens">Max tokens</Label>
                    <Input
                      id="openai-maxtokens"
                      type="number"
                      min={1}
                      max={128000}
                      value={form.maxTokens}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxTokens: Number(e.target.value) || 1024 }))
                      }
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="openai-temperature">Temperature</Label>
                    <Input
                      id="openai-temperature"
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={form.temperature}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, temperature: Number(e.target.value) || 0.3 }))
                      }
                      className="mt-1 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
                  <div>
                    <Label htmlFor="openai-enabled" className="font-medium">
                      Enable OpenAI
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Use OpenAI for matchmaking and tests when enabled.
                    </p>
                  </div>
                  <Switch
                    id="openai-enabled"
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                  />
                </div>
                <div>
                  <Label htmlFor="openai-apikey" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API key
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {settings?.hasApiKey
                      ? "Stored key is set. Enter a new value only to replace it (never displayed)."
                      : "Set your OpenAI API key. It is stored encrypted and never sent to the client."}
                  </p>
                  <Input
                    id="openai-apikey"
                    type="password"
                    autoComplete="off"
                    value={form.apiKey}
                    onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                    placeholder={settings?.hasApiKey ? "••••••••••••" : "sk-..."}
                    className="mt-1 max-w-md rounded-xl"
                  />
                </div>
                <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </>
            )}
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>

      <section aria-label="Test OpenAI">
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" aria-hidden />
              Test connection
            </AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="space-y-4">
            <Button
              className="rounded-xl"
              onClick={handleTest}
              disabled={testing || !settings?.enabled}
            >
              {testing ? "Running…" : "Run test"}
            </Button>
            {testResult && (
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 font-mono text-sm space-y-2">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={testResult.success ? "text-green-600" : "text-red-600"}>
                    {testResult.success ? "Success" : "Failed"}
                  </span>
                </p>
                {testResult.latencyMs != null && (
                  <p>
                    <span className="font-medium">Latency:</span> {testResult.latencyMs} ms
                  </p>
                )}
                {testResult.model && (
                  <p>
                    <span className="font-medium">Model:</span> {testResult.model}
                  </p>
                )}
                {testResult.sampleOutput && (
                  <p>
                    <span className="font-medium">Sample output:</span>
                    <pre className="mt-1 whitespace-pre-wrap break-all">{testResult.sampleOutput}</pre>
                  </p>
                )}
                {testResult.error && (
                  <p className="text-destructive">
                    <span className="font-medium">Error:</span> {testResult.error}
                  </p>
                )}
              </div>
            )}
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>

      <section aria-label="Health status">
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" aria-hidden />
              Real-time health
            </AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent>
            {health ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-sm font-medium">Backend</p>
                  <p className={statusColor(health.backend)}>{health.backend}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-sm font-medium">Database</p>
                  <p className={statusColor(health.database)}>{health.database}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-sm font-medium">OpenAI</p>
                  <p className={statusColor(health.openai.status)}>{health.openai.status}</p>
                  {health.openai.lastSuccessAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last success: {new Date(health.openai.lastSuccessAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-sm font-medium">Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {health.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
            )}
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>

      <section aria-label="Integration logs">
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" aria-hidden />
              Last 20 events
            </AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent>
            <Button variant="outline" size="sm" className="rounded-xl mb-4" onClick={loadEvents}>
              Refresh
            </Button>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <ul className="space-y-2 font-mono text-sm">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="font-medium">{e.type}</span>
                    <span
                      className={
                        e.status === "success"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {e.status}
                    </span>
                    {e.latencyMs != null && <span>{e.latencyMs} ms</span>}
                    {e.message && <span className="text-muted-foreground truncate">{e.message}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>
    </div>
  );
}
