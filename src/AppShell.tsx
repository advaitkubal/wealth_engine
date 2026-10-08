import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate, useRouter } from './router'
import Navbar from './components/Navbar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center pt-[20vh] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <Command label="Command Menu" className="flex flex-col h-full" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
              <Command.Input 
                autoFocus 
                placeholder="What do you need?" 
                className="w-full px-4 py-4 text-lg border-b border-gray-100 outline-none placeholder:text-gray-400"
              />
              <Command.List className="p-2 max-h-[300px] overflow-y-auto">
                <Command.Empty className="py-6 text-center text-gray-500">No results found.</Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-semibold text-gray-400 mb-2 px-2">
                  <Command.Item onSelect={() => { navigate('/'); setOpen(false) }} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Dashboard</Command.Item>
                  <Command.Item onSelect={() => { navigate('/tax-planning'); setOpen(false) }} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Tax Planning</Command.Item>
                  <Command.Item onSelect={() => { navigate('/calculators'); setOpen(false) }} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Calculators</Command.Item>
                </Command.Group>
                
                <Command.Group heading="Actions" className="text-xs font-semibold text-gray-400 mt-4 mb-2 px-2">
                  <Command.Item onSelect={() => { setOpen(false) }} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Add Transaction</Command.Item>
                  <Command.Item onSelect={() => { setOpen(false) }} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Export Report</Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </div>
  )
}
