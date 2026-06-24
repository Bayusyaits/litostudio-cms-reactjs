// apps/cms/src/tracking/index.ts
// Barrel export — import everything from '@/tracking'

export { EVENTS }                       from './events'
export type { EventName }               from './events'
export { useTracking }                  from './tracking'
export type {
  TemplateName,
  SignupMethod,
  LoginMethod,
  OrgRole,
  PageType,
  ContentType,
  AnalyticsProvider,
  DomainType,
  OrgGroupTraits,
  SiteGroupTraits,
  TrackingGroups,
  MemberInvitedProps,
  SiteCreatedProps,
  TemplateSelectedProps,
  PageCreatedProps,
  EditorSessionEndedProps,
  PagePublishedProps,
  SitePublishedProps,
  DomainConnectedProps,
  AnalyticsScriptsConfiguredProps,
  ContentCreatedProps,
} from './types'
