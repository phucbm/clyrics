const NICKNAME_KEY = 'clyrics_nickname'
const OWNER_NICK = 'phucbm'

export function isOwner(): boolean {
  return localStorage.getItem(NICKNAME_KEY)?.trim().toLowerCase() === OWNER_NICK
}
