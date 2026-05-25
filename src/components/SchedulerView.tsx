import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Check, RefreshCw, Eye, XCircle, 
  MapPin, Plus, AlertCircle, Link2, ExternalLink 
} from 'lucide-react';
import { Appointment, Contact, Agent } from '../types';
import { NativeBookingCalendar } from './NativeBookingCalendar';

interface SchedulerViewProps {
  appointments: Appointment[];
  contacts: Contact[];
  agents: Agent[];
  onAddAppointment: (newApp: Appointment) => void;
  onCancelAppointment: (appId: string) => void;
  tenantId: string;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  appointments,
  contacts,
  agents,
  onAddAppointment,
  onCancelAppointment,
  tenantId
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [contactId, setContactId] = useState(contacts[0]?.id || '');
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('Suite 200, Main Clinic');
  const [type, setType] = useState('General Consultation');

  // Load integrations to see if live Calendar Scheduler URL is defined
  const [calIntegrationUrl, setCalIntegrationUrl] = useState<string | null>(() => {
    const stored = localStorage.getItem('coolify_integrations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.calUrl) {
          return parsed.calUrl;
        }
      } catch (e) {}
    }
    return null;
  });

  const [activeSubView, setActiveSubView] = useState<'appointments' | 'live'>('appointments');

  // Availability state
  const [weekdays, setWeekdays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thuesday: true,
    friday: true,
    saturday: false,
    sunday: false
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime || !contactId) return;

    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      contactId,
      agentId,
      dateTime,
      duration,
      location,
      type,
      status: 'scheduled'
    };

    onAddAppointment(newApp);
    setFormOpen(false);
    setDateTime('');
  };

  return (
    <div className="animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="view-title">Calendar Scheduler</h2>
          <p className="view-subtitle">Appointment engine, calendar synchronizations, and slot availability settings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      <div className="grid-cols-12">
        
        {/* Left column: Calendar Sync & Availability */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Calendar Synced */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>Integrations Status</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Google Calendar</span>
                <span className="badge badge-success">Synced</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Outlook Calendar</span>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>Connect</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoom Meetings</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>

          {/* Availability schedule */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>Weekly Working Shift</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(weekdays).map(([day, checked]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor={`day-${day}`} style={{ fontSize: '0.8rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {day}
                  </label>
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    className="form-checkbox"
                    checked={checked}
                    onChange={(e) => setWeekdays({ ...weekdays, [day]: e.target.checked })}
                  />
                </div>
              ))}

              <div style={{ height: '1px', background: 'var(--border-glass)', margin: '10px 0' }} />

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Default Core Hours</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" className="form-input" style={{ padding: '6px', fontSize: '0.75rem' }} value="09:00 AM" readOnly />
                  <span style={{ fontSize: '0.75rem' }}>to</span>
                  <input type="text" className="form-input" style={{ padding: '6px', fontSize: '0.75rem' }} value="06:00 PM" readOnly />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Booked Appointments timeline or Live iframe */}
        <div className="col-span-8 glass-panel" style={{ padding: '24px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              {activeSubView === 'appointments' ? 'Active Booked Appointments' : 'Live Booking Portal'}
            </h3>
            
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
              <button 
                type="button"
                onClick={() => setActiveSubView('appointments')} 
                className="btn" 
                style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: activeSubView === 'appointments' ? 'var(--primary-color)' : 'transparent', color: activeSubView === 'appointments' ? 'white' : 'var(--text-secondary)' }}
              >
                Local Ledgers
              </button>
              <button 
                type="button"
                onClick={() => setActiveSubView('live')} 
                className="btn" 
                style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: activeSubView === 'live' ? 'var(--primary-color)' : 'transparent', color: activeSubView === 'live' ? 'white' : 'var(--text-secondary)' }}
              >
                Live Booking Frame
              </button>
            </div>
          </div>
          
          {activeSubView === 'appointments' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {appointments.map((app) => {
                const contact = contacts.find(c => c.id === app.contactId);
                const agent = agents.find(a => a.id === app.agentId);
                const isScheduled = app.status === 'scheduled';
                const dateStr = new Date(app.dateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const timeStr = new Date(app.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={app.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderLeft: isScheduled ? '4px solid var(--primary-color)' : '4px solid var(--danger-color)',
                      background: isScheduled ? 'rgba(255,255,255,0.01)' : 'rgba(239,68,68,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--primary-glow)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        📅
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {app.type}
                          {!isScheduled && <span className="badge badge-danger">Cancelled</span>}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <span>Client: <strong>{contact?.name || 'Unknown'}</strong></span>
                          <span>•</span>
                          <span>Operator: <strong>{agent?.name || 'Reception AI'}</strong></span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px' }}>
                          <MapPin size={10} /> {app.location}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{dateStr}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{timeStr} ({app.duration} mins)</div>
                      </div>
                      
                      {isScheduled && (
                        <button 
                          type="button"
                          onClick={() => onCancelAppointment(app.id)}
                          className="btn" 
                          style={{ padding: '4px 8px', fontSize: '0.65rem', background: 'none', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <XCircle size={10} /> Cancel Appointment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {appointments.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={36} />
                  <span>No appointments scheduled yet.</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {calIntegrationUrl ? (
                <iframe 
                  src={calIntegrationUrl} 
                  style={{ width: '100%', flex: 1, minHeight: '400px', border: 'none', borderRadius: '8px', background: 'white' }} 
                  title="Booking Portal"
                />
              ) : (
                <NativeBookingCalendar
                  tenantId={tenantId}
                  agents={agents}
                  contacts={contacts}
                  onAddAppointment={onAddAppointment}
                />
              )}
            </div>
          )}
        </div>

      </div>

      {/* Manual Booking Modal Overlay */}
      {formOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '480px', 
              padding: '24px', 
              backgroundColor: 'var(--bg-secondary)',
              position: 'relative' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif' }}>Book Calendar Appointment</h3>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={16} /> Close
              </button>
            </div>

            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">Client / Patient Profile</label>
                <select className="form-input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned AI Staff</label>
                <select className="form-input" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid-cols-12">
                <div className="col-span-8 form-group">
                  <label className="form-label">Date & Time</label>
                  <input type="datetime-local" className="form-input" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
                </div>
                <div className="col-span-4 form-group">
                  <label className="form-label">Duration (mins)</label>
                  <input type="number" className="form-input" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Service / Meeting Type</label>
                <input type="text" className="form-input" placeholder="e.g. Tooth Whitening / Penthouse Viewing" value={type} onChange={(e) => setType(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
