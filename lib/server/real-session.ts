export function getRealHeaders(): HeadersInit {
  return {
    'real-auth-info': process.env.REAL_AUTH_INFO ?? '',
    'real-request-token': process.env.REAL_REQUEST_TOKEN ?? '',
    'real-device-uuid': process.env.REAL_DEVICE_UUID ?? '',
    'real-device-name': process.env.REAL_DEVICE_NAME ?? '',
    'real-device-type': process.env.REAL_DEVICE_TYPE ?? '',
    'real-version': process.env.REAL_VERSION ?? '',
    id: process.env.REAL_ID ?? '',
    Accept: 'application/json',
  }
}
