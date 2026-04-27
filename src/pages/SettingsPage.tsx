import { useState } from 'react'
import { Settings, RefreshCw, FileText, Bell, Palette, Save } from 'lucide-react'
import { useToastPush } from '../context/ToastContext'

interface SettingsState {
  autoRestart: boolean
  logRetention: number
  pollInterval: number
  notifications: boolean
  theme: 'dark' | 'light' | 'system'
  maxLogEntries: number
}

const DEFAULTS: SettingsState = {
  autoRestart: false,
  logRetention: 7,
  pollInterval: 3,
  notifications: true,
  theme: 'dark',
  maxLogEntries: 500,
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon size={13} className="text-text-secondary" />
        <span className="text-[13px] font-semibold text-text-primary">{title}</span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 flex-shrink-0',
        checked ? 'bg-primary' : 'bg-border',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const push = useToastPush()

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(s => ({ ...s, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    push('success', 'Settings saved', 'Your preferences have been applied.')
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-text-primary">Settings</h1>
            <p className="text-[12px] text-text-secondary mt-0.5">Configure your Lapi Cloud environment</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/85 text-white rounded-lg text-[13px] font-semibold transition-all active:scale-95"
          >
            <Save size={13} />
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>

        {/* General */}
        <Section title="General" icon={Settings}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Auto-restart on crash</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Automatically restart projects that crash unexpectedly</p>
            </div>
            <Toggle checked={settings.autoRestart} onChange={v => update('autoRestart', v)} />
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Desktop notifications</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Show notifications when projects start or stop</p>
            </div>
            <Toggle checked={settings.notifications} onChange={v => update('notifications', v)} />
          </div>
        </Section>

        {/* Polling */}
        <Section title="Refresh & Polling" icon={RefreshCw}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Project poll interval</p>
              <p className="text-[11px] text-text-secondary mt-0.5">How often to refresh project status (seconds)</p>
            </div>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.pollInterval}
              onChange={e => update('pollInterval', Number(e.target.value))}
              className="w-20 bg-elevated border border-border rounded-lg px-3 py-1.5 text-[13px] text-text-primary text-right focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </Section>

        {/* Logs */}
        <Section title="Log Management" icon={FileText}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Log retention (days)</p>
              <p className="text-[11px] text-text-secondary mt-0.5">How many days to keep log history</p>
            </div>
            <input
              type="number"
              min={1}
              max={90}
              value={settings.logRetention}
              onChange={e => update('logRetention', Number(e.target.value))}
              className="w-20 bg-elevated border border-border rounded-lg px-3 py-1.5 text-[13px] text-text-primary text-right focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Max log entries in memory</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Maximum number of log entries to keep in the viewer</p>
            </div>
            <input
              type="number"
              min={100}
              max={5000}
              step={100}
              value={settings.maxLogEntries}
              onChange={e => update('maxLogEntries', Number(e.target.value))}
              className="w-24 bg-elevated border border-border rounded-lg px-3 py-1.5 text-[13px] text-text-primary text-right focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={Palette}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Theme</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Choose your preferred color theme</p>
            </div>
            <select
              value={settings.theme}
              onChange={e => update('theme', e.target.value as SettingsState['theme'])}
              className="bg-elevated border border-border rounded-lg px-3 py-1.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </Section>

        {/* Notifications section */}
        <Section title="Notifications" icon={Bell}>
          <div className="flex items-center gap-3 px-3 py-3 bg-elevated/50 rounded-lg border border-border/50">
            <Bell size={14} className="text-text-secondary flex-shrink-0" />
            <p className="text-[12px] text-text-secondary">
              Notification preferences are stored locally and apply to this browser session.
            </p>
          </div>
        </Section>

        {/* Version info */}
        <div className="flex items-center justify-between px-4 py-3 bg-elevated/50 border border-border rounded-xl text-[11px] text-text-secondary">
          <span>Lapi Cloud Control Plane</span>
          <span>v0.1.0-alpha</span>
        </div>
      </div>
    </main>
  )
}
