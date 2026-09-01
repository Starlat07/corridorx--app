import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, LockKeyhole, Plus, Send, ShieldCheck } from "lucide-react";
import {
  COUNTRIES,
  formatCurrency,
  fundEscrowMilestone,
  getWalletBalance,
  listEscrowProjects,
  newId,
  releaseEscrowMilestone,
  saveEscrowProject,
  submitEscrowMilestone,
  type Country,
  type EscrowMilestone,
  type EscrowProject,
  type MilestoneStatus,
} from "@/lib/corridorx";

export const Route = createFileRoute("/app/escrow")({ component: EscrowMilestones });

function EscrowMilestones() {
  const [projects, setProjects] = useState<EscrowProject[]>([]);
  const [balance, setBalance] = useState(0);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () => { setProjects(listEscrowProjects()); setBalance(getWalletBalance()); };
  useEffect(() => { refresh(); window.addEventListener("corridorx:update", refresh); return () => window.removeEventListener("corridorx:update", refresh); }, []);

  const held = useMemo(() => projects.flatMap((project) => project.milestones).filter((milestone) => milestone.status !== "draft" && milestone.status !== "released").reduce((sum, milestone) => sum + milestone.amount, 0), [projects]);

  function fund(projectId: string, milestone: EscrowMilestone) {
    const result = fundEscrowMilestone(projectId, milestone.id);
    setNotice(result.ok ? `${formatCurrency(milestone.amount, "USD")} is safely held for ${milestone.title}.` : result.message ?? "Unable to fund this milestone.");
    refresh();
  }

  function submit(projectId: string, milestoneId: string) { submitEscrowMilestone(projectId, milestoneId); setNotice("Work submitted. It is ready for the client to review."); refresh(); }
  function release(projectId: string, milestone: EscrowMilestone) { releaseEscrowMilestone(projectId, milestone.id); setNotice(`${formatCurrency(milestone.amount, "USD")} released to the freelancer's payout route.`); refresh(); }

  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><LockKeyhole size={16} /> Protected global payments</div><h1 className="text-3xl font-semibold">Safupay</h1><p className="mt-1 text-sm text-muted-foreground">Fund work in stages. Release payment only when you approve the result.</p></div>
      <div className="flex gap-2"><Link to="/app/deposit" className="btn-ghost">Add funds</Link><button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> New project</button></div>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Wallet available" value={formatCurrency(balance, "USD")} accent />
      <Metric label="Safely held by Safupay" value={formatCurrency(held, "USD")} />
      <Metric label="Protected projects" value={String(projects.length)} />
    </div>

    <div className="card-glass flex gap-3 p-4 text-sm"><ShieldCheck className="mt-0.5 flex-none text-primary" size={19} /><p><span className="font-medium">How Safupay works:</span> your money stays protected while the freelancer works. When they submit a milestone, review it and release payment with one click. CorridorX handles the international payout.</p></div>
    {notice && <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{notice}</div>}

    {creating && <ProjectForm onCancel={() => setCreating(false)} onCreate={(project) => { saveEscrowProject(project); setCreating(false); setNotice("Project created. Fund its first milestone when you are ready."); refresh(); }} />}

    {projects.length === 0 && !creating ? <div className="card-glass py-14 text-center"><LockKeyhole size={28} className="mx-auto text-primary" /><h2 className="mt-3 text-lg font-semibold">Pay safely, milestone by milestone</h2><p className="mt-1 text-sm text-muted-foreground">Create a Safupay project for your next freelancer and pay only for work you approve.</p><button className="btn-primary mt-5" onClick={() => setCreating(true)}>Create Safupay project</button></div> : <div className="space-y-5">{projects.map((project) => <ProjectCard key={project.id} project={project} onFund={fund} onSubmit={submit} onRelease={release} />)}</div>}
  </div>;
}

