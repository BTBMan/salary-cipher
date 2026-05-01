export const ROOT_PATH = '/'
export const ONBOARDING_PATHS = '/onboarding'
export const CREATE_COMPANY_PATH = '/onboarding/create-company'
export const PUBLIC_PATHS = new Set([ROOT_PATH])
export const AUTH_ONLY_SETUP_PATHS = new Set([ONBOARDING_PATHS, CREATE_COMPANY_PATH])

export * from './roles'
