import React, { useState, useEffect, useRef } from 'react';

const slides = [
  { id: 1, name: 'Intro' },
  { id: 2, name: 'Problem' },
  { id: 3, name: 'Scale' },
  { id: 4, name: 'Research' },
  { id: 5, name: 'Solution' },
  { id: 6, name: 'How' },
  { id: 7, name: 'Journey' },
  { id: 8, name: 'Compete' },
  { id: 9, name: 'Validate' },
  { id: 10, name: 'Market' },
  { id: 11, name: 'GTM' },
  { id: 12, name: 'Team' },
  { id: 13, name: 'CTA' }
];

export default function LuminaryDeck() {
  const [cur, setCur] = useState(1);
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let W = canvas.width, H = canvas.height;
    starsRef.current = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: Math.random() * W, pz: 0
    }));
    particlesRef.current = Array.from({ length: 35 }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2, col: Math.random() > 0.5 ? '#ff4500' : '#ffd700',
      op: Math.random() * 0.5 + 0.2
    }));

    let animId;
    const draw = () => {
      W = canvas.width; H = canvas.height;
      ctx.fillStyle = 'rgba(3,0,10,0.25)';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      starsRef.current.forEach(s => {
        s.pz = s.z; s.z -= 3;
        if (s.z <= 0) { s.x = Math.random() * W; s.y = Math.random() * H; s.z = W; s.pz = W; }
        const sx = (s.x - cx) / s.z * W + cx, sy = (s.y - cy) / s.z * W + cy;
        const px = (s.x - cx) / s.pz * W + cx, py = (s.y - cy) / s.pz * W + cy;
        const sp = 1 - s.z / W;
        ctx.strokeStyle = `rgba(255,${Math.floor(180 * sp)},0,${sp * 0.9})`;
        ctx.lineWidth = (1 - s.z / W) * 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      });

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.02;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const pulse = Math.sin(p.phase) * 0.4 + 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + pulse * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = p.col === '#ff4500' ? `rgba(255,69,0,${p.op * pulse})` : `rgba(255,215,0,${p.op * pulse})`;
        ctx.fill();
        for (let j = i + 1; j < Math.min(i + 3, particlesRef.current.length); j++) {
          const q = particlesRef.current[j];
          const dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(255,150,0,${(1 - d / 120) * 0.12 * pulse})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setCur(c => Math.min(c + 1, 13));
      if (e.key === 'ArrowLeft') setCur(c => Math.max(c - 1, 1));
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const Tag = ({ color, children }) => {
    const colors = {
      red: { bg: 'rgba(255,69,0,0.15)', border: 'rgba(255,69,0,0.3)', text: '#ff4500' },
      amber: { bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.3)', text: '#ffd700' },
      blue: { bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)', text: '#38bdf8' },
      green: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' }
    };
    const c = colors[color] || colors.amber;
    return <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{children}</span>;
  };

  const Pill = ({ color, children }) => {
    const colors = {
      red: { bg: 'rgba(255,69,0,0.15)', border: 'rgba(255,69,0,0.3)', text: '#ff4500' },
      amber: { bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.3)', text: '#ffd700' },
      blue: { bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)', text: '#38bdf8' },
      green: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' }
    };
    const c = colors[color] || colors.amber;
    return <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', margin: '3px', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{children}</span>;
  };

  const Card = ({ children, style, borderColor }) => (
    <div style={{ background: 'rgba(20,5,40,0.75)', border: `1px solid ${borderColor || 'rgba(220,80,0,0.2)'}`, borderRadius: '14px', padding: '24px', backdropFilter: 'blur(8px)', ...style }}>{children}</div>
  );

  const renderSlide = () => {
    switch (cur) {
      case 1:
        return (
          <div style={{ textAlign: 'center', maxWidth: '800px' }}>
            <Tag color="amber">Protothon 8.0 · Team Quaffle · APMC @ Northeastern</Tag>
            <h1 style={{ fontSize: '56px', fontWeight: 900, marginBottom: '16px' }}>
              <span style={{ background: 'linear-gradient(90deg,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ Luminary</span>
            </h1>
            <p style={{ fontSize: '22px', color: '#fff8ee', marginBottom: '12px' }}>Cross-University Research Discovery Platform</p>
            <p style={{ fontSize: '16px', color: '#c9a96e', maxWidth: '560px', margin: '0 auto 32px' }}>Making institutional research visible, discoverable, and collaborative — without exposing any raw data.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Pill color="red">Federated Learning</Pill>
              <Pill color="amber">Quantum QAOA</Pill>
              <Pill color="blue">Quantum Encoding</Pill>
              <Pill color="green">RAG Search</Pill>
            </div>
            <p style={{ marginTop: '32px', fontSize: '13px', color: '#7a5c2a' }}>March 15, 2026 · Product Conference · Northeastern University</p>
          </div>
        );

      case 2:
        return (
          <div style={{ width: '100%', maxWidth: '960px' }}>
            <Tag color="red">The Problem</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>Meet the Researchers</h2>
            <p style={{ fontSize: '14px', color: '#c9a96e', marginBottom: '20px' }}>3 interviews conducted with PhD students and researchers across universities</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {[
                { name: 'Arjun', role: 'PhD Candidate', uni: 'Northeastern University', pain: 'Spent 4 months building a federated learning pipeline. Found out a Health Sciences lab two buildings away finished the same work 6 months ago.', color: '#ff4500', time: '4 months wasted' },
                { name: 'Priya', role: 'PhD Researcher', uni: 'Research University', pain: 'Needs IRB-approved genomic datasets. Emailed 12 professors across 4 universities. 8 weeks later — still waiting. Thesis deadline moved.', color: '#38bdf8', time: '8 weeks lost' },
                { name: 'Wei', role: 'PhD Student', uni: 'MIT', pain: 'Found his perfect collaborator at a conference — same university, different building. 2 years after he could have met them.', color: '#10b981', time: '2 years too late' }
              ].map((p, i) => (
                <Card key={i} style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg,${p.color},#ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>{p.name[0]}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff8ee' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#a07050' }}>{p.role} · {p.uni}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#c9a96e', lineHeight: 1.6 }}>{p.pain}</p>
                  <div style={{ marginTop: '12px' }}><Pill color="red">{p.time}</Pill></div>
                </Card>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px', padding: '16px', background: 'rgba(255,69,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,69,0,0.2)' }}>
              <p style={{ fontSize: '15px', color: '#fff8ee' }}>These are not edge cases. <strong style={{ color: '#ffd700' }}>This is the daily reality of every PhD student at every research university.</strong></p>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ width: '100%', maxWidth: '960px', textAlign: 'center' }}>
            <Tag color="red">The Scale</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '28px', color: '#fff' }}>The Hidden Cost of <span style={{ background: 'linear-gradient(90deg,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Invisible Research</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              {[
                { num: '85%', label: 'Research investment wasted', src: 'Lancet, 2014 — Biomedical research waste study', color: '#ff4500' },
                { num: '50%', label: 'Studies never published', src: 'PMC Research Waste, 2023', color: '#ffd700' },
                { num: '187', label: 'R1 Research Universities in US', src: 'Carnegie Classification, 2025', color: '#38bdf8' },
                { num: '$580B', label: 'Global Academic R&D spend', src: 'Business Research Company, 2025', color: '#10b981' }
              ].map((s, i) => (
                <Card key={i} style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: s.color, marginBottom: '6px' }}>{s.num}</div>
                  <div style={{ fontSize: '12px', color: '#c9a96e', fontWeight: 600, marginBottom: '8px' }}>{s.label}</div>
                  <p style={{ fontSize: '10px', color: '#7a5c2a', lineHeight: 1.4 }}>{s.src}</p>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: '24px', padding: '14px 20px', background: 'rgba(255,69,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,69,0,0.2)', borderLeft: '3px solid #ff4500' }}>
              <p style={{ fontSize: '16px', fontStyle: 'italic', color: '#fff8ee' }}>"We are surrounded by geniuses — but we're all staring at our own screens."</p>
              <span style={{ fontSize: '12px', color: '#ff4500', fontWeight: 700 }}>— PhD Student, User Interview #3</span>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ width: '100%', maxWidth: '960px' }}>
            <Tag color="amber">User Research</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>3 Interviews. Same 5 Failure Modes.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
              <div>
                {[
                  { quote: '"The hardest part is figuring out what work already exists. A lot of time is spent searching scattered sources."', src: 'Interview #1' },
                  { quote: '"Projects die on the vine because the administrative friction of moving data across departments is higher than the value of the research."', src: 'Interview #3' },
                  { quote: '"If I had known they were working on that algorithm last year, my methodology would have been 10x stronger."', src: 'Interview #3' }
                ].map((q, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #ff4500', padding: '14px 20px', background: 'rgba(255,69,0,0.08)', borderRadius: '0 10px 10px 0', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#fff8ee', lineHeight: 1.6 }}>{q.quote}</p>
                    <span style={{ fontSize: '11px', color: '#ff4500', fontWeight: 700 }}>— {q.src}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#a07050', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Validated Pain Points</div>
                {[
                  ['Duplication of effort is the norm', '3/3'],
                  ['Discovery is entirely accidental', '3/3'],
                  ['Data access takes 4–12 weeks', '3/3'],
                  ['Cold start problem — dead ends repeat', '2/3'],
                  ['Collaboration found years too late', '2/3']
                ].map(([t, s], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,69,0,0.06)', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(255,69,0,0.15)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4500', flexShrink: 0 }}></div>
                    <div style={{ flex: 1, fontSize: '13px', color: '#fff8ee' }}>{t}</div>
                    <div style={{ fontSize: '11px', color: '#ffd700', fontWeight: 700 }}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div style={{ width: '100%', maxWidth: '960px', textAlign: 'center' }}>
            <Tag color="green">The Solution</Tag>
            <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '8px' }}>
              <span style={{ background: 'linear-gradient(90deg,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ Luminary</span>
            </h2>
            <p style={{ fontSize: '18px', color: '#fff8ee', maxWidth: '680px', margin: '0 auto 32px' }}>One search. Every university. All ongoing research. Zero raw data exposure.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
              {[
                { icon: '🔍', title: 'Semantic Discovery', desc: 'RAG-powered search across every connected university.', color: '#ffd700' },
                { icon: '🔐', title: 'Quantum Encoding', desc: 'Users encrypt their data locally using QED before any transmission.', color: '#a855f7' },
                { icon: '⚛️', title: 'QAOA Matching', desc: 'Quantum optimization for collaboration scoring.', color: '#ff4500' },
                { icon: '🔒', title: 'Federated Learning', desc: 'Raw data never leaves the institution. Privacy by design.', color: '#10b981' }
              ].map((f, i) => (
                <Card key={i} style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '14px', color: f.color, marginBottom: '8px', fontWeight: 700 }}>{f.title}</h3>
                  <p style={{ fontSize: '12px', color: '#c9a96e', lineHeight: 1.5 }}>{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <Tag color="blue">Technical Architecture</Tag>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>System Architecture Flow</h2>
            <div style={{ background: 'rgba(20,5,40,0.6)', borderRadius: '14px', padding: '24px', border: '1px solid rgba(255,69,0,0.2)' }}>
              {/* Layer 3: University Systems */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#a07050', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>Layer 3: University Systems</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  {['University 1', 'University 2', 'University 3'].map((uni, i) => (
                    <div key={i} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', textAlign: 'center' }}>{uni}</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '10px' }}>
                        {['KH', 'CPS', 'CE'].map((sys, j) => (
                          <div key={j} style={{ padding: '4px 8px', background: 'rgba(56,189,248,0.2)', borderRadius: '4px', fontSize: '10px', color: '#38bdf8' }}>{sys}</div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#c9a96e' }}>↓</div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(56,189,248,0.15)', borderRadius: '6px', fontSize: '11px', color: '#fff8ee', marginTop: '8px' }}>University Database</div>
                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#c9a96e', marginTop: '6px' }}>↓</div>
                      <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(56,189,248,0.1)', borderRadius: '6px', fontSize: '10px', color: '#38bdf8', marginTop: '6px' }}>SharePoint / Local Data</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Data Flow Arrows */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', margin: '16px 0', fontSize: '11px', color: '#a07050' }}>
                <span>Raw Data ↓</span>
                <span>Training Data ↓</span>
              </div>
              
              {/* Layer 2: Processing */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#a07050', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>Layer 2: Processing & Learning Pipeline</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                  <div style={{ padding: '12px 24px', background: 'rgba(255,165,0,0.2)', border: '2px solid #ffa500', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffa500' }}>Quantum Encoding (QED)</div>
                    <div style={{ fontSize: '10px', color: '#c9a96e', marginTop: '4px' }}>User-side encryption</div>
                  </div>
                  <div style={{ padding: '12px 24px', background: 'rgba(255,165,0,0.2)', border: '2px solid #ffa500', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffa500' }}>Federated Learning (FDL)</div>
                    <div style={{ fontSize: '10px', color: '#c9a96e', marginTop: '4px' }}>Distributed model training</div>
                  </div>
                </div>
              </div>
              
              {/* Data Flow Arrows */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', margin: '16px 0', fontSize: '11px', color: '#a07050' }}>
                <span>Encoded Data ↓</span>
                <span>Federated Models ↓</span>
              </div>
              
              {/* Layer 1: Central */}
              <div>
                <div style={{ fontSize: '11px', color: '#a07050', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>Layer 1: Centralized System</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '12px 32px', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', borderRadius: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>Local DB - LDB</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#c9a96e' }}>↓</div>
                  <div style={{ padding: '12px 32px', background: 'rgba(16,185,129,0.3)', border: '2px solid #10b981', borderRadius: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>Central System - CENT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <Tag color="amber">Product Experience</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>Before and After Luminary</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, padding: '24px', borderRadius: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>❌ Before Luminary</div>
                {[['Week 1–2', 'Searches Google Scholar — only published papers, 2yr lag'], ['Week 3–4', 'Emails 8 professors hoping someone replies'], ['Week 5–8', 'Waits for IRB approvals and data agreements'], ['Week 9–12', 'Manually checks 6 different university portals'], ['Month 4+', 'Discovers duplication — restarts project']].map(([w, t], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                    <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, minWidth: '70px' }}>{w}</span>
                    <span style={{ color: '#c9a96e' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '28px', color: '#ffd700' }}>→</div>
              <div style={{ flex: 1, padding: '24px', borderRadius: '14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>✅ With Luminary</div>
                {[['Minute 1', 'Opens Luminary — types research query in plain English'], ['Minute 2', 'Sees 8 ranked researchers across 6 universities'], ['Minute 3', 'Reviews collaboration scores — finds 91% match'], ['Minute 4', 'Sees dataset compatibility — IRB pre-approved'], ['Day 1', 'Collaboration confirmed — no duplication risk']].map(([w, t], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                    <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, minWidth: '70px' }}>{w}</span>
                    <span style={{ color: '#c9a96e' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <Tag color="red">Competitive Analysis</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>Why Everything Else <span style={{ background: 'linear-gradient(90deg,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fails</span></h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Solution', 'In-Progress', 'Cross-Uni', 'Semantic', 'Privacy', 'Collab Score'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a07050', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['🔍 Google Scholar', '✗', '✓', '✗', '✓', '✗'],
                  ['🔬 ResearchGate', '✗', '✓', '✗', '✓', '✗'],
                  ['📚 Semantic Scholar', '✗', '✓', '✓', '✓', '✗'],
                  ['🗄️ Centralised DB', '✓', '✓', '✓', '✗', '✗']
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: cell === '✓' ? '#10b981' : cell === '✗' ? '#ef4444' : '#c9a96e', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
                <tr style={{ background: 'rgba(255,69,0,0.1)' }}>
                  <td style={{ padding: '12px 14px', color: '#ffd700', fontWeight: 700 }}>✦ Luminary</td>
                  {['✓', '✓', '✓', '✓', '✓'].map((c, i) => (
                    <td key={i} style={{ padding: '12px 14px', color: '#10b981', fontWeight: 700 }}>{c}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(255,215,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.2)', fontSize: '14px', color: '#ffd700', textAlign: 'center' }}>
              No existing solution discovers in-progress, cross-university research while keeping raw data private.
            </div>
          </div>
        );

      case 9:
        return (
          <div style={{ width: '100%', maxWidth: '960px' }}>
            <Tag color="green">Product Validation</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>PM Metrics That Matter</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#a07050', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>User Validation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { num: '3', label: 'User Interviews', color: '#ff4500' },
                    { num: '5/5', label: 'Pain Points Validated', color: '#ffd700' },
                    { num: '100%', label: 'Would Use Product', color: '#10b981' },
                    { num: '3/3', label: 'Duplication Experienced', color: '#38bdf8' }
                  ].map((m, i) => (
                    <Card key={i} style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: m.color }}>{m.num}</div>
                      <div style={{ fontSize: '11px', color: '#a07050', marginTop: '4px' }}>{m.label}</div>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#a07050', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>RICE Prioritization</div>
                {[
                  { feature: 'Collaboration Request Flow', score: 800, pct: 100, color: '#10b981' },
                  { feature: 'Semantic Search (RAG)', score: 400, pct: 50, color: '#ffd700' },
                  { feature: 'Dataset Discovery', score: 350, pct: 44, color: '#38bdf8' },
                  { feature: 'QAOA Collab Score', score: 262, pct: 33, color: '#ff4500' }
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ flex: 2, fontSize: '12px', color: '#fff8ee' }}>{r.feature}</div>
                    <div style={{ flex: 3, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: r.color, minWidth: '40px', textAlign: 'right' }}>{r.score}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '14px 20px', background: 'rgba(255,69,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,69,0,0.2)', borderLeft: '3px solid #ff4500' }}>
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#fff8ee' }}>"If I had known they were working on that algorithm last year, my methodology would have been 10x stronger."</p>
              <span style={{ fontSize: '11px', color: '#ff4500', fontWeight: 700 }}>— User Interview #3</span>
            </div>
          </div>
        );

      case 10:
        return (
          <div style={{ width: '100%', maxWidth: '960px' }}>
            <Tag color="blue">Market Analysis</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px', color: '#fff' }}>Market Opportunity</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '24px' }}>
                {[
                  { h: '160px', value: '$2.1B', label: 'TAM', color: '#ff4500' },
                  { h: '110px', value: '$290M', label: 'SAM', color: '#ffd700' },
                  { h: '60px', value: '$2M', label: 'SOM', color: '#10b981' }
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: m.h, width: '80px', background: `linear-gradient(180deg, ${m.color}, ${m.color}66)`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px' }}>
                      <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>{m.value}</span>
                    </div>
                    <div style={{ background: 'rgba(20,5,40,0.75)', padding: '8px 16px', borderRadius: '0 0 8px 8px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: m.color, fontSize: '12px' }}>{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Card style={{ marginBottom: '12px', borderColor: 'rgba(255,69,0,0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#ff4500', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>TAM — Total Addressable Market</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#ff4500' }}>$2.1B</div>
                  <p style={{ fontSize: '11px', color: '#c9a96e', marginTop: '4px' }}>20,000+ universities globally × $105K avg. research tool spend = $2.1B</p>
                </Card>
                <Card style={{ marginBottom: '12px', borderColor: 'rgba(255,215,0,0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#ffd700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>SAM — Serviceable Market</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffd700' }}>$290M</div>
                  <p style={{ fontSize: '11px', color: '#c9a96e', marginTop: '4px' }}>187 R1 universities (US) × $155K avg. × 10 tools = $290M</p>
                </Card>
                <Card style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>SOM — Obtainable Year 1</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>$2M ARR</div>
                  <p style={{ fontSize: '11px', color: '#c9a96e', marginTop: '4px' }}>10 Boston-area R1 universities × $200K SaaS license = $2M</p>
                </Card>
              </div>
            </div>
          </div>
        );

      case 11:
        return (
          <div style={{ width: '100%', maxWidth: '960px' }}>
            <Tag color="blue">Go-To-Market</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>From One Department to <span style={{ background: 'linear-gradient(90deg,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Every University</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {[
                { phase: 'Phase 1 — Department', time: 'Q1-Q2 2026', desc: 'Single department pilot · 3 internal systems connected · 100 active researchers', gate: '3 cross-dept collaborations', revenue: 'Pilot (Free)', color: '#ff4500' },
                { phase: 'Phase 2 — Full University', time: 'Q3-Q4 2026', desc: 'All university colleges · Dataset access workflow live · Grant visibility', gate: '$150K-$200K SaaS license', revenue: '$200K ARR', color: '#ffd700' },
                { phase: 'Phase 3 — Multi-University', time: 'Year 2+', desc: 'MIT · BU · Drexel · Tufts as federated nodes · Network effect kicks in', gate: '10 universities × $200K', revenue: '$2M ARR', color: '#10b981' }
              ].map((p, i) => (
                <Card key={i} style={{ borderTop: `3px solid ${p.color}` }}>
                  <div style={{ fontSize: '11px', color: p.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{p.phase}</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: p.color, marginBottom: '8px' }}>{p.time}</div>
                  <p style={{ fontSize: '12px', color: '#c9a96e', marginBottom: '12px', lineHeight: 1.5 }}>{p.desc}</p>
                  <div style={{ fontSize: '10px', color: '#a07050', fontWeight: 700 }}>Success Gate</div>
                  <p style={{ fontSize: '11px', color: '#fff8ee', marginBottom: '8px' }}>{p.gate}</p>
                  <div style={{ fontSize: '10px', color: '#a07050', fontWeight: 700 }}>Revenue</div>
                  <p style={{ fontSize: '12px', color: p.color, fontWeight: 700 }}>{p.revenue}</p>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px 20px', background: 'rgba(255,215,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.2)', fontSize: '12px', color: '#c9a96e' }}>
              <strong style={{ color: '#ffd700' }}>Pricing Rationale:</strong> Comparable research tools (Elsevier SciVal, Clarivate InCites) charge $100K-$300K/year for institutional licenses. Our $150K-$200K positions competitively while delivering unique federated + quantum value.
            </div>
          </div>
        );

      case 12:
        return (
          <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
            <Tag color="amber">Team Quaffle</Tag>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px', color: '#fff' }}>The Team Behind Luminary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              {[
                { name: 'Uttkarsh Sharma', role: 'Team Leader', skill: 'Product / Market / QAOA', color: '#ff4500' },
                { name: 'Riya N Taori', role: 'ML Engineer', skill: 'Federated Learning / Frontend', color: '#ffd700' },
                { name: 'Aakash Kumar', role: 'Backend Lead', skill: 'Deep Learning / Backend', color: '#38bdf8' },
                { name: 'Tanya Ojha', role: 'Data Scientist', skill: 'Quantum Encoding / Analytics', color: '#10b981' }
              ].map((m, i) => (
                <Card key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', margin: '0 auto 12px', borderRadius: '50%', background: `linear-gradient(135deg, ${m.color}, #ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff' }}>{m.name.split(' ').map(n => n[0]).join('')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff8ee' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: m.color, marginTop: '4px' }}>{m.role}</div>
                  <div style={{ fontSize: '10px', color: '#7a5c2a', marginTop: '8px' }}>{m.skill}</div>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Pill color="amber">🏆 Protothon 8.0 Finalists</Pill>
              <Pill color="blue">🎓 APMC @ Northeastern</Pill>
            </div>
          </div>
        );

      case 13:
        return (
          <div style={{ textAlign: 'center', maxWidth: '700px' }}>
            <Tag color="green">Thank You</Tag>
            <h1 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '16px' }}>
              <span style={{ background: 'linear-gradient(90deg,#ff4500,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ Luminary</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#fff8ee', marginBottom: '8px' }}>by Team Quaffle</p>
            <p style={{ fontSize: '15px', color: '#c9a96e', marginBottom: '24px' }}>Cross-University Research Discovery Platform</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Pill color="red">85% research waste addressed</Pill>
              <Pill color="amber">187 R1 universities</Pill>
              <Pill color="blue">$2.1B TAM</Pill>
              <Pill color="green">FERPA compliant</Pill>
            </div>
            <Card style={{ maxWidth: '550px', margin: '0 auto', padding: '20px' }}>
              <p style={{ fontSize: '16px', color: '#fff8ee', marginBottom: '12px' }}>Time to find a relevant collaborator:</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <span style={{ fontSize: '24px', color: '#ef4444', textDecoration: 'line-through' }}>Weeks</span>
                <span style={{ fontSize: '28px', color: '#ffd700' }}>→</span>
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>Minutes</span>
              </div>
            </Card>
            <p style={{ marginTop: '32px', fontSize: '14px', color: '#a07050' }}>Protothon 8.0 · APMC @ Northeastern · March 15, 2026</p>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: '#03000a', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 1, height: 'calc(100% - 70px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 60px', overflow: 'auto' }}>
        {renderSlide()}
      </div>

      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,69,0,0.3)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <button onClick={() => setCur(c => Math.max(c - 1, 1))} style={{ background: 'none', border: 'none', color: '#ff4500', fontSize: '18px', cursor: 'pointer', padding: '4px 10px' }}>←</button>
        {slides.map(s => (
          <button key={s.id} onClick={() => setCur(s.id)} style={{ background: cur === s.id ? 'rgba(255,69,0,0.2)' : 'none', border: 'none', color: cur === s.id ? '#ff4500' : '#a07050', fontSize: '11px', cursor: 'pointer', padding: '4px 8px', borderRadius: '20px', transition: 'all 0.2s' }}>
            {s.name}
          </button>
        ))}
        <span style={{ color: '#7a5c2a', fontSize: '11px', minWidth: '45px', textAlign: 'center' }}>{cur} / 13</span>
        <button onClick={() => setCur(c => Math.min(c + 1, 13))} style={{ background: 'none', border: 'none', color: '#ff4500', fontSize: '18px', cursor: 'pointer', padding: '4px 10px' }}>→</button>
      </div>
    </div>
  );
}
