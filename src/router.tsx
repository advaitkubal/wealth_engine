import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode, type ReactElement,
} from 'react'

/* ── Context ── */
interface RouterCtx { path: string; navigate: (to: string) => void }
const Ctx = createContext<RouterCtx>({ path: '/', navigate: () => {} })

/* ── Provider ── */
export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname + window.location.search)

  useEffect(() => {
    const sync = () => setPath(window.location.pathname + window.location.search)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, '', to)
    setPath(to)
    window.scrollTo(0, 0)
  }, [])

  return <Ctx.Provider value={{ path, navigate }}>{children}</Ctx.Provider>
}

/* ── Hooks ── */
export function useRouter()   { return useContext(Ctx) }
export function useNavigate() { return useContext(Ctx).navigate }

/* ── Link ── */
interface LinkProps { to: string; children: ReactNode; className?: string }
export function Link({ to, children, className }: LinkProps) {
  const { navigate } = useContext(Ctx)
  return (
    <a href={to} className={className}
      onClick={e => { e.preventDefault(); navigate(to) }}>
      {children}
    </a>
  )
}

/* ── NavLink ── */
interface NavLinkProps {
  to: string
  children: ReactNode
  className?: string | ((opts: { isActive: boolean }) => string)
}
export function NavLink({ to, children, className }: NavLinkProps) {
  const { path, navigate } = useContext(Ctx)
  const currentPathname = path.split('?')[0]
  const isActive = currentPathname === to
  const cls = typeof className === 'function' ? className({ isActive }) : className
  return (
    <a href={to} className={cls}
      onClick={e => { e.preventDefault(); navigate(to) }}>
      {children}
    </a>
  )
}

/* ── Route / Routes ── */
interface RouteProps { path: string; element: ReactNode }
export function Route(_p: RouteProps): null { return null }

export function Routes({ children }: { children: ReactNode }) {
  const { path } = useContext(Ctx)
  const currentPathname = path.split('?')[0]
  const kids = Array.isArray(children) ? children : [children]
  for (const child of kids) {
    const el = child as ReactElement<RouteProps>
    if (el?.props?.path === currentPathname) return <>{el.props.element}</>
  }
  return null
}
