export const ROOT_PATH = '/'
export const OVERVIEW_PATH = '/overview'
export const ONBOARDING_PATHS = '/onboarding'
export const CREATE_COMPANY_PATH = '/onboarding/create-company'
export const LEGACY_OVERVIEW_PATHS = new Set(['/dashboard', '/employee'])
export const PUBLIC_PATHS = new Set([ROOT_PATH])
export const AUTH_ONLY_SETUP_PATHS = new Set([ONBOARDING_PATHS, CREATE_COMPANY_PATH])

export * from './permissions'
export * from './roles'
