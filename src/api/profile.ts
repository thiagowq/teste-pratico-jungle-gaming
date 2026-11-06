import { api } from './client'
import { profileResponse, type ChangePasswordRequest, type ProfileUpdate } from './contracts/auth'
import { parseResponse } from './parse'

export async function updateProfile(body: ProfileUpdate) {
  const { data } = await api.patch('/me/profile', body)
  return parseResponse(profileResponse, data).user
}

export async function uploadAvatar(dataUrl: string) {
  const { data } = await api.put('/me/avatar', { dataUrl })
  return parseResponse(profileResponse, data).user
}

export async function removeAvatar() {
  const { data } = await api.delete('/me/avatar')
  return parseResponse(profileResponse, data).user
}

export async function changePassword(body: ChangePasswordRequest) {
  await api.post('/me/password', body)
}
