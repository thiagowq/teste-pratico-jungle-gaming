/**
 * Usuários fictícios. As senhas NÃO são armazenadas: guardamos apenas
 * SHA-256(salt + ":" + senha). As credenciais de teste estão no README.
 *
 *  - colecionador@kurio.test / Kurio@2026
 *  - segundo@kurio.test      / Kurio@2027
 */
export interface UserRecord {
  id: string
  displayName: string
  username: string
  email: string
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
}

export function buildUserFixtures(): UserRecord[] {
  return [
    {
      id: 'user-ana',
      displayName: 'Ana Colecionadora',
      username: 'ana.kurio',
      email: 'colecionador@kurio.test',
      ensName: 'ana',
      walletNickname: 'Cofre principal',
      avatarUrl: null,
      passwordSalt: 'k1-ana-2026',
      passwordHash: '1d423f38be2a349085a772bd79562a15994f03c5252022fa9f4c373137083ff6',
    },
    {
      id: 'user-bruno',
      displayName: 'Bruno Cripto',
      username: 'bruno.eth',
      email: 'segundo@kurio.test',
      ensName: null,
      walletNickname: null,
      avatarUrl: null,
      passwordSalt: 'k2-bruno-2026',
      passwordHash: '5fc597d11f5e8fe5454782e4a1ac6e13c98d70b4bdaff975d8afcbbf159ef2ea',
    },
  ]
}
