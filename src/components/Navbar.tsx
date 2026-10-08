import { Link, NavLink } from '../router'
import LogoIcon from './LogoIcon'
import AirGapIndicator from './AirGapIndicator'

const navLinks = [
  { label: 'Tax Planning',  to: '/tax-planning'  },
  { label: 'Wealth Engine', to: '/wealth-engine'  },
  { label: 'Calculators',   to: '/calculators'   },
  { label: 'Security',      to: '/security'      },
  { label: 'Insights',      to: '/insights'      },
]

interface NavbarProps { absolute?: boolean }

export default function Navbar({ absolute = false }: NavbarProps) {
  return (
    <nav
      className={`z-20 px-6 py-5 ${
        absolute
          ? 'absolute top-0 left-0 right-0'
          : 'sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between max-w-[88rem] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="w-7 h-7 text-black" />
          <span className="text-2xl font-medium tracking-tight text-black select-none">Halo</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-base font-medium transition-colors duration-200 ${
                  isActive ? 'text-black' : 'text-gray-700 hover:text-black'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <AirGapIndicator />
        <Link
          to="/wealth-engine"
          className="bg-black text-white text-base font-medium px-7 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200"
        >
          Launch App
        </Link>
        </div>
      </div>
    </nav>
  )
}
