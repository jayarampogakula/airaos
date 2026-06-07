import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, User, Mail, Phone, Settings } from 'lucide-react';
import { Appointment, Contact, Agent } from '../types';

interface NativeBookingCalendarProps {
  tenantId?: string;
  agents: Agent[];
  contacts: Contact[];
  onAddAppointment: (newApp: Appointment) => void;
}

export const NativeBookingCalendar: React.FC<NativeBookingCalendarProps> = ({
  tenantId = 't-1',
  agents,
  contacts,
  onAddAppointment
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('General Consultation');
  const [assignedAgentId, setAssignedAgentId] = useState(agents[0]?.id || '');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch slots whenever selectedDate or tenantId changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError('');
    setSelectedSlot('');
    
    fetch(`/api/availability?tenantId=${tenantId}&date=${selectedDate}`)
      .then(res => {
        if (!res.ok) throw new Error('Could not fetch availability');
        return res.json();
      })
      .then(data => {
        setAvailableSlots(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load available slots. Check if backend server is online.');
        setLoading(false);
      });
  }, [selectedDate, tenantId]);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create or Find Contact via backend POST /api/contacts
      const contactRes = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name,
          email,
          phone,
          company: 'Individual',
          assignedAgentId
        })
      });

      if (!contactRes.ok) throw new Error('Failed to register contact in CRM');
      const contactData = await contactRes.json();

      // Parse slot hour and convert to ISO dateTime format (YYYY-MM-DDTHH:MM)
      // selectedSlot format: "02:30 PM"
      const [time, modifier] = selectedSlot.split(' ');
      const [rawHours, minutes] = time.split(':').map(Number);
      let hours = rawHours;
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const hourStr = String(hours).padStart(2, '0');
      const minStr = String(minutes).padStart(2, '0');
      const dateTimeStr = `${selectedDate}T${hourStr}:${minStr}:00`;

      // 2. Schedule Appointment via backend POST /api/appointments
      const appRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          contactId: contactData.id,
          agentId: assignedAgentId,
          dateTime: dateTimeStr,
          duration: 30,
          location: 'Smile Dental Clinic Office Suite A',
          type: serviceType
        })
      });

      if (!appRes.ok) throw new Error('Failed to schedule slot');
      const appData = await appRes.json();

      // Trigger local React state update
      onAddAppointment(appData);
      setBookingSuccess(true);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during scheduling.');
      setLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        justifyContent: 'center',
        flex: 1
      }}>
        <CheckCircle2 size={56} style={{ color: 'var(--success-color)' }} />
        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Appointment Scheduled Successfully!</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '350px' }}>
          We have registered your details in the CRM and blocked slot <strong>{selectedSlot}</strong> on <strong>{selectedDate}</strong>.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setBookingSuccess(false);
            setName('');
            setEmail('');
            setPhone('');
            setSelectedSlot('');
          }}
          style={{ marginTop: '10px' }}
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', flex: 1, flexDirection: 'column' }}>
      <div className="grid-cols-12" style={{ gap: '20px', flex: 1 }}>
        
        {/* Date Selector & Slot Picker */}
        <div className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarIcon size={14} /> Select Booking Date
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Available Slots for {selectedDate}
            </label>
            
            {loading ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '20px 0', fontFamily: 'monospace' }}>
                Generating real-time availability matrix...
              </div>
            ) : error ? (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--danger-color)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--danger-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertTriangle size={14} /> {error}
              </div>
            ) : availableSlots.length === 0 ? (
              <div style={{ padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No active working shifts or slots available on this date.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '4px'
              }}>
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '8px 4px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: selectedSlot === slot ? 'var(--primary-color)' : 'var(--border-glass)',
                      background: selectedSlot === slot ? 'var(--primary-color)' : 'rgba(255,255,255,0.01)',
                      color: selectedSlot === slot ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: selectedSlot === slot ? '600' : 'normal',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client details form */}
        <form onSubmit={handleBookSlot} className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', margin: 0 }}>
            Booking Request Lead Details
          </h4>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '28px', fontSize: '0.75rem' }} 
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="form-input" 
                style={{ paddingLeft: '28px', fontSize: '0.75rem' }} 
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="tel" 
                className="form-input" 
                style={{ paddingLeft: '28px', fontSize: '0.75rem' }} 
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Meeting Service</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ fontSize: '0.75rem' }} 
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>AI Coordinator</label>
              <select 
                className="form-input" 
                style={{ fontSize: '0.75rem' }}
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '10px', alignSelf: 'flex-end', fontSize: '0.75rem' }}
            disabled={loading || !selectedSlot}
          >
            Confirm & Sync Booking
          </button>
        </form>
      </div>
    </div>
  );
};
