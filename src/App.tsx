import { ComposerProvider } from './lib/composerContext'
import { loadInitialState } from './lib/persistence'
import AppShell from './components/AppShell'

const initialState = loadInitialState()

export default function App() {
  return (
    <ComposerProvider initialState={initialState}>
      <AppShell />
    </ComposerProvider>
  )
}
