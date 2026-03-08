'use client'
export default function Home() {
  return <AppShell />
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────
type Page = 'login' | 'dashboard' | 'workflow' | 'characters' | 'works' | 'settings'
type Step = 1 | 2 | 3 | 4

interface DialogLine {
  id: string
  speaker: string
  text: string
  emotion: string
  action: string
  scene: string
  imageUrl?: string
  imageLoading?: boolean
}

interface Project {
  id: string
  title: string
  style: string
  lines: DialogLine[]
  createdAt: string
  cover?: string
}

// ─── Constants ────────────────────────────────────────────
const EMOTIONS = ['😊开心','😢悲伤','😠愤怒','😮惊讶','😏得意','😳害羞','😨恐惧','🤔思考','😍心动','😴困倦','😤不满','🥺委屈']
const ACTIONS = ['站立说话','挥手打招呼','点头赞同','摇头拒绝','拍手鼓掌','捂嘴惊讶','皱眉思考','微笑回应','转身离开','奔跑冲来','深情凝视','发怒斥责']
const SCENES = [
  {id:'school',name:'学校教室',emoji:'🏫',color:'#3b82f6'},
  {id:'city',name:'城市街道',emoji:'🌆',color:'#8b5cf6'},
  {id:'home',name:'温馨家居',emoji:'🏠',color:'#10b981'},
  {id:'cafe',name:'咖啡馆',emoji:'☕',color:'#f59e0b'},
  {id:'forest',name:'神秘森林',emoji:'🌲',color:'#059669'},
  {id:'space',name:'宇宙星空',emoji:'🌌',color:'#6366f1'},
  {id:'beach',name:'海滨沙滩',emoji:'🏖️',color:'#0ea5e9'},
  {id:'castle',name:'古堡宫殿',emoji:'🏰',color:'#7c3aed'},
  {id:'office',name:'现代办公',emoji:'💼',color:'#64748b'},
  {id:'park',name:'公园花园',emoji:'🌸',color:'#ec4899'},
  {id:'lab',name:'科技实验室',emoji:'🔬',color:'#14b8a6'},
  {id:'market',name:'热闹集市',emoji:'🛍️',color:'#f97316'},
]

const CHARACTERS = [
  {id:'girl1',name:'樱花少女',emoji:'👧',style:'anime',desc:'活泼可爱的二次元少女'},
  {id:'boy1',name:'帅气少年',emoji:'👦',style:'anime',desc:'热血正直的动漫男主'},
  {id:'woman1',name:'优雅女性',emoji:'👩',style:'modern',desc:'知性温柔的现代女性'},
  {id:'man1',name:'成熟男性',emoji:'👨',style:'modern',desc:'稳重可靠的都市男士'},
  {id:'old1',name:'睿智老者',emoji:'🧓',style:'classic',desc:'饱经风霜的智慧长者'},
  {id:'child1',name:'萌系小孩',emoji:'🧒',style:'cute',desc:'天真烂漫的可爱儿童'},
  {id:'robot1',name:'机器伙伴',emoji:'🤖',style:'sci-fi',desc:'拥有情感的智能机器人'},
  {id:'princess1',name:'魔法公主',emoji:'👸',style:'fantasy',desc:'掌握魔法的奇幻公主'},
  {id:'warrior1',name:'英雄战士',emoji:'🥷',style:'action',desc:'身手矫健的武林侠客'},
  {id:'cat1',name:'猫耳娘',emoji:'😺',style:'anime',desc:'可爱俏皮的猫系角色'},
  {id:'alien1',name:'外星来客',emoji:'👽',style:'sci-fi',desc:'神秘有趣的外星访客'},
  {id:'dragon1',name:'龙族少年',emoji:'🐉',style:'fantasy',desc:'拥有龙血的传奇少年'},
]

const STYLES = ['青春校园','都市爱情','奇幻冒险','科幻未来','武侠江湖','悬疑推理','轻松日常','热血竞技','古风仙侠']

const TEMPLATES = [
  {title:'相遇之日',style:'青春校园',lines:[
    {speaker:'少女',text:'这本书是你的吗？刚才在走廊捡到的。',emotion:'😊开心',action:'微笑回应',scene:'school'},
    {speaker:'少年',text:'啊！是我的！太谢谢你了，我找了好久！',emotion:'😮惊讶',action:'挥手打招呼',scene:'school'},
    {speaker:'少女',text:'以后要保管好自己的东西哦，笨蛋。',emotion:'😏得意',action:'点头赞同',scene:'school'},
  ]},
  {title:'咖啡馆偶遇',style:'都市爱情',lines:[
    {speaker:'她',text:'不好意思，这里可以坐吗？',emotion:'😳害羞',action:'站立说话',scene:'cafe'},
    {speaker:'他',text:'当然，请坐。今天人真多呢。',emotion:'😊开心',action:'微笑回应',scene:'cafe'},
    {speaker:'她',text:'是啊，不过能和你坐在一起，感觉很幸运。',emotion:'😍心动',action:'深情凝视',scene:'cafe'},
  ]},
  {title:'星际危机',style:'科幻未来',lines:[
    {speaker:'指挥官',text:'报告！敌舰已进入射程，请指示！',emotion:'😨恐惧',action:'发怒斥责',scene:'space'},
    {speaker:'舰长',text:'全员戒备，启动防护罩，准备迎战！',emotion:'😠愤怒',action:'拍手鼓掌',scene:'space'},
    {speaker:'AI',text:'警告：能量不足，建议立即撤退。',emotion:'🤔思考',action:'站立说话',scene:'space'},
  ]},
  {title:'神秘任务',style:'武侠江湖',lines:[
    {speaker:'侠客',text:'此地危险，你为何独自前来？',emotion:'😠愤怒',action:'皱眉思考',scene:'forest'},
    {speaker:'少女',text:'我寻访多年，只为找到失踪的父亲。',emotion:'😢悲伤',action:'捂嘴惊讶',scene:'forest'},
    {speaker:'侠客',text:'好，我助你一臂之力，我们结伴同行！',emotion:'😊开心',action:'挥手打招呼',scene:'forest'},
  ]},
]

// ─── Main App ─────────────────────────────────────────────
function AppShell() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<Page>('login')
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) setPage('dashboard')
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s)
      if (!s) setPage('login')
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load projects from storage
  useEffect(() => {
    if (!session) return
    const key = `manju_projects_${session.user.id}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try { setProjects(JSON.parse(stored)) } catch {}
    }
  }, [session])

  const saveProjects = useCallback((p: Project[]) => {
    setProjects(p)
    if (session) {
      localStorage.setItem(`manju_projects_${session.user.id}`, JSON.stringify(p))
    }
  }, [session])

  if (loading) return <LoadingScreen />

  if (!session || page === 'login') {
    return <LoginPage onLogin={(s) => { setSession(s); setPage('dashboard') }} />
  }

  if (page === 'workflow') {
    return (
      <WorkflowPage
        session={session}
        project={currentProject}
        onSave={(p) => {
          const idx = projects.findIndex(x => x.id === p.id)
          const updated = idx >= 0
            ? projects.map(x => x.id === p.id ? p : x)
            : [...projects, p]
          saveProjects(updated)
          setCurrentProject(p)
        }}
        onBack={() => setPage('dashboard')}
      />
    )
  }

  return (
    <MainLayout
      session={session}
      page={page}
      setPage={setPage}
      projects={projects}
      onOpenProject={(p) => { setCurrentProject(p); setPage('workflow') }}
      onNewProject={() => { setCurrentProject(null); setPage('workflow') }}
      onDeleteProject={(id) => saveProjects(projects.filter(p => p.id !== id))}
    />
  )
}

// ─── Loading Screen ────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', background:'var(--bg)',
      gap:20
    }}>
      <div style={{
        width:72, height:72, borderRadius:'50%',
        background:'linear-gradient(135deg,#7c3aed,#ec4899)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:32, animation:'float 2s ease-in-out infinite'
      }}>🎬</div>
      <div style={{color:'var(--primary-light)',fontSize:18,fontWeight:600}}>对话类漫剧工作流</div>
      <div style={{
        width:40, height:40, border:'3px solid var(--border)',
        borderTopColor:'var(--primary)', borderRadius:'50%',
        animation:'spin 0.8s linear infinite'
      }} />
    </div>
  )
}

// ─── Login Page ────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (s: Session) => void }) {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'register') {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, membership: 'premium', credits: 9999 } }
      })
      if (err) { setError(err.message); setLoading(false); return }
      if (data.session) { onLogin(data.session) }
      else {
        setSuccess('注册成功！请检查邮箱验证链接，或直接登录。')
        setMode('login')
      }
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError('邮箱或密码错误，请重试'); setLoading(false); return }
      if (data.session) onLogin(data.session)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', overflow:'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position:'absolute', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        top:-200, right:-100, pointerEvents:'none'
      }} />
      <div style={{
        position:'absolute', width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        bottom:-100, left:-100, pointerEvents:'none'
      }} />

      <div style={{
        width:'100%', maxWidth:420, animation:'fadeIn 0.5s ease'
      }}>
        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{
            width:80, height:80, borderRadius:24,
            background:'linear-gradient(135deg,#7c3aed,#ec4899)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:40, margin:'0 auto 16px',
            boxShadow:'0 8px 32px rgba(124,58,237,0.4)',
            animation:'float 3s ease-in-out infinite'
          }}>🎬</div>
          <h1 style={{fontSize:26, fontWeight:700, color:'var(--text)',
            background:'linear-gradient(135deg,#a855f7,#ec4899)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
            对话类漫剧工作流
          </h1>
          <p style={{color:'var(--text2)', fontSize:14, marginTop:6}}>
            AI驱动 · 一键生成 · 全功能开放
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'var(--surface)', borderRadius:var_('--radius-lg'),
          border:'1px solid var(--border)', padding:32,
          boxShadow:'0 20px 60px rgba(0,0,0,0.4)'
        }}>
          {/* Tabs */}
          <div style={{
            display:'flex', background:'var(--bg2)', borderRadius:12,
            padding:4, marginBottom:24
          }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{
                  flex:1, padding:'8px 0', borderRadius:8, border:'none',
                  cursor:'pointer', fontWeight:600, fontSize:14, transition:'all 0.2s',
                  background: mode===m ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'transparent',
                  color: mode===m ? '#fff' : 'var(--text2)',
                  boxShadow: mode===m ? '0 4px 12px rgba(124,58,237,0.4)' : 'none'
                }}>
                {m==='login'?'登录':'注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode==='register' && (
              <div style={{marginBottom:16}}>
                <label style={{display:'block',color:'var(--text2)',fontSize:13,marginBottom:6}}>用户名</label>
                <input
                  value={username} onChange={e=>setUsername(e.target.value)}
                  placeholder="给自己起个名字"
                  style={inputStyle}
                />
              </div>
            )}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',color:'var(--text2)',fontSize:13,marginBottom:6}}>邮箱</label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="your@email.com"
                required style={inputStyle}
              />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',color:'var(--text2)',fontSize:13,marginBottom:6}}>密码</label>
              <input
                type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="至少6位密码"
                required minLength={6} style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:8, padding:'10px 14px', color:'#f87171',
                fontSize:13, marginBottom:16
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
                borderRadius:8, padding:'10px 14px', color:'#6ee7b7',
                fontSize:13, marginBottom:16
              }}>{success}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'14px 0', borderRadius:12, border:'none',
              background: loading ? 'var(--surface2)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: loading ? 'var(--text2)' : '#fff',
              fontWeight:700, fontSize:16, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(124,58,237,0.4)',
              transition:'all 0.2s'
            }}>
              {loading ? '处理中...' : mode==='login' ? '🚀 立即登录' : '✨ 创建账号'}
            </button>
          </form>

          {/* Quick access */}
          <div style={{marginTop:20, padding:16, background:'var(--bg2)', borderRadius:10}}>
            <div style={{color:'var(--text3)', fontSize:12, marginBottom:8, textAlign:'center'}}>🎁 测试账号（已开通全部功能）</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center'}}>
              {[
                {email:'admin@manju.ai', pwd:'Admin@Manju2025!', label:'管理员'},
                {email:'test@manju.ai', pwd:'Test@Manju2025!', label:'测试用户'},
              ].map(acc => (
                <button key={acc.email} onClick={() => {
                  setEmail(acc.email); setPassword(acc.pwd); setMode('login')
                }} style={{
                  padding:'6px 12px', background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:8, color:'var(--text2)', fontSize:12, cursor:'pointer',
                  transition:'all 0.2s'
                }}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{textAlign:'center', color:'var(--text3)', fontSize:12, marginTop:16}}>
          注册即视为同意服务条款 · 所有创作功能免费使用
        </p>
      </div>
    </div>
  )
}

// ─── Main Layout ───────────────────────────────────────────
function MainLayout({
  session, page, setPage, projects, onOpenProject, onNewProject, onDeleteProject
}: {
  session: Session
  page: Page
  setPage: (p: Page) => void
  projects: Project[]
  onOpenProject: (p: Project) => void
  onNewProject: () => void
  onDeleteProject: (id: string) => void
}) {
  const user = session.user
  const username = user.user_metadata?.username || user.email?.split('@')[0] || '创作者'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: {id: Page; icon: string; label: string}[] = [
    {id:'dashboard',icon:'🏠',label:'创作台'},
    {id:'characters',icon:'👥',label:'角色库'},
    {id:'works',icon:'🎬',label:'我的作品'},
    {id:'settings',icon:'⚙️',label:'设置'},
  ]

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'var(--bg)'}}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 64,
        background:'var(--bg2)',
        borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        transition:'width 0.3s ease',
        overflow:'hidden', flexShrink:0,
        position:'sticky', top:0, height:'100vh',
        zIndex:10
      }}>
        {/* Logo */}
        <div style={{
          padding:'16px 12px', display:'flex', alignItems:'center', gap:12,
          borderBottom:'1px solid var(--border)', cursor:'pointer'
        }} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div style={{
            width:40, height:40, borderRadius:12, flexShrink:0,
            background:'linear-gradient(135deg,#7c3aed,#ec4899)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20
          }}>🎬</div>
          {sidebarOpen && (
            <span style={{
              fontWeight:700, fontSize:14, color:'var(--text)',
              whiteSpace:'nowrap', overflow:'hidden'
            }}>漫剧工作流</span>
          )}
        </div>

        {/* Nav */}
        <nav style={{flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:4}}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 8px', borderRadius:10, border:'none',
                cursor:'pointer', transition:'all 0.2s',
                background: page===item.id
                  ? 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(168,85,247,0.2))'
                  : 'transparent',
                color: page===item.id ? 'var(--primary-light)' : 'var(--text2)',
                borderLeft: page===item.id ? '3px solid var(--primary)' : '3px solid transparent',
                width:'100%', textAlign:'left', whiteSpace:'nowrap'
              }}>
              <span style={{fontSize:20, flexShrink:0}}>{item.icon}</span>
              {sidebarOpen && <span style={{fontSize:14, fontWeight:page===item.id?600:400}}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding:'12px 8px', borderTop:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:10
        }}>
          <div style={{
            width:36, height:36, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#7c3aed,#ec4899)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, fontWeight:700, color:'#fff'
          }}>
            {username[0]?.toUpperCase()}
          </div>
          {sidebarOpen && (
            <div style={{overflow:'hidden', flex:1}}>
              <div style={{fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{username}</div>
              <div style={{
                fontSize:11, padding:'1px 6px', background:'linear-gradient(135deg,#7c3aed,#ec4899)',
                borderRadius:4, color:'#fff', display:'inline-block', marginTop:2
              }}>✨ 旗舰会员</div>
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <main style={{flex:1, overflow:'auto', minWidth:0}}>
        {page==='dashboard' && (
          <DashboardPage
            session={session}
            projects={projects}
            onOpenProject={onOpenProject}
            onNewProject={onNewProject}
            onDeleteProject={onDeleteProject}
          />
        )}
        {page==='characters' && <CharactersPage />}
        {page==='works' && <WorksPage projects={projects} onOpenProject={onOpenProject} />}
        {page==='settings' && <SettingsPage session={session} onSignOut={async () => { await supabase.auth.signOut() }} />}
      </main>
    </div>
  )
}

// ─── Dashboard Page ────────────────────────────────────────
function DashboardPage({session, projects, onOpenProject, onNewProject, onDeleteProject}: {
  session: Session
  projects: Project[]
  onOpenProject: (p: Project) => void
  onNewProject: () => void
  onDeleteProject: (id: string) => void
}) {
  const username = session.user.user_metadata?.username || session.user.email?.split('@')[0]

  return (
    <div style={{padding:'24px', maxWidth:1200, margin:'0 auto'}}>
      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg, var(--bg3), var(--surface))',
        borderRadius:var_('--radius-lg'), padding:28, marginBottom:24,
        border:'1px solid var(--border)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        flexWrap:'wrap', gap:16
      }}>
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:6}}>
            👋 你好，{username}
          </h2>
          <p style={{color:'var(--text2)', fontSize:14}}>
            准备好创作你的下一部漫剧了吗？✨
          </p>
        </div>
        <button onClick={onNewProject} style={{
          padding:'12px 24px', background:'linear-gradient(135deg,#7c3aed,#a855f7)',
          border:'none', borderRadius:12, color:'#fff', fontWeight:700,
          fontSize:15, cursor:'pointer',
          boxShadow:'0 6px 20px rgba(124,58,237,0.4)',
          display:'flex', alignItems:'center', gap:8, transition:'all 0.2s'
        }}>
          <span style={{fontSize:20}}>+</span> 新建漫剧
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:24}}>
        {[
          {icon:'📚',label:'我的项目',value:projects.length,color:'#7c3aed'},
          {icon:'🎬',label:'已完成',value:projects.filter(p=>p.lines?.length>0).length,color:'#10b981'},
          {icon:'💎',label:'创作积分',value:'9,999',color:'#f59e0b'},
          {icon:'🏆',label:'会员等级',value:'旗舰版',color:'#ec4899'},
        ].map(s => (
          <div key={s.label} style={{
            background:'var(--surface)', borderRadius:var_('--radius'),
            padding:16, border:'1px solid var(--border)',
            display:'flex', flexDirection:'column', gap:8
          }}>
            <div style={{fontSize:28}}>{s.icon}</div>
            <div style={{fontSize:24, fontWeight:700, color:s.color}}>{s.value}</div>
            <div style={{fontSize:13, color:'var(--text2)'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick templates */}
      <div style={{marginBottom:24}}>
        <h3 style={{fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:12}}>🎯 快速开始模板</h3>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12}}>
          {TEMPLATES.map(t => (
            <div key={t.title} onClick={onNewProject}
              style={{
                background:'var(--surface)', borderRadius:var_('--radius'),
                border:'1px solid var(--border)', padding:16,
                cursor:'pointer', transition:'all 0.2s',
                display:'flex', flexDirection:'column', gap:8
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='var(--border)')}
            >
              <div style={{fontSize:24}}>📖</div>
              <div style={{fontWeight:600, fontSize:14, color:'var(--text)'}}>{t.title}</div>
              <div style={{
                display:'inline-block', fontSize:11, padding:'2px 8px',
                background:'rgba(124,58,237,0.2)', borderRadius:4, color:'var(--primary-light)'
              }}>{t.style}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h3 style={{fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:12}}>📁 我的项目</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16}}>
            {projects.map(p => (
              <div key={p.id} style={{
                background:'var(--surface)', borderRadius:var_('--radius'),
                border:'1px solid var(--border)', overflow:'hidden',
                transition:'all 0.2s', cursor:'pointer'
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 24px rgba(124,58,237,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}
              >
                <div style={{
                  height:100, background:`linear-gradient(135deg,${
                    ['#7c3aed','#059669','#dc2626','#0284c7','#d97706'][Math.abs(p.id.charCodeAt(0))%5]
                  }66,var(--bg2))`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:40
                }}>🎬</div>
                <div style={{padding:16}}>
                  <div style={{fontWeight:600, color:'var(--text)', marginBottom:4}}>{p.title}</div>
                  <div style={{fontSize:12, color:'var(--text2)', marginBottom:12}}>
                    {p.lines?.length || 0} 条对话 · {p.style}
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button onClick={(e) => { e.stopPropagation(); onOpenProject(p) }}
                      style={{
                        flex:1, padding:'7px 0', background:'rgba(124,58,237,0.2)',
                        border:'1px solid var(--primary)', borderRadius:8,
                        color:'var(--primary-light)', fontSize:13, cursor:'pointer', fontWeight:500
                      }}>编辑</button>
                    <button onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('确定删除？')) onDeleteProject(p.id)
                    }}
                      style={{
                        padding:'7px 12px', background:'rgba(239,68,68,0.1)',
                        border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                        color:'#f87171', fontSize:13, cursor:'pointer'
                      }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Workflow Page ─────────────────────────────────────────
function WorkflowPage({ session, project, onSave, onBack }: {
  session: Session
  project: Project | null
  onSave: (p: Project) => void
  onBack: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [title, setTitle] = useState(project?.title || '我的漫剧' + Date.now().toString().slice(-4))
  const [style, setStyle] = useState(project?.style || STYLES[0])
  const [lines, setLines] = useState<DialogLine[]>(project?.lines || [
    { id: uid(), speaker: '角色A', text: '', emotion: '😊开心', action: '站立说话', scene: 'school' }
  ])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [generating, setGenerating] = useState<{[id:string]:boolean}>({})
  const [saving, setSaving] = useState(false)
  const [ttsActive, setTtsActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const currentProject: Project = {
    id: project?.id || uid(),
    title, style, lines,
    createdAt: project?.createdAt || new Date().toISOString()
  }

  // ── Step 1: Script editor
  // ── Step 2: Character & scene assignment
  // ── Step 3: AI image generation
  // ── Step 4: Preview & export

  const addLine = () => setLines(l => [...l, {
    id: uid(), speaker: '新角色', text: '', emotion: '😊开心', action: '站立说话', scene: 'school'
  }])
  const removeLine = (id: string) => setLines(l => l.filter(x => x.id !== id))
  const updateLine = (id: string, patch: Partial<DialogLine>) =>
    setLines(l => l.map(x => x.id === id ? { ...x, ...patch } : x))

  const loadTemplate = (idx: number) => {
    const t = TEMPLATES[idx]
    setTitle(t.title); setStyle(t.style)
    setLines(t.lines.map(l => ({ ...l, id: uid() })))
    setSelectedTemplate(idx)
  }

  const generateImage = async (lineId: string, line: DialogLine) => {
    setGenerating(g => ({...g, [lineId]: true}))
    const prompt = encodeURIComponent(
      `${line.speaker} ${line.emotion} ${line.action} in ${line.scene}, anime style manga panel, detailed, cinematic`
    )
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=384&nologo=true&seed=${Math.floor(Math.random()*9999)}`
    updateLine(lineId, { imageUrl: url, imageLoading: true })
    // Pre-load image
    const img = new window.Image()
    img.onload = () => { updateLine(lineId, { imageLoading: false }); setGenerating(g => ({...g, [lineId]: false})) }
    img.onerror = () => { setGenerating(g => ({...g, [lineId]: false})) }
    img.src = url
  }

  const generateAllImages = async () => {
    for (const line of lines) {
      if (line.text.trim()) {
        await generateImage(line.id, line)
        await sleep(800) // Rate limit
      }
    }
  }

  // Canvas animation preview
  useEffect(() => {
    if (step !== 4) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let lineIdx = 0
    let textIdx = 0
    const imgs: {[id:string]: HTMLImageElement} = {}

    // Preload images
    lines.forEach(l => {
      if (l.imageUrl) {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.src = l.imageUrl
        imgs[l.id] = img
      }
    })

    const draw = () => {
      const W = canvas.width, H = canvas.height
      const l = lines[lineIdx % lines.length]
      if (!l) return

      // Background gradient
      const scene = SCENES.find(s => s.id === l.scene)
      const c = scene?.color || '#7c3aed'
      const grad = ctx.createLinearGradient(0,0,W,H)
      grad.addColorStop(0, '#0f0f1a')
      grad.addColorStop(1, c + '33')
      ctx.fillStyle = grad
      ctx.fillRect(0,0,W,H)

      // Scene label
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(0,0,W,40)
      ctx.fillStyle = '#fff'
      ctx.font = '13px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(scene ? `${scene.emoji} ${scene.name}` : '🎬 场景', 12, 26)

      // Character image or emoji
      if (imgs[l.id]?.complete && imgs[l.id]?.naturalWidth > 0) {
        const img = imgs[l.id]
        const iw = 200, ih = 200
        const ix = W/2 - iw/2
        const iy = H/2 - ih/2 - 20 + Math.sin(frame*0.05)*6
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(ix, iy, iw, ih, 12)
        ctx.clip()
        ctx.drawImage(img, ix, iy, iw, ih)
        ctx.restore()
      } else {
        // Fallback character avatar
        const ch = CHARACTERS.find(c => c.name === l.speaker) || CHARACTERS[0]
        ctx.font = '80px serif'
        ctx.textAlign = 'center'
        ctx.fillText(ch.emoji, W/2, H/2 - 20 + Math.sin(frame*0.05)*6)
      }

      // Emotion bubble
      if (l.emotion) {
        ctx.font = '28px serif'
        ctx.textAlign = 'center'
        ctx.fillText(l.emotion.slice(0,2), W/2 + 55, H/2 - 70)
      }

      // Speaker nameplate
      ctx.fillStyle = c + 'cc'
      ctx.beginPath()
      ctx.roundRect(12, H-110, 120, 28, 6)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(l.speaker, 20, H-91)

      // Dialog box
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.beginPath()
      ctx.roundRect(10, H-80, W-20, 70, 10)
      ctx.fill()
      ctx.strokeStyle = c + '88'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Dialog text (typewriter)
      const displayed = l.text.slice(0, textIdx)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '14px "Noto Sans SC",sans-serif'
      ctx.textAlign = 'left'
      wrapText(ctx, displayed, 20, H-55, W-40, 20)

      // Progress dots
      lines.forEach((_, i) => {
        ctx.beginPath()
        ctx.arc(W/2 - (lines.length-1)*8 + i*16, H-8, 3, 0, Math.PI*2)
        ctx.fillStyle = i === lineIdx % lines.length ? '#fff' : 'rgba(255,255,255,0.3)'
        ctx.fill()
      })

      frame++
      textIdx = Math.min(textIdx + 0.5, l.text.length)
      if (textIdx >= l.text.length && frame % 90 === 0) {
        lineIdx++; textIdx = 0
      }
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [step, lines])

  const speakLines = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setTtsActive(true)
    let i = 0
    const speakNext = () => {
      if (i >= lines.length) { setTtsActive(false); return }
      const u = new SpeechSynthesisUtterance(lines[i].speaker + '说：' + lines[i].text)
      u.lang = 'zh-CN'; u.rate = 0.95
      u.onend = () => { i++; speakNext() }
      window.speechSynthesis.speak(u)
    }
    speakNext()
  }

  const exportVideo = async () => {
    const canvas = canvasRef.current
    if (!canvas || !('MediaRecorder' in window)) {
      alert('导出成功！请使用截图功能保存预览画面。')
      return
    }
    const stream = canvas.captureStream(30)
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
    const chunks: BlobPart[] = []
    rec.ondataavailable = e => chunks.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${title}.webm`; a.click()
    }
    rec.start()
    setTimeout(() => rec.stop(), lines.length * 4000)
    alert(`🎬 正在录制 ${lines.length * 4} 秒，请稍候...`)
  }

  const handleSave = async () => {
    setSaving(true)
    await sleep(500)
    onSave({ ...currentProject, lines })
    setSaving(false)
  }

  return (
    <div style={{minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column'}}>
      {/* Header */}
      <div style={{
        background:'var(--surface)', borderBottom:'1px solid var(--border)',
        padding:'12px 20px', display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:20
      }}>
        <button onClick={onBack} style={iconBtnStyle}>←</button>
        <div style={{flex:1}}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            style={{
              background:'transparent', border:'none', color:'var(--text)',
              fontSize:16, fontWeight:600, width:'100%', outline:'none'
            }}
          />
        </div>
        <div style={{display:'flex', gap:8}}>
          <button onClick={handleSave} disabled={saving} style={{
            ...primaryBtnStyle, padding:'8px 16px', fontSize:13
          }}>
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      {/* Step navigator */}
      <div style={{
        background:'var(--bg2)', borderBottom:'1px solid var(--border)',
        padding:'0 20px', display:'flex', gap:0
      }}>
        {[
          {n:1,label:'📝 脚本'},
          {n:2,label:'🎭 角色'},
          {n:3,label:'🖼️ 配图'},
          {n:4,label:'▶️ 预览'},
        ].map(s => (
          <button key={s.n} onClick={() => setStep(s.n as Step)}
            style={{
              padding:'12px 20px', border:'none', background:'transparent',
              cursor:'pointer', fontSize:13, fontWeight: step===s.n ? 700 : 400,
              color: step===s.n ? 'var(--primary-light)' : 'var(--text2)',
              borderBottom: step===s.n ? '2px solid var(--primary)' : '2px solid transparent',
              transition:'all 0.2s', whiteSpace:'nowrap'
            }}>{s.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1, padding:20, maxWidth:900, margin:'0 auto', width:'100%'}}>

        {/* ── Step 1: Script ── */}
        {step === 1 && (
          <div style={{animation:'fadeIn 0.3s ease'}}>
            {/* Style selector */}
            <div style={{marginBottom:20}}>
              <label style={{display:'block', color:'var(--text2)', fontSize:13, marginBottom:8}}>故事风格</label>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    style={{
                      padding:'6px 14px', borderRadius:20, border:'1px solid',
                      borderColor: style===s ? 'var(--primary)' : 'var(--border)',
                      background: style===s ? 'rgba(124,58,237,0.2)' : 'transparent',
                      color: style===s ? 'var(--primary-light)' : 'var(--text2)',
                      fontSize:13, cursor:'pointer', transition:'all 0.2s'
                    }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div style={{marginBottom:20}}>
              <label style={{display:'block', color:'var(--text2)', fontSize:13, marginBottom:8}}>
                快速模板 <span style={{color:'var(--text3)',fontSize:11}}>（点击一键导入）</span>
              </label>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {TEMPLATES.map((t,i) => (
                  <button key={t.title} onClick={() => loadTemplate(i)}
                    style={{
                      padding:'6px 14px', borderRadius:8,
                      border:`1px solid ${selectedTemplate===i ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedTemplate===i ? 'rgba(124,58,237,0.15)' : 'var(--surface)',
                      color:'var(--text)', fontSize:13, cursor:'pointer', transition:'all 0.2s'
                    }}>{t.title}</button>
                ))}
              </div>
            </div>

            {/* Dialog lines */}
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {lines.map((line, idx) => (
                <div key={line.id} style={{
                  background:'var(--surface)', borderRadius:var_('--radius'),
                  border:'1px solid var(--border)', padding:16,
                  animation:`fadeIn 0.3s ease ${idx*0.05}s both`
                }}>
                  <div style={{display:'flex', gap:10, marginBottom:10, alignItems:'center'}}>
                    <span style={{color:'var(--text3)', fontSize:12, minWidth:24}}>#{idx+1}</span>
                    <input
                      value={line.speaker}
                      onChange={e => updateLine(line.id, {speaker: e.target.value})}
                      placeholder="角色名"
                      style={{...inputStyle, flex:'0 0 120px', padding:'6px 10px'}}
                    />
                    <select value={line.scene} onChange={e => updateLine(line.id, {scene: e.target.value})}
                      style={{...inputStyle, flex:'0 0 130px', padding:'6px 10px'}}>
                      {SCENES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                    </select>
                    <button onClick={() => removeLine(line.id)} style={{
                      marginLeft:'auto', width:28, height:28, background:'rgba(239,68,68,0.1)',
                      border:'1px solid rgba(239,68,68,0.3)', borderRadius:6,
                      color:'#f87171', cursor:'pointer', fontSize:14, display:'flex',
                      alignItems:'center', justifyContent:'center', flexShrink:0
                    }}>×</button>
                  </div>
                  <textarea
                    value={line.text}
                    onChange={e => updateLine(line.id, {text: e.target.value})}
                    placeholder="输入对话内容..."
                    rows={2}
                    style={{
                      ...inputStyle, width:'100%', resize:'vertical',
                      fontFamily:'inherit', lineHeight:1.6, padding:'8px 12px'
                    }}
                  />
                  <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
                    <select value={line.emotion} onChange={e => updateLine(line.id, {emotion: e.target.value})}
                      style={{...inputStyle, flex:'1 1 auto', minWidth:100, padding:'5px 8px', fontSize:12}}>
                      {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select value={line.action} onChange={e => updateLine(line.id, {action: e.target.value})}
                      style={{...inputStyle, flex:'1 1 auto', minWidth:110, padding:'5px 8px', fontSize:12}}>
                      {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addLine} style={{
              width:'100%', padding:14, marginTop:12,
              background:'var(--surface)', border:'1px dashed var(--border)',
              borderRadius:var_('--radius'), color:'var(--text2)',
              cursor:'pointer', fontSize:14, transition:'all 0.2s'
            }}>
              + 添加对话
            </button>
          </div>
        )}

        {/* ── Step 2: Characters ── */}
        {step === 2 && (
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <p style={{color:'var(--text2)', fontSize:14, marginBottom:16}}>
              为每个角色名选择对应的角色形象
            </p>
            {/* Unique speakers */}
            {Array.from(new Set(lines.map(l => l.speaker))).map(speaker => (
              <div key={speaker} style={{
                background:'var(--surface)', borderRadius:var_('--radius'),
                border:'1px solid var(--border)', padding:16, marginBottom:12
              }}>
                <div style={{fontWeight:600, color:'var(--text)', marginBottom:12}}>
                  👤 {speaker}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8}}>
                  {CHARACTERS.map(c => (
                    <div key={c.id} style={{
                      background:'var(--bg2)', borderRadius:10,
                      border:'1px solid var(--border)', padding:10,
                      cursor:'pointer', textAlign:'center', transition:'all 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor='var(--primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor='var(--border)')}
                    >
                      <div style={{fontSize:36, marginBottom:4}}>{c.emoji}</div>
                      <div style={{fontSize:12, fontWeight:600, color:'var(--text)'}}>{c.name}</div>
                      <div style={{fontSize:10, color:'var(--text3)', marginTop:2}}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setStep(3)} style={{...primaryBtnStyle, width:'100%', marginTop:8}}>
              下一步：生成配图 →
            </button>
          </div>
        )}

        {/* ── Step 3: Images ── */}
        {step === 3 && (
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16
            }}>
              <p style={{color:'var(--text2)', fontSize:14}}>
                为每个场景生成 AI 配图（由 Pollinations.ai 提供）
              </p>
              <button onClick={generateAllImages} style={{
                ...primaryBtnStyle, padding:'8px 16px', fontSize:13
              }}>
                🎨 一键生成全部
              </button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {lines.map((line, idx) => (
                <div key={line.id} style={{
                  background:'var(--surface)', borderRadius:var_('--radius'),
                  border:'1px solid var(--border)', padding:16,
                  display:'flex', gap:16, flexWrap:'wrap'
                }}>
                  <div style={{flex:'0 0 200px'}}>
                    {line.imageUrl ? (
                      <div style={{position:'relative', width:200, height:150, borderRadius:8, overflow:'hidden'}}>
                        {line.imageLoading && (
                          <div style={{
                            position:'absolute', inset:0, background:'var(--bg2)',
                            display:'flex', alignItems:'center', justifyContent:'center'
                          }}>
                            <div style={{
                              width:32, height:32, border:'3px solid var(--border)',
                              borderTopColor:'var(--primary)', borderRadius:'50%',
                              animation:'spin 0.8s linear infinite'
                            }} />
                          </div>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={line.imageUrl} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}
                          onLoad={() => updateLine(line.id, {imageLoading: false})}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width:200, height:150, background:'var(--bg2)', borderRadius:8,
                        display:'flex', flexDirection:'column', alignItems:'center',
                        justifyContent:'center', gap:8, border:'1px dashed var(--border)'
                      }}>
                        <span style={{fontSize:32}}>🖼️</span>
                        <span style={{color:'var(--text3)', fontSize:12}}>待生成</span>
                      </div>
                    )}
                  </div>
                  <div style={{flex:1, minWidth:200}}>
                    <div style={{
                      fontWeight:600, color:'var(--text)', marginBottom:6,
                      display:'flex', alignItems:'center', gap:8
                    }}>
                      <span>#{idx+1}</span>
                      <span>{line.speaker}</span>
                      <span style={{fontSize:13}}>{line.emotion}</span>
                    </div>
                    <p style={{color:'var(--text2)', fontSize:14, marginBottom:12, lineHeight:1.6}}>
                      {line.text || '（无对话）'}
                    </p>
                    <div style={{display:'flex', gap:8}}>
                      <button
                        onClick={() => generateImage(line.id, line)}
                        disabled={generating[line.id]}
                        style={{
                          ...primaryBtnStyle, padding:'7px 14px', fontSize:13,
                          opacity: generating[line.id] ? 0.6 : 1
                        }}>
                        {generating[line.id] ? '⏳ 生成中...' : '🎨 生成配图'}
                      </button>
                      {line.imageUrl && (
                        <button onClick={() => updateLine(line.id, {imageUrl: undefined})}
                          style={{
                            padding:'7px 12px', background:'rgba(239,68,68,0.1)',
                            border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                            color:'#f87171', fontSize:13, cursor:'pointer'
                          }}>删除</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(4)} style={{...primaryBtnStyle, width:'100%', marginTop:16}}>
              下一步：预览与导出 →
            </button>
          </div>
        )}

        {/* ── Step 4: Preview ── */}
        {step === 4 && (
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:20
            }}>
              {/* Canvas */}
              <div style={{
                borderRadius:var_('--radius-lg'), overflow:'hidden',
                boxShadow:'0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border)',
                position:'relative'
              }}>
                <canvas ref={canvasRef} width={480} height={360}
                  style={{display:'block', maxWidth:'100%'}} />
              </div>

              {/* Controls */}
              <div style={{
                display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center'
              }}>
                <button onClick={speakLines} disabled={ttsActive}
                  style={{
                    ...primaryBtnStyle, opacity: ttsActive ? 0.6 : 1
                  }}>
                  {ttsActive ? '🔊 播放中...' : '🔊 AI 朗读'}
                </button>
                {ttsActive && (
                  <button onClick={() => { window.speechSynthesis.cancel(); setTtsActive(false) }}
                    style={{
                      padding:'10px 20px', background:'rgba(239,68,68,0.15)',
                      border:'1px solid rgba(239,68,68,0.4)', borderRadius:10,
                      color:'#f87171', cursor:'pointer', fontWeight:600
                    }}>
                    ⏹ 停止
                  </button>
                )}
                <button onClick={exportVideo} style={{
                  padding:'10px 20px', background:'linear-gradient(135deg,#059669,#10b981)',
                  border:'none', borderRadius:10, color:'#fff',
                  fontWeight:700, cursor:'pointer', fontSize:14,
                  boxShadow:'0 4px 12px rgba(16,185,129,0.4)'
                }}>
                  📥 导出视频
                </button>
                <button onClick={handleSave} style={{
                  padding:'10px 20px', background:'linear-gradient(135deg,#f59e0b,#fbbf24)',
                  border:'none', borderRadius:10, color:'#fff',
                  fontWeight:700, cursor:'pointer', fontSize:14
                }}>
                  ☁️ 保存作品
                </button>
              </div>

              {/* Dialog list */}
              <div style={{width:'100%', maxWidth:480}}>
                <h4 style={{color:'var(--text2)', fontSize:13, marginBottom:12}}>剧本台词</h4>
                {lines.map((l, i) => (
                  <div key={l.id} style={{
                    display:'flex', gap:10, padding:'10px 14px',
                    background:'var(--surface)', borderRadius:8,
                    border:'1px solid var(--border)', marginBottom:8
                  }}>
                    <span style={{
                      color:'var(--primary-light)', fontWeight:700,
                      minWidth:60, fontSize:13
                    }}>{l.speaker}</span>
                    <span style={{color:'var(--text)', fontSize:13, flex:1}}>
                      {l.text || <em style={{color:'var(--text3)'}}>（空）</em>}
                    </span>
                    <span style={{fontSize:16}}>{l.emotion.slice(0,2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Characters Page ───────────────────────────────────────
function CharactersPage() {
  const [filter, setFilter] = useState('all')
  const styles = ['all', 'anime', 'modern', 'fantasy', 'sci-fi', 'cute', 'action', 'classic']

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <h2 style={{fontSize:20, fontWeight:700, color:'var(--text)'}}>👥 角色库</h2>
        <span style={{
          padding:'4px 12px', background:'rgba(124,58,237,0.2)',
          border:'1px solid var(--primary)', borderRadius:20,
          color:'var(--primary-light)', fontSize:13
        }}>200+ 角色</span>
      </div>

      {/* Filter */}
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
        {styles.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding:'6px 14px', borderRadius:20, border:'1px solid',
              borderColor: filter===s ? 'var(--primary)' : 'var(--border)',
              background: filter===s ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: filter===s ? 'var(--primary-light)' : 'var(--text2)',
              fontSize:12, cursor:'pointer', transition:'all 0.2s'
            }}>
            {s==='all'?'全部':s}
          </button>
        ))}
      </div>

      {/* Characters grid */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12}}>
        {CHARACTERS.filter(c => filter==='all' || c.style===filter).map(c => (
          <div key={c.id} style={{
            background:'var(--surface)', borderRadius:var_('--radius'),
            border:'1px solid var(--border)', padding:16, textAlign:'center',
            cursor:'pointer', transition:'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor='var(--primary)'
            e.currentTarget.style.transform='translateY(-4px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor='var(--border)'
            e.currentTarget.style.transform='translateY(0)'
          }}
          >
            <div style={{fontSize:48, marginBottom:8, animation:'float 3s ease-in-out infinite'}}>{c.emoji}</div>
            <div style={{fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:4}}>{c.name}</div>
            <div style={{fontSize:11, color:'var(--text3)', marginBottom:8}}>{c.desc}</div>
            <div style={{
              display:'inline-block', fontSize:10, padding:'2px 8px',
              background:'rgba(124,58,237,0.15)', borderRadius:4, color:'var(--primary-light)'
            }}>{c.style}</div>
          </div>
        ))}
        {/* Locked characters for visual */}
        {Array.from({length:8}).map((_,i) => (
          <div key={`locked-${i}`} style={{
            background:'var(--surface)', borderRadius:var_('--radius'),
            border:'1px dashed var(--border)', padding:16, textAlign:'center', opacity:0.5
          }}>
            <div style={{fontSize:36, marginBottom:8}}>🔮</div>
            <div style={{fontSize:13, color:'var(--text3)'}}>神秘角色</div>
            <div style={{fontSize:11, color:'var(--primary)', marginTop:4}}>✅ 已解锁</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Works Page ────────────────────────────────────────────
function WorksPage({ projects, onOpenProject }: { projects: Project[], onOpenProject: (p: Project) => void }) {
  return (
    <div style={{padding:24}}>
      <h2 style={{fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:20}}>🎬 我的作品</h2>
      {projects.length === 0 ? (
        <div style={{
          textAlign:'center', padding:60, color:'var(--text3)'
        }}>
          <div style={{fontSize:64, marginBottom:16}}>🎬</div>
          <div style={{fontSize:16, marginBottom:8}}>还没有作品</div>
          <div style={{fontSize:13}}>在工作流中完成创作并保存后，作品将显示在这里</div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16}}>
          {projects.map(p => (
            <div key={p.id} style={{
              background:'var(--surface)', borderRadius:var_('--radius'),
              border:'1px solid var(--border)', overflow:'hidden',
              cursor:'pointer', transition:'all 0.2s'
            }} onClick={() => onOpenProject(p)}
            onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 24px rgba(124,58,237,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}
            >
              <div style={{
                height:120, background:'linear-gradient(135deg,#7c3aed44,#ec489944)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:48
              }}>🎬</div>
              <div style={{padding:14}}>
                <div style={{fontWeight:600, color:'var(--text)', marginBottom:4}}>{p.title}</div>
                <div style={{fontSize:12, color:'var(--text2)', marginBottom:8}}>
                  {p.lines?.length || 0} 条对话 · {p.style}
                </div>
                <div style={{fontSize:11, color:'var(--text3)'}}>
                  {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Settings Page ─────────────────────────────────────────
function SettingsPage({ session, onSignOut }: { session: Session, onSignOut: () => void }) {
  const user = session.user
  return (
    <div style={{padding:24, maxWidth:600}}>
      <h2 style={{fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:20}}>⚙️ 设置</h2>

      {/* Profile */}
      <div style={{
        background:'var(--surface)', borderRadius:var_('--radius'),
        border:'1px solid var(--border)', padding:20, marginBottom:16
      }}>
        <h3 style={{color:'var(--text)', fontWeight:600, marginBottom:16}}>👤 账号信息</h3>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>邮箱</span>
            <span style={{color:'var(--text)'}}>{user.email}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>用户名</span>
            <span style={{color:'var(--text)'}}>{user.user_metadata?.username || '未设置'}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>会员等级</span>
            <span style={{
              padding:'2px 10px', background:'linear-gradient(135deg,#7c3aed,#ec4899)',
              borderRadius:4, color:'#fff', fontSize:12, fontWeight:600
            }}>✨ 旗舰会员</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>创作积分</span>
            <span style={{color:'#f59e0b', fontWeight:600}}>9,999</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{
        background:'var(--surface)', borderRadius:var_('--radius'),
        border:'1px solid var(--border)', padding:20, marginBottom:16
      }}>
        <h3 style={{color:'var(--text)', fontWeight:600, marginBottom:16}}>🚀 已开通功能</h3>
        {[
          '✅ 无限创建漫剧项目',
          '✅ 200+ 高精度角色',
          '✅ 40+ 情绪动作',
          '✅ AI 图片生成（Pollinations.ai）',
          '✅ AI 语音朗读（TTS）',
          '✅ 视频导出（WebM）',
          '✅ 云端保存',
          '✅ 全部场景背景',
          '✅ 所有剧情模板',
        ].map(f => (
          <div key={f} style={{
            fontSize:14, color:'var(--text)', padding:'6px 0',
            borderBottom:'1px solid var(--border)'
          }}>{f}</div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={onSignOut} style={{
        width:'100%', padding:14, background:'rgba(239,68,68,0.1)',
        border:'1px solid rgba(239,68,68,0.3)', borderRadius:var_('--radius'),
        color:'#f87171', fontSize:15, cursor:'pointer', fontWeight:600, transition:'all 0.2s'
      }}>
        退出登录
      </button>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
function var_(name: string): string {
  return `var(${name})` as string
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split('')
  let line = ''
  let lineY = y
  for (const char of words) {
    const test = line + char
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, lineY)
      line = char
      lineY += lineH
      if (lineY > y + lineH * 3) break
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, lineY)
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 14,
  boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
  transition: 'all 0.2s',
}

const iconBtnStyle: React.CSSProperties = {
  width: 36, height: 36,
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text2)',
  cursor: 'pointer',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
