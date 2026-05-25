import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Mail, Key, Search, Check, AlertCircle, Users, CheckSquare, Square } from 'lucide-react';
import { Tenant, TeamMember } from '../types';
import { useAuth } from '../auth/AuthProvider';

interface TeamAccessViewProps {
  tenant: Tenant;
}

export const TeamAccessView: React.FC<TeamAccessViewProps> = ({ tenant }) => {
  const { apiFetch } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Support Staff' | 'Sales Agent' | 'Billing Manager'>('Support Staff');
  const [permissions, setPermissions] = useState({
    viewCRM: true,
    editEmployees: false,
    viewBilling: false,
    deployWebsites: false
  });
  
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initial mock data if none exists
  const getInitialMockMembers = (tenantId: string): TeamMember[] => {
    if (tenantId === 't-1') {
      return [
        {
          id: 'tm-1',
          name: 'Dr. Emily Vance',
          email: 'emily.vance@smiledental.com',
          role: 'Admin',
          permissions: { viewCRM: true, editEmployees: true, viewBilling: true, deployWebsites: true },
          status: 'active'
        },
        {
          id: 'tm-2',
          name: 'Sarah Jenkins',
          email: 'sjenkins@smiledental.com',
          role: 'Support Staff',
          permissions: { viewCRM: true, editEmployees: false, viewBilling: false, deployWebsites: false },
          status: 'active'
        }
      ];
    } else if (tenantId === 't-2') {
      return [
        {
          id: 'tm-3',
          name: 'Marcus Brody',
          email: 'mbrody@apexheights.co',
          role: 'Sales Agent',
          permissions: { viewCRM: true, editEmployees: false, viewBilling: false, deployWebsites: true },
          status: 'active'
        },
        {
          id: 'tm-4',
          name: 'Claire Standish',
          email: 'cstandish@apexheights.co',
          role: 'Billing Manager',
          permissions: { viewCRM: true, editEmployees: false, viewBilling: true, deployWebsites: false },
          status: 'active'
        }
      ];
    } else {
      return [
        {
          id: 'tm-5',
          name: 'Michael Chen',
          email: 'mchen@bytetech.io',
          role: 'Admin',
          permissions: { viewCRM: true, editEmployees: true, viewBilling: true, deployWebsites: true },
          status: 'active'
        }
      ];
    }
  };

  const normalizeMember = (member: any): TeamMember => ({
    ...member,
    role: member.role || 'Agent',
    permissions: member.permissions || {
      viewCRM: true,
      editEmployees: member.role === 'Owner' || member.role === 'Admin',
      viewBilling: member.role === 'Owner' || member.role === 'Admin',
      deployWebsites: member.role === 'Owner' || member.role === 'Admin' || member.role === 'Manager'
    },
    status: member.status === 'disabled' ? 'pending' : (member.status || 'pending')
  });

  // Load team members from tenant-scoped backend with local fallback.
  useEffect(() => {
    apiFetch('/api/current-tenant/team-members')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setTeamMembers((data.length ? data : getInitialMockMembers(tenant.id)).map(normalizeMember)))
      .catch(() => {
        const key = `team_members_${tenant.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            setTeamMembers(JSON.parse(stored));
          } catch (e) {
            setTeamMembers(getInitialMockMembers(tenant.id));
          }
        } else {
          const initial = getInitialMockMembers(tenant.id);
          setTeamMembers(initial);
          localStorage.setItem(key, JSON.stringify(initial));
        }
      });
    
    // Clear alerts and hide form on tenant switch
    setShowInviteForm(false);
    setErrorMessage('');
    setSuccessMessage('');
  }, [apiFetch, tenant.id]);

  const saveTeam = (updatedList: TeamMember[]) => {
    setTeamMembers(updatedList);
    localStorage.setItem(`team_members_${tenant.id}`, JSON.stringify(updatedList));
  };

  const handleRoleChange = (newRole: 'Admin' | 'Support Staff' | 'Sales Agent' | 'Billing Manager') => {
    setRole(newRole);
    // Auto-fill sensible default permissions based on role
    if (newRole === 'Admin') {
      setPermissions({ viewCRM: true, editEmployees: true, viewBilling: true, deployWebsites: true });
    } else if (newRole === 'Support Staff') {
      setPermissions({ viewCRM: true, editEmployees: false, viewBilling: false, deployWebsites: false });
    } else if (newRole === 'Sales Agent') {
      setPermissions({ viewCRM: true, editEmployees: false, viewBilling: false, deployWebsites: true });
    } else if (newRole === 'Billing Manager') {
      setPermissions({ viewCRM: false, editEmployees: false, viewBilling: true, deployWebsites: false });
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const exists = teamMembers.some(tm => tm.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      setErrorMessage('A team member with this email already exists.');
      return;
    }

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      permissions,
      status: 'pending' // pending until they sign in
    };

    const newList = [...teamMembers, newMember];
    saveTeam(newList);
    apiFetch('/api/current-tenant/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    }).catch(err => console.warn('Could not persist team member invite.', err));
    
    // Reset form
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    handleRoleChange('Support Staff');
    setShowInviteForm(false);
    
    setSuccessMessage(`Successfully invited ${newMember.name}! An onboarding email has been sent.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      const newList = teamMembers.filter(tm => tm.id !== id);
      saveTeam(newList);
      apiFetch(`/api/current-tenant/team-members/${id}`, { method: 'DELETE' })
        .catch(err => console.warn('Could not delete team member on backend.', err));
      setSuccessMessage('Team member has been removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const filteredMembers = teamMembers.filter(tm => {
    const matchesSearch = tm.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tm.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === 'All' || tm.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--primary-color)' }} /> Team Access & Logins
          </h2>
          <p className="view-subtitle">Manage human logins, invite support agents or sales reps, and assign granular security permissions.</p>
        </div>
        
        {!showInviteForm && (
          <button 
            onClick={() => setShowInviteForm(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} /> Invite Team Member
          </button>
        )}
      </div>

      {successMessage && (
        <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {showInviteForm && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
            Invite New Staff Login
          </h3>
          
          {errorMessage && (
            <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-color)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleInvite}>
            <div className="grid-cols-12" style={{ gap: '16px' }}>
              <div className="col-span-4 form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="col-span-4 form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="john.doe@company.com"
                  required
                />
              </div>

              <div className="col-span-4 form-group">
                <label className="form-label">Security Role *</label>
                <select 
                  className="form-input"
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as any)}
                >
                  <option value="Admin">Administrator (Full Access)</option>
                  <option value="Support Staff">Support Staff (FAQ & Inbox)</option>
                  <option value="Sales Agent">Sales Agent (CRM & Site View)</option>
                  <option value="Billing Manager">Billing Manager (Pricing & Costs)</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-12" style={{ gap: '16px', marginTop: '12px' }}>
              <div className="col-span-6 form-group">
                <label className="form-label">Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="col-span-6 form-group">
                <label className="form-label">Confirm Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '12px' }}>
                Permissions Matrix Override
              </h4>
              
              <div className="grid-cols-12" style={{ gap: '12px' }}>
                <div className="col-span-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox"
                      checked={permissions.viewCRM}
                      onChange={(e) => setPermissions({ ...permissions, viewCRM: e.target.checked })}
                    />
                    View CRM Pipelines
                  </label>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginLeft: '20px', marginTop: '4px' }}>
                    Access deal pipeline, contacts, and lead logs.
                  </div>
                </div>

                <div className="col-span-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox"
                      checked={permissions.editEmployees}
                      onChange={(e) => setPermissions({ ...permissions, editEmployees: e.target.checked })}
                    />
                    Edit AI Employees
                  </label>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginLeft: '20px', marginTop: '4px' }}>
                    Modify chatbot prompts, avatars, and departments.
                  </div>
                </div>

                <div className="col-span-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox"
                      checked={permissions.viewBilling}
                      onChange={(e) => setPermissions({ ...permissions, viewBilling: e.target.checked })}
                    />
                    View Billing Settings
                  </label>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginLeft: '20px', marginTop: '4px' }}>
                    See active limits, MRR status, and overage invoices.
                  </div>
                </div>

                <div className="col-span-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox"
                      checked={permissions.deployWebsites}
                      onChange={(e) => setPermissions({ ...permissions, deployWebsites: e.target.checked })}
                    />
                    Deploy Web Sites
                  </label>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginLeft: '20px', marginTop: '4px' }}>
                    Modify slogan headings, compile site, and configure custom domains.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowInviteForm(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '8px 20px', 
                  background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Section */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Human Employee Directory</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 10px 6px 30px', fontSize: '0.75rem', height: '34px', margin: 0 }}
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter select */}
            <select 
              className="form-input"
              style={{ fontSize: '0.75rem', height: '34px', padding: '0 10px', margin: 0, width: '130px' }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin Only</option>
              <option value="Support Staff">Support Staff</option>
              <option value="Sales Agent">Sales Agent</option>
              <option value="Billing Manager">Billing Manager</option>
            </select>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            No team members match your criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Permissions Summary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                        {member.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: '600' }}>{member.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.email}</span>
                  </td>
                  <td>
                    <span className={`badge ${member.role === 'Admin' ? 'badge-danger' : member.role === 'Billing Manager' ? 'badge-warning' : 'badge-primary'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {member.permissions.viewCRM && <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>CRM</span>}
                      {member.permissions.editEmployees && <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>AI Config</span>}
                      {member.permissions.viewBilling && <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>Billing</span>}
                      {member.permissions.deployWebsites && <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>Web Deploy</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {member.status === 'active' ? 'Active' : 'Pending Invite'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="btn"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger-color)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
