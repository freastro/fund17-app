import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '#/finance/Dashboard'

export const Route = createFileRoute('/')({ component: Dashboard })