function ProjectForm({ onCancel, onCreate }: { onCancel: () => void; onCreate: (project: EscrowProject) => void }) {
  const [title, setTitle] = useState("Website redesign"); const [freelancer, setFreelancer] = useState("Freelancer name"); const [countryCode, setCountryCode] = useState("NG"); const [milestones, setMilestones] = useState([{ title: "Wireframes", amount: "200" }, { title: "Design", amount: "300" }, { title: "Launch", amount: "500" }]);
  const total = milestones.reduce((sum, milestone) => sum + (Number(milestone.amount) || 0), 0);
  function create() { const valid = title.trim() && freelancer.trim() && milestones.every((milestone) => milestone.title.trim() && Number(milestone.amount) > 0); if (!valid) return; const destination = COUNTRIES.find((country) => country.code === countryCode) ?? COUNTRIES[1]; onCreate({ id: newId(), title: title.trim(), freelancer: freelancer.trim(), destination, createdAt: Date.now(), milestones: milestones.map((milestone) => ({ id: newId(), title: milestone.title.trim(), amount: Number(milestone.amount), status: "draft" })) }); }
  return <section className="card-glass space-y-5 p-6"><div><h2 className="text-lg font-semibold">New Safupay project</h2><p className="text-sm text-muted-foreground">Split the job into payments you approve one at a time.</p></div><div className="grid gap-4 md:grid-cols-2"><Field label="Project name" value={title} onChange={setTitle} /><Field label="Freelancer name" value={freelancer} onChange={setFreelancer} /></div><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Freelancer payout country</span><select className="input" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{COUNTRIES.map((country) => <option value={country.code} key={country.code}>{country.name} ({country.currency})</option>)}</select></label><div><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">Milestones</span><span className="text-sm text-primary">Total {formatCurrency(total, "USD")}</span></div><div className="space-y-2">{milestones.map((milestone, index) => <div className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]" key={index}><input className="input" value={milestone.title} onChange={(event) => setMilestones(milestones.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} /><input className="input" type="number" min="1" value={milestone.amount} onChange={(event) => setMilestones(milestones.map((item, itemIndex) => itemIndex === index ? { ...item, amount: event.target.value } : item))} />{milestones.length > 1 && <button className="btn-ghost" onClick={() => setMilestones(milestones.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}</div>)}</div><button className="mt-3 text-sm text-primary hover:underline" onClick={() => setMilestones([...milestones, { title: "New milestone", amount: "" }])}>+ Add milestone</button></div><div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onCancel}>Cancel</button><button className="btn-primary" onClick={create}>Create Safupay project</button></div></section>;
}

function ProjectCard({ project, onFund, onSubmit, onRelease }: { project: EscrowProject; onFund: (projectId: string, milestone: EscrowMilestone) => void; onSubmit: (projectId: string, milestoneId: string) => void; onRelease: (projectId: string, milestone: EscrowMilestone) => void }) {
  const total = project.milestones.reduce((sum, milestone) => sum + milestone.amount, 0); const released = project.milestones.filter((milestone) => milestone.status === "released").reduce((sum, milestone) => sum + milestone.amount, 0);
  return <section className="card-glass overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5"><div><h2 className="font-semibold">{project.title}</h2><p className="mt-1 text-sm text-muted-foreground">{project.freelancer} · Paid in {project.destination.currency}</p></div><div className="text-right"><div className="font-mono text-lg font-semibold">{formatCurrency(total, "USD")}</div><div className="text-xs text-muted-foreground">{formatCurrency(released, "USD")} released</div></div></div><div className="divide-y divide-border">{project.milestones.map((milestone, index) => <div key={milestone.id} className="flex flex-wrap items-center gap-4 p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-surface-elevated text-sm font-semibold">{index + 1}</span><div className="min-w-40 flex-1"><div className="font-medium">{milestone.title}</div><div className="text-xs text-muted-foreground">{statusDetail(milestone.status, project.destination.currency)}</div></div><div className="font-mono text-sm">{formatCurrency(milestone.amount, "USD")}</div><Status status={milestone.status} /><div className="flex gap-2">{milestone.status === "draft" && <button className="btn-primary" onClick={() => onFund(project.id, milestone)}>Fund</button>}{milestone.status === "funded" && <button className="btn-ghost" onClick={() => onSubmit(project.id, milestone.id)}><Send size={15} /> Mark submitted</button>}{milestone.status === "submitted" && <button className="btn-primary" onClick={() => onRelease(project.id, milestone)}><CheckCircle2 size={15} /> Release</button>}</div></div>)}</div></section>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) { return <div className="card-glass p-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className={`mt-2 text-2xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</div></div>; }
function Status({ status }: { status: MilestoneStatus }) { const colors: Record<MilestoneStatus, string> = { draft: "bg-surface-elevated text-muted-foreground", funded: "bg-primary/10 text-primary", submitted: "bg-warning/15 text-warning", released: "bg-primary/10 text-primary" }; return <span className={`rounded-full px-2 py-1 text-xs capitalize ${colors[status]}`}>{status}</span>; }
function statusDetail(status: MilestoneStatus, currency: string) { return status === "draft" ? "Waiting for funding" : status === "funded" ? `Funds held safely · payout in ${currency}` : status === "submitted" ? "Work submitted · client review needed" : "Released to freelancer"; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><input className="input" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
