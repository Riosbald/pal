import type { MobileContext, MobileRoute } from "@/core/schemas/mobile-context";

const ROUTES: Record<MobileContext["appMode"], MobileRoute> = {
  quick_action: {
    agent: "workflow",
    priority: "rapid",
    riskBaseline: 3,
    requiresApprovalByDefault: true,
    capabilities: ["workflow.draft", "workflow.trigger"],
  },
  meeting: {
    agent: "crm",
    priority: "batch",
    riskBaseline: 2,
    requiresApprovalByDefault: true,
    capabilities: ["crm.interaction.draft", "crm.entity.resolve"],
  },
  post_call: {
    agent: "receivable",
    priority: "urgent",
    riskBaseline: 3,
    requiresApprovalByDefault: true,
    capabilities: ["receivable.commitment.draft", "receivable.reminder.schedule"],
  },
  pocket: {
    agent: "market_intel",
    priority: "batch",
    riskBaseline: 1,
    requiresApprovalByDefault: false,
    capabilities: ["market.signal.record"],
  },
  field_ops: {
    agent: "operations",
    priority: "transactional",
    riskBaseline: 4,
    requiresApprovalByDefault: true,
    capabilities: ["field.visit.draft", "inventory.delta.draft"],
  },
  research: {
    agent: "rag",
    priority: "interactive",
    riskBaseline: 0,
    requiresApprovalByDefault: false,
    capabilities: ["memory.search"],
  },
  health: {
    agent: "health",
    priority: "passive",
    riskBaseline: 0,
    requiresApprovalByDefault: false,
    capabilities: ["health.metric.analyze"],
  },
};

/**
 * Routes mobile context only. It does not authorize, approve, schedule, or execute.
 * The existing policy and approval services remain the sole gates for side effects.
 */
export function routeMobileContext(context: MobileContext): MobileRoute {
  const route = ROUTES[context.appMode];
  return {
    ...route,
    // Preserve the mode's configured baseline; client-provided values cannot lower it.
    riskBaseline: Math.max(route.riskBaseline, context.riskBaseline),
    capabilities: [...route.capabilities],
  };
}
