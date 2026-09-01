import { useState, useEffect, type FormEvent } from "react";
import { UserPlus, Trash2, Power, Users2, Mail, Copy } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGet, adminPost, adminPut, adminDelete } from "@/utils/adminApi";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: number;
  created_at: string;
}

const AdminTeam = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await adminGet('/api/admin/team');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load team');
      setTeam(data.team || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(result);
  };

  const copyCredentials = (memberEmail: string, pwd: string) => {
    navigator.clipboard.writeText(`Admin login: admin.campusmart.co.ke\nEmail: ${memberEmail}\nPassword: ${pwd}`);
    toast.success('Login details copied - send them to your team member');
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    setCreating(true);
    try {
      const res = await adminPost('/api/admin/team', { email, password, full_name: fullName });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team member');

      toast.success('Team member added - product posting access only');
      copyCredentials(email, password);
      setFullName(""); setEmail(""); setPassword(""); setShowForm(false);
      fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create team member');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (member: TeamMember) => {
    try {
      const res = await adminPut('/api/admin/team', { id: member.id, is_active: !member.is_active });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update team member');
      toast.success(member.is_active ? 'Access revoked' : 'Access restored');
      fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update team member');
    }
  };

  const removeMember = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.email}? They will lose access immediately.`)) return;
    try {
      const res = await adminDelete(`/api/admin/team?id=${member.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove team member');
      toast.success('Team member removed');
      fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove team member');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Users2 className="h-6 w-6 text-accent" /> Team
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Give other people a login that can only add/edit/import products - nothing else (no orders, users, or settings).
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-glow transition"
          >
            <UserPlus className="h-4 w-4" /> Add Team Member
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Grace Wanjiru"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email (their login)</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="grace@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="flex gap-2">
                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-accent/40 font-mono"
                />
                <button type="button" onClick={generatePassword} className="px-4 py-2.5 bg-secondary text-foreground rounded-lg font-semibold text-sm hover:bg-secondary/80">
                  Generate
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={creating} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary-glow disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-secondary text-foreground rounded-lg font-semibold text-sm hover:bg-secondary/80">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading team...</p>
          ) : team.length === 0 ? (
            <div className="p-12 text-center">
              <Users2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No team members yet - add one to give them product-posting access.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {team.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{member.full_name || member.email}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${member.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400'}`}>
                        {member.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {member.email} · Products only
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(member)}
                      title={member.is_active ? 'Revoke access' : 'Restore access'}
                      className={`p-2 rounded-lg ${member.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeMember(member)}
                      title="Remove"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Copy className="h-3.5 w-3.5" /> Login page: admin.campusmart.co.ke — team members enter their email + password (you leave email blank).
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminTeam;
