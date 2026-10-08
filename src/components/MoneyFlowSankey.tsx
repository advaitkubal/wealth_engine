import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'

const data = {
  nodes: [
    { name: 'Income' },
    { name: 'Tax' },
    { name: 'Savings' },
    { name: 'Investments' },
    { name: 'Expenses' },
  ],
  links: [
    { source: 0, target: 1, value: 30000 },
    { source: 0, target: 4, value: 50000 },
    { source: 0, target: 2, value: 20000 },
    { source: 2, target: 3, value: 15000 },
  ],
}

export default function MoneyFlowSankey() {
  return (
    <div className="w-full h-80 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Money Flow</h3>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={{ stroke: '#fff', strokeWidth: 2 }}
          nodePadding={50}
          margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
          link={{ stroke: '#6366f1' }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  )
}
