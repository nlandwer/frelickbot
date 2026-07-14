import { PoolOptimizerPage } from '@/components/calc/karma/pool-optimizer-page'

export const dynamic = 'force-dynamic'

export default function WNBAPoolPage() {
  return <PoolOptimizerPage sport="WNBA" equationSet="evenPayout" />
}
