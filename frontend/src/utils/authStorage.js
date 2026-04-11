export const TOKEN_STORAGE_KEY = 'idp_token';
export const ACTIVE_ORG_STORAGE_KEY = 'active_org_id';
export const REMEMBER_BROWSER_STORAGE_KEY = 'idp_remember_browser';
export const LOGOUT_SYNC_KEY = 'idp_logout_sync';

function hasWindow() {
  return typeof window !== 'undefined';
}

function getSessionStorage() {
  return hasWindow() ? window.sessionStorage : null;
}

function getLocalStorage() {
  return hasWindow() ? window.localStorage : null;
}

function readFromBoth(key) {
  const localValue = getLocalStorage()?.getItem(key);
  if (localValue) return localValue;
  return getSessionStorage()?.getItem(key) || null;
}

function clearFromBoth(key) {
  getSessionStorage()?.removeItem(key);
  getLocalStorage()?.removeItem(key);
}

export function readRememberBrowserPreference() {
  return getLocalStorage()?.getItem(REMEMBER_BROWSER_STORAGE_KEY) === 'true';
}

export function syncRememberBrowserPreference(enabled) {
  getLocalStorage()?.setItem(REMEMBER_BROWSER_STORAGE_KEY, String(Boolean(enabled)));

  const token = getStoredToken();
  const activeOrgId = getStoredActiveOrgId();
  if (token) {
    storeAuthToken(token, enabled);
  }
  if (activeOrgId) {
    storeActiveOrgId(activeOrgId, enabled);
  }
}

export function getStoredToken() {
  return readFromBoth(TOKEN_STORAGE_KEY);
}

export function getStoredActiveOrgId() {
  return readFromBoth(ACTIVE_ORG_STORAGE_KEY);
}

export function storeAuthToken(token, rememberBrowser = readRememberBrowserPreference()) {
  clearFromBoth(TOKEN_STORAGE_KEY);
  const target = rememberBrowser ? getLocalStorage() : getSessionStorage();
  target?.setItem(TOKEN_STORAGE_KEY, token);
}

export function storeActiveOrgId(orgId, rememberBrowser = readRememberBrowserPreference()) {
  clearFromBoth(ACTIVE_ORG_STORAGE_KEY);
  if (!orgId) return;
  const target = rememberBrowser ? getLocalStorage() : getSessionStorage();
  target?.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
}

export function clearStoredAuth() {
  clearFromBoth(TOKEN_STORAGE_KEY);
  clearFromBoth(ACTIVE_ORG_STORAGE_KEY);
}
