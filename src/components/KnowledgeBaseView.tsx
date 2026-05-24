import React, { useState } from 'react';
import { Database, Plus, Search, FileText, Globe, Cloud, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { KnowledgeSource, KbChunk, Agent } from '../types';

interface KnowledgeBaseViewProps {
  sources: KnowledgeSource[];
  chunks: KbChunk[];
  onAddSource: (source: KnowledgeSource, sourceChunks: KbChunk[], agentId?: string) => void;
  agents: Agent[];
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  sources,
  chunks,
  onAddSource,
  agents
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('global');
  const [activeTab, setActiveTab] = useState<'upload' | 'crawl' | 'connect'>('upload');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(sources[0]?.id || null);
  
  // Crawler states
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawling, setCrawling] = useState(false);

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleCrawl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim() || crawling) return;

    setCrawling(true);

    setTimeout(() => {
      const srcName = `Website: ${crawlUrl.replace('https://', '').replace('http://', '')}`;
      const newSource: KnowledgeSource = {
        id: `ks-${Date.now()}`,
        name: srcName,
        type: 'url',
        size: '5 Pages',
        tokenCount: 4800,
        status: 'synced',
        lastSync: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      const newChunks: KbChunk[] = [
        {
          id: `chk-${Date.now()}-1`,
          sourceId: newSource.id,
          sourceName: srcName,
          content: `Scraped from ${crawlUrl}: Contact info and core offerings. Our team comprises industry veterans. We operate on flexible service models.`,
          tokens: 28
        },
        {
          id: `chk-${Date.now()}-2`,
          sourceId: newSource.id,
          sourceName: srcName,
          content: `Scraped from ${crawlUrl}: Pricing plans. Basic tier is free, Premium plan is $49/month, Enterprise custom pricing. Refund policy supports 14-day cancellation.`,
          tokens: 30
        }
      ];

      onAddSource(newSource, newChunks, selectedAgentId);
      setSelectedSourceId(newSource.id);
      setCrawlUrl('');
      setCrawling(false);
    }, 2000);
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileContent.trim() || uploading) return;

    setUploading(true);

    setTimeout(() => {
      const newSource: KnowledgeSource = {
        id: `ks-${Date.now()}`,
        name: fileName,
        type: 'file',
        size: `${(fileContent.length / 1024).toFixed(1)} KB`,
        tokenCount: Math.ceil(fileContent.split(' ').length * 1.3),
        status: 'synced',
        lastSync: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      // Split fileContent into mock chunks
      const sentences = fileContent.split(/[.!?]/).filter(s => s.trim().length > 0);
      const chunkList: KbChunk[] = [];
      
      // Combine every 3 sentences into a chunk
      for (let i = 0; i < sentences.length; i += 3) {
        const text = sentences.slice(i, i + 3).join('. ').trim() + '.';
        chunkList.push({
          id: `chk-${Date.now()}-${i}`,
          sourceId: newSource.id,
          sourceName: newSource.name,
          content: text,
          tokens: Math.ceil(text.split(' ').length * 1.3)
        });
      }

      onAddSource(newSource, chunkList, selectedAgentId);
      setSelectedSourceId(newSource.id);
      setFileName('');
      setFileContent('');
      setUploading(false);
    }, 1500);
  };

  const filteredChunks = chunks.filter(c => selectedSourceId ? c.sourceId === selectedSourceId : true);

  return (
    <div className="animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="view-title">Knowledge Base</h2>
          <p className="view-subtitle">Ingest company document guides, web links, or cloud folders into the AI vector brain.</p>
        </div>
      </div>

      <div className="grid-cols-12">
        
        {/* Left Column: Add Knowledge forms */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
              <button
                onClick={() => setActiveTab('upload')}
                className="btn"
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: activeTab === 'upload' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'upload' ? 'white' : 'var(--text-secondary)'
                }}
              >
                <FileText size={14} /> Upload Document
              </button>
              <button
                onClick={() => setActiveTab('crawl')}
                className="btn"
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: activeTab === 'crawl' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'crawl' ? 'white' : 'var(--text-secondary)'
                }}
              >
                <Globe size={14} /> Scrape Website
              </button>
              <button
                onClick={() => setActiveTab('connect')}
                className="btn"
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: activeTab === 'connect' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'connect' ? 'white' : 'var(--text-secondary)'
                }}
              >
                <Cloud size={14} /> Cloud Connector
              </button>
            </div>

            {activeTab === 'upload' && (
              <form onSubmit={handleFileUpload}>
                <div className="form-group">
                  <label className="form-label">Document Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Refund Policy.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Raw Text Content</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Paste document sentences here..." 
                    style={{ minHeight: '110px', fontSize: '0.75rem' }} 
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Associate with AI Employee</label>
                  <select 
                    className="form-input" 
                    value={selectedAgentId} 
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', fontSize: '0.75rem' }}
                  >
                    <option value="global">Global (All Employees)</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }} disabled={uploading}>
                  {uploading ? 'Tokenizing & Chunking...' : 'Upload & Train Brain'}
                </button>
              </form>
            )}

            {activeTab === 'crawl' && (
              <form onSubmit={handleCrawl}>
                <div className="form-group">
                  <label className="form-label">Target Website URL</label>
                  <input type="url" className="form-input" placeholder="https://example.com/about" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Associate with AI Employee</label>
                  <select 
                    className="form-input" 
                    value={selectedAgentId} 
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', fontSize: '0.75rem' }}
                  >
                    <option value="global">Global (All Employees)</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }} disabled={crawling}>
                  {crawling ? 'Crawling Domain Webpages...' : 'Scrape Web Link'}
                </button>
              </form>
            )}

            {activeTab === 'connect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Google Drive sync</span>
                  <span style={{ color: 'var(--primary-color)' }}>Link Account</span>
                </button>
                <button type="button" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notion Workspace sync</span>
                  <span style={{ color: 'var(--primary-color)' }}>Link Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Sources list status */}
          <div className="glass-panel" style={{ padding: '20px', maxHeight: '280px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>Active Ingested Files</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sources.map((s) => {
                const isSelected = s.id === selectedSourceId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSourceId(s.id)}
                    style={{
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{s.tokenCount.toLocaleString()} tokens • {s.size}</div>
                    </div>
                    <div>
                      {s.status === 'synced' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.55rem' }}>Ready</span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.55rem' }}>Syncing</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Chunk Vector Inspector */}
        <div className="col-span-7 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '580px' }}>
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} style={{ color: 'var(--accent-color)' }} /> Vector Chunk Inspector
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Processed document splits indexable by cosine similarity RAG embeddings.
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredChunks.map((chunk) => (
              <div key={chunk.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Source: <strong>{chunk.sourceName}</strong></span>
                  <span>Size: {chunk.tokens} tokens</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                  {chunk.content}
                </p>
              </div>
            ))}

            {filteredChunks.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No chunks found for this selection.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
